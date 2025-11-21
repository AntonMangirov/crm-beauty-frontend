## CRM Beauty Frontend — Документация

### Назначение

SPA для клиентов и мастеров: просмотр профилей мастеров, выбор услуг, запись, личная панель.

### Технологии

- React + TypeScript
- Vite
- MUI (тема/компоненты)
- Axios для запросов к бэкенду
- Leaflet + react-leaflet для карт (OpenStreetMap)
- React Router для навигации
- React Hook Form для форм
- Google reCAPTCHA v3 для защиты от ботов

### Структура

- `src/app/App.tsx` — корневой компонент
- `src/pages/*` — страницы (Dashboard, MasterPage, BookingSuccess и т.д.)
- `src/components/*` — UI-компоненты (в т.ч. `BookingWizard`)
- `src/api/*` — обёртки над HTTP API

### Основной функционал

- Просмотр мастеров и их профилей
- Карта с местоположением мастера (Leaflet)
- Выбор услуги и времени, оформление записи через визард
- Уведомления о статусах действий (Snackbar)

### Компоненты

- `components/MasterProfile.tsx` — страница профиля мастера с фото, описанием, услугами и картой
- `components/LocationMap.tsx` — компонент карты на основе Leaflet для отображения местоположения мастера
- `components/BookingWizard/` — пошаговый визард записи (выбор услуги, времени, контакты)
- `components/ServiceCard.tsx` — карточка услуги

### API-слой (клиент)

- `src/api/masters.ts` — запросы мастеров / профилей
- `src/api/services.ts` — запросы услуг
- `src/api/index.ts` — базовая конфигурация клиента

Для приватных запросов (например, список встреч мастера) требуется передавать JWT токен в `Authorization: Bearer <token>`.

### Утилиты

- `src/utils/recaptcha.ts` — получение токена Google reCAPTCHA v3
- `src/utils/loadRecaptcha.ts` — динамическая загрузка скрипта reCAPTCHA

### Переменные окружения

Создайте файл `.env` на основе `.env.example`:

- `VITE_API_URL` — URL бэкенда (по умолчанию `http://localhost:3000`)
- `VITE_RECAPTCHA_SITE_KEY` — Site Key для Google reCAPTCHA v3 (получите на https://www.google.com/recaptcha/admin)

**Примечание:** В режиме разработки, если `VITE_RECAPTCHA_SITE_KEY` не установлен, reCAPTCHA токен не будет отправляться, и бэкенд может пропустить проверку (если настроено).

### Встречи (Appointments)

Эндпоинт на бэкенде:

- `GET /api/appointments?dateFrom&dateTo` — возвращает список встреч текущего мастера по токену

Рекомендуемый вызов (пример):

```ts
const res = await fetch(
  `/api/appointments?dateFrom=${encodeURIComponent(
    dateFrom
  )}&dateTo=${encodeURIComponent(dateTo)}`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
const data = await res.json();
```

### Сборка и запуск

- `npm run dev` — разработка
- `npm run build` — сборка
- `npm run preview` — предпросмотр
