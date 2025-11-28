import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { meApi } from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";
import { DayScheduleCard } from "../../components/ScheduleEditor/DayScheduleCard";
import { BreaksEditor } from "../../components/ScheduleEditor/BreaksEditor";
import { SlotSettings } from "../../components/ScheduleEditor/SlotSettings";
import { AutoScheduleTools } from "../../components/ScheduleEditor/AutoScheduleTools";
import { validateSchedule as validateScheduleData } from "../../utils/scheduleValidation";
import type {
  MasterSchedule,
  UpdateScheduleRequest,
  DaySchedule,
  Break,
} from "../../types/schedule";

export const SchedulePage: React.FC = () => {
  const [schedule, setSchedule] = useState<MasterSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const response = await meApi.getSchedule();
      setSchedule(response.schedule);
    } catch (err: unknown) {
      console.error("Ошибка загрузки расписания:", err);
      
      // Если эндпоинт не найден (404), инициализируем пустое расписание
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        // Инициализируем пустое расписание для возможности создания нового
        setSchedule({
          workSchedule: null,
          breaks: null,
          defaultBufferMinutes: null,
          slotStepMinutes: null,
        });
        // Не показываем ошибку, так как это нормальная ситуация для нового пользователя
      } else {
        showSnackbar("Не удалось загрузить расписание", "error");
        // В случае другой ошибки тоже инициализируем пустое расписание
        setSchedule({
          workSchedule: null,
          breaks: null,
          defaultBufferMinutes: null,
          slotStepMinutes: null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDayScheduleChange = (
    dayOfWeek: number,
    daySchedule: DaySchedule | null
  ) => {
    if (!schedule) return;

    const currentWorkSchedule = schedule.workSchedule || [];
    let newWorkSchedule: DaySchedule[];

    if (daySchedule === null) {
      // Удаляем день из расписания
      newWorkSchedule = currentWorkSchedule.filter(
        (day) => day.dayOfWeek !== dayOfWeek
      );
    } else {
      // Обновляем или добавляем день
      const existingIndex = currentWorkSchedule.findIndex(
        (day) => day.dayOfWeek === dayOfWeek
      );

      if (existingIndex >= 0) {
        // Обновляем существующий день
        newWorkSchedule = [...currentWorkSchedule];
        newWorkSchedule[existingIndex] = daySchedule;
      } else {
        // Добавляем новый день
        newWorkSchedule = [...currentWorkSchedule, daySchedule];
      }
    }

    setSchedule({
      ...schedule,
      workSchedule: newWorkSchedule.length > 0 ? newWorkSchedule : null,
    });
    // Очищаем ошибку валидации при изменении
    setValidationError(null);
  };

  const getDaySchedule = (dayOfWeek: number): DaySchedule | null => {
    if (!schedule || !schedule.workSchedule) return null;
    return (
      schedule.workSchedule.find((day) => day.dayOfWeek === dayOfWeek) || null
    );
  };

  const handleBreaksChange = (newBreaks: Break[] | null) => {
    if (!schedule) return;

    setSchedule({
      ...schedule,
      breaks: newBreaks,
    });
    // Очищаем ошибку валидации при изменении
    setValidationError(null);
  };

  const handleSlotSettingsChange = (settings: {
    defaultBufferMinutes: number | null;
    slotStepMinutes: number | null;
  }) => {
    if (!schedule) return;

    setSchedule({
      ...schedule,
      defaultBufferMinutes: settings.defaultBufferMinutes,
      slotStepMinutes: settings.slotStepMinutes,
    });
    // Очищаем ошибку валидации при изменении
    setValidationError(null);
  };

  const handleWorkScheduleChange = (newWorkSchedule: DaySchedule[] | null) => {
    if (!schedule) return;

    setSchedule({
      ...schedule,
      workSchedule: newWorkSchedule,
    });
    // Очищаем ошибку валидации при изменении
    setValidationError(null);
  };

  const handleSave = async () => {
    if (!schedule) {
      showSnackbar("Нет данных для сохранения", "error");
      return;
    }

    // Валидация перед отправкой
    const validation = validateScheduleData(schedule);
    if (!validation.valid) {
      setValidationError(validation.error || "Ошибка валидации");
      showSnackbar(validation.error || "Исправьте ошибки в расписании", "error");
      return;
    }

    // Очищаем ошибку валидации перед отправкой
    setValidationError(null);

    try {
      setSaving(true);

      // Формируем данные для отправки
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

      // Отправка на API
      const response = await meApi.updateSchedule(updateData);

      // Успешное сохранение
      showSnackbar(
        response.message || "Расписание успешно сохранено",
        "success"
      );

      // Обновляем локальное состояние данными с сервера (на случай нормализации на бэкенде)
      if (response.schedule) {
        setSchedule(response.schedule);
      }
    } catch (err: unknown) {
      console.error("Ошибка сохранения расписания:", err);

      // Обработка различных типов ошибок
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
          
          // Если есть детали ошибки, показываем их
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

      setValidationError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 2.5 } }}>
        {/* Заголовок */}
        <Typography
          variant="h4"
          sx={{
            mb: { xs: 2, sm: 3 },
            fontWeight: 600,
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          Расписание работы
        </Typography>

        {schedule && (
          <Stack spacing={3}>
            {/* Ошибка валидации */}
            {validationError && (
              <Alert severity="error" onClose={() => setValidationError(null)}>
                {validationError}
              </Alert>
            )}

            {/* Секция 1: Умное управление расписанием */}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  fontSize: { xs: "1.125rem", sm: "1.25rem" },
                }}
              >
                Быстрая настройка
              </Typography>
              <AutoScheduleTools
                workSchedule={schedule.workSchedule}
                onChange={handleWorkScheduleChange}
              />
            </Box>

            <Divider />

            {/* Секция 2: Рабочие дни */}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  fontSize: { xs: "1.125rem", sm: "1.25rem" },
                }}
              >
                Рабочие дни недели
              </Typography>
              <Stack spacing={2}>
                {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => (
                  <DayScheduleCard
                    key={dayOfWeek}
                    dayOfWeek={dayOfWeek}
                    daySchedule={getDaySchedule(dayOfWeek)}
                    onChange={(daySchedule) =>
                      handleDayScheduleChange(dayOfWeek, daySchedule)
                    }
                  />
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Секция 3: Перерывы */}
            <Box>
              <BreaksEditor
                breaks={schedule.breaks}
                workSchedule={schedule.workSchedule}
                onChange={handleBreaksChange}
              />
            </Box>

            <Divider />

            {/* Секция 4: Настройки слотов */}
            <Box>
              <SlotSettings
                defaultBufferMinutes={schedule.defaultBufferMinutes}
                slotStepMinutes={schedule.slotStepMinutes}
                onChange={handleSlotSettingsChange}
              />
            </Box>
          </Stack>
        )}
      </Container>

      {/* Fixed Save Button */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          p: 2,
          zIndex: 1000,
          boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Container maxWidth="lg">
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !schedule}
            fullWidth
            sx={{
              maxWidth: { xs: "100%", sm: 300 },
              mx: { xs: 0, sm: "auto" },
              display: "block",
            }}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default SchedulePage;

