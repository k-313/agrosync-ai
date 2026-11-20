import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SupplierMatch, ProcurementDemand, User
from app.services.auth_service import get_current_user
from app.services.matching_engine import find_and_match_suppliers

router = APIRouter(prefix="/matches", tags=["Matches"])

@router.get("/{demand_id}")
def get_matches_for_demand(
    demand_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    matches = (
        db.query(SupplierMatch)
        .filter(SupplierMatch.demand_id == demand_id)
        .order_by(SupplierMatch.rank.asc())
        .all()
    )
    if not matches:
        # Run matching if not yet computed
        return find_and_match_suppliers(demand_id, db)

    demand = db.query(ProcurementDemand).filter(ProcurementDemand.id == demand_id).first()
    suppliers = []
    total_matched = 0.0

    for m in matches:
        crop = m.crop
        farm = crop.farm
        farmer = crop.farmer
        breakdown = json.loads(m.score_breakdown_json or "{}")

        suppliers.append({
            "match_id": m.id,
            "crop_id": m.crop_id,
            "farmer_id": m.farmer_id,
            "farmer_name": farmer.full_name if farmer else "Farmer",
            "farm_name": farm.farm_name if farm else "Farm",
            "village": farm.village if farm else "Village",
            "district": farm.district if farm else "District",
            "crop_name": crop.crop_name,
            "quality_grade": crop.quality_grade,
            "available_quantity_kg": crop.estimated_quantity,
            "allocated_quantity_kg": m.allocated_quantity,
            "expected_harvest_date": crop.expected_harvest_date,
            "distance_km": m.distance_km,
            "match_score": m.match_score,
            "rank": m.rank,
            "score_breakdown": breakdown,
            "match_explanation": m.match_explanation,
            "latitude": farm.latitude if farm else 19.99,
            "longitude": farm.longitude if farm else 73.78
        })
        if m.allocated_quantity > 0:
            total_matched += m.allocated_quantity

    remaining_shortage = max(0.0, round(demand.required_quantity - total_matched, 1))
    fulfilment_pct = round((total_matched / demand.required_quantity) * 100.0, 1) if demand.required_quantity > 0 else 0.0

    return {
        "demand_id": demand.id,
        "crop_name": demand.crop_name,
        "required_quantity_kg": demand.required_quantity,
        "total_matched_quantity_kg": round(total_matched, 1),
        "remaining_shortage_kg": remaining_shortage,
        "fulfilment_pct": min(100.0, fulfilment_pct),
        "recommended_farmers_count": len([s for s in suppliers if s["allocated_quantity_kg"] > 0]),
        "is_fully_fulfillable": remaining_shortage == 0.0,
        "formula": "Match Score = 30% Crop Compatibility + 25% Quantity Fulfilment + 20% Harvest Timing + 15% Distance + 10% Quality Compatibility",
        "suppliers": suppliers
    }
