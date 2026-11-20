import React, { useState, useEffect } from 'react';
import { farmService } from '../../services/api';
import { Farm } from '../../types';
import { AgroMap, MapSupplier } from '../../components/AgroMap';
import { MapPin, Plus, Trash2, Edit3, CheckCircle2, X } from 'lucide-react';

export const FarmManagement: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [newFarm, setNewFarm] = useState({
    farm_name: '',
    village: '',
    district: 'Nashik',
    state: 'Maharashtra',
    land_area: 3.5,
    soil_type: 'Loamy',
    latitude: 20.15,
    longitude: 73.85,
    irrigation_type: 'Drip'
  });

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await farmService.createFarm(newFarm);
      setShowAddModal(false);
      setSuccessMsg("Farm registered successfully!");
      loadFarms();
      setTimeout(() => setSuccessMsg(null), 3000);
      setNewFarm({
        farm_name: '',
        village: '',
        district: 'Nashik',
        state: 'Maharashtra',
        land_area: 3.5,
        soil_type: 'Loamy',
        latitude: 20.15,
        longitude: 73.85,
        irrigation_type: 'Drip'
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create farm");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this farm? Associated crops will also be removed.")) return;
    try {
      await farmService.deleteFarm(id);
      loadFarms();
    } catch (e) {
      console.error(e);
    }
  };

  // Convert farms to map suppliers format for map preview
  const mapSuppliers: MapSupplier[] = farms.map((f, i) => ({
    id: f.id,
    farmer_name: f.farm_name,
    farm_name: f.farm_name,
    village: f.village,
    district: f.district,
    crop_name: `${f.land_area} Acres`,
    quality_grade: f.soil_type,
    available_quantity_kg: f.land_area * 15000,
    distance_km: 0,
    latitude: f.latitude,
    longitude: f.longitude,
    rank: i + 1
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal">Farm Management</h1>
          <p className="text-xs text-gray-500">Register land holdings, geographical coordinates, and soil profiles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Farm</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Interactive Map Preview */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-soft">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-forest" />
            <h3 className="font-bold text-sm text-charcoal">Registered Land Plot Locations</h3>
          </div>
          <span className="text-[11px] text-gray-400">OpenStreetMap GPS Coordinates</span>
        </div>
        <AgroMap
          suppliers={mapSuppliers}
          center={farms.length > 0 ? [farms[0].latitude, farms[0].longitude] : [20.0, 74.0]}
          zoom={9}
          className="h-[320px] w-full rounded-2xl"
        />
      </div>

      {/* Farms List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {farms.map((f) => (
          <div key={f.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft hover:shadow-premium transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="text-gray-400 hover:text-warning p-1 transition-colors"
                  title="Delete farm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-bold text-base text-charcoal">{f.farm_name}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{f.village}, {f.district}, {f.state}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Total Land:</span>
                  <span className="font-bold text-forest">{f.land_area} Acres</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Soil Type:</span>
                  <span className="font-semibold text-charcoal">{f.soil_type}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Irrigation:</span>
                  <span className="font-semibold text-charcoal">{f.irrigation_type}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">GPS:</span>
                  <span className="font-mono text-[10px] text-gray-600">{f.latitude.toFixed(2)}, {f.longitude.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Farm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-base text-charcoal">Register New Farm Plot</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFarm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Farm Name</label>
                <input
                  type="text"
                  required
                  value={newFarm.farm_name}
                  onChange={(e) => setNewFarm({ ...newFarm, farm_name: e.target.value })}
                  placeholder="e.g. Dindori Vineyard Plot B"
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Village</label>
                  <input
                    type="text"
                    required
                    value={newFarm.village}
                    onChange={(e) => setNewFarm({ ...newFarm, village: e.target.value })}
                    placeholder="Dindori"
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={newFarm.district}
                    onChange={(e) => setNewFarm({ ...newFarm, district: e.target.value })}
                    placeholder="Nashik"
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Land Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newFarm.land_area}
                    onChange={(e) => setNewFarm({ ...newFarm, land_area: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Soil Type</label>
                  <select
                    value={newFarm.soil_type}
                    onChange={(e) => setNewFarm({ ...newFarm, soil_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  >
                    <option value="Loamy">Loamy</option>
                    <option value="Black Cotton">Black Cotton</option>
                    <option value="Alluvial">Alluvial</option>
                    <option value="Red Sandy">Red Sandy</option>
                    <option value="Clay">Clay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Irrigation Method</label>
                <select
                  value={newFarm.irrigation_type}
                  onChange={(e) => setNewFarm({ ...newFarm, irrigation_type: e.target.value })}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                >
                  <option value="Drip">Drip Irrigation</option>
                  <option value="Sprinkler">Sprinkler</option>
                  <option value="Canal">Canal</option>
                  <option value="Rainfed">Rainfed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newFarm.latitude}
                    onChange={(e) => setNewFarm({ ...newFarm, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newFarm.longitude}
                    onChange={(e) => setNewFarm({ ...newFarm, longitude: parseFloat(e.target.value) || 0 })}
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
                  Save Farm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
