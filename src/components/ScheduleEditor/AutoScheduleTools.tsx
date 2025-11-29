import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Collapse,
  Grid,
  IconButton,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Work as WorkIcon,
  EventBusy as EventBusyIcon,
  EventAvailable as EventAvailableIcon,
  CalendarToday as CalendarIcon,
  FlightTakeoff as VacationIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ru } from "date-fns/locale";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from "date-fns";
import type { DaySchedule, WorkInterval } from "../../types/schedule";

interface AutoScheduleToolsProps {
  workSchedule: DaySchedule[] | null;
  onChange: (workSchedule: DaySchedule[] | null) => void;
}

const DEFAULT_INTERVAL: WorkInterval = { from: "09:00", to: "18:00" };

export const AutoScheduleTools: React.FC<AutoScheduleToolsProps> = ({
  workSchedule,
  onChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [vacationStart, setVacationStart] = useState<Date | null>(null);
  const [vacationEnd, setVacationEnd] = useState<Date | null>(null);

  const getFirstWorkingDayIntervals = (): WorkInterval[] => {
    if (!workSchedule || workSchedule.length === 0) {
      return [DEFAULT_INTERVAL];
    }
    // Находим первый рабочий день и копируем его интервалы
    const firstDay = workSchedule[0];
    return firstDay.intervals.length > 0
      ? firstDay.intervals
      : [DEFAULT_INTERVAL];
  };

  const updateWorkSchedule = (
    daysToSet: number[],
    intervals: WorkInterval[]
  ) => {
    const currentSchedule = workSchedule || [];
    const newSchedule: DaySchedule[] = [];

    // Создаём карту существующих дней
    const existingDaysMap = new Map<number, DaySchedule>();
    currentSchedule.forEach((day) => {
      existingDaysMap.set(day.dayOfWeek, day);
    });

    // Обновляем или добавляем указанные дни
    daysToSet.forEach((dayOfWeek) => {
      newSchedule.push({
        dayOfWeek,
        intervals: [...intervals],
      });
    });

    // Добавляем остальные дни, которые не были изменены
    currentSchedule.forEach((day) => {
      if (!daysToSet.includes(day.dayOfWeek)) {
        newSchedule.push(day);
      }
    });

    onChange(newSchedule.length > 0 ? newSchedule : null);
  };

  const handleWeekdays = () => {
    // Понедельник (1) - Пятница (5)
    const weekdays = [1, 2, 3, 4, 5];
    const intervals = getFirstWorkingDayIntervals();
    updateWorkSchedule(weekdays, intervals);
  };

  const handleAllDays = () => {
    // Все дни недели: 0 (воскресенье) - 6 (суббота)
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    const intervals = getFirstWorkingDayIntervals();
    updateWorkSchedule(allDays, intervals);
  };

  const handleAllWeekends = () => {
    // Очищаем все рабочие дни
    onChange(null);
  };

  const handleAddDaysAfterDate = () => {
    if (!startDate) return;

    const intervals = getFirstWorkingDayIntervals();
    const currentSchedule = workSchedule || [];
    const newSchedule: DaySchedule[] = [...currentSchedule];

    // Получаем день недели выбранной даты
    const startDayOfWeek = getDay(startDate); // 0 = воскресенье, 1 = понедельник, ...

    // Добавляем все дни начиная с выбранного дня недели до конца недели
    const daysToAdd: number[] = [];
    for (let i = startDayOfWeek; i <= 6; i++) {
      daysToAdd.push(i);
    }

    // Обновляем или добавляем дни
    daysToAdd.forEach((dayOfWeek) => {
      const existingIndex = newSchedule.findIndex(
        (day) => day.dayOfWeek === dayOfWeek
      );
      if (existingIndex >= 0) {
        newSchedule[existingIndex] = {
          dayOfWeek,
          intervals: [...intervals],
        };
      } else {
        newSchedule.push({
          dayOfWeek,
          intervals: [...intervals],
        });
      }
    });

    onChange(newSchedule.length > 0 ? newSchedule : null);
    setStartDate(null);
  };

  const handleVacation = () => {
    if (!vacationStart || !vacationEnd) return;

    const currentSchedule = workSchedule || [];
    const newSchedule: DaySchedule[] = [];

    // Получаем все дни в диапазоне отпуска
    const vacationDays = eachDayOfInterval({
      start: vacationStart,
      end: vacationEnd,
    });

    // Создаём Set дней недели, которые попадают в отпуск
    const vacationDaysOfWeek = new Set<number>();
    vacationDays.forEach((date) => {
      vacationDaysOfWeek.add(getDay(date));
    });

    // Удаляем рабочие дни, которые попадают в отпуск
    currentSchedule.forEach((day) => {
      if (!vacationDaysOfWeek.has(day.dayOfWeek)) {
        newSchedule.push(day);
      }
    });

    onChange(newSchedule.length > 0 ? newSchedule : null);
    setVacationStart(null);
    setVacationEnd(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "1rem", sm: "1.125rem" },
              }}
            >
              Умное управление расписанием
            </Typography>
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
              sx={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Быстрые действия */}
          <Grid container spacing={1.5} sx={{ mb: expanded ? 2 : 0 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<WorkIcon />}
                onClick={handleWeekdays}
                size="small"
              >
                Будние дни (Пн–Пт)
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<EventAvailableIcon />}
                onClick={handleAllDays}
                size="small"
              >
                Все дни
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<EventBusyIcon />}
                onClick={handleAllWeekends}
                size="small"
                color="error"
              >
                Все выходные
              </Button>
            </Grid>
          </Grid>

          {/* Расширенные функции */}
          <Collapse in={expanded}>
            <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Расширенные функции
              </Typography>

              {/* Добавить дни после даты */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500 }}
                >
                  Добавить рабочие дни после даты
                </Typography>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      label="Начальная дата"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<CalendarIcon />}
                      onClick={handleAddDaysAfterDate}
                      disabled={!startDate}
                      size="small"
                    >
                      Применить
                    </Button>
                  </Grid>
                </Grid>
                {startDate && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    Будут активированы все дни недели начиная с{" "}
                    {format(startDate, "EEEE", { locale: ru })}
                  </Typography>
                )}
              </Box>

              {/* Отпуск */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500 }}
                >
                  Отпуск (отключить дни в диапазоне)
                </Typography>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DatePicker
                      label="От"
                      value={vacationStart}
                      onChange={(newValue) => setVacationStart(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DatePicker
                      label="До"
                      value={vacationEnd}
                      onChange={(newValue) => setVacationEnd(newValue)}
                      minDate={vacationStart || undefined}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<VacationIcon />}
                      onClick={handleVacation}
                      disabled={!vacationStart || !vacationEnd}
                      size="small"
                      color="warning"
                    >
                      Установить отпуск
                    </Button>
                  </Grid>
                </Grid>
                {vacationStart && vacationEnd && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    Будут отключены все рабочие дни в диапазоне с{" "}
                    {format(vacationStart, "dd.MM.yyyy")} по{" "}
                    {format(vacationEnd, "dd.MM.yyyy")}
                  </Typography>
                )}
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};


