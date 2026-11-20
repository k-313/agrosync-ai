from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Farm, Crop, Processor, ProcurementDemand, ProcurementOrder, Delivery, Notification
from app.services.auth_service import get_current_user
from app.services.supply_accounting import calculate_crop_supply
from collections import defaultdict
import io
import csv

router = APIRouter(prefix="", tags=["Analytics & Reports"])

@router.get("/dashboard/farmer")
def get_farmer_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farms = db.query(Farm).filter(Farm.farmer_id == current_user.id).all()
    crops = db.query(Crop).filter(Crop.farmer_id == current_user.id).all()

    total_pred = 0.0
    total_avail = 0.0
    total_committed = 0.0

    for c in crops:
        info = calculate_crop_supply(c, db)
        total_pred += info["predicted_harvest_kg"]
        total_avail += info["available_supply_kg"]
        total_committed += info["committed_quantity_kg"]

    pending_orders = (
        db.query(ProcurementOrder)
        .filter(ProcurementOrder.farmer_id == current_user.id, ProcurementOrder.status == "requested")
        .count()
    )

    recent_orders = (
        db.query(ProcurementOrder)
        .filter(ProcurementOrder.farmer_id == current_user.id)
        .order_by(ProcurementOrder.created_at.desc())
        .limit(5)
        .all()
    )

    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_farms": len(farms),
        "active_crops_count": len(crops),
        "total_cultivated_area_acres": sum(c.cultivation_area for c in crops),
        "estimated_upcoming_harvest_kg": round(total_pred, 1),
        "available_supply_kg": round(total_avail, 1),
        "committed_supply_kg": round(total_committed, 1),
        "pending_procurement_requests": pending_orders,
        "recent_orders": [
            {
                "id": o.id,
                "order_code": o.order_code,
                "crop_name": o.crop.crop_name if o.crop else "Crop",
                "agreed_quantity": o.agreed_quantity,
                "price_per_kg": o.price_per_kg,
                "total_value": o.total_value,
                "status": o.status,
                "company_name": o.processor.company_name if o.processor else "Processor"
            }
            for o in recent_orders
        ],
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat()
            }
            for n in notifications
        ]
    }

@router.get("/dashboard/processor")
def get_processor_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    processor = db.query(Processor).filter(Processor.user_id == current_user.id).first()
    proc_id = processor.id if processor else None

    demands_query = db.query(ProcurementDemand)
    orders_query = db.query(ProcurementOrder)

    if proc_id and current_user.role == "processor":
        demands = demands_query.filter(ProcurementDemand.processor_id == proc_id).all()
        orders = orders_query.filter(ProcurementOrder.processor_id == proc_id).all()
    else:
        demands = demands_query.all()
        orders = orders_query.all()

    total_required = sum(d.required_quantity for d in demands)

    # Confirmed orders
    confirmed_orders = [o for o in orders if o.status in ["accepted", "in_transit", "delivered", "completed"]]
    confirmed_supply = sum(o.agreed_quantity for o in confirmed_orders)

    # Calculate active suppliers count
    unique_farmers = set(o.farmer_id for o in confirmed_orders)

    # Regional crop distribution across all farms
    all_crops = db.query(Crop).all()
    crop_dist = defaultdict(float)
    for c in all_crops:
        info = calculate_crop_supply(c, db)
        crop_dist[c.crop_name] += info["available_supply_kg"]

    crop_chart_data = [{"crop": k, "available_kg": round(v, 1)} for k, v in crop_dist.items()]

    # District distribution of suppliers
    district_dist = defaultdict(int)
    all_farms = db.query(Farm).all()
    for f in all_farms:
        district_dist[f.district] += 1
    district_chart_data = [{"district": k, "farms_count": v} for k, v in district_dist.items()]

    # Potential supply gap across active demands
    potential_shortage = max(0.0, round(total_required - confirmed_supply, 1))

    return {
        "company_name": processor.company_name if processor else "Agro Processor",
        "total_demands": len(demands),
        "total_required_quantity_kg": round(total_required, 1),
        "confirmed_supply_kg": round(confirmed_supply, 1),
        "potential_shortage_kg": potential_shortage,
        "active_suppliers_count": len(unique_farmers),
        "active_orders_count": len(orders),
        "crop_supply_distribution": crop_chart_data,
        "district_distribution": district_chart_data,
        "recent_orders": [
            {
                "id": o.id,
                "order_code": o.order_code,
                "crop_name": o.crop.crop_name if o.crop else "Crop",
                "farmer_name": o.farmer.full_name if o.farmer else "Farmer",
                "agreed_quantity": o.agreed_quantity,
                "price_per_kg": o.price_per_kg,
                "total_value": o.total_value,
                "status": o.status,
                "delivery_deadline": str(o.delivery_deadline)
            }
            for o in orders[:6]
        ]
    }

@router.get("/dashboard/admin")
def get_admin_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farmers_count = db.query(User).filter(User.role == "farmer").count()
    processors_count = db.query(User).filter(User.role == "processor").count()
    farms_count = db.query(Farm).count()
    crops_count = db.query(Crop).count()
    demands_count = db.query(ProcurementDemand).count()
    orders = db.query(ProcurementOrder).all()

    total_trade_volume_kg = sum(o.agreed_quantity for o in orders if o.status != "rejected")
    total_trade_value_inr = sum(o.total_value for o in orders if o.status != "rejected")

    return {
        "total_farmers": farmers_count,
        "total_processors": processors_count,
        "registered_farms": farms_count,
        "registered_crops": crops_count,
        "active_demands": demands_count,
        "procurement_orders_count": len(orders),
        "total_trade_volume_kg": round(total_trade_volume_kg, 1),
        "total_trade_value_inr": round(total_trade_value_inr, 2),
        "system_status": "Healthy (All AI models active)",
        "users_overview": [
            {"role": "Farmers", "count": farmers_count},
            {"role": "Processors", "count": processors_count},
            {"role": "Admins", "count": db.query(User).filter(User.role == "admin").count()}
        ]
    }

@router.get("/reports/supply")
def export_supply_report(db: Session = Depends(get_db)):
    crops = db.query(Crop).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Crop ID", "Crop Name", "Variety", "Farm Name", "Farmer Name", "District",
        "State", "Cultivation Area (Acres)", "Expected Harvest Date", "Predicted Yield (kg)",
        "Committed (kg)", "Available Supply (kg)", "Quality Grade"
    ])

    for c in crops:
        info = calculate_crop_supply(c, db)
        farm = c.farm
        farmer = c.farmer
        writer.writerow([
            c.id, c.crop_name, c.variety or "",
            farm.farm_name if farm else "",
            farmer.full_name if farmer else "",
            farm.district if farm else "",
            farm.state if farm else "",
            c.cultivation_area, str(c.expected_harvest_date),
            info["predicted_harvest_kg"],
            c.committed_quantity,
            info["available_supply_kg"],
            c.quality_grade
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agrosync_supply_report.csv"}
    )

@router.get("/reports/demand")
def export_demand_report(db: Session = Depends(get_db)):
    demands = db.query(ProcurementDemand).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Demand ID", "Company Name", "Crop Name", "Required Quantity (kg)",
        "Min Quality Grade", "Delivery Deadline", "Max Radius (km)", "Target Price (INR/kg)", "Status"
    ])

    for d in demands:
        proc = d.processor
        writer.writerow([
            d.id, proc.company_name if proc else "",
            d.crop_name, d.required_quantity,
            d.minimum_quality_grade, str(d.required_delivery_date),
            d.max_distance_km, d.target_price_per_kg, d.status
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agrosync_demand_report.csv"}
    )

@router.get("/reports/delivery")
def export_delivery_report(db: Session = Depends(get_db)):
    deliveries = db.query(Delivery).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Delivery ID", "Tracking Number", "Order Code", "Farmer Name", "Crop",
        "Scheduled Collection", "Pickup Date", "Expected Delivery", "Status",
        "Collected (kg)", "Received (kg)", "Remarks"
    ])

    for d in deliveries:
        order = d.order
        farmer = order.farmer if order else None
        crop = order.crop if order else None
        writer.writerow([
            d.id, d.tracking_number,
            order.order_code if order else "",
            farmer.full_name if farmer else "",
            crop.crop_name if crop else "",
            str(d.collection_scheduled_date),
            str(d.pickup_date) if d.pickup_date else "N/A",
            str(d.expected_delivery_date),
            d.status, d.collected_quantity, d.received_quantity,
            d.remarks or ""
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agrosync_logistics_report.csv"}
    )
