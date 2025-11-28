# Пример отправки формы расписания и обработки ошибок

## Структура валидации

### Helper-функции (`src/utils/scheduleValidation.ts`)

1. **`validateIntervals(intervals)`** - проверяет интервалы рабочего дня
   - Формат времени (HH:mm)
   - from < to
   - Нет пересечений интервалов

2. **`validateBreaks(breaks, workSchedule)`** - проверяет перерывы
   - Формат времени (HH:mm)
   - from < to
   - Нет пересечений перерывов
   - Перерывы находятся внутри рабочих интервалов

3. **`validateSchedule(schedule)`** - полная валидация расписания
   - Проверяет все рабочие дни через `validateIntervals`
   - Проверяет перерывы через `validateBreaks`
   - Проверяет буфер (10-30 минут)
   - Проверяет шаг слотов (5/10/15 минут)

## Пример отправки формы

```typescript
const handleSave = async () => {
  // 1. Проверка наличия данных
  if (!schedule) {
    showSnackbar("Нет данных для сохранения", "error");
    return;
  }

  // 2. Валидация перед отправкой
  const validation = validateScheduleData(schedule);
  if (!validation.valid) {
    setValidationError(validation.error || "Ошибка валидации");
    showSnackbar(validation.error || "Исправьте ошибки в расписании", "error");
    return;
  }

  // 3. Очистка ошибок валидации
  setValidationError(null);

  try {
    setSaving(true);

    // 4. Формирование данных для отправки
    const updateData: UpdateScheduleRequest = {};

    if (schedule.workSchedule && schedule.workSchedule.length > 0) {
      updateData.workSchedule = schedule.workSchedule;
    }

    if (schedule.breaks && schedule.breaks.length > 0) {
      updateData.breaks = schedule.breaks;
    }

    if (schedule.defaultBufferMinutes !== null) {
      updateData.defaultBufferMinutes = schedule.defaultBufferMinutes;
    }

    if (schedule.slotStepMinutes !== null) {
      updateData.slotStepMinutes = schedule.slotStepMinutes as 5 | 10 | 15;
    }

    // 5. Отправка на API
    const response = await meApi.updateSchedule(updateData);

    // 6. Успешное сохранение
    showSnackbar(
      response.message || "Расписание успешно сохранено",
      "success"
    );

    // 7. Обновление локального состояния данными с сервера
    if (response.schedule) {
      setSchedule(response.schedule);
    }
  } catch (err: unknown) {
    // 8. Обработка ошибок
    console.error("Ошибка сохранения расписания:", err);

    const axiosError = err as {
      response?: {
        status?: number;
        data?: {
          message?: string;
          error?: string;
          details?: unknown;
        };
      };
      message?: string;
    };

    let errorMessage = "Не удалось сохранить расписание";

    if (axiosError.response) {
      const { status, data } = axiosError.response;

      // Обработка ошибок валидации от бэкенда (400)
      if (status === 400) {
        errorMessage =
          data?.message ||
          data?.error ||
          "Ошибка валидации данных. Проверьте правильность заполнения полей.";
        
        if (data?.details) {
          console.error("Детали ошибки валидации:", data.details);
        }
      }
      // Обработка ошибок авторизации (401)
      else if (status === 401) {
        errorMessage = "Сессия истекла. Пожалуйста, войдите заново.";
      }
      // Обработка ошибок сервера (500)
      else if (status >= 500) {
        errorMessage = "Ошибка сервера. Попробуйте позже.";
      }
      // Другие ошибки
      else {
        errorMessage =
          data?.message || data?.error || `Ошибка ${status}`;
      }
    } else if (axiosError.message) {
      errorMessage = axiosError.message;
    }

    // 9. Отображение ошибки
    setValidationError(errorMessage);
    showSnackbar(errorMessage, "error");
  } finally {
    // 10. Сброс состояния загрузки
    setSaving(false);
  }
};
```

## Обработка различных типов ошибок

### 400 - Ошибка валидации
- Показывается сообщение из `data.message` или `data.error`
- Детали ошибки логируются в консоль
- Пользователю показывается понятное сообщение

### 401 - Не авторизован
- Показывается сообщение о необходимости повторного входа
- Можно добавить редирект на страницу входа

### 500+ - Ошибка сервера
- Показывается общее сообщение об ошибке сервера
- Предлагается попробовать позже

### Другие ошибки
- Показывается сообщение из ответа или код ошибки
- Ошибка отображается через Snackbar и Alert

## Валидация перед отправкой

Все проверки выполняются на фронтенде перед отправкой:

1. ✅ Формат времени (HH:mm) для всех интервалов и перерывов
2. ✅ Нет пересечений интервалов в рамках одного дня
3. ✅ Нет пересечений перерывов между собой
4. ✅ Перерывы находятся внутри рабочих интервалов
5. ✅ У рабочих дней есть хотя бы один интервал
6. ✅ Буфер в диапазоне 10-30 минут
7. ✅ Шаг слотов: 5, 10 или 15 минут

## Структура страницы

Страница разбита на секции с использованием MUI Stack:

1. **Быстрая настройка** - AutoScheduleTools
2. **Рабочие дни недели** - DayScheduleCard для каждого дня
3. **Перерывы** - BreaksEditor
4. **Настройки слотов** - SlotSettings

Между секциями используются Divider для визуального разделения.

