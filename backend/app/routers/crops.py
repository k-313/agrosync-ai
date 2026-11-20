from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, generate_uuid
from app.models import Crop, Farm, User, CropForecast
from app.schemas import CropCreate, CropUpdate, CropResponse, CropForecastSummary
from app.services.auth_service import get_current_user, require_role
from app.services.supply_accounting import calculate_crop_supply, get_crop_predicted_harvest

router = APIRouter(prefix="/crops", tags=["Crops"])

def format_crop_response(crop: Crop, db: Session) -> CropResponse:
    supply_info = calculate_crop_supply(crop, db)
    farm = crop.farm
    latest_fc = (
        db.query(CropForecast)
        .filter(CropForecast.crop_id == crop.id)
        .order_by(CropForecast.created_at.desc())
        .first()
    )
    fc_summary = None
    if latest_fc:
        fc_summary = CropForecastSummary(
            predicted_yield_kg=latest_fc.predicted_yield_kg,
            lower_estimate_kg=latest_fc.lower_estimate_kg,
            upper_estimate_kg=latest_fc.upper_estimate_kg,
            confidence_score=latest_fc.confidence_score,
            model_version=latest_fc.model_version
        )

    return CropResponse(
        id=crop.id,
        farm_id=crop.farm_id,
        farmer_id=crop.farmer_id,
        crop_name=crop.crop_name,
        variety=crop.variety,
        cultivation_area=crop.cultivation_area,
        sowing_date=crop.sowing_date,
        expected_harvest_date=crop.expected_harvest_date,
        estimated_quantity=crop.estimated_quantity,
        quality_grade=crop.quality_grade,
        cultivation_status=crop.cultivation_status,
        retained_quantity=crop.retained_quantity,
        loss_buffer_pct=crop.loss_buffer_pct,
        committed_quantity=crop.committed_quantity,
        predicted_yield_kg=supply_info["predicted_harvest_kg"],
        available_supply_kg=supply_info["available_supply_kg"],
        latest_forecast=fc_summary,
        farm_name=farm.farm_name if farm else None,
        village=farm.village if farm else None,
        district=farm.district if farm else None,
        soil_type=farm.soil_type if farm else None,
        irrigation_type=farm.irrigation_type if farm else None,
        latitude=farm.latitude if farm else None,
        longitude=farm.longitude if farm else None,
        created_at=crop.created_at
    )

@router.post("", response_model=CropResponse)
def create_crop(
    crop_in: CropCreate,
    current_user: User = Depends(require_role(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == crop_in.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if current_user.role == "farmer" and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add crop to this farm")

    new_crop = Crop(
        id=generate_uuid(),
        farm_id=crop_in.farm_id,
        farmer_id=current_user.id,
        crop_name=crop_in.crop_name,
        variety=crop_in.variety,
        cultivation_area=crop_in.cultivation_area,
        sowing_date=crop_in.sowing_date,
        expected_harvest_date=crop_in.expected_harvest_date,
        estimated_quantity=crop_in.estimated_quantity,
        quality_grade=crop_in.quality_grade,
        cultivation_status=crop_in.cultivation_status,
        retained_quantity=crop_in.retained_quantity,
        loss_buffer_pct=crop_in.loss_buffer_pct,
        committed_quantity=0.0
    )
    db.add(new_crop)
    db.commit()
    db.refresh(new_crop)

    return format_crop_response(new_crop, db)

@router.get("", response_model=List[CropResponse])
def get_crops(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "farmer":
        crops = db.query(Crop).filter(Crop.farmer_id == current_user.id).all()
    else:
        crops = db.query(Crop).all()

    return [format_crop_response(c, db) for c in crops]

@router.get("/{id}", response_model=CropResponse)
def get_crop(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    crop = db.query(Crop).filter(Crop.id == id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    if current_user.role == "farmer" and crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this crop")
    return format_crop_response(crop, db)

@router.put("/{id}", response_model=CropResponse)
def update_crop(
    id: str,
    crop_in: CropUpdate,
    current_user: User = Depends(require_role(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    crop = db.query(Crop).filter(Crop.id == id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    if current_user.role == "farmer" and crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this crop")

    update_data = crop_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crop, field, value)

    db.add(crop)
    db.commit()
    db.refresh(crop)
    return format_crop_response(crop, db)

@router.delete("/{id}")
def delete_crop(
    id: str,
    current_user: User = Depends(require_role(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    crop = db.query(Crop).filter(Crop.id == id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    if current_user.role == "farmer" and crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this crop")

    db.delete(crop)
    db.commit()
    return {"message": "Crop deleted successfully"}
