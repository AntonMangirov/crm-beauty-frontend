/**
 * Утилита для работы с Google reCAPTCHA v3
 */

import { loadRecaptchaScript } from './loadRecaptcha';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

/**
 * Получает токен reCAPTCHA v3
 * @param action - действие для токена (например, 'booking')
 * @returns Promise с токеном или null если reCAPTCHA не загружена
 */
export async function getRecaptchaToken(
  action: string = 'booking'
): Promise<string | null> {
  // Загружаем скрипт если ещё не загружен
  loadRecaptchaScript();

  // Получаем site key из переменных окружения
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Если site key не установлен, возвращаем null
  // В dev режиме бэкенд может пропускать проверку
  if (!siteKey || siteKey.includes('XXXX')) {
    if (import.meta.env.MODE === 'development') {
      console.warn(
        '[reCAPTCHA] Site key не установлен, пропускаем проверку (dev режим)'
      );
    }
    return null;
  }

  // Ждём загрузки grecaptcha
  if (!window.grecaptcha) {
    // Ждём до 5 секунд
    await new Promise<void>((resolve) => {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        if (window.grecaptcha || attempts >= 50) {
          clearInterval(checkInterval);
          resolve();
        }
        attempts++;
      }, 100);
    });

    if (!window.grecaptcha) {
      console.error('[reCAPTCHA] grecaptcha не загружен после ожидания');
      return null;
    }
  }

  try {
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action })
          .then((token) => {
            resolve(token);
          })
          .catch((error) => {
            console.error('[reCAPTCHA] Ошибка получения токена:', error);
            reject(error);
          });
      });
    });
  } catch (error) {
    console.error('[reCAPTCHA] Ошибка:', error);
    return null;
  }
}

