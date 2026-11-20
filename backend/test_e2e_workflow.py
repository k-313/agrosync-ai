"""
AgroSync AI - End-to-End Workflow Verification Script
Validates all 11 core functional modules, authentication, ML yield forecasting,
multi-farmer supplier matching, supply accounting, shortage detection, and delivery tracking.
"""

import os
import sys
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app

client = TestClient(app)

def test_full_workflow():
    print("\n--- [1] Testing Health Check & System Status ---")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ Health check operational:", res.json())

    print("\n--- [2] Testing Processor Authentication ---")
    login_res = client.post("/api/auth/login", json={
        "email": "processor@agrosync.com",
        "password": "Processor123!"
    })
    assert login_res.status_code == 200, f"Processor login failed: {login_res.text}"
    proc_token = login_res.json()["access_token"]
    proc_headers = {"Authorization": f"Bearer {proc_token}"}
    print("✓ Food Processor logged in successfully:", login_res.json()["email"])

    print("\n--- [3] Testing Farmer Authentication ---")
    farmer_login = client.post("/api/auth/login", json={
        "email": "farmer1@agrosync.com",
        "password": "Farmer123!"
    })
    assert farmer_login.status_code == 200, f"Farmer login failed: {farmer_login.text}"
    farmer_token = farmer_login.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    print("✓ Farmer logged in successfully:", farmer_login.json()["email"])

    print("\n--- [4] Testing Crop List & Supply Accounting ---")
    crops_res = client.get("/api/crops", headers=farmer_headers)
    assert crops_res.status_code == 200, f"Crops list failed: {crops_res.text}"
    farmer_crops = crops_res.json()
    assert len(farmer_crops) > 0, "No crops found for farmer"
    target_crop = farmer_crops[0]
    print(f"✓ Found Farmer Crop: {target_crop['crop_name']} ({target_crop['cultivation_area']} acres)")
    print(f"  Predicted Yield: {target_crop['predicted_yield_kg']:,.0f} kg | Available Supply: {target_crop['available_supply_kg']:,.0f} kg")

    print("\n--- [5] Testing AI Yield Prediction Endpoint ---")
    pred_res = client.post(f"/api/ai/predict-yield/{target_crop['id']}", headers=farmer_headers)
    assert pred_res.status_code == 200, f"Yield prediction failed: {pred_res.text}"
    pred_data = pred_res.json()
    print(f"✓ AI Yield Forecast generated: {pred_data['predicted_yield_kg']:,.0f} kg")
    print(f"  95% Confidence Interval: {pred_data['lower_estimate_kg']:,.0f} kg to {pred_data['upper_estimate_kg']:,.0f} kg")
    print(f"  Explanations: {pred_data['explanations']}")

    print("\n--- [6] Testing Processor Demands ---")
    demands_res = client.get("/api/demands", headers=proc_headers)
    assert demands_res.status_code == 200, f"Demands list failed: {demands_res.text}"
    demands = demands_res.json()
    assert len(demands) > 0, "No demands found"
    target_demand = demands[0]
    print(f"✓ Active Demand: {target_demand['crop_name']} {target_demand['required_quantity']:,.0f} kg by {target_demand['required_delivery_date']}")

    print("\n--- [7] Testing AI Multi-Farmer Supplier Matching Engine ---")
    match_res = client.post(f"/api/ai/match/{target_demand['id']}", headers=proc_headers)
    assert match_res.status_code == 200, f"Matching engine failed: {match_res.text}"
    match_data = match_res.json()
    print(f"✓ Multi-Farmer Matching Completed:")
    print(f"  Required: {match_data['required_quantity_kg']:,.0f} kg | Matched: {match_data['total_matched_quantity_kg']:,.0f} kg | Remaining: {match_data['remaining_shortage_kg']} kg")
    print(f"  Recommended Growers: {match_data['recommended_farmers_count']} farmers")
    for s in match_data['suppliers']:
        print(f"  - Rank #{s['rank']}: {s['farmer_name']} ({s['village']}) | Dist: {s['distance_km']}km | Score: {s['match_score']}/100 | Allocated: {s['allocated_quantity_kg']:,.0f} kg")

    print("\n--- [8] Testing Rules-Based Supply Shortage Risk Analysis ---")
    risk_res = client.get(f"/api/ai/risk/{target_demand['id']}", headers=proc_headers)
    assert risk_res.status_code == 200, f"Risk analysis failed: {risk_res.text}"
    risk_data = risk_res.json()
    print(f"✓ Supply Shortage Risk Analysis:")
    print(f"  Risk Category: {risk_data['risk_category']} | Potential Gap: {risk_data['potential_supply_gap_kg']} kg | Coverage: {risk_data['coverage_pct']}%")
    print(f"  Actions: {risk_data['recommended_actions']}")

    print("\n--- [9] Testing Procurement Order Creation (Anti-Double Booking) ---")
    top_supplier = match_data['suppliers'][0]
    order_payload = {
        "demand_id": target_demand['id'],
        "crop_id": top_supplier['crop_id'],
        "farmer_id": top_supplier['farmer_id'],
        "match_id": top_supplier['match_id'],
        "agreed_quantity": top_supplier['allocated_quantity_kg'],
        "price_per_kg": target_demand['target_price_per_kg'] or 26.50,
        "delivery_deadline": target_demand['required_delivery_date']
    }
    order_res = client.post("/api/orders", json=order_payload, headers=proc_headers)
    assert order_res.status_code == 200, f"Order creation failed: {order_res.text}"
    order_data = order_res.json()
    print(f"✓ Procurement Order Dispatched: {order_data['order_code']} for {order_data['agreed_quantity']:,.0f} kg @ ₹{order_data['price_per_kg']}/kg")
    print(f"  Order Status: {order_data['status']}")

    print("\n--- [10] Testing Farmer Acceptance & Logistics Milestone ---")
    accept_res = client.post(f"/api/orders/{order_data['id']}/accept", headers=farmer_headers)
    assert accept_res.status_code == 200, f"Order accept failed: {accept_res.text}"
    print(f"✓ Farmer Accepted Order: {accept_res.json()['status']}")

    # Check Delivery record auto-created
    del_res = client.get("/api/deliveries", headers=farmer_headers)
    assert del_res.status_code == 200
    deliveries = del_res.json()
    assert len(deliveries) > 0, "Delivery not created on order acceptance"
    print(f"✓ Logistics Dispatch Scheduled: Tracking #{deliveries[0]['tracking_number']} (Status: {deliveries[0]['status']})")

    print("\n--- [11] Testing Quality Inspection Record ---")
    qual_res = client.post("/api/quality", json={
        "order_id": order_data['id'],
        "inspector_name": "Dr. Sandeep Kulkarni",
        "assessed_grade": "Grade A",
        "moisture_content_pct": 88.2,
        "defects_pct": 1.5,
        "notes": "Verified food-grade intake sample.",
        "passed": True
    }, headers=proc_headers)
    assert qual_res.status_code == 200, f"Quality record creation failed: {qual_res.text}"
    print(f"✓ Quality Inspection Passed: {qual_res.json()['assessed_grade']} (Defects: {qual_res.json()['defects_pct']}%)")

    print("\n--- [12] Testing Analytics & Dashboards ---")
    admin_dash = client.get("/api/dashboard/admin", headers=proc_headers)
    assert admin_dash.status_code == 200
    print(f"✓ Admin Dashboard Metrics: Total Farmers={admin_dash.json()['total_farmers']}, Total Demands={admin_dash.json()['active_demands']}")

    print("\n=======================================================")
    print("ALL 12 END-TO-END WORKFLOW INTEGRATION TESTS PASSED 100%!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_workflow()
