import React, { useState, useEffect } from 'react';
import { logisticsService } from '../../services/api';
import { Delivery } from '../../types';
import { Truck, CheckCircle2, Clock, Calendar, ShieldCheck, MapPin, Package } from 'lucide-react';

const statusSteps = [
  { key: 'pending_collection', label: 'Pending' },
  { key: 'scheduled_collection', label: 'Scheduled' },
  { key: 'collected', label: 'Collected' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
];

export const FarmerDeliveriesPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const data = await logisticsService.getDeliveries();
      setDeliveries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    const idx = statusSteps.findIndex(s => s.key === status);
    return idx === -1 ? 1 : idx;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal">Delivery & Collection Tracking</h1>
        <p className="text-xs text-gray-500">Live milestones from farm-gate aggregation pickup to factory processing</p>
      </div>

      <div className="space-y-5">
        {deliveries.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-gray-400 border border-gray-100 shadow-soft">
            <Truck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No scheduled dispatches yet. When procurement orders are accepted, logistics dispatch schedules appear here.
          </div>
        ) : (
          deliveries.map((del) => {
            const currentStep = getStepIndex(del.status);

            return (
              <div
                key={del.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-premium transition-all space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest flex items-center justify-center font-bold">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-charcoal">{del.order_code || 'Procurement Order'}</h3>
                      <p className="text-xs text-gray-500 font-mono">Tracking: {del.tracking_number}</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-emerald-50 text-forest text-xs font-bold rounded-full border border-emerald-200 self-start sm:self-center">
                    {del.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Progress Step Bar */}
                <div className="relative pt-2 pb-4">
                  <div className="flex items-center justify-between relative z-10">
                    {statusSteps.map((step, idx) => {
                      const isPassed = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isPassed
                                ? 'bg-forest text-white ring-4 ring-forest-50 shadow-sm'
                                : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span
                            className={`text-[10px] mt-1.5 font-semibold text-center ${
                              isCurrent
                                ? 'text-forest font-bold'
                                : isPassed
                                ? 'text-charcoal'
                                : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Connecting line */}
                  <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-0">
                    <div
                      className="h-full bg-forest transition-all duration-500"
                      style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Details Footer */}
                <div className="bg-cream rounded-2xl p-4 border border-gray-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Crop:</span>
                    <span className="font-semibold text-charcoal">{del.crop_name || 'Produce'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Scheduled Pickup:</span>
                    <span className="font-semibold text-charcoal">{del.collection_scheduled_date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Expected Arrival:</span>
                    <span className="font-semibold text-charcoal">{del.expected_delivery_date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Remarks:</span>
                    <span className="text-gray-600 truncate block">{del.remarks || 'Standard farm-gate aggregation'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
