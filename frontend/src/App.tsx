import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FarmerLayout } from './components/FarmerLayout';
import { ProcessorLayout } from './components/ProcessorLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterFarmerPage } from './pages/auth/RegisterFarmerPage';
import { RegisterProcessorPage } from './pages/auth/RegisterProcessorPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Farmer Pages
import { FarmerOverview } from './pages/farmer/FarmerOverview';
import { FarmManagement } from './pages/farmer/FarmManagement';
import { CropManagement } from './pages/farmer/CropManagement';
import { YieldPredictionPage } from './pages/farmer/YieldPredictionPage';
import { ProcurementRequestsPage } from './pages/farmer/ProcurementRequestsPage';
import { FarmerDeliveriesPage } from './pages/farmer/FarmerDeliveriesPage';

// Processor Pages
import { ProcessorOverview } from './pages/processor/ProcessorOverview';
import { DemandCreationPage } from './pages/processor/DemandCreationPage';
import { SupplierMatchingPage } from './pages/processor/SupplierMatchingPage';
import { SupplyRiskPage } from './pages/processor/SupplyRiskPage';
import { ProcurementOrdersPage } from './pages/processor/ProcurementOrdersPage';
import { LogisticsManagementPage } from './pages/processor/LogisticsManagementPage';
import { AnalyticsReportsPage } from './pages/processor/AnalyticsReportsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Navbar } from './components/Navbar';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navbar /><LandingPage /></>} />
          <Route path="/login" element={<><Navbar /><LoginPage /></>} />
          <Route path="/register-farmer" element={<><Navbar /><RegisterFarmerPage /></>} />
          <Route path="/register-processor" element={<><Navbar /><RegisterProcessorPage /></>} />
          <Route path="/forgot-password" element={<><Navbar /><ForgotPasswordPage /></>} />

          {/* Farmer Protected Routes */}
          <Route
            path="/farmer"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <FarmerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<FarmerOverview />} />
            <Route path="farms" element={<FarmManagement />} />
            <Route path="crops" element={<CropManagement />} />
            <Route path="yield" element={<YieldPredictionPage />} />
            <Route path="requests" element={<ProcurementRequestsPage />} />
            <Route path="deliveries" element={<FarmerDeliveriesPage />} />
          </Route>

          {/* Processor Protected Routes */}
          <Route
            path="/processor"
            element={
              <ProtectedRoute allowedRoles={['processor', 'admin']}>
                <ProcessorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProcessorOverview />} />
            <Route path="demands" element={<DemandCreationPage />} />
            <Route path="matching" element={<SupplierMatchingPage />} />
            <Route path="risk" element={<SupplyRiskPage />} />
            <Route path="orders" element={<ProcurementOrdersPage />} />
            <Route path="logistics" element={<LogisticsManagementPage />} />
            <Route path="analytics" element={<AnalyticsReportsPage />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div className="min-h-screen bg-cream flex flex-col">
                  <Navbar />
                  <main className="flex-1">
                    <AdminDashboard />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
