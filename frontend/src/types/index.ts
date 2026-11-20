export type UserRole = 'farmer' | 'processor' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id: string;
  email: string;
  full_name: string;
}

export interface Farm {
  id: string;
  farmer_id: string;
  farm_name: string;
  village: string;
  district: string;
  state: string;
  land_area: number;
  soil_type: string;
  latitude: number;
  longitude: number;
  irrigation_type: string;
  created_at: string;
}

export interface CropForecastSummary {
  predicted_yield_kg: number;
  lower_estimate_kg: number;
  upper_estimate_kg: number;
  confidence_score: number;
  model_version: string;
}

export interface Crop {
  id: string;
  farm_id: string;
  farmer_id: string;
  crop_name: string;
  variety?: string;
  cultivation_area: number;
  sowing_date: string;
  expected_harvest_date: string;
  estimated_quantity: number;
  quality_grade: string;
  cultivation_status: string;
  retained_quantity: number;
  loss_buffer_pct: number;
  committed_quantity: number;
  predicted_yield_kg?: number;
  available_supply_kg: number;
  latest_forecast?: CropForecastSummary;
  farm_name?: string;
  village?: string;
  district?: string;
  soil_type?: string;
  irrigation_type?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface ProcessorProfile {
  id: string;
  user_id: string;
  company_name: string;
  processing_capacity: number;
  facility_type: string;
  address: string;
  city: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface ProcurementDemand {
  id: string;
  processor_id: string;
  crop_name: string;
  required_quantity: number;
  minimum_quality_grade: string;
  required_delivery_date: string;
  max_distance_km: number;
  target_price_per_kg?: number;
  additional_requirements?: string;
  status: 'active' | 'paused' | 'fulfilled' | 'closed';
  company_name?: string;
  matched_quantity?: number;
  committed_quantity?: number;
  created_at: string;
}

export interface SupplierScoreBreakdown {
  crop_compatibility: number;
  quantity_fulfilment: number;
  harvest_timing: number;
  distance: number;
  quality_compatibility: number;
  total_score: number;
}

export interface RankedSupplier {
  match_id?: string;
  crop_id: string;
  farmer_id: string;
  farmer_name: string;
  farm_name: string;
  village: string;
  district: string;
  crop_name: string;
  quality_grade: string;
  available_quantity_kg: number;
  allocated_quantity_kg: number;
  expected_harvest_date: string;
  distance_km: number;
  match_score: number;
  rank: number;
  score_breakdown: SupplierScoreBreakdown;
  match_explanation: string;
  latitude: number;
  longitude: number;
}

export interface MultiFarmerMatchResponse {
  demand_id: string;
  crop_name: string;
  required_quantity_kg: number;
  total_matched_quantity_kg: number;
  remaining_shortage_kg: number;
  fulfilment_pct: number;
  recommended_farmers_count: number;
  is_fully_fulfillable: boolean;
  formula: string;
  suppliers: RankedSupplier[];
}

export interface SupplyRiskResponse {
  demand_id: string;
  crop_name: string;
  required_quantity_kg: number;
  confirmed_supply_kg: number;
  predicted_available_supply_kg: number;
  total_addressable_supply_kg: number;
  potential_supply_gap_kg: number;
  coverage_pct: number;
  risk_category: 'Low' | 'Medium' | 'High';
  risk_color: string;
  thresholds: Record<string, string>;
  recommended_actions: string[];
  supply_breakdown: Record<string, any>;
}

export interface ProcurementOrder {
  id: string;
  demand_id: string;
  processor_id: string;
  farmer_id: string;
  crop_id: string;
  match_id?: string;
  order_code: string;
  agreed_quantity: number;
  price_per_kg: number;
  total_value: number;
  delivery_deadline: string;
  status: 'requested' | 'accepted' | 'rejected' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  rejection_reason?: string;
  farmer_name?: string;
  farmer_phone?: string;
  company_name?: string;
  crop_name?: string;
  farm_village?: string;
  farm_district?: string;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  tracking_number: string;
  collection_scheduled_date: string;
  pickup_date?: string;
  expected_delivery_date: string;
  actual_delivery_date?: string;
  collected_quantity: number;
  received_quantity: number;
  status: 'pending_collection' | 'scheduled_collection' | 'collected' | 'delivered' | 'completed';
  remarks?: string;
  order_code?: string;
  farmer_name?: string;
  crop_name?: string;
  created_at: string;
}

export interface QualityRecord {
  id: string;
  order_id: string;
  inspector_name: string;
  inspection_date: string;
  assessed_grade: string;
  moisture_content_pct: number;
  defects_pct: number;
  notes?: string;
  passed: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface ModelInfo {
  model_name: string;
  algorithm: string;
  version: string;
  trained_at: string;
  samples_trained: number;
  samples_tested: number;
  metrics: {
    r2_score: number;
    mae_kg: number;
    rmse_kg: number;
    mean_test_target_kg: number;
    relative_error_pct: number;
  };
  top_feature_importances: Array<{ feature: string; importance: number }>;
  supported_crops: string[];
  supported_soils: string[];
  supported_irrigations: string[];
  supported_seasons: string[];
  disclosure: string;
}
