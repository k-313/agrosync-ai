import math
import json
from datetime import date
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import ProcurementDemand, Crop, Farm, User, Processor, SupplierMatch
from app.services.supply_accounting import calculate_crop_supply
from app.database import generate_uuid

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

GRADE_WEIGHTS = {
    "Grade A": 3,
    "Grade B": 2,
    "Grade C": 1
}

def calculate_supplier_score(
    crop: Crop,
    farm: Farm,
    demand: ProcurementDemand,
    processor: Processor,
    available_supply: float
) -> Tuple[float, Dict[str, float], float, str]:
    """
    Computes transparent 5-factor weighted score:
    Match Score = 30% Crop Compatibility + 25% Quantity Fulfilment + 20% Harvest Timing + 15% Distance + 10% Quality Compatibility
    """
    # 1. Crop Compatibility (30%)
    crop_match = 30.0 if crop.crop_name.strip().lower() == demand.crop_name.strip().lower() else 0.0

    # 2. Quantity Fulfilment (25%)
    qty_ratio = min(1.0, available_supply / demand.required_quantity)
    quantity_score = round(qty_ratio * 25.0, 1)

    # 3. Harvest Timing (20%)
    # Ideal: Harvest happens 1 to 7 days before delivery
    day_diff = (demand.required_delivery_date - crop.expected_harvest_date).days
    if 1 <= day_diff <= 7:
        timing_score = 20.0
        timing_note = f"Optimal harvest window ({day_diff} days prior to delivery deadline)"
    elif day_diff == 0:
        timing_score = 16.0
        timing_note = "Same-day harvest & dispatch"
    elif 8 <= day_diff <= 20:
        timing_score = 15.0
        timing_note = f"Harvested {day_diff} days prior; requires short holding"
    elif 21 <= day_diff <= 35:
        timing_score = 10.0
        timing_note = f"Harvested {day_diff} days prior"
    elif day_diff < 0:
        timing_score = 0.0
        timing_note = f"Harvest is {abs(day_diff)} days past the required delivery deadline"
    else:
        timing_score = 5.0
        timing_note = f"Harvested {day_diff} days prior"

    # 4. Distance (15%)
    distance_km = haversine_distance_km(
        farm.latitude, farm.longitude, processor.latitude, processor.longitude
    )
    dist_ratio = max(0.0, 1.0 - (distance_km / max(1.0, demand.max_distance_km)))
    distance_score = round(dist_ratio * 15.0, 1)

    # 5. Quality Compatibility (10%)
    crop_grade_val = GRADE_WEIGHTS.get(crop.quality_grade, 2)
    req_grade_val = GRADE_WEIGHTS.get(demand.minimum_quality_grade, 2)
    if crop_grade_val > req_grade_val:
        quality_score = 10.0
        quality_note = f"Exceeds minimum ({crop.quality_grade} vs required {demand.minimum_quality_grade})"
    elif crop_grade_val == req_grade_val:
        quality_score = 9.0
        quality_note = f"Exact match for {demand.minimum_quality_grade}"
    else:
        quality_score = 0.0
        quality_note = f"Below minimum required grade"

    total_score = round(crop_match + quantity_score + timing_score + distance_score + quality_score, 1)

    breakdown = {
        "crop_compatibility": crop_match,
        "quantity_fulfilment": quantity_score,
        "harvest_timing": timing_score,
        "distance": distance_score,
        "quality_compatibility": quality_score,
        "total_score": total_score
    }

    explanation = (
        f"Match Score {total_score}/100: {crop.crop_name} ({crop.variety or 'Standard'}), {distance_km} km away. "
        f"{timing_note}. Supplies {available_supply:,.0f} kg ({qty_ratio*100:.1f}% of order). {quality_note}."
    )

    return total_score, breakdown, distance_km, explanation


def find_and_match_suppliers(demand_id: str, db: Session) -> Dict[str, Any]:
    """
    Executes eligibility filtering, transparent weighted scoring,
    and multi-farmer quantity allocation.
    """
    demand = db.query(ProcurementDemand).filter(ProcurementDemand.id == demand_id).first()
    if not demand:
        raise ValueError("Procurement demand not found")

    processor = db.query(Processor).filter(Processor.id == demand.processor_id).first()
    if not processor:
        raise ValueError("Processor profile not found for demand")

    # Clear previous matches for fresh run
    db.query(SupplierMatch).filter(SupplierMatch.demand_id == demand.id).delete()
    db.commit()

    # Query candidate crops matching crop name
    candidate_crops = (
        db.query(Crop)
        .join(Farm, Crop.farm_id == Farm.id)
        .filter(Crop.crop_name.ilike(demand.crop_name.strip()))
        .all()
    )

    req_grade_val = GRADE_WEIGHTS.get(demand.minimum_quality_grade, 2)
    eligible_candidates = []

    for crop in candidate_crops:
        farm = crop.farm
        farmer = crop.farmer

        # 1. Supply Accounting check
        supply_info = calculate_crop_supply(crop, db)
        available_supply = supply_info["available_supply_kg"]
        if available_supply <= 0:
            continue

        # 2. Quality compatibility filter
        crop_grade_val = GRADE_WEIGHTS.get(crop.quality_grade, 2)
        if crop_grade_val < req_grade_val:
            continue

        # 3. Distance check
        distance_km = haversine_distance_km(
            farm.latitude, farm.longitude, processor.latitude, processor.longitude
        )
        if distance_km > demand.max_distance_km:
            continue

        # 4. Harvest timing check: Harvest should occur before or up to 2 days post required date
        day_diff = (demand.required_delivery_date - crop.expected_harvest_date).days
        if day_diff < -2: # Harvest is more than 2 days late
            continue

        # Compute Score
        total_score, breakdown, dist, explanation = calculate_supplier_score(
            crop, farm, demand, processor, available_supply
        )

        eligible_candidates.append({
            "crop": crop,
            "farm": farm,
            "farmer": farmer,
            "available_supply": available_supply,
            "distance_km": dist,
            "total_score": total_score,
            "breakdown": breakdown,
            "explanation": explanation
        })

    # Rank eligible suppliers by total score descending
    eligible_candidates.sort(key=lambda x: x["total_score"], reverse=True)

    # Multi-farmer allocation algorithm
    remaining_demand = demand.required_quantity
    ranked_suppliers = []
    total_matched = 0.0

    for rank_idx, item in enumerate(eligible_candidates, start=1):
        crop = item["crop"]
        farm = item["farm"]
        farmer = item["farmer"]
        avail = item["available_supply"]

        # Allocate quantity
        if remaining_demand > 0:
            allocated = min(avail, remaining_demand)
            remaining_demand -= allocated
            total_matched += allocated
        else:
            allocated = 0.0 # Recommended as standby/backup supplier

        # Persist SupplierMatch record
        match_record = SupplierMatch(
            id=generate_uuid(),
            demand_id=demand.id,
            crop_id=crop.id,
            farmer_id=farmer.id,
            match_score=item["total_score"],
            score_breakdown_json=json.dumps(item["breakdown"]),
            allocated_quantity=allocated,
            distance_km=item["distance_km"],
            match_explanation=item["explanation"],
            rank=rank_idx,
            status="recommended"
        )
        db.add(match_record)
        db.commit()
        db.refresh(match_record)

        ranked_suppliers.append({
            "match_id": match_record.id,
            "crop_id": crop.id,
            "farmer_id": farmer.id,
            "farmer_name": farmer.full_name,
            "farm_name": farm.farm_name,
            "village": farm.village,
            "district": farm.district,
            "crop_name": crop.crop_name,
            "quality_grade": crop.quality_grade,
            "available_quantity_kg": avail,
            "allocated_quantity_kg": allocated,
            "expected_harvest_date": crop.expected_harvest_date,
            "distance_km": item["distance_km"],
            "match_score": item["total_score"],
            "rank": rank_idx,
            "score_breakdown": item["breakdown"],
            "match_explanation": item["explanation"],
            "latitude": farm.latitude,
            "longitude": farm.longitude
        })

    remaining_shortage = max(0.0, round(demand.required_quantity - total_matched, 1))
    fulfilment_pct = round((total_matched / demand.required_quantity) * 100.0, 1) if demand.required_quantity > 0 else 0.0

    formula_str = (
        "Match Score = 30% Crop Compatibility + 25% Quantity Fulfilment + "
        "20% Harvest Timing + 15% Distance + 10% Quality Compatibility"
    )

    return {
        "demand_id": demand.id,
        "crop_name": demand.crop_name,
        "required_quantity_kg": demand.required_quantity,
        "total_matched_quantity_kg": round(total_matched, 1),
        "remaining_shortage_kg": remaining_shortage,
        "fulfilment_pct": min(100.0, fulfilment_pct),
        "recommended_farmers_count": len([s for s in ranked_suppliers if s["allocated_quantity_kg"] > 0]),
        "is_fully_fulfillable": remaining_shortage == 0.0,
        "formula": formula_str,
        "suppliers": ranked_suppliers
    }
