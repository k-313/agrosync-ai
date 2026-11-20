import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Sparkles, AlertTriangle,
  ShoppingBag, Truck, BarChart3, Building2, ChevronRight
} from 'lucide-react';

const processorLinks = [
  { name: 'Overview', path: '/processor', icon: LayoutDashboard },
  { name: 'Procurement Demands', path: '/processor/demands', icon: FileText },
  { name: 'AI Supplier Matching', path: '/processor/matching', icon: Sparkles, badge: 'AI' },
  { name: 'Supply Risk Analysis', path: '/processor/risk', icon: AlertTriangle, badge: 'Live' },
  { name: 'Procurement Orders', path: '/processor/orders', icon: ShoppingBag },
  { name: 'Logistics & Delivery', path: '/processor/logistics', icon: Truck },
  { name: 'Analytics & Reports', path: '/processor/analytics', icon: BarChart3 },
];

export const ProcessorSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        {/* Processor Badge Card */}
        <div className="p-3.5 bg-gradient-to-br from-forest-50 to-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-charcoal truncate">Food Processor Hub</p>
            <p className="text-[11px] text-emerald-700 font-medium truncate">Nashik Processing Cluster</p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            Procurement Operations
          </p>
          {processorLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/processor'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-forest text-white shadow-md shadow-forest/20'
                      : 'text-gray-600 hover:text-charcoal hover:bg-cream'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-100 text-forest'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Signature Innovations Info Box */}
      <div className="p-3 bg-cream rounded-2xl border border-gray-200/60 text-xs">
        <div className="flex items-center gap-1.5 text-forest font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Sourcing</span>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Aggregating multi-farmer harvests to fulfill large industrial demands without shortage.
        </p>
      </div>
    </aside>
  );
};
