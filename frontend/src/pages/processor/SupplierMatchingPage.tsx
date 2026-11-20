import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { demandService, aiService, orderService } from '../../services/api';
import { ProcurementDemand, MultiFarmerMatchResponse, RankedSupplier } from '../../types';
import { AgroMap, MapSupplier } from '../../components/AgroMap';
import {
  Sparkles, Search, CheckCircle2, AlertTriangle, ShieldCheck,
  Send, Users, MapPin, Calendar, Check, Clock, ChevronDown, ChevronUp
} from 'lucide-react';

export const SupplierMatchingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedDemandId = searchParams.get('demand');

  const [demands, setDemands] = useState<ProcurementDemand[]>([]);
  const [selectedDemandId, setSelectedDemandId] = useState<string>('');
  const [matchResult, setMatchResult] = useState<MultiFarmerMatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sentOrderSuccess, setSentOrderSuccess] = useState<string | null>(null);
  const [requestedSuppliers, setRequestedSuppliers] = useState<Record<string, boolean>>({});
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);

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
        runMatching(targetId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runMatching = async (demandId: string) => {
    setIsLoading(true);
    setSentOrderSuccess(null);
    try {
      const res = await aiService.matchSuppliers(demandId);
      setMatchResult(res);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Supplier matching failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOrder = async (supplier: RankedSupplier) => {
    const demand = demands.find(d => d.id === selectedDemandId);
    if (!demand) return;

    try {
      await orderService.createOrder({
        demand_id: demand.id,
        crop_id: supplier.crop_id,
        farmer_id: supplier.farmer_id,
        match_id: supplier.match_id,
        agreed_quantity: supplier.allocated_quantity_kg > 0 ? supplier.allocated_quantity_kg : supplier.available_quantity_kg,
        price_per_kg: demand.target_price_per_kg || 26.50,
        delivery_deadline: demand.required_delivery_date
      });

      setRequestedSuppliers(prev => ({ ...prev, [supplier.farmer_id]: true }));
      setSentOrderSuccess(`Procurement request dispatched to ${supplier.farmer_name} for ${supplier.allocated_quantity_kg || supplier.available_quantity_kg} kg.`);
      setTimeout(() => setSentOrderSuccess(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to dispatch procurement order");
    }
  };

  const handleSendAllAllocated = async () => {
    if (!matchResult) return;
    const allocated = matchResult.suppliers.filter(s => s.allocated_quantity_kg > 0);
    let count = 0;
    for (const sup of allocated) {
      try {
        await handleSendOrder(sup);
        count++;
      } catch (e) {
        console.error(e);
      }
    }
    setSentOrderSuccess(`Successfully dispatched orders to ${count} recommended farmer suppliers!`);
  };

  const selectedDemand = demands.find(d => d.id === selectedDemandId);

  // Prepare map suppliers
  const mapSuppliers: MapSupplier[] = (matchResult?.suppliers || []).map(s => ({
    id: s.crop_id,
    farmer_name: s.farmer_name,
    farm_name: s.farm_name,
    village: s.village,
    district: s.district,
    crop_name: s.crop_name,
    quality_grade: s.quality_grade,
    available_quantity_kg: s.available_quantity_kg,
    allocated_quantity_kg: s.allocated_quantity_kg,
    expected_harvest_date: s.expected_harvest_date,
    distance_km: s.distance_km,
    match_score: s.match_score,
    rank: s.rank,
    latitude: s.latitude,
    longitude: s.longitude
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-forest" />
          <span>Intelligent Multi-Farmer Supplier Matching</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Automated multi-grower quota fulfillment using transparent 5-factor weighted scoring
        </p>
      </div>

      {/* Demand Selector & Trigger Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="w-full sm:max-w-md">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Procurement Demand</label>
            <select
              value={selectedDemandId}
              onChange={(e) => {
                setSelectedDemandId(e.target.value);
                runMatching(e.target.value);
              }}
              className="w-full px-4 py-2.5 bg-cream border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-forest"
            >
              {demands.map(d => (
                <option key={d.id} value={d.id}>
                  {d.crop_name} Requirement: {d.required_quantity.toLocaleString()} kg (By {d.required_delivery_date})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => runMatching(selectedDemandId)}
            disabled={isLoading || !selectedDemandId}
            className="px-6 py-2.5 bg-forest hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-premium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'Running Matching Algorithm...' : 'Find & Rank Suppliers'}</span>
          </button>
        </div>
      </div>

      {sentOrderSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald" />
          <span>{sentOrderSuccess}</span>
        </div>
      )}

      {/* Multi-Farmer Allocation KPI Summary */}
      {matchResult && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-premium space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <span className="text-xs font-bold text-emerald uppercase tracking-wider">Multi-Farmer Allocation Engine</span>
              <h3 className="text-xl font-extrabold text-charcoal mt-0.5">
                {matchResult.crop_name} Quota Fulfillment: {matchResult.fulfilment_pct}%
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Fulfilling {matchResult.total_matched_quantity_kg.toLocaleString()} kg across {matchResult.recommended_farmers_count} regional smallholders
              </p>
            </div>

            {matchResult.is_fully_fulfillable ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-100 text-forest font-bold text-xs rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald" />
                  <span>100% Demand Fulfilled</span>
                </span>
                <button
                  onClick={handleSendAllAllocated}
                  className="px-4 py-2 bg-forest hover:bg-forest-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request All {matchResult.recommended_farmers_count} Farmers</span>
                </button>
              </div>
            ) : (
              <span className="px-3 py-1.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-xl flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Shortage: {matchResult.remaining_shortage_kg.toLocaleString()} kg remaining</span>
              </span>
            )}
          </div>

          {/* Allocation Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-500">Allocation Progress</span>
              <span className="text-forest">{matchResult.total_matched_quantity_kg.toLocaleString()} / {matchResult.required_quantity_kg.toLocaleString()} kg</span>
            </div>
            <div className="w-full h-3 bg-cream rounded-full overflow-hidden border border-gray-200">
              <div
                className="h-full bg-gradient-to-r from-forest to-emerald transition-all duration-700 rounded-full"
                style={{ width: `${Math.min(100, matchResult.fulfilment_pct)}%` }}
              />
            </div>
          </div>

          {/* Scoring Formula Box */}
          <div className="p-3 bg-cream rounded-2xl border border-gray-200/80 text-[11px] text-gray-600 font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
            <span>Formula: {matchResult.formula}</span>
          </div>
        </div>
      )}

      {/* Interactive Sourcing Map */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-soft">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-forest" />
            <h3 className="font-bold text-sm text-charcoal">Geospatial Supplier Network</h3>
          </div>
          <span className="text-[11px] text-gray-400">
            Green = Allocated &bull; Amber = Standby
          </span>
        </div>

        <AgroMap
          suppliers={mapSuppliers}
          center={[19.9975, 73.7898]}
          zoom={9}
          className="h-[380px] w-full rounded-2xl"
        />
      </div>

      {/* Ranked Suppliers Cards */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-base text-charcoal">
          Ranked Supplier Recommendations ({matchResult?.suppliers.length || 0})
        </h3>

        {(!matchResult?.suppliers || matchResult.suppliers.length === 0) ? (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-gray-400 border border-gray-100 shadow-soft">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No matching suppliers found within the selected radius and harvest window.
          </div>
        ) : (
          matchResult.suppliers.map((s) => {
            const isAllocated = s.allocated_quantity_kg > 0;
            const isRequested = requestedSuppliers[s.farmer_id];
            const isExpanded = expandedSupplier === s.crop_id;

            return (
              <div
                key={s.crop_id}
                className={`bg-white rounded-3xl p-6 border transition-all ${
                  isAllocated
                    ? 'border-emerald-200 shadow-soft hover:shadow-premium'
                    : 'border-gray-200/80 opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base ${
                      isAllocated
                        ? 'bg-emerald text-white shadow-sm'
                        : 'bg-amber text-white'
                    }`}>
                      #{s.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-charcoal">{s.farmer_name}</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isAllocated
                            ? 'bg-emerald-100 text-forest'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isAllocated ? 'Recommended Supplier' : 'Standby Backup'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {s.farm_name} &bull; {s.village}, {s.district} &bull; <span className="font-semibold text-charcoal">{s.distance_km} km away</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-forest">{s.match_score}</span>
                      <span className="text-xs text-gray-400 font-semibold">/100</span>
                      <p className="text-[10px] text-gray-400">Match Score</p>
                    </div>

                    <button
                      onClick={() => handleSendOrder(s)}
                      disabled={isRequested}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                        isRequested
                          ? 'bg-emerald-50 text-forest border border-emerald-300 cursor-default'
                          : 'bg-forest hover:bg-forest-900 text-white'
                      }`}
                    >
                      {isRequested ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-forest" />
                          <span>Request Sent</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-cream p-4 rounded-2xl border border-gray-200/60 text-xs my-3">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Crop & Variety:</span>
                    <span className="font-bold text-charcoal">{s.crop_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Quality Grade:</span>
                    <span className="font-semibold text-charcoal">{s.quality_grade}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Expected Harvest:</span>
                    <span className="font-semibold text-charcoal flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {s.expected_harvest_date}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Quota Allocation:</span>
                    <span className="font-extrabold text-forest">
                      {isAllocated ? `${s.allocated_quantity_kg.toLocaleString()} kg` : 'Standby (0 kg)'}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-normal">
                      (of {s.available_quantity_kg.toLocaleString()} kg available)
                    </span>
                  </div>
                </div>

                {/* Match Explanation Text */}
                <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-charcoal">Matching Intelligence:</span> {s.match_explanation}
                </p>

                {/* Expandable Score Breakdown Accordion */}
                <div className="pt-2">
                  <button
                    onClick={() => setExpandedSupplier(isExpanded ? null : s.crop_id)}
                    className="text-[11px] font-bold text-forest hover:underline flex items-center gap-1"
                  >
                    <span>View 5-Factor Score Breakdown</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-3.5 bg-cream rounded-2xl border border-gray-200/60 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Crop Compatibility</span>
                        <span className="font-bold text-charcoal">{s.score_breakdown.crop_compatibility} / 30</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Quantity Fulfilment</span>
                        <span className="font-bold text-charcoal">{s.score_breakdown.quantity_fulfilment} / 25</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Harvest Timing</span>
                        <span className="font-bold text-charcoal">{s.score_breakdown.harvest_timing} / 20</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Distance Proximity</span>
                        <span className="font-bold text-charcoal">{s.score_breakdown.distance} / 15</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Quality Compatibility</span>
                        <span className="font-bold text-charcoal">{s.score_breakdown.quality_compatibility} / 10</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
