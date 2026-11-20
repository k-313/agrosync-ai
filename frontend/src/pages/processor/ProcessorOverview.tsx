import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/api';
import {
  Building2, FileText, Sparkles, AlertTriangle, Users,
  ShoppingBag, ArrowRight, TrendingUp, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#166534', '#10B981', '#34D399', '#F59E0B', '#DC2626'];

export const ProcessorOverview: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await analyticsService.getProcessorDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
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
      {/* Processor Banner */}
      <div className="p-6 bg-gradient-to-r from-forest to-forest-900 rounded-3xl text-white shadow-premium flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">
            {data?.company_name || 'Industrial Food Processing'}
          </span>
          <h1 className="text-2xl font-extrabold mt-0.5">Procurement Operations Overview</h1>
          <p className="text-xs text-emerald-100/90 mt-1">
            Aggregated farm-gate supply intelligence and shortage risk monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/processor/demands"
            className="px-4 py-2 bg-emerald text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
          >
            Create Demand
          </Link>
          <Link
            to="/processor/matching"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>AI Match Suppliers</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Required Demand</span>
            <FileText className="w-4 h-4 text-forest" />
          </div>
          <p className="text-2xl font-extrabold text-charcoal">{data?.total_required_quantity_kg?.toLocaleString()} kg</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{data?.total_demands} active demands</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Confirmed Supply</span>
            <CheckCircle2 className="w-4 h-4 text-emerald" />
          </div>
          <p className="text-2xl font-extrabold text-forest">{data?.confirmed_supply_kg?.toLocaleString()} kg</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Binding farmer orders</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Active Suppliers</span>
            <Users className="w-4 h-4 text-charcoal" />
          </div>
          <p className="text-2xl font-extrabold text-charcoal">{data?.active_suppliers_count}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Contracted farm partners</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Supply Gap Risk</span>
            <AlertTriangle className={`w-4 h-4 ${data?.potential_shortage_kg > 0 ? 'text-amber-500' : 'text-emerald'}`} />
          </div>
          <p className={`text-2xl font-extrabold ${data?.potential_shortage_kg > 0 ? 'text-amber-600' : 'text-emerald'}`}>
            {data?.potential_shortage_kg?.toLocaleString()} kg
          </p>
          <Link to="/processor/risk" className="text-[11px] text-forest font-bold hover:underline flex items-center gap-1 mt-0.5">
            View Risk Analysis &rarr;
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop Supply Chart */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-charcoal">Available Regional Produce (kg)</h3>
              <p className="text-xs text-gray-400">Total uncommitted harvest in regional network</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-forest rounded-full">
              Real-time
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.crop_supply_distribution || []}>
                <XAxis dataKey="crop" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} kg`, 'Available']}
                  contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="available_kg" fill="#166534" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Distribution Chart */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-charcoal">Supplier Distribution by District</h3>
              <p className="text-xs text-gray-400">Registered farm cluster density</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.district_distribution || []}
                  dataKey="farms_count"
                  nameKey="district"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(data?.district_distribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Procurement Orders Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div>
            <h3 className="font-bold text-base text-charcoal">Recent Procurement Orders</h3>
            <p className="text-xs text-gray-400">Contracts dispatched to matched farmer suppliers</p>
          </div>
          <Link to="/processor/orders" className="text-xs font-bold text-forest hover:underline flex items-center gap-1">
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!data?.recent_orders || data.recent_orders.length === 0) ? (
          <p className="text-xs text-gray-400 py-6 text-center">No procurement orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 pb-2">
                  <th className="pb-2 font-semibold">Order Code</th>
                  <th className="pb-2 font-semibold">Farmer Supplier</th>
                  <th className="pb-2 font-semibold">Crop</th>
                  <th className="pb-2 font-semibold">Quantity</th>
                  <th className="pb-2 font-semibold">Unit Price</th>
                  <th className="pb-2 font-semibold">Total Value</th>
                  <th className="pb-2 font-semibold">Deadline</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recent_orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-cream/50 transition-colors">
                    <td className="py-3 font-mono font-bold text-charcoal">{o.order_code}</td>
                    <td className="py-3 font-medium text-gray-700">{o.farmer_name}</td>
                    <td className="py-3 font-semibold text-charcoal">{o.crop_name}</td>
                    <td className="py-3 font-bold text-forest">{o.agreed_quantity.toLocaleString()} kg</td>
                    <td className="py-3 text-gray-600">₹{o.price_per_kg}</td>
                    <td className="py-3 font-bold text-charcoal">₹{o.total_value.toLocaleString()}</td>
                    <td className="py-3 text-gray-500">{o.delivery_deadline}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.status === 'requested' ? 'bg-amber-100 text-amber-800' :
                        o.status === 'accepted' ? 'bg-emerald-100 text-forest' :
                        o.status === 'rejected' ? 'bg-red-100 text-warning' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {o.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
