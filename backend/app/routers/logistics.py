from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, generate_uuid
from app.models import Delivery, QualityRecord, ProcurementOrder, User
from app.schemas import (
    DeliverySchedule, DeliveryUpdate, DeliveryResponse,
    QualityRecordCreate, QualityRecordResponse
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="", tags=["Logistics & Quality"])

def format_delivery_response(d: Delivery) -> DeliveryResponse:
    order = d.order
    farmer = order.farmer if order else None
    crop = order.crop if order else None

    return DeliveryResponse(
        id=d.id,
        order_id=d.order_id,
        tracking_number=d.tracking_number,
        collection_scheduled_date=d.collection_scheduled_date,
        pickup_date=d.pickup_date,
        expected_delivery_date=d.expected_delivery_date,
        actual_delivery_date=d.actual_delivery_date,
        collected_quantity=d.collected_quantity,
        received_quantity=d.received_quantity,
        status=d.status,
        remarks=d.remarks,
        order_code=order.order_code if order else None,
        farmer_name=farmer.full_name if farmer else None,
        crop_name=crop.crop_name if crop else None,
        created_at=d.created_at
    )

@router.post("/deliveries", response_model=DeliveryResponse)
def create_delivery(
    del_in: DeliverySchedule,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(ProcurementOrder).filter(ProcurementOrder.id == del_in.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    tracking_num = f"TRK-{order.order_code[4:]}"
    delivery = Delivery(
        id=generate_uuid(),
        order_id=del_in.order_id,
        tracking_number=tracking_num,
        collection_scheduled_date=del_in.collection_scheduled_date,
        expected_delivery_date=del_in.expected_delivery_date,
        status="scheduled_collection",
        remarks=del_in.remarks or "Scheduled farm-gate logistics"
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return format_delivery_response(delivery)

@router.get("/deliveries", response_model=List[DeliveryResponse])
def get_deliveries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "farmer":
        deliveries = (
            db.query(Delivery)
            .join(ProcurementOrder, Delivery.order_id == ProcurementOrder.id)
            .filter(ProcurementOrder.farmer_id == current_user.id)
            .order_by(Delivery.created_at.desc())
            .all()
        )
    else:
        deliveries = db.query(Delivery).order_by(Delivery.created_at.desc()).all()

    return [format_delivery_response(d) for d in deliveries]

@router.patch("/deliveries/{id}", response_model=DeliveryResponse)
def update_delivery(
    id: str,
    update_in: DeliveryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    delivery = db.query(Delivery).filter(Delivery.id == id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found")

    update_dict = update_in.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(delivery, field, val)

    # Auto-synchronize order status
    order = delivery.order
    if order:
        if delivery.status == "collected":
            order.status = "in_transit"
        elif delivery.status in ["delivered", "completed"]:
            order.status = delivery.status
        db.add(order)

    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return format_delivery_response(delivery)

@router.post("/quality", response_model=QualityRecordResponse)
def create_quality_record(
    qual_in: QualityRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(ProcurementOrder).filter(ProcurementOrder.id == qual_in.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    rec = QualityRecord(
        id=generate_uuid(),
        order_id=qual_in.order_id,
        inspector_name=qual_in.inspector_name,
        inspection_date=qual_in.inspection_date or date.today(),
        assessed_grade=qual_in.assessed_grade,
        moisture_content_pct=qual_in.moisture_content_pct,
        defects_pct=qual_in.defects_pct,
        notes=qual_in.notes,
        passed=qual_in.passed
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

@router.get("/quality/{order_id}", response_model=List[QualityRecordResponse])
def get_order_quality(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(QualityRecord).filter(QualityRecord.order_id == order_id).all()
