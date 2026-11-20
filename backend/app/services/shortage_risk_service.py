from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import ProcurementDemand, Crop, ProcurementOrder, Processor, Farm
from app.services.supply_accounting import calculate_crop_supply
from app.services.matching_engine import haversine_distance_km

def analyze_supply_shortage_risk(
    demand_id: str,
    db: Session,
    low_buffer_threshold_pct: float = 15.0, # buffer > 15% means low risk
    medium_shortage_threshold_pct: float = 25.0 # gap <= 25% means medium risk
) -> Dict[str, Any]:
    """
    Rules-based Supply Risk Engine.
    Formula: Supply Gap = max(0, Required Demand - Available Uncommitted Supply)
    
    Clearly distinguishes predicted uncommitted supply from confirmed contracted supply.
    """
    demand = db.query(ProcurementDemand).filter(ProcurementDemand.id == demand_id).first()
    if not demand:
        raise ValueError("Procurement demand not found")

    processor = db.query(Processor).filter(Processor.id == demand.processor_id).first()
    if not processor:
        raise ValueError("Processor not found")

    # 1. Confirmed Supply: Orders in 'accepted', 'in_transit', 'delivered', 'completed'
    confirmed_orders = (
        db.query(ProcurementOrder)
        .filter(
            ProcurementOrder.demand_id == demand.id,
            ProcurementOrder.status.in_(["accepted", "in_transit", "delivered", "completed"])
        )
        .all()
    )
    confirmed_supply_kg = sum(float(o.agreed_quantity) for o in confirmed_orders)

    # 2. Regional Predicted Available Uncommitted Supply within radius
    matching_crops = (
        db.query(Crop)
        .join(Farm, Crop.farm_id == Farm.id)
        .filter(Crop.crop_name.ilike(demand.crop_name.strip()))
        .all()
    )

    eligible_farms_count = 0
    total_predicted_available_kg = 0.0

    for crop in matching_crops:
        farm = crop.farm
        dist = haversine_distance_km(
            farm.latitude, farm.longitude, processor.latitude, processor.longitude
        )
        # Check within distance and harvest timing within window
        if dist <= demand.max_distance_km:
            day_diff = (demand.required_delivery_date - crop.expected_harvest_date).days
            if day_diff >= -3: # harvest timely
                supply_info = calculate_crop_supply(crop, db)
                avail = supply_info["available_supply_kg"]
                if avail > 0:
                    eligible_farms_count += 1
                    total_predicted_available_kg += avail

    required_qty = float(demand.required_quantity)
    # Remaining quantity still required after confirmed orders
    net_required_kg = max(0.0, required_qty - confirmed_supply_kg)

    # Supply Gap formula
    potential_supply_gap_kg = max(0.0, round(net_required_kg - total_predicted_available_kg, 1))

    # Evaluate Risk Category
    coverage_pct = round(((confirmed_supply_kg + total_predicted_available_kg) / max(1.0, required_qty)) * 100.0, 1)

    recommended_actions: List[str] = []

    if potential_supply_gap_kg == 0.0:
        buffer_qty = (confirmed_supply_kg + total_predicted_available_kg) - required_qty
        buffer_pct = (buffer_qty / required_qty) * 100.0 if required_qty > 0 else 0.0
        if buffer_pct >= low_buffer_threshold_pct or confirmed_supply_kg >= required_qty:
            risk_category = "Low"
            risk_color = "#10B981" # Emerald
            recommended_actions.append(
                f"Supply security is strong ({coverage_pct}% coverage). Proceed with final delivery scheduling."
            )
            if confirmed_supply_kg < required_qty:
                recommended_actions.append(
                    "Send formal procurement requests to matched recommended farmers to lock committed supply."
                )
        else:
            risk_category = "Medium"
            risk_color = "#F59E0B" # Amber
            recommended_actions.append(
                f"Supply barely meets demand with a minimal {buffer_pct:.1f}% safety buffer."
            )
            recommended_actions.append(
                "Immediately send binding procurement contracts to top-ranked farmers before competitors reserve them."
            )
    else:
        gap_ratio_pct = (potential_supply_gap_kg / required_qty) * 100.0
        if gap_ratio_pct <= medium_shortage_threshold_pct:
            risk_category = "Medium"
            risk_color = "#F59E0B" # Amber
            recommended_actions.append(
                f"Minor supply deficit of {potential_supply_gap_kg:,.0f} kg ({gap_ratio_pct:.1f}% of order)."
            )
            recommended_actions.append(
                f"Expand procurement radius from {demand.max_distance_km} km to {demand.max_distance_km + 40:.0f} km to capture neighboring district farm clusters."
            )
            recommended_actions.append(
                "Consider flexible delivery windows (+/- 4 days) to access secondary harvests."
            )
        else:
            risk_category = "High"
            risk_color = "#DC2626" # Warning Red
            recommended_actions.append(
                f"CRITICAL SHORTAGE: Projected regional deficit of {potential_supply_gap_kg:,.0f} kg ({gap_ratio_pct:.1f}% of demand)."
            )
            recommended_actions.append(
                f"Broaden procurement perimeter beyond {demand.max_distance_km} km to inter-district grower cooperatives."
            )
            recommended_actions.append(
                "Activate split-delivery batches or explore Grade B / mixed quality specifications."
            )
            recommended_actions.append(
                "Create secondary procurement demands or offer forward purchase price premiums to attract uncommitted growers."
            )

    return {
        "demand_id": demand.id,
        "crop_name": demand.crop_name,
        "required_quantity_kg": required_qty,
        "confirmed_supply_kg": round(confirmed_supply_kg, 1),
        "predicted_available_supply_kg": round(total_predicted_available_kg, 1),
        "total_addressable_supply_kg": round(confirmed_supply_kg + total_predicted_available_kg, 1),
        "potential_supply_gap_kg": potential_supply_gap_kg,
        "coverage_pct": min(200.0, coverage_pct),
        "risk_category": risk_category,
        "risk_color": risk_color,
        "thresholds": {
            "low_safety_buffer_pct": f">= {low_buffer_threshold_pct}% buffer",
            "medium_deficit_threshold_pct": f"<= {medium_shortage_threshold_pct}% deficit",
            "high_critical_threshold_pct": f"> {medium_shortage_threshold_pct}% deficit"
        },
        "recommended_actions": recommended_actions,
        "supply_breakdown": {
            "eligible_farms_in_radius": eligible_farms_count,
            "max_distance_km": demand.max_distance_km,
            "required_delivery_date": str(demand.required_delivery_date),
            "status": demand.status
        }
    }
