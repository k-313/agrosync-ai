import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { demandService } from '../../services/api';
import { ProcurementDemand } from '../../types';
import {
  FileText, Plus, Sparkles, Pause, Play, CheckCircle2,
  Trash2, X, AlertTriangle, Calendar, MapPin
} from 'lucide-react';

export const DemandCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const [demands, setDemands] = useState<ProcurementDemand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    crop_name: 'Tomato',
    required_quantity: 5000,
    minimum_quality_grade: 'Grade B',
    required_delivery_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    max_distance_km: 150,
    target_price_per_kg: 26.50,
    additional_requirements: 'Firm pulp, minimum 4.5 Brix sugar rating, no mechanical puncture defects.'
  });

  useEffect(() => {
    loadDemands();
  }, []);

  const loadDemands = async () => {
    try {
      const data = await demandService.getDemands();
      setDemands(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await demandService.createDemand(formData);
      setShowModal(false);
      setSuccessMsg("Procurement demand created! You can now run AI supplier matching.");
      loadDemands();
      setTimeout(() => setSuccessMsg(null), 4000);
      navigate(`/processor/matching?demand=${created.id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create demand");
    }
  };

  const handleToggleStatus = async (demand: ProcurementDemand) => {
    const nextStatus = demand.status === 'active' ? 'paused' : 'active';
    try {
      await demandService.updateDemand(demand.id, { status: nextStatus });
      loadDemands();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this procurement demand?")) return;
    try {
      await demandService.deleteDemand(id);
      loadDemands();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal">Procurement Demands</h1>
          <p className="text-xs text-gray-500">Define raw produce intake requirements for processing facilities</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Procurement Demand</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Demands List */}
      <div className="space-y-4">
        {demands.map((dem) => (
          <div
            key={dem.id}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-premium transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-charcoal">{dem.crop_name} Requirement</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      dem.status === 'active' ? 'bg-emerald-100 text-forest' :
                      dem.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {dem.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Target Price: <span className="font-semibold text-charcoal">₹{dem.target_price_per_kg}/kg</span> &bull; Radius: <span className="font-semibold text-charcoal">{dem.max_distance_km} km</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <Link
                  to={`/processor/matching?demand=${dem.id}`}
                  className="px-4 py-2 bg-forest hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald" />
                  <span>Find Suppliers</span>
                </Link>
                <button
                  onClick={() => handleToggleStatus(dem)}
                  className="p-2 border border-gray-200 hover:bg-cream rounded-xl text-gray-600 transition-colors"
                  title={dem.status === 'active' ? 'Pause demand' : 'Resume demand'}
                >
                  {dem.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(dem.id)}
                  className="p-2 border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-warning rounded-xl transition-colors"
                  title="Delete demand"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-cream p-4 rounded-2xl border border-gray-200/60 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">Required Volume:</span>
                <span className="font-extrabold text-charcoal text-sm">{dem.required_quantity.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Minimum Quality:</span>
                <span className="font-semibold text-charcoal">{dem.minimum_quality_grade}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Delivery Deadline:</span>
                <span className="font-semibold text-charcoal flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {dem.required_delivery_date}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Confirmed Supply:</span>
                <span className="font-bold text-forest">{dem.committed_quantity?.toLocaleString() || 0} kg</span>
              </div>
            </div>

            {dem.additional_requirements && (
              <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                <span className="font-bold text-charcoal">Processing Specs:</span> {dem.additional_requirements}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-base text-charcoal">Create Raw Produce Intake Demand</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDemand} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Crop Type</label>
                  <select
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Potato">Potato</option>
                    <option value="Onion">Onion</option>
                    <option value="Green Chilli">Green Chilli</option>
                    <option value="Cabbage">Cabbage</option>
                    <option value="Carrot">Carrot</option>
                    <option value="Sugarcane">Sugarcane</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Required Quantity (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.required_quantity}
                    onChange={(e) => setFormData({ ...formData, required_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Minimum Quality Grade</label>
                  <select
                    value={formData.minimum_quality_grade}
                    onChange={(e) => setFormData({ ...formData, minimum_quality_grade: e.target.value })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  >
                    <option value="Grade A">Grade A (Premium Retail Fresh)</option>
                    <option value="Grade B">Grade B (Commercial Puree/Sauce)</option>
                    <option value="Grade C">Grade C (Industrial Distillate)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Required Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={formData.required_delivery_date}
                    onChange={(e) => setFormData({ ...formData, required_delivery_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Max Sourcing Radius (km)</label>
                  <input
                    type="number"
                    value={formData.max_distance_km}
                    onChange={(e) => setFormData({ ...formData, max_distance_km: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Price (₹ / kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.target_price_per_kg}
                    onChange={(e) => setFormData({ ...formData, target_price_per_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Additional Quality & Processing Specs</label>
                <textarea
                  rows={2}
                  value={formData.additional_requirements}
                  onChange={(e) => setFormData({ ...formData, additional_requirements: e.target.value })}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 border border-gray-200 text-charcoal font-semibold text-xs rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-forest hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Create & Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
