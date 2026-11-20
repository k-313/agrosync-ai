from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Farm, Crop, ProcurementDemand, ProcurementOrder
from app.schemas import UserResponse
from app.services.auth_service import require_role

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

class UserStatusUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    role: Optional[str] = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()

@router.patch("/users/{id}/status", response_model=UserResponse)
def update_user_status(
    id: str,
    status_in: UserStatusUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if status_in.is_active is not None:
        target_user.is_active = status_in.is_active
    if status_in.is_verified is not None:
        target_user.is_verified = status_in.is_verified

    db.add(target_user)
    db.commit()
    db.refresh(target_user)
    return target_user
