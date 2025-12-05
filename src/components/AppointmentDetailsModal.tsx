import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Pagination,
} from "@mui/material";
import {
  Close as CloseIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ru } from "date-fns/locale";
import { format, parseISO, addMinutes } from "date-fns";
import { meApi, type Appointment } from "../api/me";
import { mastersApi } from "../api/masters";
import { useSnackbar } from "./SnackbarProvider";
import { normalizeImageUrl } from "../utils/imageUrl";
import { logError } from "../utils/logger";

interface AppointmentDetailsModalProps {
  open: boolean;
  appointment: Appointment | null;
  masterSlug: string;
  onClose: () => void;
  onUpdated: () => void;
}

export const AppointmentDetailsModal: React.FC<
  AppointmentDetailsModalProps
> = ({ open, appointment, masterSlug, onClose, onUpdated }) => {
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [slotsPage, setSlotsPage] = useState(1);
  const slotsPerPage = 18;
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (!open) {
      setRescheduleMode(false);
      setSelectedDate(null);
      setAvailableSlots([]);
      setSelectedSlot(null);
      setSlotsPage(1);
    } else if (appointment) {
      // Устанавливаем текущую дату встречи при открытии
      setSelectedDate(parseISO(appointment.startAt));
    }
  }, [open, appointment]);

  // Загружаем доступные слоты при выборе даты
  useEffect(() => {
    if (rescheduleMode && selectedDate && appointment) {
      loadAvailableSlots();
      setSlotsPage(1); // Сбрасываем страницу при смене даты
    }
  }, [rescheduleMode, selectedDate, appointment]);

  const loadAvailableSlots = async () => {
    if (!selectedDate || !appointment || !masterSlug) return;

    try {
      setLoadingSlots(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await mastersApi.getTimeslots(
        masterSlug,
        dateStr,
        appointment.serviceId
      );

      // Фильтруем слоты, исключая текущее время встречи
      const currentStartAt = parseISO(appointment.startAt);
      const filteredSlots = response.available.filter((slot) => {
        const slotDate = parseISO(slot);
        return slotDate.getTime() !== currentStartAt.getTime();
      });

      setAvailableSlots(filteredSlots);
      setSelectedSlot(null);
    } catch (error) {
      logError("Ошибка загрузки слотов:", error);
      showSnackbar("Не удалось загрузить доступные слоты", "error");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot || !appointment) return;

    try {
      setRescheduling(true);
      await meApi.rescheduleAppointment(appointment.id, selectedSlot);
      showSnackbar("Встреча успешно перенесена", "success");
      setRescheduleMode(false);
      onUpdated();
      onClose();
    } catch (error: any) {
      logError("Ошибка переноса встречи:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Не удалось перенести встречу";
      showSnackbar(errorMessage, "error");
    } finally {
      setRescheduling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd.MM.yyyy", { locale: ru });
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), "HH:mm");
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), "dd.MM.yyyy HH:mm", { locale: ru });
  };

  if (!appointment) return null;

  const statusColors: Record<
    Appointment["status"],
    "default" | "primary" | "success" | "warning" | "error"
  > = {
    PENDING: "warning",
    CONFIRMED: "primary",
    COMPLETED: "success",
    CANCELED: "error",
    NO_SHOW: "error",
  };

  const statusLabels: Record<Appointment["status"], string> = {
    PENDING: "Ожидает",
    CONFIRMED: "Подтверждена",
    COMPLETED: "Завершена",
    CANCELED: "Отменена",
    NO_SHOW: "Не явился",
  };

  const displayPrice = appointment.price ?? appointment.service.price;
  const canReschedule =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Детали встречи</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {!rescheduleMode ? (
          <Stack spacing={2}>
            {/* Статус */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Статус
              </Typography>
              <Chip
                label={statusLabels[appointment.status]}
                color={statusColors[appointment.status]}
                size="small"
              />
            </Box>

            <Divider />

            {/* Клиент */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Клиент
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {appointment.client.name}
              </Typography>
              {appointment.client.phone && (
                <Typography variant="body2" color="text.secondary">
                  📞 {appointment.client.phone}
                </Typography>
              )}
              {appointment.client.telegramUsername && (
                <Typography variant="body2" color="text.secondary">
                  ✈️ @{appointment.client.telegramUsername}
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Услуга */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <BuildIcon sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Услуга
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {appointment.service.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Длительность: {appointment.service.durationMin} мин
              </Typography>
            </Box>

            <Divider />

            {/* Дата и время */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <EventIcon sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Дата и время
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formatDate(appointment.startAt)} {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
              </Typography>
            </Box>

            <Divider />

            {/* Цена */}
            {displayPrice && (
              <>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <MoneyIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Цена
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {displayPrice.toLocaleString("ru-RU")} ₽
                  </Typography>
                </Box>
                <Divider />
              </>
            )}

            {/* Заметки */}
            {appointment.notes && (
              <>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Заметки
                  </Typography>
                  <Typography variant="body2">{appointment.notes}</Typography>
                </Box>
                <Divider />
              </>
            )}

            {/* Фото */}
            {appointment.status === "COMPLETED" &&
              appointment.photos &&
              appointment.photos.length > 0 && (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Фото работ ({appointment.photos.length})
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {appointment.photos.map((photo) => (
                        <Box
                          key={photo.id}
                          component="img"
                          src={normalizeImageUrl(photo.url)}
                          alt={photo.description || "Фото"}
                          sx={{
                            width: 80,
                            height: 80,
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                  <Divider />
                </>
              )}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Alert severity="info">
              Выберите новую дату и время для встречи
            </Alert>

            {/* Выбор даты */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Выберите дату
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                <DatePicker
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  minDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>

            {/* Доступные слоты */}
            {selectedDate && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Выберите время
                </Typography>
                {loadingSlots ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : availableSlots.length === 0 ? (
                  <Alert severity="warning">
                    На выбранную дату нет доступных слотов
                  </Alert>
                ) : (
                  <>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {availableSlots
                        .slice((slotsPage - 1) * slotsPerPage, slotsPage * slotsPerPage)
                        .map((slot) => {
                          const slotDate = parseISO(slot);
                          const slotEnd = addMinutes(slotDate, appointment.service.durationMin);
                          const isSelected = selectedSlot === slot;
                          return (
                            <Button
                              key={slot}
                              variant={isSelected ? "contained" : "outlined"}
                              onClick={() => setSelectedSlot(slot)}
                              sx={{
                                textTransform: "none",
                                py: 1,
                                minWidth: 120,
                                flex: "1 1 calc(33.333% - 8px)",
                                maxWidth: "calc(33.333% - 8px)",
                              }}
                            >
                              {formatTime(slot)} - {formatTime(slotEnd.toISOString())}
                            </Button>
                          );
                        })}
                    </Box>
                    {availableSlots.length > slotsPerPage && (
                      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Pagination
                          count={Math.ceil(availableSlots.length / slotsPerPage)}
                          page={slotsPage}
                          onChange={(_, value) => setSlotsPage(value)}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {!rescheduleMode ? (
          <>
            <Button onClick={onClose}>Закрыть</Button>
            {canReschedule && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setRescheduleMode(true)}
              >
                Перенести
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={() => {
                setRescheduleMode(false);
                setSelectedSlot(null);
              }}
              disabled={rescheduling}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleReschedule}
              disabled={!selectedSlot || rescheduling}
              startIcon={rescheduling ? <CircularProgress size={16} /> : <ScheduleIcon />}
            >
              {rescheduling ? "Перенос..." : "Перенести встречу"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

