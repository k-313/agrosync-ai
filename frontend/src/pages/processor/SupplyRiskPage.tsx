import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { demandService, aiService } from '../../services/api';
import { ProcurementDemand, SupplyRiskResponse } from '../../types';
import {
  AlertTriangle, ShieldCheck, CheckCircle2, TrendingUp, AlertOctagon,
  ArrowRight, Sparkles, Sliders, Layers, RefreshCw
} from 'lucide-react';

export const SupplyRiskPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedDemandId = searchParams.get('demand');

  const [demands, setDemands] = useState<ProcurementDemand[]>([]);
  const [selectedDemandId, setSelectedDemandId] = useState<string>('');
  const [riskData, setRiskData] = useState<SupplyRiskResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDemands();
  }, []);

  const loadDemands = async () => {
    try {
      const data = await demandService.getDemands();
      setDemands(data);
      const targetId = preselectedDemandId || (data.length > 0 ? data[0].id : '');
      if (targetId) {
        setSelectedDemandId(targetId);
        loadRisk(targetId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadRisk = async (demandId: string) => {
    setIsLoading(true);
    try {
      const res = await aiService.getSupplyRisk(demandId);
      setRiskData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal flex items-center gap-2">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
          <span>Intelligent Supply Shortage Risk Analysis</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Rules-based supply risk monitoring evaluating uncommitted regional harvests against processor intake deadlines
        </p>
      </div>

      {/* Demand Selector Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="w-full sm:max-w-md">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Intake Demand</label>
            <select
              value={selectedDemandId}
              onChange={(e) => {
                setSelectedDemandId(e.target.value);
                loadRisk(e.target.value);
              }}
              className="w-full px-4 py-2.5 bg-cream border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-forest"
            >
              {demands.map(d => (
                <option key={d.id} value={d.id}>
                  {d.crop_name} ({d.required_quantity.toLocaleString()} kg) - Delivery {d.required_delivery_date}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadRisk(selectedDemandId)}
            disabled={isLoading || !selectedDemandId}
            className="px-5 py-2.5 bg-forest hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate Shortage Risk</span>
          </button>
        </div>
      </div>

      {/* Main Risk Analysis Card */}
      {riskData && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-premium space-y-6">
            
            {/* Top Status & Risk Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Demand Shortage Status</span>
                <h2 className="text-2xl font-extrabold text-charcoal mt-0.5">
                  {riskData.crop_name} Sourcing Security Assessment
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Overall coverage: <span className="font-extrabold text-charcoal">{riskData.coverage_pct}%</span> of required factory volume
                </p>
              </div>

              {/* Visual Risk Badge */}
              <div
                className="px-4 py-3 rounded-2xl flex items-center gap-3 border"
                style={{
                  backgroundColor: riskData.risk_category === 'Low' ? '#ECFDF5' : riskData.risk_category === 'Medium' ? '#FFFBEB' : '#FEF2F2',
                  borderColor: riskData.risk_color
                }}
              >
                {riskData.risk_category === 'Low' && <CheckCircle2 className="w-6 h-6 text-emerald" />}
                {riskData.risk_category === 'Medium' && <AlertTriangle className="w-6 h-6 text-amber" />}
                {riskData.risk_category === 'High' && <AlertOctagon className="w-6 h-6 text-warning" />}

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: riskData.risk_color }}>
                    Shortage Risk Level
                  </span>
                  <span className="text-lg font-extrabold text-charcoal">
                    {riskData.risk_category} Risk
                  </span>
                </div>
              </div>
            </div>

            {/* Crucial Formula Display */}
            <div className="p-4 bg-cream rounded-2xl border border-gray-200/80">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-charcoal">Mathematical Shortage Formula:</span>
                <span className="text-gray-500">Rules-Based Supply Risk Engine</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200 font-mono text-xs text-charcoal">
                Supply Gap = max(0, Required Demand - Available Uncommitted Supply)
              </div>
            </div>

            {/* 4 Quantitative Breakdown Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-cream rounded-2xl border border-gray-200/70">
                <span className="text-gray-400 block text-[11px] mb-1">Required Intake</span>
                <p className="text-2xl font-extrabold text-charcoal">
                  {riskData.required_quantity_kg.toLocaleString()} <span className="text-xs font-normal">kg</span>
                </p>
                <span className="text-[10px] text-gray-500">Factory Quota</span>
              </div>

              <div className="p-4 bg-cream rounded-2xl border border-gray-200/70">
                <span className="text-gray-400 block text-[11px] mb-1">Confirmed Supply</span>
                <p className="text-2xl font-extrabold text-forest">
                  {riskData.confirmed_supply_kg.toLocaleString()} <span className="text-xs font-normal">kg</span>
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">Accepted Contracts</span>
              </div>

              <div className="p-4 bg-cream rounded-2xl border border-gray-200/70">
                <span className="text-gray-400 block text-[11px] mb-1">Predicted Available</span>
                <p className="text-2xl font-extrabold text-charcoal">
                  {riskData.predicted_available_supply_kg.toLocaleString()} <span className="text-xs font-normal">kg</span>
                </p>
                <span className="text-[10px] text-gray-500">Uncommitted In Radius</span>
              </div>

              <div className="p-4 bg-cream rounded-2xl border border-gray-200/70">
                <span className="text-gray-400 block text-[11px] mb-1">Potential Supply Gap</span>
                <p
                  className="text-2xl font-extrabold"
                  style={{ color: riskData.risk_color }}
                >
                  {riskData.potential_supply_gap_kg.toLocaleString()} <span className="text-xs font-normal">kg</span>
                </p>
                <span className="text-[10px] text-gray-500">Uncovered Deficit</span>
              </div>
            </div>

            {/* Clear Scientific Distinction Notice */}
            <div className="p-4 bg-forest-50/50 rounded-2xl border border-emerald-100 flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-forest shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-forest">Clear Supply Distinction</span>
                <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5">
                  <strong>Confirmed Supply</strong> represents legally accepted procurement orders. <strong>Predicted Available Supply</strong> is the uncommitted farm-gate volume forecasted by machine learning within your {riskData.supply_breakdown.max_distance_km} km radius.
                </p>
              </div>
            </div>

            {/* Recommended Operational Actions */}
            <div>
              <h3 className="font-bold text-sm text-charcoal mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald" />
                <span>AI Operational Recommendations</span>
              </h3>

              <div className="space-y-2.5">
                {riskData.recommended_actions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-cream rounded-2xl border border-gray-200/60 flex items-start gap-3 text-xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-forest text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{act}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Button to Matching */}
            <div className="pt-2 flex justify-end">
              <Link
                to={`/processor/matching?demand=${riskData.demand_id}`}
                className="px-5 py-2.5 bg-forest hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <span>Open Supplier Matching Engine</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

          {/* Configurable Thresholds Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
            <h3 className="font-bold text-sm text-charcoal mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-forest" />
              <span>Configurable Threshold Parameters</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Calibrated safety margins determining risk categorizations across processing clusters
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-cream rounded-2xl border border-gray-200/60">
                <span className="font-bold text-forest block">Low Risk Threshold</span>
                <p className="text-[11px] text-gray-600 mt-0.5">{riskData.thresholds.low_safety_buffer_pct}</p>
              </div>
              <div className="p-3.5 bg-cream rounded-2xl border border-gray-200/60">
                <span className="font-bold text-amber block">Medium Risk Threshold</span>
                <p className="text-[11px] text-gray-600 mt-0.5">{riskData.thresholds.medium_deficit_threshold_pct}</p>
              </div>
              <div className="p-3.5 bg-cream rounded-2xl border border-gray-200/60">
                <span className="font-bold text-warning block">High Risk Threshold</span>
                <p className="text-[11px] text-gray-600 mt-0.5">{riskData.thresholds.high_critical_threshold_pct}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
