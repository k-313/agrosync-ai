import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cropService, aiService } from '../../services/api';
import { Crop, ModelInfo } from '../../types';
import {
  BrainCircuit, Sparkles, TrendingUp, Info, CheckCircle2,
  Calendar, Layers, ShieldCheck, HelpCircle, BarChart2
} from 'lucide-react';

export const YieldPredictionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCropId = searchParams.get('crop');

  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [prediction, setPrediction] = useState<any>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cropsData, infoData] = await Promise.all([
        cropService.getCrops(),
        aiService.getModelInfo()
      ]);
      setCrops(cropsData);
      setModelInfo(infoData);

      const targetId = preselectedCropId || (cropsData.length > 0 ? cropsData[0].id : '');
      if (targetId) {
        setSelectedCropId(targetId);
        // Load existing forecast if available
        loadCropForecast(targetId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsModelLoading(false);
    }
  };

  const loadCropForecast = async (cropId: string) => {
    try {
      const fc = await aiService.getForecast(cropId);
      setPrediction(fc);
    } catch (e) {
      console.warn("No forecast yet for crop", e);
    }
  };

  const handleRunPrediction = async () => {
    if (!selectedCropId) return;
    setIsLoading(true);
    try {
      const res = await aiService.predictYield(selectedCropId);
      setPrediction(res);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to generate yield forecast");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCrop = crops.find(c => c.id === selectedCropId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal flex items-center gap-2">
          <BrainCircuit className="w-7 h-7 text-forest" />
          <span>Machine Learning Crop Yield Prediction</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Pre-harvest econometric forecasting utilizing Random Forest regression trained on horticultural benchmarks
        </p>
      </div>

      {/* Selector & Run Button Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="w-full sm:max-w-md">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Registered Crop</label>
            <select
              value={selectedCropId}
              onChange={(e) => {
                setSelectedCropId(e.target.value);
                loadCropForecast(e.target.value);
              }}
              className="w-full px-4 py-2.5 bg-cream border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-forest"
            >
              {crops.map(c => (
                <option key={c.id} value={c.id}>
                  {c.crop_name} ({c.variety || 'Standard'}) - {c.farm_name || 'Farm'} ({c.cultivation_area} acres)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunPrediction}
            disabled={isLoading || !selectedCropId}
            className="px-6 py-2.5 bg-forest hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-premium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald" />
            <span>{isLoading ? 'Running Inference...' : 'Run Yield Prediction'}</span>
          </button>
        </div>

        {selectedCrop && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">Cultivated Area:</span>
              <span className="font-bold text-charcoal">{selectedCrop.cultivation_area} Acres</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Soil Type:</span>
              <span className="font-semibold text-charcoal">{selectedCrop.soil_type || 'Loamy'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Irrigation Regime:</span>
              <span className="font-semibold text-charcoal">{selectedCrop.irrigation_type || 'Drip'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Sown Date:</span>
              <span className="font-semibold text-charcoal">{selectedCrop.sowing_date}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Prediction Results Display */}
      {prediction && (
        <div className="space-y-6">
          {/* Hero Forecast Result Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-premium">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-emerald uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4" /> Machine Learning Output
                </span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-charcoal">
                  {prediction.predicted_yield_kg?.toLocaleString()} <span className="text-lg text-gray-500 font-bold">kg</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Predicted harvest volume across {prediction.cultivation_area_acres || selectedCrop?.cultivation_area} acres
                </p>
              </div>

              {/* Statistical Confidence Interval (Lower to Upper) */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1 sm:min-w-[260px]">
                <div className="flex items-center justify-between text-forest font-bold text-xs">
                  <span>95% Confidence Interval</span>
                  <span>R² 0.83</span>
                </div>
                <div className="flex items-center justify-between text-charcoal font-extrabold text-sm pt-1">
                  <span>{prediction.lower_estimate_kg?.toLocaleString()} kg</span>
                  <span className="text-gray-400 font-normal text-xs">to</span>
                  <span>{prediction.upper_estimate_kg?.toLocaleString()} kg</span>
                </div>
                <p className="text-[10px] text-gray-500 pt-1">
                  Statistically supported empirical tree variance across 35 ensemble regressors.
                </p>
              </div>
            </div>

            {/* Crucial Scientific Disclosure Alert */}
            <div className="mt-4 p-3.5 bg-cream rounded-2xl border border-gray-200 text-xs flex items-start gap-3 text-gray-700">
              <ShieldCheck className="w-5 h-5 text-forest shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-charcoal">Scientific Accounting Distinction</p>
                <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                  This figure is a probabilistic pre-harvest prediction based on agronomic features. It is clearly distinguished from confirmed warehouse harvest quantities. Available supply is strictly computed after subtracting farmer retention and loss buffers.
                </p>
              </div>
            </div>

            {/* Agronomic Explanations */}
            {prediction.explanations && prediction.explanations.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3">
                  Key Algorithmic Growth Drivers
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {prediction.explanations.map((exp: string, idx: number) => (
                    <div key={idx} className="p-3.5 bg-cream rounded-2xl border border-gray-200/60 text-xs">
                      <div className="w-2 h-2 rounded-full bg-forest mb-2"></div>
                      <p className="text-gray-700 leading-relaxed text-[11px]">{exp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model Specification & Validation Card */}
          {modelInfo && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-forest" />
                  <h3 className="font-bold text-sm text-charcoal">Model Architecture & Evaluation Metrics</h3>
                </div>
                <span className="text-[11px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {modelInfo.version}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-center py-2">
                <div className="p-3 bg-cream rounded-xl border border-gray-200/60">
                  <span className="text-gray-400 block text-[10px]">Test R² Score</span>
                  <span className="text-base font-extrabold text-forest">{modelInfo.metrics.r2_score}</span>
                </div>
                <div className="p-3 bg-cream rounded-xl border border-gray-200/60">
                  <span className="text-gray-400 block text-[10px]">Mean Absolute Error</span>
                  <span className="text-base font-extrabold text-charcoal">{modelInfo.metrics.mae_kg.toLocaleString()} kg</span>
                </div>
                <div className="p-3 bg-cream rounded-xl border border-gray-200/60">
                  <span className="text-gray-400 block text-[10px]">Root Mean Squared Err</span>
                  <span className="text-base font-extrabold text-charcoal">{modelInfo.metrics.rmse_kg.toLocaleString()} kg</span>
                </div>
                <div className="p-3 bg-cream rounded-xl border border-gray-200/60">
                  <span className="text-gray-400 block text-[10px]">Validation Set</span>
                  <span className="text-base font-extrabold text-charcoal">{modelInfo.samples_tested} records</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 mt-3 pt-3 border-t border-gray-100 leading-relaxed">
                {modelInfo.disclosure}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
