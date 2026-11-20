# AgroSync AI
## Intelligent Farmer-to-Processor Supply Chain Platform
### *Tagline: Predict. Connect. Supply.*

AgroSync AI is an agricultural technology platform designed to solve the critical supply reliability problem in food manufacturing: **"Food processors cannot rely on farmer collections/supply."**

By connecting regional smallholder farmers directly with commercial food processing companies, AgroSync AI bridges the gap between fragmented farm-gate harvests and industrial processing schedules through **machine learning crop yield forecasting**, **intelligent multi-farmer supplier matching**, and **pre-deadline supply shortage detection**.

---

## 🌾 Three Signature Innovations

### 1. Pre-Harvest ML Crop Yield Prediction
- **Problem**: Processors sign retail delivery contracts blindly, with zero scientific visibility into regional harvest volumes.
- **Solution**: A trained **RandomForestRegressor** ensemble model calibrated against ICAR/FAO regional horticultural benchmarks across soil types, irrigation regimes, and weather patterns.
- **Statistical Rigor**: Delivers not just point estimates, but empirical tree variance calculations yielding **95% statistical confidence intervals** (lower and upper estimates) with transparent agronomic explanations.
- **Supply Accounting**: Distinguishes probabilistic model predictions from warehouse-confirmed quantities:
  $$\text{Available Supply} = \text{Predicted Harvest} - \text{Retained Qty} - \text{Expected Losses} - \text{Committed Qty}$$

### 2. Intelligent Multi-Farmer Supplier Matching
- **Problem**: Smallholders individually produce 1–3 tons, while industrial food processors demand 5–50 tons per delivery batch.
- **Solution**: A multi-farmer allocation engine that aggregates multiple nearby growers to fulfill single large-scale processor demands.
- **Transparent 5-Factor Weighted Scoring Formula**:
  $$\text{Match Score} = 30\% \text{ Crop Compatibility} + 25\% \text{ Quantity Fulfilment} + 20\% \text{ Harvest Timing} + 15\% \text{ Distance} + 10\% \text{ Quality Compatibility}$$
- **Multi-Farmer Greedy Knapsack Allocation**: Automatically allocates volume across ranked growers until demand is 100% fulfilled or eligible supply is exhausted.

### 3. Rules-Based Supply Shortage Detection Engine
- **Problem**: Shortages are typically discovered on the morning of scheduled delivery, causing factory shutdowns.
- **Solution**: Evaluates uncommitted regional harvest pools well before delivery deadlines.
- **Formula**:
  $$\text{Supply Gap} = \max(0, \text{Required Demand} - \text{Available Uncommitted Supply})$$
- **Actionable Risk Categorization**:
  - **Low Risk (Emerald)**: Regional supply exceeds demand with $\ge 15\%$ safety buffer.
  - **Medium Risk (Amber)**: Supply barely meets demand ($\le 14\%$ buffer) or minor deficit.
  - **High Risk (Warning Red)**: Critical deficit ($> 25\%$ gap); triggers perimeter radius expansion and secondary backup grower reserves.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Leaflet, OpenStreetMap, PWA Ready |
| **Backend** | Python 3.12+, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, Bcrypt, Starlette |
| **Database** | PostgreSQL / SQLite (zero-friction dev fallback via `DATABASE_URL`), UUID Primary Keys, ACID row-level locking |
| **AI / ML** | Scikit-learn, NumPy, Pandas, Pure Python RandomForestRegressor with empirical tree prediction intervals |
| **Deployment Ready** | Frontend: Vercel &bull; Backend: Render &bull; Database: Neon PostgreSQL |

---

## 🔐 Demo Credentials

The platform is pre-seeded with a complete demo scenario (5 Farmers in the Nashik/Maharashtra horticultural belt, 1 Food Processor with a 5,000 kg Tomato demand, and 1 Super Admin):

| Role | Account / Name | Email | Password |
|---|---|---|---|
| **Food Processor** | Sahyadri Agro Processing Ltd (Nashik) | `processor@agrosync.com` | `Processor123!` |
| **Farmer #1** | Ramesh Patil (2.5 ac, Tomato Hybrid-618) | `farmer1@agrosync.com` | `Farmer123!` |
| **Farmer #2** | Suresh Deshmukh (2.0 ac, Tomato Roma) | `farmer2@agrosync.com` | `Farmer123!` |
| **Farmer #3** | Anand Shinde (1.8 ac, Tomato Pusa Ruby) | `farmer3@agrosync.com` | `Farmer123!` |
| **Farmer #4** | Vikas Jadhav (2.8 ac, Tomato Abhinav) | `farmer4@agrosync.com` | `Farmer123!` |
| **Farmer #5** | Ganesh Gaikwad (4.0 ac, Potato Kufri Jyoti) | `farmer5@agrosync.com` | `Farmer123!` |
| **Platform Admin** | Rajesh Verma (Super Administrator) | `admin@agrosync.com` | `Admin123!` |

> **Interactive 1-Click Login**: The login page and landing page feature 1-click quick-fill buttons for instant evaluation.

---

## 📁 Repository Structure

```
agrosync-ai/
├── backend/
│   ├── app/
│   │   ├── config.py             # App & security configuration
│   │   ├── database.py           # SQLAlchemy engine & session management
│   │   ├── main.py               # FastAPI application entrypoint
│   │   ├── models/               # 11 SQLAlchemy database models
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── services/             # ML, Matching, Shortage, and Supply Accounting services
│   │   └── routers/              # 13 REST API route controllers
│   ├── ml_models/
│   │   ├── rf_regressor.py       # Pure-Python Random Forest Regressor & Agronomic Pipeline
│   │   ├── train_yield_model.py  # Model training & test set evaluation
│   │   ├── yield_rf_model.json   # Serialized trained model ensemble
│   │   └── model_metadata.json   # Evaluation metrics (R² 0.83, MAE, RMSE)
│   ├── seed_data.py              # Seeds 5 farmers, 1 processor, 1 demand, 1 admin
│   ├── test_e2e_workflow.py      # End-to-end integration test suite
│   └── requirements.txt          # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/           # AgroMap, Navbar, FarmerNav, ProcessorSidebar, etc.
│   │   ├── context/              # AuthContext (JWT session state)
│   │   ├── pages/                # Public, Farmer, Processor, and Admin dashboards
│   │   ├── services/             # Axios typed API client
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── App.tsx               # Route declarations & role guards
│   │   └── main.tsx              # DOM root mount
│   ├── tailwind.config.js        # Forest & Emerald design system
│   └── vite.config.ts            # Vite bundler configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ and pip

### 1. Backend Setup & Run

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the database seeder (initializes SQLite/Postgres with demo data)
python seed_data.py

# Run the end-to-end integration tests (verifies all 12 modules)
python test_e2e_workflow.py

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup & Run

```bash
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start local development server
npm run dev
```
Web application will be accessible at: `http://localhost:5173`

---

## 🌐 Production Deployment Guide

### Database (Neon PostgreSQL)
1. Create a serverless PostgreSQL database on [Neon.tech](https://neon.tech).
2. Copy the connection string: `postgresql+psycopg2://user:pass@ep-xyz.neon.tech/agrosync?sslmode=require`.
3. Set the environment variable: `DATABASE_URL=<your-neon-url>`.

### Backend (Render)
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect the repository, set Root Directory to `backend`.
3. Set Build Command: `pip install -r requirements.txt && python seed_data.py`.
4. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add Environment Variables:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `SECRET_KEY`: A secure 64-character secret.

### Frontend (Vercel)
1. Import the repository into [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite**, Root Directory to `frontend`.
3. Set Environment Variable:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g. `https://agrosync-backend.onrender.com/api`).
4. Click **Deploy**.
