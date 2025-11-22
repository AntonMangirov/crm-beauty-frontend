import { apiClient } from "./index";

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  slug: string;
  phone: string | null;
  description: string | null;
  photoUrl: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  vkUrl: string | null;
  telegramUrl: string | null;
  whatsappUrl: string | null;
  backgroundImageUrl: string | null;
  rating: number | null;
  isActive: boolean;
  role: "MASTER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  stats: {
    totalServices: number;
    activeServices: number;
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    totalClients: number;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  description?: string | null;
  photoUrl?: string | null;
  address?: string | null;
}

export interface Appointment {
  id: string;
  masterId: string;
  clientId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
  source: string;
  notes: string | null;
  price: number | null;
  notificationJobId: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  service: {
    id: string;
    name: string;
    price: number;
    durationMin: number;
  };
}

export interface AppointmentsFilter {
  dateFrom?: string;
  dateTo?: string;
  status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
  serviceId?: string;
  clientId?: string;
}

export interface Service {
  id: string;
  masterId: string;
  name: string;
  price: number;
  durationMin: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  price: number;
  durationMin: number;
  description?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  price?: number;
  durationMin?: number;
  description?: string;
  isActive?: boolean;
}

export const meApi = {
  /**
   * GET /api/me
   * Получить полную информацию о текущем мастере
   */
  getMe: async (): Promise<MeResponse> => {
    const response = await apiClient.get("/api/me");
    return response.data;
  },

  /**
   * PATCH /api/me/profile
   * Обновить профиль мастера (name, description, address, photoUrl)
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<MeResponse> => {
    const response = await apiClient.patch("/api/me/profile", data);
    return response.data;
  },

  /**
   * POST /api/me/profile/upload-photo
   * Загрузить фото профиля
   */
  uploadPhoto: async (file: File): Promise<MeResponse> => {
    const formData = new FormData();
    formData.append("photo", file);
    
    const response = await apiClient.post("/api/me/profile/upload-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * GET /api/me/appointments
   * Получить записи мастера с фильтрами
   */
  getAppointments: async (
    filters?: AppointmentsFilter
  ): Promise<Appointment[]> => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.serviceId) params.append("serviceId", filters.serviceId);
    if (filters?.clientId) params.append("clientId", filters.clientId);

    const queryString = params.toString();
    const url = `/api/me/appointments${queryString ? `?${queryString}` : ""}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * GET /api/me/services
   * Получить все услуги мастера
   */
  getServices: async (): Promise<Service[]> => {
    const response = await apiClient.get("/api/me/services");
    return response.data;
  },

  /**
   * POST /api/me/services
   * Создать новую услугу
   */
  createService: async (data: CreateServiceRequest): Promise<Service> => {
    const response = await apiClient.post("/api/me/services", data);
    return response.data;
  },

  /**
   * PATCH /api/me/services/:id
   * Обновить услугу
   */
  updateService: async (
    id: string,
    data: UpdateServiceRequest
  ): Promise<Service> => {
    const response = await apiClient.patch(`/api/me/services/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /api/me/services/:id
   * Удалить услугу
   */
  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/me/services/${id}`);
  },
};

