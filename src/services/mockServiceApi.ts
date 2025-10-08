import type {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceResponse,
  ServicesListResponse,
  ApiError,
} from "../types/service";

// Ключ для localStorage
const STORAGE_KEY = "crm_services";

// Имитация задержки API
const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Генерация уникального ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Получение текущей даты в ISO формате
const getCurrentDate = () => new Date().toISOString();

// Получение данных из localStorage
const getStoredServices = (): Service[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Ошибка при чтении данных из localStorage:", error);
    return [];
  }
};

// Сохранение данных в localStorage
const saveStoredServices = (services: Service[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  } catch (error) {
    console.error("Ошибка при сохранении данных в localStorage:", error);
  }
};

// Инициализация с тестовыми данными
const initializeWithMockData = (): Service[] => {
  const mockServices: Service[] = [
    {
      id: "service-1",
      name: "Классический маникюр",
      price: 1500,
      durationMin: 60,
      description: "Обрезной маникюр с покрытием обычным лаком",
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: "service-2",
      name: "Маникюр + гель-лак",
      price: 2500,
      durationMin: 90,
      description: "Полный маникюр с покрытием гель-лаком",
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: "service-3",
      name: "Педикюр",
      price: 2000,
      durationMin: 90,
      description: "Полный педикюр с покрытием лаком",
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];

  saveStoredServices(mockServices);
  return mockServices;
};

// Mock API для услуг
export const mockServiceApi = {
  // Получить все услуги
  async getServices(): Promise<ServicesListResponse> {
    await delay();

    let services = getStoredServices();

    // Если данных нет, инициализируем тестовыми данными
    if (services.length === 0) {
      services = initializeWithMockData();
    }

    return services;
  },

  // Получить услугу по ID
  async getServiceById(id: string): Promise<ServiceResponse> {
    await delay();

    const services = getStoredServices();
    const service = services.find((s) => s.id === id);

    if (!service) {
      throw new Error(`Услуга с ID ${id} не найдена`);
    }

    return service;
  },

  // Создать новую услугу
  async createService(data: CreateServiceRequest): Promise<ServiceResponse> {
    await delay();

    const services = getStoredServices();
    const newService: Service = {
      id: generateId(),
      ...data,
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    };

    services.push(newService);
    saveStoredServices(services);

    return newService;
  },

  // Обновить услугу
  async updateService(
    id: string,
    data: UpdateServiceRequest
  ): Promise<ServiceResponse> {
    await delay();

    const services = getStoredServices();
    const serviceIndex = services.findIndex((s) => s.id === id);

    if (serviceIndex === -1) {
      throw new Error(`Услуга с ID ${id} не найдена`);
    }

    const updatedService: Service = {
      ...services[serviceIndex],
      ...data,
      updatedAt: getCurrentDate(),
    };

    services[serviceIndex] = updatedService;
    saveStoredServices(services);

    return updatedService;
  },

  // Удалить услугу
  async deleteService(id: string): Promise<void> {
    await delay();

    const services = getStoredServices();
    const serviceIndex = services.findIndex((s) => s.id === id);

    if (serviceIndex === -1) {
      throw new Error(`Услуга с ID ${id} не найдена`);
    }

    services.splice(serviceIndex, 1);
    saveStoredServices(services);
  },

  // Поиск услуг
  async searchServices(query: string): Promise<ServicesListResponse> {
    await delay();

    const services = getStoredServices();
    const filteredServices = services.filter(
      (service) =>
        service.name.toLowerCase().includes(query.toLowerCase()) ||
        service.description?.toLowerCase().includes(query.toLowerCase())
    );

    return filteredServices;
  },

  // Фильтрация услуг
  async filterServices(isActive?: boolean): Promise<ServicesListResponse> {
    await delay();

    const services = getStoredServices();

    if (isActive !== undefined) {
      return services.filter((service) => service.isActive === isActive);
    }

    return services;
  },

  // Сброс данных (для тестирования)
  async resetData(): Promise<void> {
    await delay();
    localStorage.removeItem(STORAGE_KEY);
  },

  // Инициализация тестовыми данными
  async initializeMockData(): Promise<ServicesListResponse> {
    await delay();
    return initializeWithMockData();
  },
};

// Экспорт типов для удобства
export type { Service, CreateServiceRequest, UpdateServiceRequest, ApiError };
