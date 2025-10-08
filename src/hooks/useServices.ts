import { useState, useEffect, useCallback } from "react";
import type {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  ApiError,
} from "../types/service";
import { mockServiceApi } from "../services/mockServiceApi";

interface UseServicesReturn {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  createService: (data: CreateServiceRequest) => Promise<Service | null>;
  updateService: (
    id: string,
    data: UpdateServiceRequest
  ) => Promise<Service | null>;
  deleteService: (id: string) => Promise<boolean>;
  refreshServices: () => Promise<void>;
  searchServices: (query: string) => Promise<void>;
  filterServices: (isActive?: boolean) => Promise<void>;
}

export const useServices = (): UseServicesReturn => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка услуг
  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await mockServiceApi.getServices();
      setServices(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка загрузки услуг";
      setError(errorMessage);
      console.error("Ошибка загрузки услуг:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Создание услуги
  const createService = useCallback(
    async (data: CreateServiceRequest): Promise<Service | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const newService = await mockServiceApi.createService(data);
        setServices((prev) => [...prev, newService]);
        return newService;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Ошибка создания услуги";
        setError(errorMessage);
        console.error("Ошибка создания услуги:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Обновление услуги
  const updateService = useCallback(
    async (id: string, data: UpdateServiceRequest): Promise<Service | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedService = await mockServiceApi.updateService(id, data);
        setServices((prev) =>
          prev.map((service) => (service.id === id ? updatedService : service))
        );
        return updatedService;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Ошибка обновления услуги";
        setError(errorMessage);
        console.error("Ошибка обновления услуги:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Удаление услуги
  const deleteService = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await mockServiceApi.deleteService(id);
      setServices((prev) => prev.filter((service) => service.id !== id));
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка удаления услуги";
      setError(errorMessage);
      console.error("Ошибка удаления услуги:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Обновление списка услуг
  const refreshServices = useCallback(async () => {
    await loadServices();
  }, [loadServices]);

  // Поиск услуг
  const searchServices = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await loadServices();
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await mockServiceApi.searchServices(query);
        setServices(results);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Ошибка поиска услуг";
        setError(errorMessage);
        console.error("Ошибка поиска услуг:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [loadServices]
  );

  // Фильтрация услуг
  const filterServices = useCallback(async (isActive?: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await mockServiceApi.filterServices(isActive);
      setServices(results);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка фильтрации услуг";
      setError(errorMessage);
      console.error("Ошибка фильтрации услуг:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Загрузка услуг при монтировании компонента
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  return {
    services,
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
    refreshServices,
    searchServices,
    filterServices,
  };
};
