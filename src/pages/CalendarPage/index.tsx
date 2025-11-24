import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Button,
  ButtonGroup,
  useMediaQuery,
  useTheme,
  Divider,
  Stack,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { ru } from "date-fns/locale";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, isSameDay, isPast, isToday } from "date-fns";
import {
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { meApi, type Appointment } from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";
import { PhotoUploader } from "../../components/PhotoUploader";
import { normalizeImageUrl } from "../../utils/imageUrl";

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

export const CalendarPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());
  const [datesWithAppointments, setDatesWithAppointments] = useState<Set<string>>(new Set());
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false);
  const [selectedAppointmentForPhotos, setSelectedAppointmentForPhotos] = useState<Appointment | null>(null);
  // Выходные дни мастера (опционально выставляются мастером через настройки)
  // Формат: Set дат в формате "yyyy-MM-dd"
  // TODO: Загружать из API /api/me/days-off при монтировании компонента
  const [masterDaysOff, setMasterDaysOff] = useState<Set<string>>(new Set());
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (selectedDate) {
      loadAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Загружаем даты с записями при монтировании и при смене месяца
  useEffect(() => {
    if (selectedDate) {
      loadDatesWithAppointments();
      // TODO: Загрузить выходные дни мастера из API
      // loadMasterDaysOff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate ? format(selectedDate, "yyyy-MM") : null]);

  // Проверка, является ли дата выходным днем мастера
  // Выходные дни опционально выставляются самим мастером через настройки
  // TODO: Загружать выходные дни мастера из API /api/me/days-off
  const isDayOff = (date: Date): boolean => {
    const dateKey = format(date, "yyyy-MM-dd");
    return masterDaysOff.has(dateKey);
  };

  // Загружаем даты с записями для текущего месяца
  const loadDatesWithAppointments = async () => {
    if (!selectedDate) return;

    try {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      
      const year = monthStart.getFullYear();
      const month = monthStart.getMonth();
      const day = monthStart.getDate();
      
      const utcMonthStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      
      const endYear = monthEnd.getFullYear();
      const endMonth = monthEnd.getMonth();
      const endDay = monthEnd.getDate();
      const utcMonthEnd = new Date(Date.UTC(endYear, endMonth, endDay, 23, 59, 59, 999));

      const data = await meApi.getAppointments({
        from: utcMonthStart.toISOString(),
        to: utcMonthEnd.toISOString(),
      });

      // Извлекаем уникальные даты из записей
      const datesSet = new Set<string>();
      data.forEach((apt) => {
        const date = new Date(apt.startAt);
        const dateKey = format(date, "yyyy-MM-dd");
        datesSet.add(dateKey);
      });

      setDatesWithAppointments(datesSet);
    } catch (err) {
      console.error("Ошибка загрузки дат с записями:", err);
    }
  };

  const loadAppointments = async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);
      setError(null);

      // Получаем начало и конец выбранного дня в локальном времени
      // Преобразуем в UTC для отправки на сервер
      const localStartOfDay = startOfDay(selectedDate);
      const localEndOfDay = endOfDay(selectedDate);
      
      // Создаем UTC даты с теми же компонентами даты
      const year = localStartOfDay.getFullYear();
      const month = localStartOfDay.getMonth();
      const day = localStartOfDay.getDate();
      
      const utcStartOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const utcEndOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

      const data = await meApi.getAppointments({
        from: utcStartOfDay.toISOString(),
        to: utcEndOfDay.toISOString(),
      });

      setAppointments(data);
    } catch (err) {
      console.error("Ошибка загрузки записей:", err);
      setError("Не удалось загрузить записи");
      showSnackbar("Не удалось загрузить записи", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, "dd.MM.yyyy HH:mm", { locale: ru });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: ru });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, "dd.MM.yyyy", { locale: ru });
  };

  const handleConfirm = async (appointmentId: string) => {
    setUpdatingStatus((prev) => new Set(prev).add(appointmentId));
    try {
      // PUT запрос для обновления статуса
      const updatedAppointment = await meApi.updateAppointmentStatus(
        appointmentId,
        "CONFIRMED"
      );
      // Обновляем состояние с полученными данными
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? updatedAppointment : apt))
      );
      showSnackbar("Запись подтверждена", "success");
    } catch (err: any) {
      console.error("Ошибка подтверждения записи:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Не удалось подтвердить запись";
      showSnackbar(errorMessage, "error");
    } finally {
      setUpdatingStatus((prev) => {
        const next = new Set(prev);
        next.delete(appointmentId);
        return next;
      });
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (
      !window.confirm("Вы уверены, что хотите отменить эту запись?")
    ) {
      return;
    }

    setUpdatingStatus((prev) => new Set(prev).add(appointmentId));
    try {
      // PUT запрос для обновления статуса
      const updatedAppointment = await meApi.updateAppointmentStatus(
        appointmentId,
        "CANCELED"
      );
      // Обновляем состояние с полученными данными
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? updatedAppointment : apt))
      );
      showSnackbar("Запись отменена", "success");
    } catch (err: any) {
      console.error("Ошибка отмены записи:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Не удалось отменить запись";
      showSnackbar(errorMessage, "error");
    } finally {
      setUpdatingStatus((prev) => {
        const next = new Set(prev);
        next.delete(appointmentId);
        return next;
      });
    }
  };

  const handleComplete = async (appointmentId: string) => {
    setUpdatingStatus((prev) => new Set(prev).add(appointmentId));
    try {
      const updatedAppointment = await meApi.updateAppointmentStatus(
        appointmentId,
        "COMPLETED"
      );
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? updatedAppointment : apt))
      );
      showSnackbar("Запись завершена", "success");
    } catch (err: any) {
      console.error("Ошибка завершения записи:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Не удалось завершить запись";
      showSnackbar(errorMessage, "error");
    } finally {
      setUpdatingStatus((prev) => {
        const next = new Set(prev);
        next.delete(appointmentId);
        return next;
      });
    }
  };

  const handleOpenPhotoUploader = (appointment: Appointment) => {
    setSelectedAppointmentForPhotos(appointment);
    setPhotoUploaderOpen(true);
  };

  const handlePhotosUpdated = async () => {
    if (selectedAppointmentForPhotos) {
      await loadAppointments();
    }
  };

  const columns: GridColDef[] = [
    {
      field: "client",
      headerName: "Клиент",
      width: 250,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const { name, phone } = params.row.client;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {name}
            </Typography>
            {phone && (
              <Typography variant="caption" color="text.secondary">
                {phone}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "service",
      headerName: "Услуга",
      width: 200,
      valueGetter: (value, row: Appointment) => row.service.name,
    },
    {
      field: "dateTime",
      headerName: "Дата / время",
      width: 180,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const date = formatDate(params.row.startAt);
        const time = `${formatTime(params.row.startAt)} - ${formatTime(params.row.endAt)}`;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {date}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {time}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "price",
      headerName: "Цена",
      width: 120,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const price = params.row.price ?? params.row.service.price;
        return (
          <Typography variant="body2">
            {price ? `${price.toLocaleString("ru-RU")} ₽` : "-"}
          </Typography>
        );
      },
    },
    {
      field: "status",
      headerName: "Статус",
      width: 150,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const status = params.row.status;
        return (
          <Chip
            label={statusLabels[status]}
            color={statusColors[status]}
            size="small"
          />
        );
      },
    },
    {
      field: "photos",
      headerName: "Фото",
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const photos = params.row.photos || [];
        const hasPhotos = photos.length > 0;
        const isCompleted = params.row.status === "COMPLETED";

        if (!isCompleted) {
          return (
            <Typography variant="body2" color="text.disabled">
              —
            </Typography>
          );
        }

        if (!hasPhotos) {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ImageIcon sx={{ fontSize: 18, color: "text.disabled" }} />
              <Typography variant="caption" color="text.disabled">
                Нет фото
              </Typography>
            </Box>
          );
        }

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              cursor: "pointer",
            }}
            onClick={() => handleOpenPhotoUploader(params.row)}
          >
            <Box sx={{ display: "flex", gap: 0.25 }}>
              {photos.slice(0, 2).map((photo) => (
                <Box
                  key={photo.id}
                  component="img"
                  src={normalizeImageUrl(photo.url)}
                  alt=""
                  sx={{
                    width: 32,
                    height: 32,
                    objectFit: "cover",
                    borderRadius: 0.5,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
              ))}
              {photos.length > 2 && (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 0.5,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "action.hover",
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                    +{photos.length - 2}
                  </Typography>
                </Box>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              ({photos.length})
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Действия",
      width: 380,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const { id, status } = params.row;
        const canConfirm = status === "PENDING";
        const canCancel = status === "PENDING" || status === "CONFIRMED";
        const canComplete = status === "CONFIRMED" || status === "PENDING";
        const canAddPhotos = status === "COMPLETED";
        const isUpdating = updatingStatus.has(id);

        return (
          <ButtonGroup size="small" variant="outlined" sx={{ flexWrap: "nowrap" }}>
            {canConfirm && (
              <Button
                startIcon={<CheckIcon />}
                onClick={() => handleConfirm(id)}
                disabled={isUpdating}
                color="primary"
                sx={{ 
                  textTransform: "none",
                  fontSize: "0.75rem",
                  px: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {isUpdating ? "..." : "Подтвердить"}
              </Button>
            )}
            {canComplete && status !== "PENDING" && (
              <Button
                startIcon={<CheckCircleIcon />}
                onClick={() => handleComplete(id)}
                disabled={isUpdating}
                color="success"
                sx={{ 
                  textTransform: "none",
                  fontSize: "0.75rem",
                  px: 1,
                  whiteSpace: "nowrap",
                }}
              >
                Завершить
              </Button>
            )}
            {canCancel && (
              <Button
                startIcon={<CancelIcon />}
                onClick={() => handleCancel(id)}
                disabled={isUpdating}
                color="error"
                sx={{ 
                  textTransform: "none",
                  fontSize: "0.75rem",
                  px: 1,
                  whiteSpace: "nowrap",
                }}
              >
                Отменить
              </Button>
            )}
            {canAddPhotos && (
              <Button
                startIcon={<PhotoCameraIcon />}
                onClick={() => handleOpenPhotoUploader(params.row)}
                color="success"
                sx={{ 
                  textTransform: "none",
                  fontSize: "0.75rem",
                  px: 1,
                  whiteSpace: "nowrap",
                }}
              >
                Фото
              </Button>
            )}
          </ButtonGroup>
        );
      },
    },
  ];

  if (loading && appointments.length === 0) {
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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Box 
        sx={{ 
          py: { xs: 1.5, sm: 2.5 },
          px: { xs: 0.5, sm: 1, md: 1.5 },
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        {/* Заголовок и DatePicker */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            mb: { xs: 2, sm: 2.5 },
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            Календарь записей
          </Typography>

          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <CalendarIcon sx={{ color: "primary.main", display: { xs: "none", sm: "block" } }} />
            <DatePicker
              label="Выберите дату"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              slots={{
                day: (props) => {
                  const { day, ...other } = props;
                  const dateKey = format(day, "yyyy-MM-dd");
                  const hasAppointments = datesWithAppointments.has(dateKey);
                  const isTodayDate = isToday(day);
                  const isPastDate = isPast(startOfDay(day)) && !isTodayDate;
                  const isDayOffDate = isDayOff(day);
                  
                  return (
                    <PickersDay
                      {...other}
                      day={day}
                      sx={{
                        // Стили для выходных дней (будущих)
                        ...(isDayOffDate && !isPastDate && {
                          color: "error.main",
                          fontWeight: 600,
                        }),
                        // Стили для прошедших выходных дней
                        ...(isDayOffDate && isPastDate && {
                          color: "error.light",
                          opacity: 0.6,
                        }),
                        // Стили для прошедших дней без записей
                        ...(isPastDate && !hasAppointments && !isDayOffDate && {
                          color: "text.disabled",
                          opacity: 0.5,
                        }),
                        // Стили для прошедших дней с записями (более серые)
                        ...(isPastDate && hasAppointments && !isDayOffDate && {
                          bgcolor: "action.disabledBackground",
                          color: "text.disabled",
                          opacity: 0.7,
                          fontWeight: 500,
                        }),
                        // Стили для сегодняшней даты
                        ...(isTodayDate && {
                          border: "2px solid",
                          borderColor: isDayOffDate ? "error.main" : "primary.main",
                          fontWeight: 700,
                          bgcolor: hasAppointments 
                            ? (isDayOffDate ? "error.light" : "primary.light") 
                            : "background.paper",
                        }),
                        // Стили для будущих дат с записями (не выходные)
                        ...(hasAppointments && !isTodayDate && !isPastDate && !isDayOffDate && {
                          bgcolor: "primary.light",
                          color: "primary.contrastText",
                          fontWeight: 600,
                          "&:hover": {
                            bgcolor: "primary.main",
                          },
                          "&.Mui-selected": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            "&:hover": {
                              bgcolor: "primary.dark",
                            },
                          },
                        }),
                        // Стили для выбранной даты с записями и сегодня
                        ...(hasAppointments && isTodayDate && !isDayOffDate && {
                          "&.Mui-selected": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            borderColor: "primary.dark",
                            "&:hover": {
                              bgcolor: "primary.dark",
                            },
                          },
                        }),
                      }}
                    />
                  );
                },
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: isMobile,
                  sx: { 
                    minWidth: { xs: "100%", sm: 200 },
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Ошибка */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Таблица записей или карточки для мобильных */}
        {appointments.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                {selectedDate
                  ? `На ${format(selectedDate, "dd.MM.yyyy", { locale: ru })} записей нет`
                  : "Выберите дату для просмотра записей"}
              </Typography>
            </CardContent>
          </Card>
        ) : isMobile ? (
          // Мобильный вид - карточки
          <Stack spacing={2}>
            {appointments.map((appointment) => {
              const { id, status, startAt, endAt, client, service, price } = appointment;
              const canConfirm = status === "PENDING";
              const canCancel = status === "PENDING" || status === "CONFIRMED";
              const canComplete = status === "CONFIRMED" || status === "PENDING";
              const isUpdating = updatingStatus.has(id);
              const displayPrice = price ?? service.price;

              return (
                <Card key={id} sx={{ width: "100%" }}>
                  <CardContent>
                    {/* Заголовок с клиентом и статусом */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {client.name}
                        </Typography>
                        {client.phone && (
                          <Typography variant="body2" color="text.secondary">
                            {client.phone}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={statusLabels[status]}
                        color={statusColors[status]}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Информация о записи */}
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Услуга
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {service.name}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Дата и время
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatDate(startAt)} {formatTime(startAt)} - {formatTime(endAt)}
                        </Typography>
                      </Box>

                      {displayPrice && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Цена
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {displayPrice.toLocaleString("ru-RU")} ₽
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {/* Фото (только для завершенных записей) */}
                    {status === "COMPLETED" && appointment.photos && appointment.photos.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                          Фото работ
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {appointment.photos.slice(0, 3).map((photo) => (
                            <Box
                              key={photo.id}
                              component="img"
                              src={normalizeImageUrl(photo.url)}
                              alt={photo.description || "Фото"}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: "cover",
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "divider",
                              }}
                            />
                          ))}
                          {appointment.photos.length > 3 && (
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "action.hover",
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                +{appointment.photos.length - 3}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Действия */}
                    <Box sx={{ mt: 2, display: "flex", gap: 1, flexDirection: "column" }}>
                      {canConfirm && (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => handleConfirm(id)}
                          disabled={isUpdating}
                          color="primary"
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          {isUpdating ? "Обновление..." : "Подтвердить"}
                        </Button>
                      )}
                      {canComplete && status !== "PENDING" && (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleComplete(id)}
                          disabled={isUpdating}
                          color="success"
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          {isUpdating ? "Обновление..." : "Завершить"}
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancel(id)}
                          disabled={isUpdating}
                          color="error"
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          Отменить
                        </Button>
                      )}
                      {status === "COMPLETED" && (
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<PhotoCameraIcon />}
                          onClick={() => handleOpenPhotoUploader(appointment)}
                          color="success"
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          {appointment.photos && appointment.photos.length > 0
                            ? `Фото (${appointment.photos.length})`
                            : "Добавить фото"}
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        ) : (
          // Десктопный вид - таблица
          <Box 
            sx={{ 
              height: 600, 
              width: "100%",
              overflowX: "auto",
            }}
          >
            <DataGrid
              rows={appointments}
              columns={columns}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 },
                },
              }}
              sx={{
                width: "100%",
                minWidth: 1000,
                "& .MuiDataGrid-cell": {
                  fontSize: "0.875rem",
                },
                "& .MuiDataGrid-columnHeaders": {
                  fontSize: "0.875rem",
                  fontWeight: 600,
                },
              }}
            />
          </Box>
        )}

        {/* Диалог загрузки фото */}
        {selectedAppointmentForPhotos && (
          <PhotoUploader
            open={photoUploaderOpen}
            onClose={() => {
              setPhotoUploaderOpen(false);
              setSelectedAppointmentForPhotos(null);
            }}
            appointmentId={selectedAppointmentForPhotos.id}
            existingPhotos={selectedAppointmentForPhotos.photos || []}
            onPhotosUpdated={handlePhotosUpdated}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

