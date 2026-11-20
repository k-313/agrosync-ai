import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, Sprout, BrainCircuit, Inbox, Truck } from 'lucide-react';

const farmerNavItems = [
  { name: 'Home', path: '/farmer', icon: LayoutDashboard },
  { name: 'My Farms', path: '/farmer/farms', icon: MapPin },
  { name: 'Crops', path: '/farmer/crops', icon: Sprout },
  { name: 'AI Yield', path: '/farmer/yield', icon: BrainCircuit, badge: 'AI' },
  { name: 'Requests', path: '/farmer/requests', icon: Inbox },
  { name: 'Deliveries', path: '/farmer/deliveries', icon: Truck },
];

export const FarmerNav: React.FC = () => {
  return (
    <>
      {/* Desktop Farmer Header Pill Navigation */}
      <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-soft mb-6 max-w-7xl mx-auto mt-4">
        {farmerNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/farmer'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-forest text-white shadow-sm'
                    : 'text-gray-600 hover:text-charcoal hover:bg-cream'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-forest ml-1">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Mobile-First Fixed Bottom Navigation Bar (PWA Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2 flex items-center justify-around shadow-2xl">
        {farmerNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/farmer'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-lg transition-colors relative ${
                  isActive ? 'text-forest font-bold' : 'text-gray-400 hover:text-gray-600 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-forest stroke-[2.5]' : 'text-gray-400'}`} />
                  <span className="text-[10px] leading-tight">{item.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-forest absolute -bottom-0.5"></span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </>
  );
};
