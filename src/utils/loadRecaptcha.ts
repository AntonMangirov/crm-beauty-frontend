/**
 * Загружает скрипт Google reCAPTCHA v3 динамически
 */

export function loadRecaptchaScript(): void {
  // Проверяем, не загружен ли уже скрипт
  if (document.getElementById('recaptcha-script')) {
    return;
  }

  const siteKey =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
    '6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

  // Если site key не установлен или это тестовый ключ, не загружаем скрипт
  if (!siteKey || siteKey.includes('XXXX')) {
    console.warn('[reCAPTCHA] Site key не установлен, reCAPTCHA не будет загружена');
    return;
  }

  const script = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

