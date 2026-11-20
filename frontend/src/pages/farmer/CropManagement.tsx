import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cropService, farmService, aiService } from '../../services/api';
import { Crop, Farm } from '../../types';
import {
  Sprout, Plus, Trash2, Sparkles, TrendingUp,
  CheckCircle2, X, AlertCircle, Calendar, ShieldCheck
} from 'lucide-react';

export const CropManagement: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [newCrop, setNewCrop] = useState({
    farm_id: '',
    crop_name: 'Tomato',
    variety: 'Hybrid-618',
    cultivation_area: 2.0,
    sowing_date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expected_harvest_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimated_quantity: 25000,
    quality_grade: 'Grade A',
    cultivation_status: 'Fruiting',
    retained_quantity: 200,
    loss_buffer_pct: 5.0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cropsData, farmsData] = await Promise.all([
        cropService.getCrops(),
        farmService.getFarms()
      ]);
      setCrops(cropsData);
      setFarms(farmsData);
      if (farmsData.length > 0 && !newCrop.farm_id) {
        setNewCrop(prev => ({ ...prev, farm_id: farmsData[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrop.farm_id) {
      alert("Please select or add a farm first.");
      return;
    }
    try {
      const created = await cropService.createCrop(newCrop);
      // Run initial yield prediction
      try {
        await aiService.predictYield(created.id);
      } catch (err) {
        console.warn(err);
      }
      setShowAddModal(false);
      setSuccessMsg("Crop registered and initial AI yield predicted!");
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to register crop");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this crop record?")) return;
    try {
      await cropService.deleteCrop(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal">Crop Management & Supply Accounting</h1>
          <p className="text-xs text-gray-500">Track sown crops, growth milestones, and net uncommitted available produce</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Crop</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Crops Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {crops.map((crop) => {
          const predictedYield = crop.predicted_yield_kg || crop.estimated_quantity;
          const expectedLosses = Math.round(predictedYield * (crop.loss_buffer_pct / 100));
          const grossMarketable = Math.max(0, predictedYield - crop.retained_quantity - expectedLosses);

          return (
            <div key={crop.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-premium transition-all space-y-4">
              {/* Card Top */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest flex items-center justify-center font-bold">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-charcoal">{crop.crop_name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest">
                        {crop.cultivation_status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Variety: <span className="font-semibold text-charcoal">{crop.variety || 'Standard'}</span> &bull; {crop.cultivation_area} Acres
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Farm: {crop.farm_name || 'Main Farm'} ({crop.village || 'Nashik'})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(crop.id)}
                  className="text-gray-400 hover:text-warning p-1"
                  title="Delete crop"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Strict Supply Accounting Box */}
              <div className="bg-cream rounded-2xl p-4 border border-gray-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald" /> Supply Accounting
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">Anti-Double Booking</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 border-y border-gray-200/60 text-center">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Predicted Yield:</span>
                    <span className="font-bold text-charcoal">{predictedYield.toLocaleString()} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Retained/Buffer:</span>
                    <span className="font-semibold text-gray-600">{(crop.retained_quantity + expectedLosses).toLocaleString()} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Committed:</span>
                    <span className="font-bold text-amber-600">{crop.committed_quantity.toLocaleString()} kg</span>
                  </div>
                  <div className="bg-emerald-50 rounded-lg py-0.5 border border-emerald-200">
                    <span className="text-forest block text-[10px] font-bold">Net Available:</span>
                    <span className="font-extrabold text-forest">{crop.available_supply_kg.toLocaleString()} kg</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Harvest: {new Date(crop.expected_harvest_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="font-semibold text-emerald-800">
                    Grade: {crop.quality_grade}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <Link
                  to={`/farmer/yield?crop=${crop.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-forest-900 bg-forest-50 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-emerald" />
                  <span>Run AI Yield Predictor</span>
                </Link>
                <span className="text-[11px] text-gray-400 font-medium">
                  {crop.latest_forecast ? `Model ${crop.latest_forecast.model_version}` : 'Forecast Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Crop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-base text-charcoal">Register New Crop Season</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCrop} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Farm Plot</label>
                <select
                  required
                  value={newCrop.farm_id}
                  onChange={(e) => setNewCrop({ ...newCrop, farm_id: e.target.value })}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                >
                  {farms.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} ({f.village}, {f.district} - {f.land_area} ac)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Crop Type</label>
                  <select
                    value={newCrop.crop_name}
                    onChange={(e) => setNewCrop({ ...newCrop, crop_name: e.target.value })}
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">Variety</label>
                  <input
                    type="text"
                    value={newCrop.variety}
                    onChange={(e) => setNewCrop({ ...newCrop, variety: e.target.value })}
                    placeholder="Hybrid-618 / Roma"
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cultivation Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newCrop.cultivation_area}
                    onChange={(e) => setNewCrop({ ...newCrop, cultivation_area: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Estimated Baseline (kg)</label>
                  <input
                    type="number"
                    required
                    value={newCrop.estimated_quantity}
                    onChange={(e) => setNewCrop({ ...newCrop, estimated_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sowing Date</label>
                  <input
                    type="date"
                    required
                    value={newCrop.sowing_date}
                    onChange={(e) => setNewCrop({ ...newCrop, sowing_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Expected Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={newCrop.expected_harvest_date}
                    onChange={(e) => setNewCrop({ ...newCrop, expected_harvest_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Quality Grade</label>
                  <select
                    value={newCrop.quality_grade}
                    onChange={(e) => setNewCrop({ ...newCrop, quality_grade: e.target.value })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard Processing)</option>
                    <option value="Grade C">Grade C (Industrial Puree)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Growth Status</label>
                  <select
                    value={newCrop.cultivation_status}
                    onChange={(e) => setNewCrop({ ...newCrop, cultivation_status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  >
                    <option value="Sown">Sown</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting">Fruiting</option>
                    <option value="Harvesting">Harvesting</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Farmer Retained (kg)</label>
                  <input
                    type="number"
                    value={newCrop.retained_quantity}
                    onChange={(e) => setNewCrop({ ...newCrop, retained_quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="100"
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Loss Buffer (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newCrop.loss_buffer_pct}
                    onChange={(e) => setNewCrop({ ...newCrop, loss_buffer_pct: parseFloat(e.target.value) || 0 })}
                    placeholder="5.0"
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 border border-gray-200 text-charcoal font-semibold text-xs rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-forest hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Save & Predict
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
