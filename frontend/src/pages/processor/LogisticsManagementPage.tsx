import React, { useState, useEffect } from 'react';
import { logisticsService, orderService } from '../../services/api';
import { Delivery, ProcurementOrder } from '../../types';
import {
  Truck, CheckCircle2, ShieldCheck, Plus, Clock,
  Calendar, Package, AlertCircle, X, ClipboardCheck
} from 'lucide-react';

export const LogisticsManagementPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quality Inspection Modal
  const [inspectDelivery, setInspectDelivery] = useState<Delivery | null>(null);
  const [qualityForm, setQualityForm] = useState({
    inspector_name: 'Dr. Sandeep Kulkarni',
    assessed_grade: 'Grade A',
    moisture_content_pct: 88.5,
    defects_pct: 1.8,
    notes: 'Firm pulp texture, no mechanical damage, compliant with food processing line standards.',
    passed: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [delData, ordData] = await Promise.all([
        logisticsService.getDeliveries(),
        orderService.getOrders()
      ]);
      setDeliveries(delData);
      setOrders(ordData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDeliveryStatus = async (delId: string, nextStatus: string) => {
    try {
      await logisticsService.updateDelivery(delId, { status: nextStatus });
      setSuccessMsg(`Delivery status updated to ${nextStatus.replace('_', ' ')}.`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQualitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectDelivery) return;

    try {
      await logisticsService.createQualityRecord({
        order_id: inspectDelivery.order_id,
        ...qualityForm
      });
      // Also advance delivery to completed if passed
      if (qualityForm.passed) {
        await logisticsService.updateDelivery(inspectDelivery.id, { status: 'completed' });
      }
      setInspectDelivery(null);
      setSuccessMsg("Quality inspection record saved and verified!");
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to submit quality inspection");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal">Logistics & Quality Inspection</h1>
        <p className="text-xs text-gray-500">Farm-gate collection dispatches, weighbridge tracking, and laboratory quality tests</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Deliveries List */}
      <div className="space-y-4">
        {deliveries.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-gray-400 border border-gray-100 shadow-soft">
            <Truck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No active dispatches. As farmers accept procurement requests, dispatches appear automatically.
          </div>
        ) : (
          deliveries.map((del) => (
            <div
              key={del.id}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-premium transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest flex items-center justify-center font-bold">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-charcoal">{del.order_code || 'Order Contract'}</h3>
                    <p className="text-xs text-gray-500 font-mono">Tracking: {del.tracking_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    del.status === 'scheduled_collection' ? 'bg-amber-100 text-amber-800' :
                    del.status === 'collected' ? 'bg-blue-100 text-blue-800' :
                    del.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {del.status.replace('_', ' ').toUpperCase()}
                  </span>

                  {del.status === 'scheduled_collection' && (
                    <button
                      onClick={() => handleUpdateDeliveryStatus(del.id, 'collected')}
                      className="px-3 py-1.5 bg-forest hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Record Farm Pickup
                    </button>
                  )}

                  {del.status === 'collected' && (
                    <button
                      onClick={() => handleUpdateDeliveryStatus(del.id, 'delivered')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Record Plant Gate Arrival
                    </button>
                  )}

                  {del.status === 'delivered' && (
                    <button
                      onClick={() => setInspectDelivery(del)}
                      className="px-3 py-1.5 bg-forest hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                    >
                      <ClipboardCheck className="w-4 h-4 text-emerald" />
                      <span>Quality Inspection</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-cream p-4 rounded-2xl border border-gray-200/60 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Farmer Partner:</span>
                  <span className="font-bold text-charcoal">{del.farmer_name || 'Farmer Partner'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Crop Produce:</span>
                  <span className="font-semibold text-charcoal">{del.crop_name || 'Produce'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Collection Scheduled:</span>
                  <span className="font-semibold text-charcoal">{del.collection_scheduled_date}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Expected Factory Intake:</span>
                  <span className="font-semibold text-charcoal">{del.expected_delivery_date}</span>
                </div>
              </div>

              {del.remarks && (
                <p className="text-xs text-gray-600">
                  <span className="font-bold text-charcoal">Logistics Note:</span> {del.remarks}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quality Inspection Modal */}
      {inspectDelivery && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-forest" />
                <h3 className="font-bold text-base text-charcoal">Quality Inspection Intake Test</h3>
              </div>
              <button onClick={() => setInspectDelivery(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQualitySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Quality Inspector Name</label>
                <input
                  type="text"
                  required
                  value={qualityForm.inspector_name}
                  onChange={(e) => setQualityForm({ ...qualityForm, inspector_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Assessed Quality Grade</label>
                  <select
                    value={qualityForm.assessed_grade}
                    onChange={(e) => setQualityForm({ ...qualityForm, assessed_grade: e.target.value })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Sub-standard)</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Moisture Content (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={qualityForm.moisture_content_pct}
                    onChange={(e) => setQualityForm({ ...qualityForm, moisture_content_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Defects & Blemishes (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={qualityForm.defects_pct}
                  onChange={(e) => setQualityForm({ ...qualityForm, defects_pct: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Inspection Notes</label>
                <textarea
                  rows={2}
                  value={qualityForm.notes}
                  onChange={(e) => setQualityForm({ ...qualityForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-cream border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                />
              </div>

              <div className="pt-2 flex items-center justify-between p-3 bg-cream rounded-xl">
                <span className="text-xs font-bold text-charcoal">Batch Inspection Verdict:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qualityForm.passed}
                    onChange={(e) => setQualityForm({ ...qualityForm, passed: e.target.checked })}
                    className="rounded text-forest focus:ring-forest w-4 h-4"
                  />
                  <span className={`text-xs font-extrabold ${qualityForm.passed ? 'text-forest' : 'text-warning'}`}>
                    {qualityForm.passed ? 'PASSED & ACCEPTED' : 'FAILED / REJECTED'}
                  </span>
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setInspectDelivery(null)}
                  className="w-1/2 py-2.5 border border-gray-200 text-charcoal font-semibold text-xs rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-forest hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Save Quality Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
