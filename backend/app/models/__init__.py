import enum
from datetime import datetime, date, timezone
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Date, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from app.database import Base, generate_uuid

def utcnow():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    FARMER = "farmer"
    PROCESSOR = "processor"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), default=UserRole.FARMER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    farms = relationship("Farm", back_populates="farmer", cascade="all, delete-orphan")
    crops = relationship("Crop", back_populates="farmer", cascade="all, delete-orphan")
    processor_profile = relationship("Processor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    orders_as_farmer = relationship("ProcurementOrder", foreign_keys="ProcurementOrder.farmer_id", back_populates="farmer")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farmer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_name = Column(String(255), nullable=False)
    village = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False, default="Maharashtra")
    land_area = Column(Float, nullable=False) # In acres
    soil_type = Column(String(100), nullable=False, default="Loamy") # Loamy, Black Cotton, Red Sandy, Clay, Alluvial
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    irrigation_type = Column(String(100), nullable=False, default="Drip") # Drip, Sprinkler, Canal, Rainfed
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    farmer = relationship("User", back_populates="farms")
    crops = relationship("Crop", back_populates="farm", cascade="all, delete-orphan")


class Crop(Base):
    __tablename__ = "crops"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False) # e.g. Tomato, Potato, Onion
    variety = Column(String(100), nullable=True, default="Hybrid")
    cultivation_area = Column(Float, nullable=False) # In acres
    sowing_date = Column(Date, nullable=False)
    expected_harvest_date = Column(Date, nullable=False)
    estimated_quantity = Column(Float, nullable=False) # Baseline/Farmer expected in kg
    quality_grade = Column(String(50), nullable=False, default="Grade A") # Grade A, Grade B, Grade C
    cultivation_status = Column(String(50), nullable=False, default="Vegetative") # Sown, Vegetative, Flowering, Fruiting, Harvesting, Harvested
    
    # Supply Accounting
    retained_quantity = Column(Float, nullable=False, default=0.0) # For local/home use
    loss_buffer_pct = Column(Float, nullable=False, default=5.0) # Expected harvest losses %
    committed_quantity = Column(Float, nullable=False, default=0.0) # Already committed to processors
    
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="crops")
    farmer = relationship("User", back_populates="crops")
    forecasts = relationship("CropForecast", back_populates="crop", cascade="all, delete-orphan")
    matches = relationship("SupplierMatch", back_populates="crop", cascade="all, delete-orphan")
    orders = relationship("ProcurementOrder", back_populates="crop")


class Processor(Base):
    __tablename__ = "processors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    processing_capacity = Column(Float, nullable=False, default=50000.0) # kg per month
    facility_type = Column(String(100), nullable=False, default="Sauce & Puree Processing")
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False, default="Maharashtra")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="processor_profile")
    demands = relationship("ProcurementDemand", back_populates="processor", cascade="all, delete-orphan")
    orders = relationship("ProcurementOrder", back_populates="processor")


class ProcurementDemand(Base):
    __tablename__ = "procurement_demands"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    processor_id = Column(String(36), ForeignKey("processors.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False) # e.g. Tomato
    required_quantity = Column(Float, nullable=False) # kg
    minimum_quality_grade = Column(String(50), nullable=False, default="Grade B") # Grade A, Grade B, Grade C
    required_delivery_date = Column(Date, nullable=False)
    max_distance_km = Column(Float, nullable=False, default=150.0)
    target_price_per_kg = Column(Float, nullable=True, default=24.0) # Currency unit
    additional_requirements = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="active") # active, paused, fulfilled, closed
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    processor = relationship("Processor", back_populates="demands")
    matches = relationship("SupplierMatch", back_populates="demand", cascade="all, delete-orphan")
    orders = relationship("ProcurementOrder", back_populates="demand")


class CropForecast(Base):
    __tablename__ = "crop_forecasts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    crop_id = Column(String(36), ForeignKey("crops.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_yield_kg = Column(Float, nullable=False)
    lower_estimate_kg = Column(Float, nullable=False)
    upper_estimate_kg = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.83)
    model_version = Column(String(50), nullable=False, default="rf-yield-v1.2.0")
    feature_importance_json = Column(Text, nullable=True)
    weather_context_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    crop = relationship("Crop", back_populates="forecasts")


class SupplierMatch(Base):
    __tablename__ = "supplier_matches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    demand_id = Column(String(36), ForeignKey("procurement_demands.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_id = Column(String(36), ForeignKey("crops.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    match_score = Column(Float, nullable=False) # 0 to 100
    score_breakdown_json = Column(Text, nullable=False) # JSON breakdown of the 5 criteria
    allocated_quantity = Column(Float, nullable=False) # kg allocated by multi-farmer algorithm
    distance_km = Column(Float, nullable=False)
    match_explanation = Column(Text, nullable=False)
    rank = Column(Integer, nullable=False, default=1)
    status = Column(String(50), nullable=False, default="recommended") # recommended, requested, accepted, rejected
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    demand = relationship("ProcurementDemand", back_populates="matches")
    crop = relationship("Crop", back_populates="matches")


class ProcurementOrder(Base):
    __tablename__ = "procurement_orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    demand_id = Column(String(36), ForeignKey("procurement_demands.id"), nullable=False, index=True)
    processor_id = Column(String(36), ForeignKey("processors.id"), nullable=False, index=True)
    farmer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    crop_id = Column(String(36), ForeignKey("crops.id"), nullable=False, index=True)
    match_id = Column(String(36), ForeignKey("supplier_matches.id"), nullable=True)
    order_code = Column(String(50), unique=True, nullable=False, index=True)
    agreed_quantity = Column(Float, nullable=False) # kg
    price_per_kg = Column(Float, nullable=False, default=24.0)
    total_value = Column(Float, nullable=False)
    delivery_deadline = Column(Date, nullable=False)
    status = Column(String(50), nullable=False, default="requested") 
    # Statuses: requested, accepted, rejected, in_transit, delivered, completed, cancelled
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    demand = relationship("ProcurementDemand", back_populates="orders")
    processor = relationship("Processor", back_populates="orders")
    farmer = relationship("User", foreign_keys=[farmer_id], back_populates="orders_as_farmer")
    crop = relationship("Crop", back_populates="orders")
    quality_records = relationship("QualityRecord", back_populates="order", cascade="all, delete-orphan")
    deliveries = relationship("Delivery", back_populates="order", cascade="all, delete-orphan")


class QualityRecord(Base):
    __tablename__ = "quality_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("procurement_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    inspector_name = Column(String(255), nullable=False)
    inspection_date = Column(Date, nullable=False, default=date.today)
    assessed_grade = Column(String(50), nullable=False, default="Grade A") # Grade A, Grade B, Grade C, Rejected
    moisture_content_pct = Column(Float, nullable=False, default=88.5)
    defects_pct = Column(Float, nullable=False, default=2.1)
    notes = Column(Text, nullable=True)
    passed = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    order = relationship("ProcurementOrder", back_populates="quality_records")


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("procurement_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    tracking_number = Column(String(100), unique=True, nullable=False, index=True)
    collection_scheduled_date = Column(Date, nullable=False)
    pickup_date = Column(Date, nullable=True)
    expected_delivery_date = Column(Date, nullable=False)
    actual_delivery_date = Column(Date, nullable=True)
    collected_quantity = Column(Float, nullable=False, default=0.0)
    received_quantity = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="pending_collection") 
    # Statuses: pending_collection, scheduled_collection, collected, delivered, completed
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    order = relationship("ProcurementOrder", back_populates="deliveries")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, default="system") # demand, match, order, delivery, risk, system
    is_read = Column(Boolean, nullable=False, default=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")
