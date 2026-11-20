import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/api';
import { ProcurementOrder } from '../../types';
import {
  Inbox, CheckCircle2, XCircle, Clock, ShoppingBag,
  Building2, Calendar, ShieldCheck, X
} from 'lucide-react';

export const ProcurementRequestsPage: React.FC = () => {
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Reject modal state
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Unavailable harvest schedule');

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

  const handleAccept = async (orderId: string) => {
    try {
      await orderService.acceptOrder(orderId);
      setActionSuccess("Procurement request accepted! Scheduled collection initialized.");
      loadOrders();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectOrderId) return;
    try {
      await orderService.rejectOrder(rejectOrderId, rejectReason);
      setRejectOrderId(null);
      setActionSuccess("Procurement request declined. Supply released back to matching pool.");
      loadOrders();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal">Procurement Requests</h1>
          <p className="text-xs text-gray-500">Incoming binding purchase orders from food processors</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200">
          {['all', 'requested', 'accepted', 'completed', 'rejected'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                filter === st
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-gray-600 hover:text-charcoal hover:bg-cream'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-gray-400 border border-gray-100 shadow-soft">
            <Inbox className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No procurement requests in this category.
          </div>
        ) : (
          filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-premium transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-charcoal">{ord.company_name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.status === 'requested' ? 'bg-amber-100 text-amber-800' :
                        ord.status === 'accepted' ? 'bg-emerald-100 text-forest' :
                        ord.status === 'rejected' ? 'bg-red-100 text-warning' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ord.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{ord.order_code}</p>
                  </div>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-xs font-extrabold text-forest text-lg">
                    ₹{ord.total_value.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-gray-400">Total Purchase Value</p>
                </div>
              </div>

              {/* Order Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Crop Requested:</span>
                  <span className="font-bold text-charcoal">{ord.crop_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Agreed Volume:</span>
                  <span className="font-bold text-forest">{ord.agreed_quantity.toLocaleString()} kg</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Agreed Unit Price:</span>
                  <span className="font-bold text-charcoal">₹{ord.price_per_kg} / kg</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Delivery Deadline:</span>
                  <span className="font-semibold text-charcoal flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {ord.delivery_deadline}
                  </span>
                </div>
              </div>

              {ord.rejection_reason && (
                <div className="p-3 bg-red-50 text-warning rounded-xl text-xs mb-3 border border-red-200">
                  <span className="font-bold">Decline Reason:</span> {ord.rejection_reason}
                </div>
              )}

              {/* Action Buttons */}
              {ord.status === 'requested' && (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleAccept(ord.id)}
                    className="px-5 py-2.5 bg-forest hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Procurement Terms</span>
                  </button>
                  <button
                    onClick={() => setRejectOrderId(ord.id)}
                    className="px-4 py-2.5 bg-white hover:bg-red-50 text-warning border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline Order</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-base text-charcoal">Decline Procurement Request</h3>
              <button onClick={() => setRejectOrderId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Reason for Declining</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                >
                  <option value="Harvest timing conflict with processor deadline">Harvest timing conflict with processor deadline</option>
                  <option value="Offered price per kg below farm minimum">Offered price per kg below farm minimum</option>
                  <option value="Produce already committed to local retail mandis">Produce already committed to local retail mandis</option>
                  <option value="Quality grade standards not achievable this season">Quality grade standards not achievable this season</option>
                  <option value="Logistics/distance constraints">Logistics/distance constraints</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectOrderId(null)}
                  className="w-1/2 py-2.5 border border-gray-200 text-charcoal font-semibold text-xs rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-warning hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
