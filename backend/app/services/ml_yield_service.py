import os
import json
import sys
from datetime import date
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Crop, Farm, CropForecast
from app.database import generate_uuid

# Add ml_models to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ML_DIR = os.path.join(BASE_DIR, "ml_models")
if ML_DIR not in sys.path:
    sys.path.append(ML_DIR)

from rf_regressor import AgronomicYieldPipeline

MODEL_FILE = os.path.join(ML_DIR, "yield_rf_model.json")
METADATA_FILE = os.path.join(ML_DIR, "model_metadata.json")

# Singleton pipeline instance
_pipeline: Optional[AgronomicYieldPipeline] = None
_metadata: Optional[Dict[str, Any]] = None

def get_pipeline() -> AgronomicYieldPipeline:
    global _pipeline
    if _pipeline is None:
        if os.path.exists(MODEL_FILE):
            _pipeline = AgronomicYieldPipeline.load(MODEL_FILE)
        else:
            raise RuntimeError(f"Trained model not found at {MODEL_FILE}")
    return _pipeline

def get_model_metadata() -> Dict[str, Any]:
    global _metadata
    if _metadata is None:
        if os.path.exists(METADATA_FILE):
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                _metadata = json.load(f)
        else:
            _metadata = {
                "model_name": "AgroSync Yield Predictor",
                "version": "rf-yield-v1.2.0",
                "status": "ready"
            }
    return _metadata

def determine_season(sowing_date: date) -> str:
    month = sowing_date.month
    if 6 <= month <= 10:
        return "Kharif"
    elif 11 <= month or month <= 2:
        return "Rabi"
    else:
        return "Zaid"

def predict_crop_yield(crop: Crop, farm: Farm, db: Session) -> Dict[str, Any]:
    pipeline = get_pipeline()
    metadata = get_model_metadata()

    days_to_harvest = max(30, (crop.expected_harvest_date - crop.sowing_date).days)
    season = determine_season(crop.sowing_date)

    # Regional climate estimation for Maharashtra / Western Ghats horticultural belt
    temp_c = 26.5
    rainfall_mm = 650.0

    input_row = {
        "crop_name": crop.crop_name,
        "soil_type": farm.soil_type,
        "season": season,
        "irrigation_type": farm.irrigation_type,
        "cultivation_area": float(crop.cultivation_area),
        "rainfall_mm": rainfall_mm,
        "temperature_celsius": temp_c,
        "days_to_harvest": days_to_harvest
    }

    pred_res = pipeline.predict_one(input_row)

    predicted_yield = float(pred_res["predicted_yield_kg"])
    lower_est = float(pred_res["lower_estimate_kg"])
    upper_est = float(pred_res["upper_estimate_kg"])

    # Persist forecast to DB
    forecast = CropForecast(
        id=generate_uuid(),
        crop_id=crop.id,
        predicted_yield_kg=predicted_yield,
        lower_estimate_kg=lower_est,
        upper_estimate_kg=upper_est,
        confidence_score=metadata.get("metrics", {}).get("r2_score", 0.83),
        model_version=metadata.get("version", "rf-yield-v1.2.0"),
        feature_importance_json=json.dumps(metadata.get("top_feature_importances", [])),
        weather_context_json=json.dumps({
            "estimated_temp_c": temp_c,
            "estimated_rainfall_mm": rainfall_mm,
            "season": season,
            "days_cycle": days_to_harvest
        })
    )
    db.add(forecast)
    db.commit()
    db.refresh(forecast)

    return {
        "crop_id": crop.id,
        "crop_name": crop.crop_name,
        "cultivation_area_acres": crop.cultivation_area,
        "predicted_yield_kg": predicted_yield,
        "lower_estimate_kg": lower_est,
        "upper_estimate_kg": upper_est,
        "confidence_score": forecast.confidence_score,
        "model_version": forecast.model_version,
        "evaluation_metrics": metadata.get("metrics", {}),
        "explanations": pred_res["explanations"],
        "weather_context": {
            "season": season,
            "days_to_harvest": days_to_harvest,
            "temperature_celsius": temp_c,
            "rainfall_mm": rainfall_mm
        },
        "forecast_id": forecast.id,
        "created_at": forecast.created_at.isoformat()
    }
