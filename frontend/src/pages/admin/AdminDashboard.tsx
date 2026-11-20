import React, { useState, useEffect } from 'react';
import { analyticsService, adminService } from '../../services/api';
import { User } from '../../types';
import {
  ShieldCheck, Users, Tractor, Building2, FileText,
  ShoppingBag, CheckCircle2, XCircle, TrendingUp, Filter, Search
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, [roleFilter]);

  const loadAdminData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        analyticsService.getAdminDashboard(),
        adminService.getUsers(roleFilter === 'all' ? undefined : roleFilter)
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await adminService.updateUserStatus(user.id, !user.is_active, user.is_verified);
      loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-charcoal to-gray-900 rounded-3xl text-white shadow-premium flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-amber">Super Admin Control</span>
          <h1 className="text-2xl font-extrabold mt-0.5">AgroSync AI Platform Administration</h1>
          <p className="text-xs text-gray-300 mt-1">
            System status: <span className="font-bold text-emerald">{stats?.system_status || 'Operational'}</span>
          </p>
        </div>
      </div>

      {/* Network Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Registered Farmers</span>
          <p className="text-2xl font-extrabold text-charcoal">{stats?.total_farmers || 0}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">{stats?.registered_farms || 0} Farms &bull; {stats?.registered_crops || 0} Crops</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Food Processors</span>
          <p className="text-2xl font-extrabold text-charcoal">{stats?.total_processors || 0}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{stats?.active_demands || 0} Active Demands</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Network Trade Volume</span>
          <p className="text-2xl font-extrabold text-forest">{stats?.total_trade_volume_kg?.toLocaleString() || 0} kg</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{stats?.procurement_orders_count || 0} Total Contracts</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Total Contract Value</span>
          <p className="text-2xl font-extrabold text-charcoal">₹{stats?.total_trade_value_inr?.toLocaleString() || 0}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Automated settlement</p>
        </div>
      </div>

      {/* User Management Module */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-extrabold text-base text-charcoal">User Account Management</h3>
            <p className="text-xs text-gray-400">Review, activate, and moderate registered supply chain participants</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Role Filter Pills */}
            <div className="flex items-center gap-1 bg-cream p-1 rounded-xl border border-gray-200">
              {['all', 'farmer', 'processor', 'admin'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                    roleFilter === r
                      ? 'bg-forest text-white shadow-sm'
                      : 'text-gray-600 hover:text-charcoal'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 pb-3">
                <th className="pb-3 font-semibold">User Full Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Phone</th>
                <th className="pb-3 font-semibold">Platform Role</th>
                <th className="pb-3 font-semibold">Verification</th>
                <th className="pb-3 font-semibold">Account Status</th>
                <th className="pb-3 font-semibold text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-cream/40 transition-colors">
                  <td className="py-3.5 font-bold text-charcoal">{u.full_name}</td>
                  <td className="py-3.5 text-gray-600">{u.email}</td>
                  <td className="py-3.5 text-gray-500">{u.phone || 'N/A'}</td>
                  <td className="py-3.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      u.role === 'farmer' ? 'bg-emerald-100 text-forest' :
                      u.role === 'processor' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald" /> Verified
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-warning'
                    }`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleToggleUserStatus(u)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        u.is_active
                          ? 'bg-red-50 text-warning hover:bg-red-100'
                          : 'bg-emerald-50 text-forest hover:bg-emerald-100'
                      }`}
                    >
                      {u.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
