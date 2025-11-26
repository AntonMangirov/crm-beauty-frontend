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
    telegramUsername: string | null;
    email: string | null;
  };
  service: {
    id: string;
    name: string;
    price: number;
    durationMin: number;
  };
  photos?: ClientHistoryPhoto[];
}

export interface AppointmentsFilter {
  // Короткие параметры (предпочтительные)
  from?: string;
  to?: string;
  // Старые параметры (для обратной совместимости)
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

export interface ClientListItem {
  id: string;
  name: string;
  phone: string | null;
  telegramUsername: string | null;
  lastVisit: string | null; // ISO date string
  visitsCount: number;
  photosCount: number; // Количество фото у клиента
}

export interface ClientHistoryPhoto {
  id: string;
  url: string;
  description: string | null;
  createdAt: string;
}

export interface ClientHistoryItem {
  id: string;
  date: string; // ISO date string
  service: {
    id: string;
    name: string;
    price: number;
  };
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
  photos: ClientHistoryPhoto[];
}

export interface AnalyticsResponse {
  appointmentsCount: number;
  revenue: number;
  topServices: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  newClientsPercentage: number;
}

export interface PortfolioPhoto {
  id: string;
  url: string;
  description?: string | null;
  createdAt: string;
}

export interface PortfolioResponse {
  photos: PortfolioPhoto[];
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
   * GET /api/me/analytics
   * Получить аналитику за текущий месяц
   */
  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const response = await apiClient.get("/api/me/analytics");
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

    const response = await apiClient.post(
      "/api/me/profile/upload-photo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
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
    // Используем короткие параметры from/to, если они указаны, иначе dateFrom/dateTo
    if (filters?.from) {
      params.append("from", filters.from);
    } else if (filters?.dateFrom) {
      params.append("dateFrom", filters.dateFrom);
    }
    if (filters?.to) {
      params.append("to", filters.to);
    } else if (filters?.dateTo) {
      params.append("dateTo", filters.dateTo);
    }
    if (filters?.status) params.append("status", filters.status);
    if (filters?.serviceId) params.append("serviceId", filters.serviceId);
    if (filters?.clientId) params.append("clientId", filters.clientId);

    const queryString = params.toString();
    const url = `/api/me/appointments${queryString ? `?${queryString}` : ""}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * PUT /api/me/appointments/:id
   * Обновить статус записи
   */
  updateAppointmentStatus: async (
    id: string,
    status: "CONFIRMED" | "CANCELED" | "COMPLETED"
  ): Promise<Appointment> => {
    const response = await apiClient.put(`/api/me/appointments/${id}`, {
      status,
    });
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

  /**
   * GET /api/me/clients
   * Получить список клиентов мастера
   * @param search - поиск по имени или телефону (опционально)
   */
  getClients: async (search?: { name?: string; phone?: string }): Promise<ClientListItem[]> => {
    const params = new URLSearchParams();
    if (search?.name) params.append("name", search.name);
    if (search?.phone) params.append("phone", search.phone);
    
    const queryString = params.toString();
    const url = `/api/me/clients${queryString ? `?${queryString}` : ""}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * GET /api/me/clients/:id/history
   * Получить историю посещений клиента
   */
  getClientHistory: async (clientId: string): Promise<ClientHistoryItem[]> => {
    const response = await apiClient.get(`/api/me/clients/${clientId}/history`);
    return response.data;
  },

  /**
   * POST /api/me/appointments/:id/photos
   * Загрузить фото к записи
   */
  uploadAppointmentPhotos: async (
    appointmentId: string,
    files: File[],
    descriptions?: string[]
  ): Promise<{ photos: ClientHistoryPhoto[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("photos", file);
    });
    if (descriptions) {
      descriptions.forEach((desc, index) => {
        if (desc) {
          formData.append(`description`, desc);
        }
      });
    }

    const response = await apiClient.post(
      `/api/me/appointments/${appointmentId}/photos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * DELETE /api/me/appointments/:id/photos/:photoId
   * Удалить фото из записи
   */
  deleteAppointmentPhoto: async (
    appointmentId: string,
    photoId: string
  ): Promise<void> => {
    await apiClient.delete(
      `/api/me/appointments/${appointmentId}/photos/${photoId}`
    );
  },

  /**
   * GET /api/me/portfolio
   * Получить портфолио мастера
   */
  getPortfolio: async (): Promise<PortfolioResponse> => {
    const response = await apiClient.get("/api/me/portfolio");
    return response.data;
  },

  /**
   * POST /api/me/portfolio/photos
   * Загрузить фото в портфолио
   */
  uploadPortfolioPhoto: async (
    file: File,
    description?: string
  ): Promise<{ photo: PortfolioPhoto }> => {
    const formData = new FormData();
    formData.append("photo", file);
    if (description) {
      formData.append("description", description);
    }
    const response = await apiClient.post("/api/me/portfolio/photos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * DELETE /api/me/portfolio/photos/:id
   * Удалить фото из портфолио
   */
  deletePortfolioPhoto: async (photoId: string): Promise<void> => {
    await apiClient.delete(`/api/me/portfolio/photos/${photoId}`);
  },
};
