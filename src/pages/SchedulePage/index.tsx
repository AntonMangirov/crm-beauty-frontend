import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { meApi } from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";
import { DayScheduleCard } from "../../components/ScheduleEditor/DayScheduleCard";
import { BreaksEditor } from "../../components/ScheduleEditor/BreaksEditor";
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
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const response = await meApi.getSchedule();
      setSchedule(response.schedule);
    } catch (err) {
      console.error("Ошибка загрузки расписания:", err);
      showSnackbar("Не удалось загрузить расписание", "error");
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
  };

  const validateSchedule = (): boolean => {
    if (!schedule) {
      showSnackbar("Нет данных для сохранения", "error");
      return false;
    }

    // Проверяем, что есть хотя бы один рабочий день
    if (!schedule.workSchedule || schedule.workSchedule.length === 0) {
      showSnackbar("Выберите хотя бы один рабочий день", "error");
      return false;
    }

    // Валидация интервалов будет проверяться на бэкенде
    return true;
  };

  const handleSave = async () => {
    if (!schedule) return;

    if (!validateSchedule()) {
      return;
    }

    try {
      setSaving(true);
      const updateData: UpdateScheduleRequest = {};

      if (schedule.workSchedule) {
        updateData.workSchedule = schedule.workSchedule;
      }
      if (schedule.breaks) {
        updateData.breaks = schedule.breaks;
      }
      if (schedule.defaultBufferMinutes !== null) {
        updateData.defaultBufferMinutes = schedule.defaultBufferMinutes;
      }
      if (schedule.slotStepMinutes !== null) {
        updateData.slotStepMinutes = schedule.slotStepMinutes as 5 | 10 | 15;
      }

      await meApi.updateSchedule(updateData);
      showSnackbar("Расписание успешно сохранено", "success");
    } catch (err: unknown) {
      console.error("Ошибка сохранения расписания:", err);
      const errorMessage =
        (err as { response?: { data?: { message?: string; error?: string } } })
          ?.response?.data?.message ||
        (err as { response?: { data?: { message?: string; error?: string } } })
          ?.response?.data?.error ||
        "Не удалось сохранить расписание";
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
          <Box>
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

            <BreaksEditor
              breaks={schedule.breaks}
              workSchedule={schedule.workSchedule}
              onChange={handleBreaksChange}
            />
          </Box>
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

