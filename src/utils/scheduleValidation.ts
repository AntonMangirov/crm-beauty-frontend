import type {
  DaySchedule,
  Break,
  WorkInterval,
  MasterSchedule,
} from "../types/schedule";

/**
 * Проверка формата времени HH:mm
 */
export const isValidTimeFormat = (time: string): boolean => {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

/**
 * Преобразование времени в минуты для сравнения
 */
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Проверка, что интервалы не пересекаются
 */
export const validateIntervals = (
  intervals: WorkInterval[]
): { valid: boolean; error?: string } => {
  if (intervals.length === 0) {
    return { valid: false, error: "Должен быть хотя бы один интервал" };
  }

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];

    // Проверка формата времени
    if (!isValidTimeFormat(interval.from)) {
      return { valid: false, error: "Неверный формат времени начала" };
    }
    if (!isValidTimeFormat(interval.to)) {
      return { valid: false, error: "Неверный формат времени окончания" };
    }

    const fromTime = timeToMinutes(interval.from);
    const toTime = timeToMinutes(interval.to);

    // Проверка: from < to
    if (fromTime >= toTime) {
      return {
        valid: false,
        error: "Время начала должно быть меньше времени окончания",
      };
    }

    // Проверка пересечений с другими интервалами
    for (let j = i + 1; j < intervals.length; j++) {
      const otherInterval = intervals[j];
      const otherFromTime = timeToMinutes(otherInterval.from);
      const otherToTime = timeToMinutes(otherInterval.to);

      // Интервалы пересекаются если: from1 < to2 && from2 < to1
      if (fromTime < otherToTime && otherFromTime < toTime) {
        return { valid: false, error: "Интервалы не должны пересекаться" };
      }
    }
  }

  return { valid: true };
};

/**
 * Проверка перерывов
 */
export const validateBreaks = (
  breaks: Break[],
  workSchedule: DaySchedule[] | null
): { valid: boolean; error?: string } => {
  if (!breaks || breaks.length === 0) {
    return { valid: true };
  }

  if (!workSchedule || workSchedule.length === 0) {
    return {
      valid: false,
      error: "Сначала настройте рабочие дни для перерывов",
    };
  }

  // Создаём карту всех рабочих интервалов
  const allWorkIntervals: Array<{ from: number; to: number }> = [];
  workSchedule.forEach((daySchedule) => {
    daySchedule.intervals.forEach((interval) => {
      allWorkIntervals.push({
        from: timeToMinutes(interval.from),
        to: timeToMinutes(interval.to),
      });
    });
  });

  for (let i = 0; i < breaks.length; i++) {
    const breakItem = breaks[i];

    // Проверка формата времени
    if (!isValidTimeFormat(breakItem.from)) {
      return { valid: false, error: "Неверный формат времени начала перерыва" };
    }
    if (!isValidTimeFormat(breakItem.to)) {
      return {
        valid: false,
        error: "Неверный формат времени окончания перерыва",
      };
    }

    const breakFromTime = timeToMinutes(breakItem.from);
    const breakToTime = timeToMinutes(breakItem.to);

    // Проверка: from < to
    if (breakFromTime >= breakToTime) {
      return {
        valid: false,
        error: "Время начала перерыва должно быть меньше времени окончания",
      };
    }

    // Проверка пересечений с другими перерывами
    for (let j = i + 1; j < breaks.length; j++) {
      const otherBreak = breaks[j];
      const otherFromTime = timeToMinutes(otherBreak.from);
      const otherToTime = timeToMinutes(otherBreak.to);

      // Перерывы пересекаются если: from1 < to2 && from2 < to1
      if (breakFromTime < otherToTime && otherFromTime < breakToTime) {
        return { valid: false, error: "Перерывы не должны пересекаться" };
      }
    }

    // Проверка, что перерыв находится внутри хотя бы одного рабочего интервала
    let foundInWorkInterval = false;
    for (const workInterval of allWorkIntervals) {
      // Перерыв находится внутри интервала если
      // breakFrom >= intervalFrom && breakTo <= intervalTo
      if (
        breakFromTime >= workInterval.from &&
        breakToTime <= workInterval.to
      ) {
        foundInWorkInterval = true;
        break;
      }
    }

    if (!foundInWorkInterval) {
      return {
        valid: false,
        error: `Перерыв ${breakItem.from}-${breakItem.to} должен находиться внутри рабочего интервала`,
      };
    }
  }

  return { valid: true };
};

/**
 * Полная валидация расписания
 */
export const validateSchedule = (
  schedule: MasterSchedule
): { valid: boolean; error?: string } => {
  // Проверка рабочих дней
  if (!schedule.workSchedule || schedule.workSchedule.length === 0) {
    return {
      valid: false,
      error: "Выберите хотя бы один рабочий день",
    };
  }

  // Проверка каждого рабочего дня
  for (const daySchedule of schedule.workSchedule) {
    const intervalsValidation = validateIntervals(daySchedule.intervals);
    if (!intervalsValidation.valid) {
      return {
        valid: false,
        error: `Ошибка в расписании дня недели ${daySchedule.dayOfWeek}: ${intervalsValidation.error}`,
      };
    }
  }

  // Проверка перерывов
  if (schedule.breaks && schedule.breaks.length > 0) {
    const breaksValidation = validateBreaks(schedule.breaks, schedule.workSchedule);
    if (!breaksValidation.valid) {
      return breaksValidation;
    }
  }

  // Проверка буфера
  if (schedule.defaultBufferMinutes !== null) {
    if (
      schedule.defaultBufferMinutes < 10 ||
      schedule.defaultBufferMinutes > 30
    ) {
      return {
        valid: false,
        error: "Буфер должен быть от 10 до 30 минут",
      };
    }
  }

  // Проверка шага слотов
  if (schedule.slotStepMinutes !== null) {
    if (![5, 10, 15].includes(schedule.slotStepMinutes)) {
      return {
        valid: false,
        error: "Шаг слотов должен быть 5, 10 или 15 минут",
      };
    }
  }

  return { valid: true };
};









