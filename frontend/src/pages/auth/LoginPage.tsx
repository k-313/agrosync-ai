import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sprout, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const authData = await login(email, password);
      if (authData.role === 'processor') {
        navigate('/processor');
      } else if (authData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/farmer');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-100 shadow-premium">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-forest text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-forest/20">
            <Sprout className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-charcoal">Sign In to AgroSync</h2>
          <p className="text-xs text-gray-500 mt-1">Access your intelligent supply chain portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-warning text-xs font-semibold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-forest hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-forest hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-md shadow-forest/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* 1-Click Quick Demo Fillers */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-forest mb-2.5">
            <ShieldCheck className="w-4 h-4" /> Quick Demo Fill
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('processor@agrosync.com', 'Processor123!')}
              className="py-1.5 px-2 bg-cream hover:bg-forest-50 border border-gray-200 rounded-lg text-charcoal font-semibold text-[11px] transition-colors"
            >
              Processor
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('farmer1@agrosync.com', 'Farmer123!')}
              className="py-1.5 px-2 bg-cream hover:bg-emerald-50 border border-gray-200 rounded-lg text-charcoal font-semibold text-[11px] transition-colors"
            >
              Farmer 1
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@agrosync.com', 'Admin123!')}
              className="py-1.5 px-2 bg-cream hover:bg-amber-50 border border-gray-200 rounded-lg text-charcoal font-semibold text-[11px] transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Footer Registration links */}
        <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
          <p>
            New farmer?{' '}
            <Link to="/register-farmer" className="text-forest font-bold hover:underline">
              Register Farm
            </Link>
          </p>
          <p>
            Food processing company?{' '}
            <Link to="/register-processor" className="text-forest font-bold hover:underline">
              Register Plant
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
