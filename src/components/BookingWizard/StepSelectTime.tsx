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
        // Форматируем дату в YYYY-MM-DD
        const dateStr = localDate.toISOString().split("T")[0];

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
      } catch (error) {
        console.error("Ошибка загрузки временных слотов:", error);
        setSlotsError("Не удалось загрузить доступное время");
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
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Выберите дату и время
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
          Выберите удобную дату и время для записи
        </Typography>

        {/* Выбранные услуги */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Выбранные услуги
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
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
            <Typography variant="body2" color="text.secondary">
              Общее время: {formatDuration(getTotalDuration())}
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          {/* Выбор даты */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CalendarIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                      helperText: "Выберите дату не ранее завтрашнего дня",
                    },
                  }}
                />

                {localDate && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: "primary.light",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="primary.contrastText">
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
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <TimeIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Выберите время
                  </Typography>
                </Box>

                {loadingSlots ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 3 }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : slotsError ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {slotsError}
                  </Alert>
                ) : availableSlots.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2 }}
                  >
                    Нет доступного времени на выбранную дату
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
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
                      mt: 2,
                      p: 2,
                      bgcolor: "primary.light",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="primary.contrastText">
                      Выбрано: {localTime}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Навигация */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onBack}
            sx={{ textTransform: "none" }}
          >
            Назад
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!localDate || !localTime}
            sx={{ textTransform: "none", px: 4 }}
          >
            Продолжить
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};
