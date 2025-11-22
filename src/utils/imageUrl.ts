/**
 * Нормализует URL изображения
 * Если URL относительный (начинается с /uploads/), добавляет базовый URL API
 */
export function normalizeImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  // Если это полный URL (http/https или cloudinary), возвращаем как есть
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Если это относительный путь (например /uploads/...), добавляем базовый URL API
  if (url.startsWith('/')) {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${API_BASE_URL}${url}`;
  }
  
  return url;
}


