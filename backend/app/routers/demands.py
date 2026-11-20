from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, generate_uuid
from app.models import ProcurementDemand, Processor, User, SupplierMatch, ProcurementOrder
from app.schemas import DemandCreate, DemandUpdate, DemandResponse
from app.services.auth_service import get_current_user, require_role

router = APIRouter(prefix="/demands", tags=["Procurement Demands"])

def format_demand_response(demand: ProcurementDemand, db: Session) -> DemandResponse:
    processor = demand.processor
    # Sum up matched quantities and committed orders
    matches = db.query(SupplierMatch).filter(SupplierMatch.demand_id == demand.id).all()
    matched_qty = sum(m.allocated_quantity for m in matches if m.allocated_quantity > 0)

    orders = (
        db.query(ProcurementOrder)
        .filter(
            ProcurementOrder.demand_id == demand.id,
            ProcurementOrder.status.in_(["accepted", "in_transit", "delivered", "completed"])
        )
        .all()
    )
    committed_qty = sum(o.agreed_quantity for o in orders)

    return DemandResponse(
        id=demand.id,
        processor_id=demand.processor_id,
        crop_name=demand.crop_name,
        required_quantity=demand.required_quantity,
        minimum_quality_grade=demand.minimum_quality_grade,
        required_delivery_date=demand.required_delivery_date,
        max_distance_km=demand.max_distance_km,
        target_price_per_kg=demand.target_price_per_kg,
        additional_requirements=demand.additional_requirements,
        status=demand.status,
        company_name=processor.company_name if processor else "Agro Processor",
        matched_quantity=matched_qty,
        committed_quantity=committed_qty,
        created_at=demand.created_at
    )

@router.post("", response_model=DemandResponse)
def create_demand(
    demand_in: DemandCreate,
    current_user: User = Depends(require_role(["processor", "admin"])),
    db: Session = Depends(get_db)
):
    processor = db.query(Processor).filter(Processor.user_id == current_user.id).first()
    if not processor:
        raise HTTPException(status_code=400, detail="Processor profile not configured")

    new_demand = ProcurementDemand(
        id=generate_uuid(),
        processor_id=processor.id,
        crop_name=demand_in.crop_name,
        required_quantity=demand_in.required_quantity,
        minimum_quality_grade=demand_in.minimum_quality_grade,
        required_delivery_date=demand_in.required_delivery_date,
        max_distance_km=demand_in.max_distance_km,
        target_price_per_kg=demand_in.target_price_per_kg,
        additional_requirements=demand_in.additional_requirements,
        status="active"
    )
    db.add(new_demand)
    db.commit()
    db.refresh(new_demand)

    return format_demand_response(new_demand, db)

@router.get("", response_model=List[DemandResponse])
def get_demands(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "processor":
        processor = db.query(Processor).filter(Processor.user_id == current_user.id).first()
        if not processor:
            return []
        demands = db.query(ProcurementDemand).filter(ProcurementDemand.processor_id == processor.id).all()
    else:
        # Farmers and Admin see active demands
        demands = db.query(ProcurementDemand).all()

    return [format_demand_response(d, db) for d in demands]

@router.get("/{id}", response_model=DemandResponse)
def get_demand(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    demand = db.query(ProcurementDemand).filter(ProcurementDemand.id == id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    return format_demand_response(demand, db)

@router.put("/{id}", response_model=DemandResponse)
def update_demand(
    id: str,
    demand_in: DemandUpdate,
    current_user: User = Depends(require_role(["processor", "admin"])),
    db: Session = Depends(get_db)
):
    demand = db.query(ProcurementDemand).filter(ProcurementDemand.id == id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")

    update_data = demand_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(demand, field, value)

    db.add(demand)
    db.commit()
    db.refresh(demand)
    return format_demand_response(demand, db)

@router.delete("/{id}")
def delete_demand(
    id: str,
    current_user: User = Depends(require_role(["processor", "admin"])),
    db: Session = Depends(get_db)
):
    demand = db.query(ProcurementDemand).filter(ProcurementDemand.id == id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")

    db.delete(demand)
    db.commit()
    return {"message": "Demand deleted successfully"}
