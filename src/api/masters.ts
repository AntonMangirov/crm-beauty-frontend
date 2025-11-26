import { publicApiClient } from "./index";

export interface PortfolioPhoto {
  id: string;
  url: string;
  description?: string | null;
  createdAt: string;
}

export interface Master {
  slug: string;
  name: string;
  photoUrl: string | null;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone?: string | null;
  vkUrl?: string | null;
  telegramUrl?: string | null;
  whatsappUrl?: string | null;
  rating?: number | null;
  backgroundImageUrl?: string | null; // Фоновое изображение для карточки мастера
  services: Service[];
  portfolio?: PortfolioPhoto[]; // Примеры работ мастера
}

export interface Service {
  id: string;
  name: string;
  price: string; // API возвращает строку
  durationMin: number;
  photoUrl?: string | null; // Фото услуги (опционально)
}

export interface BookingRequest {
  name: string;
  phone: string;
  serviceId: string;
  startAt: string; // ISO строка
  comment?: string;
  recaptchaToken?: string; // reCAPTCHA v3 токен (опционально в dev режиме)
}

export interface BookingResponse {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface TimeslotsResponse {
  available: string[]; // ISO datetime strings
}

export const mastersApi = {
  getBySlug: async (slug: string): Promise<Master> => {
    const response = await publicApiClient.get(`/api/public/${slug}`);
    return response.data;
  },

  getTimeslots: async (
    slug: string,
    date?: string,
    serviceId?: string
  ): Promise<TimeslotsResponse> => {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (serviceId) params.append("serviceId", serviceId);

    const queryString = params.toString();
    const url = `/api/public/${slug}/timeslots${
      queryString ? `?${queryString}` : ""
    }`;
    const response = await publicApiClient.get(url);
    return response.data;
  },

  bookAppointment: async (
    slug: string,
    bookingData: BookingRequest
  ): Promise<BookingResponse> => {
    const requestBody: Record<string, unknown> = {
      name: bookingData.name,
      phone: bookingData.phone,
      serviceId: bookingData.serviceId,
      startAt: bookingData.startAt,
    };
    
    if (bookingData.comment) {
      requestBody.comment = bookingData.comment;
    }
    
    // Добавляем recaptchaToken только если он есть
    if (bookingData.recaptchaToken) {
      requestBody.recaptchaToken = bookingData.recaptchaToken;
    }
    
    const response = await publicApiClient.post(`/api/public/${slug}/book`, requestBody);
    return response.data;
  },
};
