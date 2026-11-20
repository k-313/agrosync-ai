import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/api';
import { ProcurementOrder } from '../../types';
import {
  ShoppingBag, Search, CheckCircle2, Clock, XCircle,
  Truck, ArrowRight, ShieldCheck, Filter, AlertCircle
} from 'lucide-react';

export const ProcurementOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await orderService.updateStatus(orderId, nextStatus);
      loadOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const matchesSearch =
      o.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.farmer_name && o.farmer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.crop_name && o.crop_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal">Procurement Order Contracts</h1>
          <p className="text-xs text-gray-500">Committed farmer allocations with strict concurrency anti-double booking protection</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200 overflow-x-auto">
          {['all', 'requested', 'accepted', 'in_transit', 'delivered', 'completed', 'rejected'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                filter === st
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-gray-600 hover:text-charcoal hover:bg-cream'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-soft">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order code, farmer name, or crop..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No procurement orders found matching current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 pb-3">
                  <th className="pb-3 font-semibold">Order Code</th>
                  <th className="pb-3 font-semibold">Farmer Supplier</th>
                  <th className="pb-3 font-semibold">Farm Location</th>
                  <th className="pb-3 font-semibold">Crop</th>
                  <th className="pb-3 font-semibold">Contracted Vol</th>
                  <th className="pb-3 font-semibold">Unit Price</th>
                  <th className="pb-3 font-semibold">Total Value</th>
                  <th className="pb-3 font-semibold">Deadline</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-charcoal">{ord.order_code}</td>
                    <td className="py-3.5 font-bold text-gray-800">{ord.farmer_name || 'Farmer'}</td>
                    <td className="py-3.5 text-gray-500">{ord.farm_village || 'Nashik'}, {ord.farm_district || 'MH'}</td>
                    <td className="py-3.5 font-semibold text-charcoal">{ord.crop_name}</td>
                    <td className="py-3.5 font-extrabold text-forest">{ord.agreed_quantity.toLocaleString()} kg</td>
                    <td className="py-3.5 text-gray-600">₹{ord.price_per_kg}</td>
                    <td className="py-3.5 font-bold text-charcoal">₹{ord.total_value.toLocaleString()}</td>
                    <td className="py-3.5 text-gray-600">{ord.delivery_deadline}</td>
                    <td className="py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        ord.status === 'requested' ? 'bg-amber-100 text-amber-800' :
                        ord.status === 'accepted' ? 'bg-emerald-100 text-forest' :
                        ord.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        ord.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                        ord.status === 'completed' ? 'bg-green-100 text-green-800' :
                        ord.status === 'rejected' ? 'bg-red-100 text-warning' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ord.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {ord.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'in_transit')}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Mark Dispatched
                        </button>
                      )}
                      {ord.status === 'in_transit' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'delivered')}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {ord.status === 'delivered' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'completed')}
                          className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Complete Order
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
