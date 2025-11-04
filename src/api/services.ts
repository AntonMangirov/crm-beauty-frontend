// Заглушка для API услуг
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number; // Изменено с duration на durationMin
  category: string;
  isActive: boolean;
}

// Моковые данные
const mockServices: Service[] = [
  {
    id: "1",
    name: "Маникюр",
    description: "Классический маникюр",
    price: 1500,
    durationMin: 60,
    category: "Маникюр",
    isActive: true,
  },
  {
    id: "2",
    name: "Педикюр",
    description: "Аппаратный педикюр",
    price: 2000,
    durationMin: 90,
    category: "Педикюр",
    isActive: true,
  },
];

export const servicesApi = {
  getAll: async (): Promise<Service[]> => {
    // Имитация задержки API
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockServices;
  },
};
