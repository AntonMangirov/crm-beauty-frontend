import { type Service } from "../api/me";

const CACHE_KEY = "master_services_cache";
const CACHE_TIMESTAMP_KEY = "master_services_cache_timestamp";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 минут

interface CachedServices {
  services: Service[];
  timestamp: number;
}

/**
 * Получить услуги из кеша, если они еще актуальны
 */
export const getCachedServices = (): Service[] | null => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!cachedData || !cachedTimestamp) {
      return null;
    }

    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();

    // Проверяем, не истек ли кеш
    if (now - timestamp > CACHE_DURATION_MS) {
      // Кеш истек, удаляем его
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }

    const parsed: CachedServices = JSON.parse(cachedData);
    return parsed.services;
  } catch (error) {
    console.error("Ошибка чтения кеша услуг:", error);
    // В случае ошибки очищаем кеш
    clearServicesCache();
    return null;
  }
};

/**
 * Сохранить услуги в кеш
 */
export const setCachedServices = (services: Service[]): void => {
  try {
    const cacheData: CachedServices = {
      services,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error("Ошибка сохранения кеша услуг:", error);
    // В случае ошибки (например, переполнение localStorage) просто игнорируем
  }
};

/**
 * Очистить кеш услуг
 */
export const clearServicesCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Ошибка очистки кеша услуг:", error);
  }
};

/**
 * Проверить, есть ли актуальный кеш
 */
export const hasValidCache = (): boolean => {
  return getCachedServices() !== null;
};

