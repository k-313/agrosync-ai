from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# ----------------- AUTH SCHEMAS -----------------
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    email: str
    full_name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone: Optional[str] = None
    role: str = "farmer" # farmer, processor, admin
    
    # Processor details if role == processor
    company_name: Optional[str] = None
    processing_capacity: Optional[float] = None
    facility_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = "Maharashtra"
    latitude: Optional[float] = 19.9975
    longitude: Optional[float] = 73.7898

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- FARM SCHEMAS -----------------
class FarmCreate(BaseModel):
    farm_name: str
    village: str
    district: str
    state: str = "Maharashtra"
    land_area: float = Field(..., gt=0, description="Land area in acres")
    soil_type: str = "Loamy" # Loamy, Black Cotton, Red Sandy, Clay, Alluvial
    latitude: float
    longitude: float
    irrigation_type: str = "Drip" # Drip, Sprinkler, Canal, Rainfed

class FarmUpdate(BaseModel):
    farm_name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    land_area: Optional[float] = None
    soil_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    irrigation_type: Optional[str] = None

class FarmResponse(BaseModel):
    id: str
    farmer_id: str
    farm_name: str
    village: str
    district: str
    state: str
    land_area: float
    soil_type: str
    latitude: float
    longitude: float
    irrigation_type: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- CROP SCHEMAS -----------------
class CropCreate(BaseModel):
    farm_id: str
    crop_name: str
    variety: Optional[str] = "Hybrid"
    cultivation_area: float = Field(..., gt=0, description="Cultivation area in acres")
    sowing_date: date
    expected_harvest_date: date
    estimated_quantity: float = Field(..., gt=0, description="Baseline quantity in kg")
    quality_grade: str = "Grade A"
    cultivation_status: str = "Vegetative"
    retained_quantity: float = 0.0
    loss_buffer_pct: float = 5.0

class CropUpdate(BaseModel):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    cultivation_area: Optional[float] = None
    sowing_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    estimated_quantity: Optional[float] = None
    quality_grade: Optional[str] = None
    cultivation_status: Optional[str] = None
    retained_quantity: Optional[float] = None
    loss_buffer_pct: Optional[float] = None

class CropForecastSummary(BaseModel):
    predicted_yield_kg: float
    lower_estimate_kg: float
    upper_estimate_kg: float
    confidence_score: float
    model_version: str

class CropResponse(BaseModel):
    id: str
    farm_id: str
    farmer_id: str
    crop_name: str
    variety: Optional[str]
    cultivation_area: float
    sowing_date: date
    expected_harvest_date: date
    estimated_quantity: float
    quality_grade: str
    cultivation_status: str
    retained_quantity: float
    loss_buffer_pct: float
    committed_quantity: float
    
    # Calculated supply accounting fields
    predicted_yield_kg: Optional[float] = None
    available_supply_kg: float = 0.0
    latest_forecast: Optional[CropForecastSummary] = None
    farm_name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- PROCESSOR SCHEMAS -----------------
class ProcessorCreate(BaseModel):
    company_name: str
    processing_capacity: float
    facility_type: str
    address: str
    city: str
    district: str
    state: str = "Maharashtra"
    latitude: float
    longitude: float

class ProcessorResponse(BaseModel):
    id: str
    user_id: str
    company_name: str
    processing_capacity: float
    facility_type: str
    address: str
    city: str
    district: str
    state: str
    latitude: float
    longitude: float
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- DEMAND SCHEMAS -----------------
class DemandCreate(BaseModel):
    crop_name: str
    required_quantity: float = Field(..., gt=0, description="Required quantity in kg")
    minimum_quality_grade: str = "Grade B" # Grade A, Grade B, Grade C
    required_delivery_date: date
    max_distance_km: float = 150.0
    target_price_per_kg: Optional[float] = 24.0
    additional_requirements: Optional[str] = None

class DemandUpdate(BaseModel):
    crop_name: Optional[str] = None
    required_quantity: Optional[float] = None
    minimum_quality_grade: Optional[str] = None
    required_delivery_date: Optional[date] = None
    max_distance_km: Optional[float] = None
    target_price_per_kg: Optional[float] = None
    additional_requirements: Optional[str] = None
    status: Optional[str] = None # active, paused, fulfilled, closed

class DemandResponse(BaseModel):
    id: str
    processor_id: str
    crop_name: str
    required_quantity: float
    minimum_quality_grade: str
    required_delivery_date: date
    max_distance_km: float
    target_price_per_kg: Optional[float]
    additional_requirements: Optional[str]
    status: str
    company_name: Optional[str] = None
    matched_quantity: Optional[float] = 0.0
    committed_quantity: Optional[float] = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- AI MATCHING & SHORTAGE SCHEMAS -----------------
class SupplierScoreBreakdown(BaseModel):
    crop_compatibility: float # max 30
    quantity_fulfilment: float # max 25
    harvest_timing: float # max 20
    distance: float # max 15
    quality_compatibility: float # max 10
    total_score: float # 0 to 100

class RankedSupplier(BaseModel):
    match_id: Optional[str] = None
    crop_id: str
    farmer_id: str
    farmer_name: str
    farm_name: str
    village: str
    district: str
    crop_name: str
    quality_grade: str
    available_quantity_kg: float
    allocated_quantity_kg: float
    expected_harvest_date: date
    distance_km: float
    match_score: float
    rank: int
    score_breakdown: SupplierScoreBreakdown
    match_explanation: str
    latitude: float
    longitude: float

class MultiFarmerMatchResponse(BaseModel):
    demand_id: str
    crop_name: str
    required_quantity_kg: float
    total_matched_quantity_kg: float
    remaining_shortage_kg: float
    fulfilment_pct: float
    recommended_farmers_count: int
    is_fully_fulfillable: bool
    formula: str
    suppliers: List[RankedSupplier]

class SupplyRiskAnalysisResponse(BaseModel):
    demand_id: str
    crop_name: str
    required_quantity_kg: float
    predicted_available_supply_kg: float
    confirmed_supply_kg: float
    potential_supply_gap_kg: float
    risk_category: str # Low, Medium, High
    risk_color: str # emerald (#10B981), amber (#F59E0B), warning (#DC2626)
    thresholds: Dict[str, str]
    recommended_actions: List[str]
    supply_breakdown: Dict[str, Any]

# ----------------- PROCUREMENT ORDER SCHEMAS -----------------
class OrderCreate(BaseModel):
    demand_id: str
    crop_id: str
    farmer_id: str
    match_id: Optional[str] = None
    agreed_quantity: float
    price_per_kg: float
    delivery_deadline: date

class OrderStatusUpdate(BaseModel):
    status: str # requested, accepted, rejected, in_transit, delivered, completed, cancelled
    rejection_reason: Optional[str] = None

class RejectionRequest(BaseModel):
    rejection_reason: Optional[str] = "Supplier declined procurement terms"


class OrderResponse(BaseModel):
    id: str
    demand_id: str
    processor_id: str
    farmer_id: str
    crop_id: str
    match_id: Optional[str]
    order_code: str
    agreed_quantity: float
    price_per_kg: float
    total_value: float
    delivery_deadline: date
    status: str
    rejection_reason: Optional[str]
    farmer_name: Optional[str] = None
    farmer_phone: Optional[str] = None
    company_name: Optional[str] = None
    crop_name: Optional[str] = None
    farm_village: Optional[str] = None
    farm_district: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ----------------- LOGISTICS & QUALITY SCHEMAS -----------------
class DeliverySchedule(BaseModel):
    order_id: str
    collection_scheduled_date: date
    expected_delivery_date: date
    remarks: Optional[str] = None

class DeliveryUpdate(BaseModel):
    pickup_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    collected_quantity: Optional[float] = None
    received_quantity: Optional[float] = None
    status: Optional[str] = None
    remarks: Optional[str] = None

class DeliveryResponse(BaseModel):
    id: str
    order_id: str
    tracking_number: str
    collection_scheduled_date: date
    pickup_date: Optional[date]
    expected_delivery_date: date
    actual_delivery_date: Optional[date]
    collected_quantity: float
    received_quantity: float
    status: str
    remarks: Optional[str]
    order_code: Optional[str] = None
    farmer_name: Optional[str] = None
    crop_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QualityRecordCreate(BaseModel):
    order_id: str
    inspector_name: str
    inspection_date: Optional[date] = None
    assessed_grade: str = "Grade A"
    moisture_content_pct: float = 88.5
    defects_pct: float = 2.0
    notes: Optional[str] = None
    passed: bool = True

class QualityRecordResponse(BaseModel):
    id: str
    order_id: str
    inspector_name: str
    inspection_date: date
    assessed_grade: str
    moisture_content_pct: float
    defects_pct: float
    notes: Optional[str]
    passed: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- NOTIFICATION SCHEMAS -----------------
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
