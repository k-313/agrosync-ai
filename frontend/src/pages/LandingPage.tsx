import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout, BrainCircuit, Users, TrendingUp, AlertOctagon, CheckCircle2,
  ArrowRight, ShieldCheck, Factory, Tractor, Sparkles, MapPin, BarChart3, Clock
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemoLogin = async (email: string, pass: string, rolePath: string) => {
    try {
      await login(email, pass);
      navigate(rolePath);
    } catch (e) {
      console.error("Demo login error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-10 w-80 h-80 bg-forest-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest text-xs font-bold tracking-wide uppercase shadow-soft mb-6">
              <Sparkles className="w-4 h-4 text-emerald" />
              <span>Predict. Connect. Supply.</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-charcoal tracking-tight leading-tight md:leading-none">
              Intelligent Farmer-to-Processor <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-forest to-emerald">
                Supply Chain Platform
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Solving agricultural supply uncertainty. Connect food processors directly with regional farm clusters using machine learning yield forecasting, multi-farmer matching, and early shortage alerts.
            </p>

            {/* Main Action CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register-processor"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-forest hover:bg-forest-900 text-white font-bold text-sm shadow-premium transition-all hover:scale-[1.02]"
              >
                <Factory className="w-4 h-4" />
                <span>Processor Registration</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register-farmer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-charcoal font-bold text-sm border border-gray-200 shadow-soft transition-all hover:scale-[1.02]"
              >
                <Tractor className="w-4 h-4 text-forest" />
                <span>Farmer Registration</span>
              </Link>
            </div>

            {/* Quick Demo Login Cards Bar */}
            <div className="mt-12 p-4 sm:p-5 bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-100 shadow-premium max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> 1-Click Interactive Demo Login
                </span>
                <span className="text-[11px] text-gray-400">Pre-seeded with real multi-farmer tomato scenario</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleQuickDemoLogin('processor@agrosync.com', 'Processor123!', '/processor')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 hover:border-forest hover:bg-forest-50/50 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-forest text-white flex items-center justify-center shrink-0">
                    <Factory className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-charcoal group-hover:text-forest truncate">Food Processor</p>
                    <p className="text-[10px] text-gray-500 truncate">Sahyadri Agro Ltd</p>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickDemoLogin('farmer1@agrosync.com', 'Farmer123!', '/farmer')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald text-white flex items-center justify-center shrink-0">
                    <Tractor className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-charcoal group-hover:text-emerald-700 truncate">Farmer (Supplier)</p>
                    <p className="text-[10px] text-gray-500 truncate">Ramesh Patil (2.5 ac)</p>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickDemoLogin('admin@agrosync.com', 'Admin123!', '/admin')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 hover:border-amber hover:bg-amber-50/50 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-charcoal group-hover:text-amber-700 truncate">Platform Admin</p>
                    <p className="text-[10px] text-gray-500 truncate">Full Network View</p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* The Core Problem Solved */}
      <section id="problem" className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold text-warning uppercase tracking-wider">The Agricultural Dilemma</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal mt-1">
              "Food processors cannot rely on farmer collections/supply."
            </h2>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              Industrial food processing lines require continuous, high-volume, quality-graded produce. Yet traditional fragmented sourcing creates catastrophic delays, broken contracts, and sudden shortages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-cream border border-gray-200/80 hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-warning flex items-center justify-center mb-4">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-charcoal mb-2">Unpredicted Crop Yields</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Processors commit to retail delivery deadlines with zero mathematical visibility into whether regional crops will yield 10 tons or 30 tons.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream border border-gray-200/80 hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-charcoal mb-2">Fragmented Smallholder Supply</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                A 5,000 kg demand cannot be fulfilled by a single 1-acre farmer. Processors waste weeks haggling individually with dozens of disconnected growers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream border border-gray-200/80 hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-charcoal mb-2">Late Shortage Discovery</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Procurement managers only discover supply gaps on delivery morning—when it is far too late to procure substitute harvests from neighboring districts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Signature Innovations */}
      <section id="ai-innovations" className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald uppercase tracking-wider">Algorithmic Precision</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal mt-1">
              Three Signature AI Innovations
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Transforming speculative farm-gate sourcing into a predictable industrial supply chain.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Innovation 1 */}
            <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-premium flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-forest text-white flex items-center justify-center font-bold text-lg mb-6 shadow-md shadow-forest/20">
                  1
                </div>
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Predict Before Harvest</span>
                <h3 className="text-xl font-bold text-charcoal mt-1 mb-3">ML Crop Yield Prediction</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Trained RandomForestRegressor model calibrated against ICAR/FAO horticultural benchmarks across soil types, irrigation regimes, and weather conditions.
                </p>
                <div className="bg-cream rounded-xl p-3 border border-gray-200/60 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Test R² Score:</span>
                    <span className="font-bold text-forest">0.8296</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Confidence Bounds:</span>
                    <span className="font-bold text-charcoal">95% Empirical Tree Intervals</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Inputs:</span>
                    <span className="font-medium text-gray-700">Area, Soil, Rain, Temp, Days</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-forest">
                <CheckCircle2 className="w-4 h-4 text-emerald" />
                <span>Prevents Over/Under-Estimating Harvests</span>
              </div>
            </div>

            {/* Innovation 2 */}
            <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-premium flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald text-white flex items-center justify-center font-bold text-lg mb-6 shadow-md shadow-emerald/20">
                  2
                </div>
                <span className="text-xs font-bold text-emerald uppercase tracking-wider">Multi-Farmer Aggregation</span>
                <h3 className="text-xl font-bold text-charcoal mt-1 mb-3">Intelligent Supplier Matching</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Multi-farmer allocation algorithm combining smallholder growers into a unified industrial delivery quota using a transparent 5-factor scoring formula.
                </p>
                <div className="bg-cream rounded-xl p-3 border border-gray-200/60 text-xs space-y-1 font-mono text-[11px] text-gray-700">
                  <p>30% Crop Compatibility</p>
                  <p>25% Quantity Fulfilment</p>
                  <p>20% Harvest Timing Window</p>
                  <p>15% Haversine Distance</p>
                  <p>10% Quality Grade Match</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-forest">
                <CheckCircle2 className="w-4 h-4 text-emerald" />
                <span>Fulfills 5,000+ kg across 3-5 growers</span>
              </div>
            </div>

            {/* Innovation 3 */}
            <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-premium flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg mb-6 shadow-md shadow-amber/20">
                  3
                </div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Early Shortage Warning</span>
                <h3 className="text-xl font-bold text-charcoal mt-1 mb-3">Supply Risk Detection Engine</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Rules-based shortage engine calculating supply gaps before procurement deadlines, automatically triggering perimeter radius expansions and backup supplier reserves.
                </p>
                <div className="bg-cream rounded-xl p-3 border border-gray-200/60 text-xs space-y-2">
                  <div className="font-mono text-charcoal font-bold text-[11px] bg-white p-1.5 rounded border border-gray-200">
                    Gap = max(0, Demand - Uncommitted Supply)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald"></span>
                    <span className="text-[11px] text-gray-600">Low Risk: Sufficient buffer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber"></span>
                    <span className="text-[11px] text-gray-600">Medium Risk: Tight quota</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
                    <span className="text-[11px] text-gray-600">High Risk: Immediate deficit</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-forest">
                <CheckCircle2 className="w-4 h-4 text-emerald" />
                <span>Zero Last-Minute Factory Downtime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Live Stats */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-forest">5,000 kg</p>
              <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Demo Industrial Demand</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-charcoal">3 Growers</p>
              <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Auto-Matched in 1 Click</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald">100%</p>
              <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Quota Fulfillment Rate</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-forest">0 kg</p>
              <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Supply Shortage Gap</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-charcoal text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald flex items-center justify-center text-white">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight">AgroSync AI</span>
              <p className="text-xs text-gray-400">Intelligent Farmer-to-Processor Supply Chain Platform</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center md:text-right">
            Predict. Connect. Supply. &copy; 2026 AgroSync AI Inc. Built for agricultural excellence.
          </p>
        </div>
      </footer>
    </div>
  );
};
