from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Crop, Farm, ProcurementDemand, CropForecast, User
from app.services.auth_service import get_current_user
from app.services.ml_yield_service import predict_crop_yield, get_model_metadata
from app.services.matching_engine import find_and_match_suppliers
from app.services.shortage_risk_service import analyze_supply_shortage_risk

router = APIRouter(prefix="/ai", tags=["AI & Analytics Engines"])

@router.post("/predict-yield/{crop_id}")
def run_yield_prediction(
    crop_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop record not found")

    farm = crop.farm
    if not farm:
        raise HTTPException(status_code=404, detail="Farm record not found for crop")

    if current_user.role == "farmer" and crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to run predictions for this crop")

    prediction_result = predict_crop_yield(crop, farm, db)
    return prediction_result

@router.get("/forecast/{crop_id}")
def get_crop_forecast(
    crop_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop record not found")

    forecast = (
        db.query(CropForecast)
        .filter(CropForecast.crop_id == crop_id)
        .order_by(CropForecast.created_at.desc())
        .first()
    )
    if not forecast:
        # Trigger prediction on the fly if not yet generated
        farm = crop.farm
        return predict_crop_yield(crop, farm, db)

    import json
    return {
        "crop_id": crop.id,
        "crop_name": crop.crop_name,
        "cultivation_area_acres": crop.cultivation_area,
        "predicted_yield_kg": forecast.predicted_yield_kg,
        "lower_estimate_kg": forecast.lower_estimate_kg,
        "upper_estimate_kg": forecast.upper_estimate_kg,
        "confidence_score": forecast.confidence_score,
        "model_version": forecast.model_version,
        "feature_importances": json.loads(forecast.feature_importance_json or "[]"),
        "weather_context": json.loads(forecast.weather_context_json or "{}"),
        "created_at": forecast.created_at.isoformat()
    }

@router.post("/match/{demand_id}")
def run_supplier_matching(
    demand_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    demand = db.query(ProcurementDemand).filter(ProcurementDemand.id == demand_id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Procurement demand not found")

    try:
        matching_results = find_and_match_suppliers(demand_id, db)
        return matching_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching engine error: {str(e)}")

@router.get("/risk/{demand_id}")
def get_supply_risk_analysis(
    demand_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    demand = db.query(ProcurementDemand).filter(ProcurementDemand.id == demand_id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Procurement demand not found")

    try:
        risk_result = analyze_supply_shortage_risk(demand_id, db)
        return risk_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk engine error: {str(e)}")

@router.get("/model-info")
def get_ai_model_info():
    return get_model_metadata()
