import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/api';
import {
  BarChart3, Download, TrendingUp, CheckCircle2,
  PieChart as PieIcon, Calendar, FileSpreadsheet, ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#166534', '#10B981', '#34D399', '#F59E0B', '#DC2626', '#6366F1'];

// Monthly trend mock data
const monthlyTrends = [
  { month: 'Jun', demand_tons: 22, supply_tons: 19 },
  { month: 'Jul', demand_tons: 35, supply_tons: 32 },
  { month: 'Aug', demand_tons: 48, supply_tons: 46 },
  { month: 'Sep', demand_tons: 60, supply_tons: 58 },
  { month: 'Oct', demand_tons: 75, supply_tons: 74 },
  { month: 'Nov', demand_tons: 85, supply_tons: 85 },
];

export const AnalyticsReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await analyticsService.getProcessorDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal">Procurement Analytics & CSV Export</h1>
          <p className="text-xs text-gray-500">Cross-regional supply volumes, monthly intake trends, and auditable procurement reports</p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadCSV(analyticsService.exportSupplyCSV())}
            className="px-3.5 py-2 bg-white hover:bg-cream border border-gray-200 text-charcoal rounded-xl text-xs font-bold transition-all shadow-soft flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-forest" />
            <span>Supply CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCSV(analyticsService.exportDemandCSV())}
            className="px-3.5 py-2 bg-white hover:bg-cream border border-gray-200 text-charcoal rounded-xl text-xs font-bold transition-all shadow-soft flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-forest" />
            <span>Demand CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCSV(analyticsService.exportDeliveryCSV())}
            className="px-3.5 py-2 bg-forest hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald" />
            <span>Logistics CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Contract Fulfillment</span>
          <p className="text-2xl font-extrabold text-forest">98.4%</p>
          <p className="text-[11px] text-emerald-700 font-bold mt-0.5">On-time factory intake</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Total Procured Vol</span>
          <p className="text-2xl font-extrabold text-charcoal">{data?.confirmed_supply_kg?.toLocaleString() || 5000} kg</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Active season intake</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Average Sourcing Radius</span>
          <p className="text-2xl font-extrabold text-charcoal">34.8 km</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Regional farm proximity</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Shortage Mitigation</span>
          <p className="text-2xl font-extrabold text-emerald">100%</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Zero plant line stoppages</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Procurement Volume Trend */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-charcoal">Monthly Intake vs Demand (Metric Tons)</h3>
              <p className="text-xs text-gray-400">Demand scaling with matched farmer capacity</p>
            </div>
            <span className="text-xs text-forest font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +28% YoY
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#166534" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#166534" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                <Area type="monotone" dataKey="demand_tons" name="Intake Demand" stroke="#166534" fillOpacity={1} fill="url(#colorDemand)" strokeWidth={2} />
                <Area type="monotone" dataKey="supply_tons" name="Fulfilled Supply" stroke="#10B981" fillOpacity={1} fill="url(#colorSupply)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop Supply Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-charcoal">Crop Supply Distribution (kg)</h3>
              <p className="text-xs text-gray-400">Regional farm yield availability</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.crop_supply_distribution || []}>
                <XAxis dataKey="crop" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} kg`, 'Available Supply']}
                  contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="available_kg" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
