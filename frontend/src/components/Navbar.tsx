import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, Bell, LogOut, User as UserIcon, Shield, Building2, Tractor, CheckCircle2 } from 'lucide-react';
import { notificationService } from '../services/api';
import { Notification } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-forest to-emerald flex items-center justify-center text-white shadow-md shadow-forest/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-charcoal">AgroSync</span>
              <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-forest">AI</span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium tracking-wide">Predict. Connect. Supply.</p>
          </div>
        </Link>

        {/* Center Public Links if not logged in */}
        {!user && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#problem" className="hover:text-forest transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-forest transition-colors">How It Works</a>
            <a href="#ai-innovations" className="hover:text-forest transition-colors">AI Engine</a>
            <a href="#impact" className="hover:text-forest transition-colors">Impact</a>
          </nav>
        )}

        {/* User / Auth Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Role Quick Switcher / Indicator Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream border border-gray-200 text-xs font-semibold text-charcoal">
                {role === 'farmer' && <Tractor className="w-3.5 h-3.5 text-forest" />}
                {role === 'processor' && <Building2 className="w-3.5 h-3.5 text-forest" />}
                {role === 'admin' && <Shield className="w-3.5 h-3.5 text-amber-600" />}
                <span className="capitalize">{role}</span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl text-gray-600 hover:text-forest hover:bg-cream transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-warning text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 px-4 z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-charcoal">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="text-[11px] bg-emerald-100 text-forest font-semibold px-2 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-forest hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 py-1">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 py-6">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n.id}
                            className={`py-2.5 px-1 transition-colors ${!n.is_read ? 'bg-emerald-50/40 rounded-lg px-2' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <h5 className="font-semibold text-xs text-charcoal">{n.title}</h5>
                              <span className="text-[10px] text-gray-400">
                                {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown / Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-charcoal truncate max-w-[120px]">{user.full_name}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-gray-500 hover:text-warning hover:bg-red-50 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-700 hover:text-forest px-3.5 py-2 rounded-xl hover:bg-cream transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register-farmer"
                className="hidden sm:inline-flex text-xs font-bold bg-forest text-white px-4 py-2.5 rounded-xl hover:bg-forest-900 transition-colors shadow-sm shadow-forest/20"
              >
                Join as Farmer
              </Link>
              <Link
                to="/register-processor"
                className="text-xs font-bold bg-cream text-charcoal border border-gray-200 px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Join as Processor
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
