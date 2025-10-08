import { useState, useEffect, useCallback } from "react";
import type { Service, UpdateServiceRequest, ApiError } from "../types/service";
import { mockServiceApi } from "../services/mockServiceApi";

interface UseServiceReturn {
  service: Service | null;
  isLoading: boolean;
  error: string | null;
  updateService: (data: UpdateServiceRequest) => Promise<Service | null>;
  deleteService: () => Promise<boolean>;
  refreshService: () => Promise<void>;
}

export const useService = (id: string): UseServiceReturn => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка услуги
  const loadService = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await mockServiceApi.getServiceById(id);
      setService(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка загрузки услуги";
      setError(errorMessage);
      console.error("Ошибка загрузки услуги:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Обновление услуги
  const updateService = useCallback(
    async (data: UpdateServiceRequest): Promise<Service | null> => {
      if (!id) return null;

      setIsLoading(true);
      setError(null);

      try {
        const updatedService = await mockServiceApi.updateService(id, data);
        setService(updatedService);
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
    [id]
  );

  // Удаление услуги
  const deleteService = useCallback(async (): Promise<boolean> => {
    if (!id) return false;

    setIsLoading(true);
    setError(null);

    try {
      await mockServiceApi.deleteService(id);
      setService(null);
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
  }, [id]);

  // Обновление услуги
  const refreshService = useCallback(async () => {
    await loadService();
  }, [loadService]);

  // Загрузка услуги при изменении ID
  useEffect(() => {
    loadService();
  }, [loadService]);

  return {
    service,
    isLoading,
    error,
    updateService,
    deleteService,
    refreshService,
  };
};
