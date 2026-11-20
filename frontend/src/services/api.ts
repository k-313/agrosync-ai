import axios from 'axios';
import {
  AuthResponse, Farm, Crop, ProcessorProfile, ProcurementDemand,
  MultiFarmerMatchResponse, SupplyRiskResponse, ProcurementOrder,
  Delivery, QualityRecord, Notification, ModelInfo
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrosync_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect on failed login attempt
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('agrosync_token');
        localStorage.removeItem('agrosync_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (payload: any): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  }
};

export const farmService = {
  getFarms: async (): Promise<Farm[]> => {
    const res = await api.get('/farms');
    return res.data;
  },
  createFarm: async (farm: Partial<Farm>): Promise<Farm> => {
    const res = await api.post('/farms', farm);
    return res.data;
  },
  updateFarm: async (id: string, farm: Partial<Farm>): Promise<Farm> => {
    const res = await api.put(`/farms/${id}`, farm);
    return res.data;
  },
  deleteFarm: async (id: string) => {
    const res = await api.delete(`/farms/${id}`);
    return res.data;
  }
};

export const cropService = {
  getCrops: async (): Promise<Crop[]> => {
    const res = await api.get('/crops');
    return res.data;
  },
  getCrop: async (id: string): Promise<Crop> => {
    const res = await api.get(`/crops/${id}`);
    return res.data;
  },
  createCrop: async (crop: any): Promise<Crop> => {
    const res = await api.post('/crops', crop);
    return res.data;
  },
  updateCrop: async (id: string, crop: any): Promise<Crop> => {
    const res = await api.put(`/crops/${id}`, crop);
    return res.data;
  },
  deleteCrop: async (id: string) => {
    const res = await api.delete(`/crops/${id}`);
    return res.data;
  }
};

export const demandService = {
  getDemands: async (): Promise<ProcurementDemand[]> => {
    const res = await api.get('/demands');
    return res.data;
  },
  getDemand: async (id: string): Promise<ProcurementDemand> => {
    const res = await api.get(`/demands/${id}`);
    return res.data;
  },
  createDemand: async (demand: any): Promise<ProcurementDemand> => {
    const res = await api.post('/demands', demand);
    return res.data;
  },
  updateDemand: async (id: string, demand: any): Promise<ProcurementDemand> => {
    const res = await api.put(`/demands/${id}`, demand);
    return res.data;
  },
  deleteDemand: async (id: string) => {
    const res = await api.delete(`/demands/${id}`);
    return res.data;
  }
};

export const processorService = {
  getProfile: async (): Promise<ProcessorProfile> => {
    const res = await api.get('/processors/profile');
    return res.data;
  },
  updateProfile: async (profile: Partial<ProcessorProfile>): Promise<ProcessorProfile> => {
    const res = await api.put('/processors/profile', profile);
    return res.data;
  }
};

export const aiService = {
  predictYield: async (cropId: string) => {
    const res = await api.post(`/ai/predict-yield/${cropId}`);
    return res.data;
  },
  getForecast: async (cropId: string) => {
    const res = await api.get(`/ai/forecast/${cropId}`);
    return res.data;
  },
  matchSuppliers: async (demandId: string): Promise<MultiFarmerMatchResponse> => {
    const res = await api.post(`/ai/match/${demandId}`);
    return res.data;
  },
  getMatches: async (demandId: string): Promise<MultiFarmerMatchResponse> => {
    const res = await api.get(`/matches/${demandId}`);
    return res.data;
  },
  getSupplyRisk: async (demandId: string): Promise<SupplyRiskResponse> => {
    const res = await api.get(`/ai/risk/${demandId}`);
    return res.data;
  },
  getModelInfo: async (): Promise<ModelInfo> => {
    const res = await api.get('/ai/model-info');
    return res.data;
  }
};

export const orderService = {
  getOrders: async (): Promise<ProcurementOrder[]> => {
    const res = await api.get('/orders');
    return res.data;
  },
  createOrder: async (payload: {
    demand_id: string;
    crop_id: string;
    farmer_id: string;
    match_id?: string;
    agreed_quantity: number;
    price_per_kg: number;
    delivery_deadline: string;
  }): Promise<ProcurementOrder> => {
    const res = await api.post('/orders', payload);
    return res.data;
  },
  acceptOrder: async (orderId: string): Promise<ProcurementOrder> => {
    const res = await api.post(`/orders/${orderId}/accept`);
    return res.data;
  },
  rejectOrder: async (orderId: string, reason?: string): Promise<ProcurementOrder> => {
    const res = await api.post(`/orders/${orderId}/reject`, { rejection_reason: reason });
    return res.data;
  },
  updateStatus: async (orderId: string, status: string, rejection_reason?: string): Promise<ProcurementOrder> => {
    const res = await api.patch(`/orders/${orderId}/status`, { status, rejection_reason });
    return res.data;
  }
};

export const logisticsService = {
  getDeliveries: async (): Promise<Delivery[]> => {
    const res = await api.get('/deliveries');
    return res.data;
  },
  scheduleDelivery: async (payload: any): Promise<Delivery> => {
    const res = await api.post('/deliveries', payload);
    return res.data;
  },
  updateDelivery: async (id: string, payload: any): Promise<Delivery> => {
    const res = await api.patch(`/deliveries/${id}`, payload);
    return res.data;
  },
  createQualityRecord: async (payload: any): Promise<QualityRecord> => {
    const res = await api.post('/quality', payload);
    return res.data;
  },
  getOrderQuality: async (orderId: string): Promise<QualityRecord[]> => {
    const res = await api.get(`/quality/${orderId}`);
    return res.data;
  }
};

export const analyticsService = {
  getFarmerDashboard: async () => {
    const res = await api.get('/dashboard/farmer');
    return res.data;
  },
  getProcessorDashboard: async () => {
    const res = await api.get('/dashboard/processor');
    return res.data;
  },
  getAdminDashboard: async () => {
    const res = await api.get('/dashboard/admin');
    return res.data;
  },
  exportSupplyCSV: () => `${API_BASE_URL}/reports/supply`,
  exportDemandCSV: () => `${API_BASE_URL}/reports/demand`,
  exportDeliveryCSV: () => `${API_BASE_URL}/reports/delivery`
};

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markAsRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.post('/notifications/read-all');
    return res.data;
  }
};

export const adminService = {
  getUsers: async (role?: string) => {
    const res = await api.get('/admin/users', { params: { role } });
    return res.data;
  },
  updateUserStatus: async (userId: string, is_active?: boolean, is_verified?: boolean) => {
    const res = await api.patch(`/admin/users/${userId}/status`, { is_active, is_verified });
    return res.data;
  }
};

export default api;
