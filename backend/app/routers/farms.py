from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, generate_uuid
from app.models import Farm, User
from app.schemas import FarmCreate, FarmUpdate, FarmResponse
from app.services.auth_service import get_current_user, require_role

router = APIRouter(prefix="/farms", tags=["Farms"])

@router.post("", response_model=FarmResponse)
def create_farm(
    farm_in: FarmCreate,
    current_user: User = Depends(require_role(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    new_farm = Farm(
        id=generate_uuid(),
        farmer_id=current_user.id,
        farm_name=farm_in.farm_name,
        village=farm_in.village,
        district=farm_in.district,
        state=farm_in.state,
        land_area=farm_in.land_area,
        soil_type=farm_in.soil_type,
        latitude=farm_in.latitude,
        longitude=farm_in.longitude,
        irrigation_type=farm_in.irrigation_type
    )
    db.add(new_farm)
    db.commit()
    db.refresh(new_farm)
    return new_farm

@router.get("", response_model=List[FarmResponse])
def get_farms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "farmer":
        return db.query(Farm).filter(Farm.farmer_id == current_user.id).all()
    # Processors & Admins can view all farms
    return db.query(Farm).all()

@router.get("/{id}", response_model=FarmResponse)
def get_farm(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if current_user.role == "farmer" and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this farm")
    return farm

@router.put("/{id}", response_model=FarmResponse)
def update_farm(
    id: str,
    farm_in: FarmUpdate,
    current_user: User = Depends(require_role(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if current_user.role == "farmer" and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this farm")

    update_data = farm_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farm, field, value)

    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm

@router.delete("/{id}")
def delete_farm(
    id: str,
    current_user: User = Depends(require_role(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if current_user.role == "farmer" and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this farm")

    db.delete(farm)
    db.commit()
    return {"message": "Farm deleted successfully"}
