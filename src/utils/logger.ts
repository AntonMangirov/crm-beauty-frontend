/**
 * Production-ready утилита для логирования
 * 
 * Особенности:
 * - В dev режиме использует console с форматированием для удобства разработки
 * - В production использует структурированное логирование (JSON формат)
 * - Оставляет только info/warn/error (без debug/trace)
 * - При ошибках выводит stack trace только в dev режиме
 * - В production логирует структурированно (JSON формат) для удобства парсинга
 * 
 * Использование:
 * ```typescript
 * import { logInfo, logWarn, logError } from './utils/logger';
 * 
 * logInfo('Пользователь залогинился', { userId: '123' });
 * logWarn('Медленный запрос', { duration: 5000 });
 * logError('Ошибка загрузки данных', error, { context: 'userProfile' });
 * ```
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Структурированное логирование через console
 */
function logStructured(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>
): void {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // В production выводим как JSON для структурированного логирования
  const logString = JSON.stringify(logEntry);
  
  switch (level) {
    case 'info':
      console.info(logString);
      break;
    case 'warn':
      console.warn(logString);
      break;
    case 'error':
      console.error(logString);
      break;
  }
}

/**
 * Логирует информационное сообщение
 * 
 * @param message - Текст сообщения
 * @param args - Дополнительные данные для логирования
 * 
 * @example
 * logInfo('Пользователь залогинился', { userId: '123', email: 'user@example.com' });
 */
export function logInfo(message: string, ...args: unknown[]): void {
  if (isDev) {
    console.info(`[INFO] ${message}`, ...args);
  } else {
    const data: Record<string, unknown> = {};
    if (args.length > 0) {
      data.args = args;
    }
    logStructured('info', message, data);
  }
}

/**
 * Логирует предупреждение
 * 
 * @param message - Текст сообщения
 * @param args - Дополнительные данные для логирования
 * 
 * @example
 * logWarn('Медленный запрос', { duration: 5000, endpoint: '/api/users' });
 */
export function logWarn(message: string, ...args: unknown[]): void {
  if (isDev) {
    console.warn(`[WARN] ${message}`, ...args);
  } else {
    const data: Record<string, unknown> = {};
    if (args.length > 0) {
      data.args = args;
    }
    logStructured('warn', message, data);
  }
}

/**
 * Логирует ошибку
 * В dev режиме выводит полный stack trace, в production - только сообщение
 * 
 * @param message - Текст сообщения об ошибке
 * @param error - Объект ошибки (Error или другой тип)
 * @param args - Дополнительные данные для логирования
 * 
 * @example
 * try {
 *   await fetchData();
 * } catch (error) {
 *   logError('Ошибка загрузки данных', error, { context: 'userProfile', userId: '123' });
 * }
 */
export function logError(message: string, error?: unknown, ...args: unknown[]): void {
  if (isDev) {
    // В dev режиме выводим полный stack trace
    console.error(`[ERROR] ${message}`, error, ...args);
  } else {
    // В production используем структурированное логирование без stack trace
    const errorData: Record<string, unknown> = {};

    if (error instanceof Error) {
      errorData.error = {
        message: error.message,
        name: error.name,
        // В production не включаем stack trace для безопасности
      };
    } else if (error) {
      errorData.error = {
        message: String(error),
      };
    }

    if (args.length > 0) {
      errorData.args = args;
    }

    logStructured('error', message, errorData);
  }
}

/**
 * Получает logger instance (для расширенного использования)
 * Возвращает console-based logger
 * 
 * @example
 * import { logger } from './utils/logger';
 * logger.info({ userId: '123' }, 'Пользователь залогинился');
 */
export function getLogger() {
  return {
    info: (data: any, msg: string) => logStructured('info', msg, data),
    warn: (data: any, msg: string) => logStructured('warn', msg, data),
    error: (data: any, msg: string) => logStructured('error', msg, data),
  };
}

// Экспортируем logger для расширенного использования
export const logger = getLogger();
