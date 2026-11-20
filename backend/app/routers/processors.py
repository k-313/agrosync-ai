from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, generate_uuid
from app.models import User, Processor
from app.schemas import ProcessorCreate, ProcessorResponse
from app.services.auth_service import get_current_user, require_role

router = APIRouter(prefix="/processors", tags=["Processors"])

@router.get("/profile", response_model=ProcessorResponse)
def get_processor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Processor).filter(Processor.user_id == current_user.id).first()
    if not profile:
        # Create default profile if not existing
        profile = Processor(
            id=generate_uuid(),
            user_id=current_user.id,
            company_name=f"{current_user.full_name}'s Agro Processing",
            processing_capacity=60000.0,
            facility_type="Sauce & Puree Processing",
            address="Agro Industrial Complex, MIDC",
            city="Nashik",
            district="Nashik",
            state="Maharashtra",
            latitude=19.9975,
            longitude=73.7898
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=ProcessorResponse)
def update_processor_profile(
    profile_in: ProcessorCreate,
    current_user: User = Depends(require_role(["processor", "admin"])),
    db: Session = Depends(get_db)
):
    profile = db.query(Processor).filter(Processor.user_id == current_user.id).first()
    if not profile:
        profile = Processor(
            id=generate_uuid(),
            user_id=current_user.id,
            **profile_in.model_dump()
        )
    else:
        for field, value in profile_in.model_dump().items():
            setattr(profile, field, value)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
