export interface WorkInterval {
  from: string; // "HH:mm"
  to: string; // "HH:mm"
}

export interface DaySchedule {
  dayOfWeek: number; // 0-6 (0 = воскресенье, 1 = понедельник, ...)
  intervals: WorkInterval[];
}

export interface Break {
  from: string; // "HH:mm"
  to: string; // "HH:mm"
  reason?: string;
}

export interface MasterSchedule {
  workSchedule: DaySchedule[] | null;
  breaks: Break[] | null;
  defaultBufferMinutes: number | null;
  slotStepMinutes: number | null;
}

export interface UpdateScheduleRequest {
  workSchedule?: DaySchedule[];
  breaks?: Break[];
  defaultBufferMinutes?: number;
  slotStepMinutes?: 5 | 10 | 15;
}

export interface UpdateScheduleResponse {
  success: boolean;
  message: string;
  schedule: MasterSchedule;
}



