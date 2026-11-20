"""
AgroSync AI - Database Seeder
Seeds clearly labelled simulated demo data:
- 5 Farmer accounts with farms and crops
- 1 Food Processor account with plant facility
- 1 Admin account
- Initial 5,000 kg Tomato procurement demand
"""

import os
import sys
from datetime import date, timedelta

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine, generate_uuid
from app.models import User, Farm, Crop, Processor, ProcurementDemand, CropForecast, Notification
from app.services.auth_service import hash_password
from app.services.ml_yield_service import predict_crop_yield

def seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    existing_admin = db.query(User).filter(User.email == "admin@agrosync.com").first()
    if existing_admin:
        print("Database already contains seed data. Refreshing...")
        # Clean up existing data for fresh seed
        db.query(Notification).delete()
        db.query(CropForecast).delete()
        db.query(Crop).delete()
        db.query(Farm).delete()
        db.query(ProcurementDemand).delete()
        db.query(Processor).delete()
        db.query(User).delete()
        db.commit()

    print("Creating Demo Admin...")
    admin = User(
        id=generate_uuid(),
        email="admin@agrosync.com",
        hashed_password=hash_password("Admin123!"),
        full_name="Rajesh Verma (Admin)",
        phone="+91 98220 11000",
        role="admin",
        is_active=True,
        is_verified=True
    )
    db.add(admin)

    print("Creating Demo Food Processor: Sahyadri Agro Processing Ltd...")
    proc_user = User(
        id=generate_uuid(),
        email="processor@agrosync.com",
        hashed_password=hash_password("Processor123!"),
        full_name="Kavita Deshpande (Procurement Head)",
        phone="+91 98220 22000",
        role="processor",
        is_active=True,
        is_verified=True
    )
    db.add(proc_user)
    db.commit()

    processor = Processor(
        id=generate_uuid(),
        user_id=proc_user.id,
        company_name="Sahyadri Agro Processing Ltd",
        processing_capacity=85000.0,
        facility_type="Sauce, Puree & Ketchup Processing",
        address="Plot 44-A, MIDC Food Processing Park, Ambad",
        city="Nashik",
        district="Nashik",
        state="Maharashtra",
        latitude=19.9975,
        longitude=73.7898
    )
    db.add(processor)
    db.commit()

    today = date.today()
    target_delivery_date = today + timedelta(days=6)

    print("Creating Processor Demand: 5,000 kg Tomato...")
    demand = ProcurementDemand(
        id=generate_uuid(),
        processor_id=processor.id,
        crop_name="Tomato",
        required_quantity=5000.0,
        minimum_quality_grade="Grade B",
        required_delivery_date=target_delivery_date,
        max_distance_km=150.0,
        target_price_per_kg=26.50,
        additional_requirements="Firm pulp, minimum 4.5 Brix sugar rating, no physical mechanical punctures.",
        status="active"
    )
    db.add(demand)
    db.commit()

    # 5 Farmers data
    farmers_data = [
        {
            "email": "farmer1@agrosync.com",
            "name": "Ramesh Patil",
            "phone": "+91 94220 33001",
            "farm_name": "Patil Organic Farm",
            "village": "Dindori",
            "district": "Nashik",
            "land_area": 5.0,
            "soil_type": "Loamy",
            "lat": 20.2012,
            "lon": 73.8321,
            "irrigation": "Drip",
            "crop_name": "Tomato",
            "variety": "Hybrid-618",
            "cultivation_area": 2.5,
            "sowing_offset_days": -75,
            "harvest_offset_days": 3, # Harvest 3 days before delivery
            "estimated_qty": 2600.0,
            "grade": "Grade A",
            "retained": 100.0,
            "loss_pct": 4.0
        },
        {
            "email": "farmer2@agrosync.com",
            "name": "Suresh Deshmukh",
            "phone": "+91 94220 33002",
            "farm_name": "Deshmukh Green Acres",
            "village": "Niphad",
            "district": "Nashik",
            "land_area": 4.2,
            "soil_type": "Alluvial",
            "lat": 20.0768,
            "lon": 74.1082,
            "irrigation": "Drip",
            "crop_name": "Tomato",
            "variety": "Roma Special",
            "cultivation_area": 2.0,
            "sowing_offset_days": -72,
            "harvest_offset_days": 4, # Harvest 4 days before delivery
            "estimated_qty": 2000.0,
            "grade": "Grade A",
            "retained": 120.0,
            "loss_pct": 5.0
        },
        {
            "email": "farmer3@agrosync.com",
            "name": "Anand Shinde",
            "phone": "+91 94220 33003",
            "farm_name": "Shinde Agro Lands",
            "village": "Sinnar",
            "district": "Nashik",
            "land_area": 3.5,
            "soil_type": "Black Cotton",
            "lat": 19.8456,
            "lon": 73.9982,
            "irrigation": "Sprinkler",
            "crop_name": "Tomato",
            "variety": "Pusa Ruby",
            "cultivation_area": 1.8,
            "sowing_offset_days": -70,
            "harvest_offset_days": 5, # Harvest 5 days before delivery
            "estimated_qty": 1600.0,
            "grade": "Grade B",
            "retained": 80.0,
            "loss_pct": 4.5
        },
        {
            "email": "farmer4@agrosync.com",
            "name": "Vikas Jadhav",
            "phone": "+91 94220 33004",
            "farm_name": "Jadhav Krishi Farm",
            "village": "Sangamner",
            "district": "Ahmednagar",
            "land_area": 6.0,
            "soil_type": "Red Sandy",
            "lat": 19.5762,
            "lon": 74.2091,
            "irrigation": "Canal",
            "crop_name": "Tomato",
            "variety": "Abhinav Hybrid",
            "cultivation_area": 2.8,
            "sowing_offset_days": -65,
            "harvest_offset_days": 10, # Harvest 10 days out (slightly later)
            "estimated_qty": 2400.0,
            "grade": "Grade B",
            "retained": 150.0,
            "loss_pct": 6.0
        },
        {
            "email": "farmer5@agrosync.com",
            "name": "Ganesh Gaikwad",
            "phone": "+91 94220 33005",
            "farm_name": "Gaikwad Agro Estates",
            "village": "Yeola",
            "district": "Nashik",
            "land_area": 7.0,
            "soil_type": "Loamy",
            "lat": 20.0421,
            "lon": 74.4891,
            "irrigation": "Drip",
            "crop_name": "Potato",
            "variety": "Kufri Jyoti",
            "cultivation_area": 4.0,
            "sowing_offset_days": -60,
            "harvest_offset_days": 14,
            "estimated_qty": 14000.0,
            "grade": "Grade A",
            "retained": 500.0,
            "loss_pct": 5.0
        }
    ]

    print("Seeding 5 Farmers with farms, crops and running AI yield predictions...")
    for idx, f_data in enumerate(farmers_data, start=1):
        farmer_user = User(
            id=generate_uuid(),
            email=f_data["email"],
            hashed_password=hash_password("Farmer123!"),
            full_name=f_data["name"],
            phone=f_data["phone"],
            role="farmer",
            is_active=True,
            is_verified=True
        )
        db.add(farmer_user)
        db.commit()

        farm = Farm(
            id=generate_uuid(),
            farmer_id=farmer_user.id,
            farm_name=f_data["farm_name"],
            village=f_data["village"],
            district=f_data["district"],
            state="Maharashtra",
            land_area=f_data["land_area"],
            soil_type=f_data["soil_type"],
            latitude=f_data["lat"],
            longitude=f_data["lon"],
            irrigation_type=f_data["irrigation"]
        )
        db.add(farm)
        db.commit()

        sow_dt = today + timedelta(days=f_data["sowing_offset_days"])
        harv_dt = today + timedelta(days=f_data["harvest_offset_days"])

        crop = Crop(
            id=generate_uuid(),
            farm_id=farm.id,
            farmer_id=farmer_user.id,
            crop_name=f_data["crop_name"],
            variety=f_data["variety"],
            cultivation_area=f_data["cultivation_area"],
            sowing_date=sow_dt,
            expected_harvest_date=harv_dt,
            estimated_quantity=f_data["estimated_qty"],
            quality_grade=f_data["grade"],
            cultivation_status="Fruiting" if f_data["crop_name"] == "Tomato" else "Vegetative",
            retained_quantity=f_data["retained"],
            loss_buffer_pct=f_data["loss_pct"],
            committed_quantity=0.0
        )
        db.add(crop)
        db.commit()

        # For the demo multi-farmer scenario, seed realistic available uncommitted quantities
        # so that fulfilling 5,000 kg requires allocating across Farmer 1 (2,400 kg) + Farmer 2 (1,800 kg) + Farmer 3 (800 kg)
        if f_data["crop_name"] == "Tomato":
            if idx == 1:
                # 2,400 kg available
                crop.retained_quantity = round(crop.estimated_quantity - 2500.0, 1)
            elif idx == 2:
                # 1,800 kg available
                crop.retained_quantity = round(crop.estimated_quantity - 1900.0, 1)
            elif idx == 3:
                # 1,500 kg available
                crop.retained_quantity = round(crop.estimated_quantity - 1600.0, 1)
            elif idx == 4:
                # 2,200 kg available
                crop.retained_quantity = round(crop.estimated_quantity - 2350.0, 1)
            db.add(crop)
            db.commit()

        # Run real ML yield prediction for the crop
        try:
            pred_res = predict_crop_yield(crop, farm, db)
            # Re-align retained quantity so available_supply matches exact multi-farmer target
            if f_data["crop_name"] == "Tomato":
                pred_harvest = pred_res['predicted_yield_kg']
                loss_buf = pred_harvest * (crop.loss_buffer_pct / 100.0)
                if idx == 1:
                    target_avail = 2400.0
                elif idx == 2:
                    target_avail = 1800.0
                elif idx == 3:
                    target_avail = 1500.0
                else:
                    target_avail = 2200.0
                crop.retained_quantity = max(0.0, round(pred_harvest - loss_buf - target_avail, 1))
                db.add(crop)
                db.commit()
            print(f"  [AI Model] Predicted yield for {f_data['name']} ({crop.crop_name}): {pred_res['predicted_yield_kg']:,.0f} kg")
        except Exception as e:
            print(f"  [AI Model Warning] Could not predict yield for {f_data['name']}: {e}")

        # Seed welcoming notification
        Notification(
            id=generate_uuid(),
            user_id=farmer_user.id,
            title="Welcome to AgroSync AI",
            message=f"Welcome {f_data['name']}! Your farm '{farm.farm_name}' and crop '{crop.crop_name}' are now active on the intelligent supply chain network.",
            type="system",
            is_read=False
        )
        db.commit()

    db.close()
    print("\n Seed completed successfully!")
    print("==================================================")
    print("DEMO CREDENTIALS:")
    print("  Processor: processor@agrosync.com  / Password: Processor123!")
    print("  Farmer 1:  farmer1@agrosync.com    / Password: Farmer123!")
    print("  Farmer 2:  farmer2@agrosync.com    / Password: Farmer123!")
    print("  Farmer 3:  farmer3@agrosync.com    / Password: Farmer123!")
    print("  Farmer 4:  farmer4@agrosync.com    / Password: Farmer123!")
    print("  Farmer 5:  farmer5@agrosync.com    / Password: Farmer123!")
    print("  Admin:     admin@agrosync.com      / Password: Admin123!")
    print("==================================================")

if __name__ == "__main__":
    seed()
