import axios from "axios";

// Базовый URL для API (можно настроить через переменные окружения)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Создаем экземпляр axios с базовой конфигурацией
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерцептор для добавления токена авторизации
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Логируем данные запроса для отладки
    if (config.data && config.method === "post") {
      console.log(
        "[API] Отправляем данные:",
        JSON.stringify(config.data, null, 2)
      );
      console.log(
        "[API] Типы данных:",
        Object.keys(config.data).reduce((acc, key) => {
          const value = config.data[key];
          acc[key] = value instanceof Date ? "Date" : typeof value;
          return acc;
        }, {} as Record<string, string>)
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
