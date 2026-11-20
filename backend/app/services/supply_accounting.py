from sqlalchemy.orm import Session
from app.models import Crop, CropForecast

def get_crop_predicted_harvest(crop: Crop, db: Session) -> float:
    """
    Returns the latest ML predicted harvest in kg if available,
    falling back to the crop's baseline estimated_quantity.
    """
    latest_forecast = (
        db.query(CropForecast)
        .filter(CropForecast.crop_id == crop.id)
        .order_by(CropForecast.created_at.desc())
        .first()
    )
    if latest_forecast:
        return float(latest_forecast.predicted_yield_kg)
    return float(crop.estimated_quantity)

def calculate_crop_supply(crop: Crop, db: Session) -> dict:
    """
    Strict Supply Accounting:
    Available Supply = Predicted Harvest - Farmer Retained Quantity - Expected Losses - Already Committed Quantity
    """
    predicted_harvest = get_crop_predicted_harvest(crop, db)
    retained_qty = float(crop.retained_quantity or 0.0)
    loss_buffer_pct = float(crop.loss_buffer_pct or 0.0)
    expected_losses = round(predicted_harvest * (loss_buffer_pct / 100.0), 1)
    committed_qty = float(crop.committed_quantity or 0.0)

    gross_marketable = predicted_harvest - retained_qty - expected_losses
    available_supply = max(0.0, round(gross_marketable - committed_qty, 1))

    return {
        "predicted_harvest_kg": predicted_harvest,
        "retained_quantity_kg": retained_qty,
        "loss_buffer_pct": loss_buffer_pct,
        "expected_losses_kg": expected_losses,
        "committed_quantity_kg": committed_qty,
        "gross_marketable_kg": max(0.0, gross_marketable),
        "available_supply_kg": available_supply
    }

def commit_crop_supply(crop_id: str, quantity_kg: float, db: Session) -> bool:
    """
    Concurrency-safe supply commitment to prevent double booking.
    In PostgreSQL, with_for_update() locks the row; SQLite locks at transaction level.
    """
    crop = db.query(Crop).filter(Crop.id == crop_id).with_for_update().first()
    if not crop:
        return False

    supply_info = calculate_crop_supply(crop, db)
    if supply_info["available_supply_kg"] < quantity_kg:
        return False # Insufficient available uncommitted supply

    crop.committed_quantity = float(crop.committed_quantity or 0.0) + quantity_kg
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return True

def release_crop_supply(crop_id: str, quantity_kg: float, db: Session) -> bool:
    """
    Releases committed supply when an order is rejected or cancelled.
    """
    crop = db.query(Crop).filter(Crop.id == crop_id).with_for_update().first()
    if not crop:
        return False

    current_committed = float(crop.committed_quantity or 0.0)
    crop.committed_quantity = max(0.0, current_committed - quantity_kg)
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return True
