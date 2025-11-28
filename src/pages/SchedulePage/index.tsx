import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Card,
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { meApi } from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";
import type { MasterSchedule, UpdateScheduleRequest } from "../../types/schedule";

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

  const validateSchedule = (): boolean => {
    if (!schedule) {
      showSnackbar("Нет данных для сохранения", "error");
      return false;
    }

    // Валидация будет добавлена позже
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

        <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="body1" color="text.secondary">
            Интерфейс редактирования расписания будет добавлен в следующих
            шагах
          </Typography>
          {schedule && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Рабочих дней:{" "}
                {schedule.workSchedule?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Перерывов: {schedule.breaks?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Буфер: {schedule.defaultBufferMinutes || "не задан"} мин
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Шаг слотов: {schedule.slotStepMinutes || "не задан"} мин
              </Typography>
            </Box>
          )}
        </Card>
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

