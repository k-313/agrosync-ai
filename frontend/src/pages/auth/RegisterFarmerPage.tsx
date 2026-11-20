import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { farmService } from '../../services/api';
import { Tractor, ArrowRight, User, Mail, Lock, Phone, MapPin } from 'lucide-react';

export const RegisterFarmerPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    // Initial Farm fields
    farm_name: '',
    village: '',
    district: 'Nashik',
    land_area: '3.0',
    soil_type: 'Loamy',
    irrigation_type: 'Drip'
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone,
        role: 'farmer'
      });

      // Automatically create initial farm
      try {
        await farmService.createFarm({
          farm_name: formData.farm_name || `${formData.full_name}'s Farm`,
          village: formData.village || 'Dindori',
          district: formData.district,
          state: 'Maharashtra',
          land_area: parseFloat(formData.land_area) || 3.0,
          soil_type: formData.soil_type,
          latitude: 20.15,
          longitude: 73.85,
          irrigation_type: formData.irrigation_type
        });
      } catch (fErr) {
        console.warn("Farm creation warning:", fErr);
      }

      navigate('/farmer');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-gray-100 shadow-premium">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald/20">
            <Tractor className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-charcoal">Farmer Registration</h2>
          <p className="text-xs text-gray-500 mt-1">Join the network and secure guaranteed buyers before harvest</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-warning text-xs font-semibold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Ramesh Patil"
                className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 94220 12345"
                className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="ramesh@agro.com"
                className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          {/* Initial Farm Profile Card */}
          <div className="pt-2 border-t border-gray-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest block mb-2">
              Primary Farm Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Farm Name</label>
                <input
                  type="text"
                  name="farm_name"
                  value={formData.farm_name}
                  onChange={handleChange}
                  placeholder="e.g. Patil Organic Lands"
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Village</label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  placeholder="Dindori"
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Nashik"
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Land Area (Acres)</label>
                <input
                  type="number"
                  step="0.1"
                  name="land_area"
                  value={formData.land_area}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Soil Type</label>
                <select
                  name="soil_type"
                  value={formData.soil_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                >
                  <option value="Loamy">Loamy</option>
                  <option value="Black Cotton">Black Cotton</option>
                  <option value="Red Sandy">Red Sandy</option>
                  <option value="Clay">Clay</option>
                  <option value="Alluvial">Alluvial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Irrigation System</label>
                <select
                  name="irrigation_type"
                  value={formData.irrigation_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                >
                  <option value="Drip">Drip Irrigation</option>
                  <option value="Sprinkler">Sprinkler</option>
                  <option value="Canal">Canal</option>
                  <option value="Rainfed">Rainfed</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-forest hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-md shadow-forest/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Creating Farm Profile...' : 'Complete Farmer Registration'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Already registered?{' '}
          <Link to="/login" className="text-forest font-bold hover:underline">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};
