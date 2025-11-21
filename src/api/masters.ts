import { apiClient } from "./index";

export interface Master {
  slug: string;
  name: string;
  photoUrl: string | null;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  services: Service[];
}

export interface Service {
  id: string;
  name: string;
  price: string; // API возвращает строку
  durationMin: number;
}

export interface BookingRequest {
  name: string;
  phone: string;
  serviceId: string;
  startAt: string; // ISO строка
  comment?: string;
  recaptchaToken?: string; // reCAPTCHA v3 токен
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
    const response = await apiClient.get(`/api/public/${slug}`);
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
    const response = await apiClient.get(url);
    return response.data;
  },

  bookAppointment: async (
    slug: string,
    bookingData: BookingRequest
  ): Promise<BookingResponse> => {
    const response = await apiClient.post(`/api/public/${slug}/book`, {
      name: bookingData.name,
      phone: bookingData.phone,
      serviceId: bookingData.serviceId,
      startAt: bookingData.startAt,
      comment: bookingData.comment,
      recaptchaToken: bookingData.recaptchaToken,
    });
    return response.data;
  },
};
