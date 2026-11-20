from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/farmers", tags=["Farmers"])

@router.get("/profile", response_model=UserResponse)
def get_farmer_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_farmer_profile(
    phone: str = None,
    full_name: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if phone:
        current_user.phone = phone
    if full_name:
        current_user.full_name = full_name
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
