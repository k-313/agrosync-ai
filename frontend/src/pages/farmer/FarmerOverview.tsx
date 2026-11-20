import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsService, orderService } from '../../services/api';
import {
  Tractor, Sprout, TrendingUp, ShoppingBag, Bell, ArrowRight,
  CheckCircle2, XCircle, Clock, AlertCircle, ShieldAlert
} from 'lucide-react';
import { ProcurementOrder } from '../../types';

export const FarmerOverview: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await analyticsService.getFarmerDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    try {
      await orderService.acceptOrder(orderId);
      setActionSuccess("Procurement request accepted! Scheduled collection initialized.");
      loadDashboard();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await orderService.rejectOrder(orderId, "Unavailable harvest schedule");
      setActionSuccess("Procurement request declined. Supply released back to matching pool.");
      loadDashboard();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-forest to-forest-900 rounded-3xl text-white shadow-premium flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">Farmer Command Center</span>
          <h1 className="text-2xl font-extrabold mt-0.5">Welcome back, {user?.full_name}!</h1>
          <p className="text-xs text-emerald-100/90 mt-1">
            Your farm produce is continuously monitored and matched to guaranteed food processors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/farmer/crops"
            className="px-4 py-2 bg-emerald text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
          >
            Add New Crop
          </Link>
          <Link
            to="/farmer/yield"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
          >
            AI Yield Predictor
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Registered Farms</span>
            <Tractor className="w-4 h-4 text-forest" />
          </div>
          <p className="text-2xl font-extrabold text-charcoal">{data?.total_farms || 0}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{data?.total_cultivated_area_acres || 0} acres active</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Predicted Harvest</span>
            <Sprout className="w-4 h-4 text-emerald" />
          </div>
          <p className="text-2xl font-extrabold text-charcoal">{data?.estimated_upcoming_harvest_kg?.toLocaleString()} kg</p>
          <span className="text-[10px] bg-emerald-100 text-forest font-bold px-1.5 py-0.5 rounded">AI Forecasted</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Available Produce</span>
            <TrendingUp className="w-4 h-4 text-forest" />
          </div>
          <p className="text-2xl font-extrabold text-forest">{data?.available_supply_kg?.toLocaleString()} kg</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Uncommitted for buyers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Committed Supply</span>
            <ShoppingBag className="w-4 h-4 text-amber" />
          </div>
          <p className="text-2xl font-extrabold text-charcoal">{data?.committed_supply_kg?.toLocaleString()} kg</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Guaranteed Contracts</p>
        </div>
      </div>

      {/* Two Column Section: Incoming Requests & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Incoming Requests */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-charcoal">Procurement Requests</h2>
              <p className="text-xs text-gray-500">Orders received from verified food processing companies</p>
            </div>
            <Link to="/farmer/requests" className="text-xs font-bold text-forest hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(!data?.recent_orders || data.recent_orders.length === 0) ? (
            <div className="py-10 text-center text-xs text-gray-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No procurement requests yet. When food processors match with your crops, orders appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {data.recent_orders.map((ord: any) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl bg-cream border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-xs text-charcoal">{ord.company_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.status === 'requested' ? 'bg-amber-100 text-amber-800' :
                        ord.status === 'accepted' ? 'bg-emerald-100 text-forest' :
                        ord.status === 'rejected' ? 'bg-red-100 text-warning' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ord.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Crop: <span className="font-semibold text-charcoal">{ord.crop_name}</span> &bull; Quantity: <span className="font-semibold text-charcoal">{ord.agreed_quantity.toLocaleString()} kg</span> @ ₹{ord.price_per_kg}/kg
                    </p>
                    <p className="text-xs font-bold text-forest mt-0.5">
                      Total Contract Value: ₹{ord.total_value.toLocaleString()}
                    </p>
                  </div>

                  {ord.status === 'requested' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(ord.id)}
                        className="px-3.5 py-1.5 bg-forest hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleReject(ord.id)}
                        className="px-3.5 py-1.5 bg-white hover:bg-red-50 text-warning border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Alerts / Activity */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
              <Bell className="w-4 h-4 text-forest" />
              <span>Activity Feed</span>
            </h3>
          </div>

          <div className="space-y-3">
            {(!data?.notifications || data.notifications.length === 0) ? (
              <p className="text-xs text-gray-400 py-6 text-center">No recent alerts.</p>
            ) : (
              data.notifications.map((n: any) => (
                <div key={n.id} className="p-3 bg-cream rounded-xl border border-gray-200/60">
                  <p className="text-xs font-bold text-charcoal">{n.title}</p>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-gray-400 block mt-1.5">
                    {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
