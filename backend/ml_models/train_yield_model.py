"""
AgroSync AI - Crop Yield Prediction Training Script
Generates agronomic training data based on ICAR/FAO horticultural benchmarks,
trains the pure-Python RandomForestRegressor ensemble pipeline,
and saves the model and evaluation metadata.
"""

import os
import json
import random
import math
from datetime import datetime, timezone
from rf_regressor import AgronomicYieldPipeline

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, "yield_rf_model.json")
METADATA_FILE = os.path.join(MODEL_DIR, "model_metadata.json")

def generate_agronomic_records(n_samples=1500, seed=42):
    rng = random.Random(seed)
    crops = ["Tomato", "Potato", "Onion", "Green Chilli", "Cabbage", "Carrot", "Sugarcane"]
    soil_types = ["Loamy", "Black Cotton", "Red Sandy", "Clay", "Alluvial"]
    seasons = ["Kharif", "Rabi", "Zaid"]
    irrigation_types = ["Drip", "Sprinkler", "Canal", "Rainfed"]

    base_yield_per_acre = {
        "Tomato": 16000.0,
        "Potato": 12000.0,
        "Onion": 10500.0,
        "Green Chilli": 6500.0,
        "Cabbage": 18000.0,
        "Carrot": 14000.0,
        "Sugarcane": 38000.0
    }

    soil_mult = {
        "Loamy": 1.15,
        "Alluvial": 1.18,
        "Black Cotton": 1.08,
        "Red Sandy": 0.90,
        "Clay": 0.85
    }

    irrig_mult = {
        "Drip": 1.20,
        "Sprinkler": 1.10,
        "Canal": 0.98,
        "Rainfed": 0.75
    }

    records = []
    for _ in range(n_samples):
        crop = rng.choice(crops)
        soil = rng.choice(soil_types)
        season = rng.choice(seasons)
        irrigation = rng.choice(irrigation_types)
        
        area = round(rng.uniform(0.5, 10.0), 2)
        rainfall_mm = round(rng.uniform(250.0, 1000.0), 1)
        temp_c = round(rng.uniform(18.0, 36.0), 1)
        days_to_harvest = rng.randint(70, 140)

        # Agronomic response curves
        temp_factor = 1.0 - 0.015 * abs(temp_c - 26.0)
        temp_factor = max(0.65, min(1.15, temp_factor))

        if irrigation == "Rainfed":
            rain_factor = min(1.2, rainfall_mm / 600.0)
        else:
            rain_factor = 0.95 + 0.1 * min(1.0, rainfall_mm / 700.0)

        noise = rng.gauss(1.0, 0.06) # 6% natural variation
        calc_yield = (
            base_yield_per_acre[crop] * 
            area * 
            soil_mult[soil] * 
            irrig_mult[irrigation] * 
            temp_factor * 
            rain_factor * 
            noise
        )
        calc_yield = max(150.0, round(calc_yield, 1))

        records.append({
            "crop_name": crop,
            "soil_type": soil,
            "season": season,
            "irrigation_type": irrigation,
            "cultivation_area": area,
            "rainfall_mm": rainfall_mm,
            "temperature_celsius": temp_c,
            "days_to_harvest": days_to_harvest,
            "harvested_yield_kg": calc_yield
        })

    return records

def train():
    print("Generating agronomic historical harvest records...")
    records = generate_agronomic_records(n_samples=1200, seed=42)

    # Train / Test split (80 / 20)
    rng = random.Random(42)
    shuffled = list(records)
    rng.shuffle(shuffled)
    split_idx = int(len(shuffled) * 0.8)
    train_records = shuffled[:split_idx]
    test_records = shuffled[split_idx:]

    print(f"Dataset split: {len(train_records)} training records, {len(test_records)} test records.")

    pipeline = AgronomicYieldPipeline()
    print("Fitting pure-Python RandomForestRegressor ensemble pipeline (35 trees, depth 9)...")
    pipeline.fit(train_records, n_estimators=35, max_depth=9)

    print("Evaluating test predictions...")
    y_true = [r["harvested_yield_kg"] for r in test_records]
    y_preds = []
    for r in test_records:
        pred_res = pipeline.predict_one(r)
        y_preds.append(pred_res["predicted_yield_kg"])

    mae = sum(abs(t - p) for t, p in zip(y_true, y_preds)) / len(y_true)
    rmse = math.sqrt(sum((t - p) ** 2 for t, p in zip(y_true, y_preds)) / len(y_true))
    mean_y = sum(y_true) / len(y_true)
    ss_tot = sum((t - mean_y) ** 2 for t in y_true)
    ss_res = sum((t - p) ** 2 for t, p in zip(y_true, y_preds))
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

    print("--- Model Evaluation Metrics ---")
    print(f"R² Score:            {r2:.4f}")
    print(f"MAE:                 {mae:.2f} kg")
    print(f"RMSE:                {rmse:.2f} kg")
    print(f"Mean Test Target:    {mean_y:.2f} kg")
    print(f"Mean Relative Error: {(mae / mean_y) * 100:.2f}%")

    pipeline.save(MODEL_FILE)
    print(f"Saved model to: {MODEL_FILE}")

    # Top feature importances
    feat_names = pipeline.feature_names
    feat_imps = pipeline.rf.feature_importances_
    sorted_imps = sorted(
        [{"feature": f, "importance": round(imp, 4)} for f, imp in zip(feat_names, feat_imps)],
        key=lambda x: x["importance"],
        reverse=True
    )

    metadata = {
        "model_name": "AgroSync Yield Predictor",
        "algorithm": "Pure Random Forest Regressor (35 Estimators, Depth 9)",
        "version": "rf-yield-v1.2.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "samples_trained": len(train_records),
        "samples_tested": len(test_records),
        "metrics": {
            "r2_score": round(r2, 4),
            "mae_kg": round(mae, 2),
            "rmse_kg": round(rmse, 2),
            "mean_test_target_kg": round(mean_y, 2),
            "relative_error_pct": round((mae / mean_y) * 100, 2)
        },
        "top_feature_importances": sorted_imps[:8],
        "supported_crops": sorted(list(set(r["crop_name"] for r in records))),
        "supported_soils": sorted(list(set(r["soil_type"] for r in records))),
        "supported_irrigations": sorted(list(set(r["irrigation_type"] for r in records))),
        "supported_seasons": sorted(list(set(r["season"] for r in records))),
        "disclosure": "Trained on an agronomic simulation dataset calibrated against ICAR/FAO regional horticultural yield benchmarks. Evaluated on a held-out 20% test split."
    }

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to: {METADATA_FILE}")

if __name__ == "__main__":
    train()
