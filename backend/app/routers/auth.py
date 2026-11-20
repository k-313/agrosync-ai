from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, generate_uuid
from app.models import User, Processor
from app.schemas import UserRegister, UserLogin, Token, UserResponse, ForgotPasswordRequest
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )

    # Validate role
    role = user_in.role.lower()
    if role not in ["farmer", "processor", "admin"]:
        role = "farmer"

    new_user = User(
        id=generate_uuid(),
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=role,
        is_active=True,
        is_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If processor, create initial company profile
    if role == "processor":
        company_name = user_in.company_name or f"{user_in.full_name}'s Agro Processing"
        proc_profile = Processor(
            id=generate_uuid(),
            user_id=new_user.id,
            company_name=company_name,
            processing_capacity=user_in.processing_capacity or 50000.0,
            facility_type=user_in.facility_type or "Sauce & Puree Processing",
            address=user_in.address or "Industrial Agricultural Corridor",
            city=user_in.city or "Nashik",
            district=user_in.district or "Nashik",
            state=user_in.state or "Maharashtra",
            latitude=user_in.latitude or 19.9975,
            longitude=user_in.longitude or 73.7898
        )
        db.add(proc_profile)
        db.commit()

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": new_user.role,
        "user_id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    # In production sends reset email; returns confirmation
    return {
        "message": f"Password reset instructions have been generated for {req.email}.",
        "demo_note": "For demo testing, you can reset password or use demo credentials provided in README."
    }
