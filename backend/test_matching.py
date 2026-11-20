from app.database import SessionLocal
from app.models import ProcurementDemand
from app.services.matching_engine import find_and_match_suppliers
from app.services.shortage_risk_service import analyze_supply_shortage_risk

db = SessionLocal()
demand = db.query(ProcurementDemand).first()
print(f"Demand: {demand.crop_name} {demand.required_quantity} kg")

res = find_and_match_suppliers(demand.id, db)
print(f"Matched Quantity: {res['total_matched_quantity_kg']} kg")
print(f"Remaining Shortage: {res['remaining_shortage_kg']} kg")
print(f"Recommended Farmers: {res['recommended_farmers_count']}")
for s in res['suppliers']:
    print(f"Rank {s['rank']}: {s['farmer_name']} | Distance: {s['distance_km']} km | Score: {s['match_score']} | Allocated: {s['allocated_quantity_kg']} kg / Available: {s['available_quantity_kg']} kg")

risk = analyze_supply_shortage_risk(demand.id, db)
print(f"Risk Category: {risk['risk_category']} (Gap: {risk['potential_supply_gap_kg']} kg)")
print(f"Recommended Actions: {risk['recommended_actions']}")
db.close()
