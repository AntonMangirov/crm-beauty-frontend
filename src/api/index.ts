import axios, { AxiosError } from "axios";

// Базовый URL для API (можно настроить через переменные окружения)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Флаг для предотвращения бесконечного цикла refresh запросов
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Создаем экземпляр axios с базовой конфигурацией
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Включаем отправку cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерцептор для добавления токена авторизации к каждому запросу
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок и автоматического refresh токена
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as {
      _retry?: boolean;
      url?: string;
      headers?: any;
    };

    // Если ошибка 401 и это не запрос на refresh или logout
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/logout")
    ) {
      if (isRefreshing) {
        // Если уже идет refresh, добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Пытаемся обновить токен
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );

        const { accessToken } = response.data;
        localStorage.setItem("authToken", accessToken);

        // Обновляем заголовок оригинального запроса
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        isRefreshing = false;

        // Повторяем оригинальный запрос
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Если refresh не удался, очищаем токен и редиректим на логин
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem("authToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Публичный API клиент без credentials для публичных эндпоинтов
export const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false, // Не отправляем cookies для публичных запросов
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
