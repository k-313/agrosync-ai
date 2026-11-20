import random
from typing import List
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, generate_uuid
from app.models import ProcurementOrder, ProcurementDemand, Processor, Crop, User, Delivery, SupplierMatch
from app.schemas import OrderCreate, OrderStatusUpdate, OrderResponse, RejectionRequest
from app.services.auth_service import get_current_user, require_role
from app.services.supply_accounting import commit_crop_supply, release_crop_supply
from app.services.notification_service import create_notification

router = APIRouter(prefix="/orders", tags=["Procurement Orders"])

def generate_order_code(crop_name: str) -> str:
    code_prefix = crop_name[:3].upper() if crop_name else "AGR"
    num = random.randint(1000, 9999)
    return f"ORD-2026-{code_prefix}-{num}"

def format_order_response(order: ProcurementOrder) -> OrderResponse:
    crop = order.crop
    farm = crop.farm if crop else None
    farmer = order.farmer
    processor = order.processor

    return OrderResponse(
        id=order.id,
        demand_id=order.demand_id,
        processor_id=order.processor_id,
        farmer_id=order.farmer_id,
        crop_id=order.crop_id,
        match_id=order.match_id,
        order_code=order.order_code,
        agreed_quantity=order.agreed_quantity,
        price_per_kg=order.price_per_kg,
        total_value=order.total_value,
        delivery_deadline=order.delivery_deadline,
        status=order.status,
        rejection_reason=order.rejection_reason,
        farmer_name=farmer.full_name if farmer else "Farmer",
        farmer_phone=farmer.phone if farmer else None,
        company_name=processor.company_name if processor else "Processor",
        crop_name=crop.crop_name if crop else "Crop",
        farm_village=farm.village if farm else None,
        farm_district=farm.district if farm else None,
        created_at=order.created_at,
        updated_at=order.updated_at
    )

@router.post("", response_model=OrderResponse)
def create_procurement_order(
    order_in: OrderCreate,
    current_user: User = Depends(require_role(["processor", "admin"])),
    db: Session = Depends(get_db)
):
    processor = db.query(Processor).filter(Processor.user_id == current_user.id).first()
    if not processor and current_user.role != "admin":
        raise HTTPException(status_code=400, detail="Processor profile not found")

    demand = db.query(ProcurementDemand).filter(ProcurementDemand.id == order_in.demand_id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")

    crop = db.query(Crop).filter(Crop.id == order_in.crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    # Supply accounting: Lock and commit uncommitted crop supply
    success = commit_crop_supply(crop.id, order_in.agreed_quantity, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot book order: Insufficient uncommitted available supply for this crop to prevent overbooking."
        )

    proc_id = processor.id if processor else demand.processor_id
    total_val = round(order_in.agreed_quantity * order_in.price_per_kg, 2)
    order_code = generate_order_code(crop.crop_name)

    order = ProcurementOrder(
        id=generate_uuid(),
        demand_id=demand.id,
        processor_id=proc_id,
        farmer_id=order_in.farmer_id,
        crop_id=order_in.crop_id,
        match_id=order_in.match_id,
        order_code=order_code,
        agreed_quantity=order_in.agreed_quantity,
        price_per_kg=order_in.price_per_kg,
        total_value=total_val,
        delivery_deadline=order_in.delivery_deadline,
        status="requested"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # If match_id provided, update match status
    if order_in.match_id:
        match_rec = db.query(SupplierMatch).filter(SupplierMatch.id == order_in.match_id).first()
        if match_rec:
            match_rec.status = "requested"
            db.add(match_rec)
            db.commit()

    # Notify farmer of incoming request
    comp_name = processor.company_name if processor else "A Food Processor"
    create_notification(
        db=db,
        user_id=order_in.farmer_id,
        title="New Procurement Request",
        message=f"{comp_name} requested {order_in.agreed_quantity:,.0f} kg of {crop.crop_name} @ ₹{order_in.price_per_kg}/kg.",
        notification_type="order",
        metadata={"order_id": order.id, "order_code": order_code}
    )

    return format_order_response(order)

@router.get("", response_model=List[OrderResponse])
def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "farmer":
        orders = (
            db.query(ProcurementOrder)
            .filter(ProcurementOrder.farmer_id == current_user.id)
            .order_by(ProcurementOrder.created_at.desc())
            .all()
        )
    elif current_user.role == "processor":
        processor = db.query(Processor).filter(Processor.user_id == current_user.id).first()
        if not processor:
            return []
        orders = (
            db.query(ProcurementOrder)
            .filter(ProcurementOrder.processor_id == processor.id)
            .order_by(ProcurementOrder.created_at.desc())
            .all()
        )
    else:
        orders = db.query(ProcurementOrder).order_by(ProcurementOrder.created_at.desc()).all()

    return [format_order_response(o) for o in orders]

@router.get("/{id}", response_model=OrderResponse)
def get_order(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(ProcurementOrder).filter(ProcurementOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return format_order_response(order)

@router.post("/{id}/accept", response_model=OrderResponse)
def accept_order(
    id: str,
    current_user: User = Depends(require_role(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    order = db.query(ProcurementOrder).filter(ProcurementOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role == "farmer" and order.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this order")

    order.status = "accepted"
    db.add(order)
    db.commit()

    # Automatically initialize scheduled delivery
    sched_date = order.delivery_deadline - timedelta(days=2)
    track_code = f"TRK-{order.order_code[4:]}"
    delivery = Delivery(
        id=generate_uuid(),
        order_id=order.id,
        tracking_number=track_code,
        collection_scheduled_date=sched_date,
        expected_delivery_date=order.delivery_deadline,
        collected_quantity=0.0,
        received_quantity=0.0,
        status="scheduled_collection",
        remarks="Scheduled for farm-gate aggregation vehicle."
    )
    db.add(delivery)
    db.commit()

    # Notify processor
    farmer = order.farmer
    processor = order.processor
    if processor:
        create_notification(
            db=db,
            user_id=processor.user_id,
            title="Procurement Request Accepted!",
            message=f"Farmer {farmer.full_name} accepted order {order.order_code} for {order.agreed_quantity:,.0f} kg of {order.crop.crop_name}.",
            notification_type="order",
            metadata={"order_id": order.id, "order_code": order.order_code}
        )

    db.refresh(order)
    return format_order_response(order)

@router.post("/{id}/reject", response_model=OrderResponse)
def reject_order(
    id: str,
    reason_in: RejectionRequest = None,
    current_user: User = Depends(require_role(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    order = db.query(ProcurementOrder).filter(ProcurementOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role == "farmer" and order.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this order")

    order.status = "rejected"
    order.rejection_reason = reason_in.rejection_reason if reason_in else "Supplier declined procurement terms"
    db.add(order)
    db.commit()

    # Release committed supply back to available pool
    release_crop_supply(order.crop_id, order.agreed_quantity, db)

    # Notify processor
    farmer = order.farmer
    processor = order.processor
    if processor:
        create_notification(
            db=db,
            user_id=processor.user_id,
            title="Procurement Request Declined",
            message=f"Farmer {farmer.full_name} declined order {order.order_code}. Supply released back to matching pool.",
            notification_type="order",
            metadata={"order_id": order.id, "order_code": order.order_code}
        )

    db.refresh(order)
    return format_order_response(order)

@router.patch("/{id}/status", response_model=OrderResponse)
def update_order_status(
    id: str,
    status_in: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(ProcurementOrder).filter(ProcurementOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    order.status = status_in.status
    if status_in.rejection_reason:
        order.rejection_reason = status_in.rejection_reason

    # If cancelling, release supply
    if status_in.status == "cancelled" and old_status not in ["rejected", "cancelled"]:
        release_crop_supply(order.crop_id, order.agreed_quantity, db)

    db.add(order)
    db.commit()
    db.refresh(order)
    return format_order_response(order)
