import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Factory, ArrowRight, Building, Mail, Lock, Phone, MapPin } from 'lucide-react';

export const RegisterProcessorPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    company_name: '',
    processing_capacity: '75000',
    facility_type: 'Sauce, Puree & Ketchup Processing',
    address: 'MIDC Industrial Agro Cluster',
    city: 'Nashik',
    district: 'Nashik'
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
        role: 'processor',
        company_name: formData.company_name,
        processing_capacity: parseFloat(formData.processing_capacity) || 75000,
        facility_type: formData.facility_type,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        latitude: 19.9975,
        longitude: 73.7898
      });
      navigate('/processor');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Processor registration failed. Please review fields.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-gray-100 shadow-premium">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-forest text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-forest/20">
            <Factory className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-charcoal">Food Processor Registration</h2>
          <p className="text-xs text-gray-500 mt-1">Directly connect with regional farmers and eliminate supply shortages</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-warning text-xs font-semibold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Company / Plant Name</label>
              <input
                type="text"
                name="company_name"
                required
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Sahyadri Agro Processing Ltd"
                className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Procurement Officer Name</label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Kavita Deshpande"
                className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Official Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="procurement@sahyadriagro.com"
                className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Official Phone</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98220 98765"
                className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
              />
            </div>
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

          <div className="pt-2 border-t border-gray-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest block mb-2">
              Facility Specifications
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Processing Capacity (kg/month)</label>
                <input
                  type="number"
                  name="processing_capacity"
                  value={formData.processing_capacity}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Facility Type</label>
                <select
                  name="facility_type"
                  value={formData.facility_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                >
                  <option value="Sauce, Puree & Ketchup Processing">Sauce, Puree & Ketchup Processing</option>
                  <option value="Cold Storage & Fresh Grading">Cold Storage & Fresh Grading</option>
                  <option value="Dehydration & Powder Plant">Dehydration & Powder Plant</option>
                  <option value="Canning & Preservation">Canning & Preservation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">City / Hub</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Nashik"
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
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-forest hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-md shadow-forest/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Creating Processing Account...' : 'Complete Processor Registration'}
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
