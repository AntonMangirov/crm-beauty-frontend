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
  phone?: string; // Опционально, если указан telegramUsername
  telegramUsername?: string; // Опционально, если указан phone
  serviceId: string;
  startAt: string; // ISO строка
  comment?: string;
  recaptchaToken?: string; // reCAPTCHA v3 токен (опционально в dev режиме)
  source?: 'MANUAL' | 'PHONE' | 'WEB' | 'TELEGRAM' | 'VK' | 'WHATSAPP'; // Источник записи
  price?: number; // Кастомная цена (опционально)
  durationOverride?: number; // Кастомная длительность в минутах (опционально)
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
      serviceId: bookingData.serviceId,
      startAt: bookingData.startAt,
    };
    
    // Добавляем phone только если он указан
    if (bookingData.phone) {
      requestBody.phone = bookingData.phone;
    }
    
    // Добавляем telegramUsername только если он указан
    if (bookingData.telegramUsername) {
      requestBody.telegramUsername = bookingData.telegramUsername;
    }
    
    if (bookingData.comment) {
      requestBody.comment = bookingData.comment;
    }
    
    // Добавляем source только если он указан
    if (bookingData.source) {
      requestBody.source = bookingData.source;
    }
    
    // Добавляем кастомную цену, если указана
    if (bookingData.price !== undefined && bookingData.price > 0) {
      requestBody.price = bookingData.price;
    }
    
    // Добавляем кастомную длительность, если указана
    if (bookingData.durationOverride !== undefined && bookingData.durationOverride > 0) {
      requestBody.durationOverride = bookingData.durationOverride;
    }
    
    // Добавляем recaptchaToken только если он есть
    if (bookingData.recaptchaToken) {
      requestBody.recaptchaToken = bookingData.recaptchaToken;
    }
    
    const response = await publicApiClient.post(`/api/public/${slug}/book`, requestBody);
    return response.data;
  },
};
