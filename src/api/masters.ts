import { apiClient } from "./index";

export interface Master {
  name: string;
  photoUrl: string | null;
  description: string;
  address: string;
  services: Service[];
}

export interface Service {
  id: string;
  name: string;
  price: string; // API возвращает строку
  durationMin: number;
}

export const mastersApi = {
  getBySlug: async (slug: string): Promise<Master> => {
    const response = await apiClient.get(`/api/public/${slug}`);
    return response.data;
  },
};
