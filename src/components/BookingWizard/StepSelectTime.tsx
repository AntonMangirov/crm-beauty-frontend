import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ru } from "date-fns/locale";
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import type { Service } from "../../api/masters";
import { mastersApi } from "../../api/masters";

interface StepSelectTimeProps {
  masterSlug: string;
  selectedServices: Service[];
  selectedDate: Date | null;
  selectedTime: string;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepSelectTime: React.FC<StepSelectTimeProps> = ({
  masterSlug,
  selectedServices,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  onNext,
  onBack,
}) => {
  const [localDate, setLocalDate] = useState<Date | null>(selectedDate);
  const [localTime, setLocalTime] = useState<string>(selectedTime);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const handleDateChange = (date: Date | null) => {
    setLocalDate(date);
    onDateChange(date);
    setLocalTime(""); // Сбрасываем выбранное время при смене даты
    onTimeChange("");
  };

  const handleTimeChange = (time: string) => {
    setLocalTime(time);
    onTimeChange(time);
  };

  const handleNext = () => {
    if (localDate && localTime) {
      onNext();
    }
  };

  // Загружаем доступные слоты при изменении даты или услуг
  useEffect(() => {
    if (!localDate) {
      setAvailableSlots([]);
      return;
    }

    const loadTimeslots = async () => {
      setLoadingSlots(true);
      setSlotsError(null);

      try {
        // Форматируем дату в YYYY-MM-DD (используем локальные компоненты даты)
        // toISOString() может дать неправильную дату из-за часового пояса
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        const day = String(localDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        // Используем первую выбранную услугу для учёта длительности
        const serviceId =
          selectedServices.length > 0 ? selectedServices[0].id : undefined;

        const response = await mastersApi.getTimeslots(
          masterSlug,
          dateStr,
          serviceId
        );

        // Преобразуем ISO строки в формат HH:MM для отображения
        const formattedSlots = response.available.map((isoString) => {
          const date = new Date(isoString);
          const hours = date.getUTCHours().toString().padStart(2, "0");
          const minutes = date.getUTCMinutes().toString().padStart(2, "0");
          return `${hours}:${minutes}`;
        });

        setAvailableSlots(formattedSlots);
      } catch (error: unknown) {
        console.error("Ошибка загрузки временных слотов:", error);
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as {
            response?: { status?: number; data?: unknown };
            message?: string;
          };
          console.error("Детали ошибки:", {
            status: axiosError.response?.status,
            data: axiosError.response?.data,
            message: axiosError.message,
          });
        }

        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Не удалось загрузить доступное время";
        setSlotsError(errorMessage);
        // Fallback к хардкоду в случае ошибки
        const fallbackSlots = [];
        for (let hour = 9; hour <= 18; hour++) {
          fallbackSlots.push(`${hour.toString().padStart(2, "0")}:00`);
        }
        setAvailableSlots(fallbackSlots);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadTimeslots();
  }, [localDate, masterSlug, selectedServices]);

  const getTotalDuration = () => {
    return selectedServices.reduce(
      (total, service) => total + service.durationMin,
      0
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
    }
    return `${mins}м`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Box>
        <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600 }}>
          Выберите дату и время
        </Typography>

        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Выберите удобную дату и время для записи
        </Typography>

        {/* Выбранные услуги */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Выбранные услуги
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
              {selectedServices.map((service) => (
                <Chip
                  key={service.id}
                  label={service.name}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Общее время: {formatDuration(getTotalDuration())}
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {/* Выбор даты */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                  <CalendarIcon
                    sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Выберите дату
                  </Typography>
                </Box>

                <DatePicker
                  label="Дата записи"
                  value={localDate}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      helperText: "Выберите дату не ранее завтрашнего дня",
                    },
                  }}
                />

                {localDate && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1,
                      bgcolor: "primary.light",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" color="primary.contrastText">
                      Выбрано: {formatDate(localDate)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Выбор времени */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                  <TimeIcon
                    sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Выберите время
                  </Typography>
                </Box>

                {loadingSlots ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 2 }}
                  >
                    <CircularProgress size={20} />
                  </Box>
                ) : slotsError ? (
                  <Alert severity="warning" sx={{ mb: 1, py: 0.5 }}>
                    {slotsError}
                  </Alert>
                ) : availableSlots.length === 0 ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ py: 1, display: "block" }}
                  >
                    Нет доступного времени на выбранную дату
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {availableSlots.map((time) => (
                      <Button
                        key={time}
                        variant={localTime === time ? "contained" : "outlined"}
                        size="small"
                        onClick={() => handleTimeChange(time)}
                        sx={{
                          minWidth: 80,
                          textTransform: "none",
                        }}
                      >
                        {time}
                      </Button>
                    ))}
                  </Box>
                )}

                {localTime && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1,
                      bgcolor: "primary.light",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" color="primary.contrastText">
                      Выбрано: {localTime}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Навигация */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button
            variant="outlined"
            size="medium"
            onClick={onBack}
            sx={{ textTransform: "none" }}
          >
            Назад
          </Button>

          <Button
            variant="contained"
            size="medium"
            onClick={handleNext}
            disabled={!localDate || !localTime}
            sx={{ textTransform: "none", px: 3 }}
          >
            Продолжить
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};
