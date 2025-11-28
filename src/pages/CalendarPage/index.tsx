import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { ru } from "date-fns/locale";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, isSameDay, isPast, isToday, addMonths, subMonths, getDay } from "date-fns";
import {
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Image as ImageIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { meApi, type Appointment } from "../../api/me";
import type { DaySchedule } from "../../types/schedule";
import { useSnackbar } from "../../components/SnackbarProvider";
import { PhotoUploader } from "../../components/PhotoUploader";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { QuickBookingModal } from "../../components/QuickBookingModal";

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
  // Кэш данных по месяцам: ключ - "yyyy-MM", значение - Set дат
  const [datesWithAppointmentsCache, setDatesWithAppointmentsCache] = useState<Map<string, Set<string>>>(new Map());
  const [datesWithCompletedPhotosCache, setDatesWithCompletedPhotosCache] = useState<Map<string, Set<string>>>(new Map());
  // Отслеживаем, какие месяцы уже загружены
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false);
  const [selectedAppointmentForPhotos, setSelectedAppointmentForPhotos] = useState<Appointment | null>(null);
  const [quickBookingOpen, setQuickBookingOpen] = useState(false);
  const [masterSlug, setMasterSlug] = useState<string>("");
  // Расписание мастера для определения выходных дней недели
  const [workSchedule, setWorkSchedule] = useState<DaySchedule[] | null>(null);
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Загружаем slug мастера и расписание при монтировании
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const master = await meApi.getMe();
        setMasterSlug(master.slug);
        
        // Загружаем расписание для определения выходных дней
        try {
          const scheduleResponse = await meApi.getSchedule();
          setWorkSchedule(scheduleResponse.schedule.workSchedule);
        } catch (scheduleErr) {
          console.error("Ошибка загрузки расписания:", scheduleErr);
          // Если расписание не найдено, это нормально для нового пользователя
        }
      } catch (err) {
        console.error("Ошибка загрузки данных мастера:", err);
      }
    };
    loadMasterData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Загружаем даты с записями при монтировании и при смене месяца
  // Загружаем данные для текущего месяца и соседних (предыдущий и следующий)
  useEffect(() => {
    if (selectedDate) {
      const currentMonth = format(selectedDate, "yyyy-MM");
      const prevMonth = format(subMonths(selectedDate, 1), "yyyy-MM");
      const nextMonth = format(addMonths(selectedDate, 1), "yyyy-MM");
      
      // Загружаем данные для всех трех месяцев параллельно, если они еще не загружены
      const monthsToLoad = [currentMonth, prevMonth, nextMonth].filter(
        (month) => !loadedMonths.has(month)
      );
      
      if (monthsToLoad.length > 0) {
        Promise.all(monthsToLoad.map((month) => loadDatesWithAppointmentsForMonth(month)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate ? format(selectedDate, "yyyy-MM") : null]);

  // Проверка, является ли дата выходным днем мастера
  // Выходной день определяется на основе workSchedule: если день недели не входит в workSchedule, это выходной
  // ВАЖНО: Выходные дни применяются только с сегодняшнего дня, не влияют на прошлые даты
  const isDayOff = (date: Date): boolean => {
    // Если дата в прошлом, не применяем правила выходных дней
    // Используем isPast с startOfDay для корректного сравнения дат без времени
    const checkDate = startOfDay(date);
    if (isPast(checkDate) && !isToday(checkDate)) {
      return false;
    }
    
    // Если расписание не загружено или пустое, считаем все дни рабочими
    if (!workSchedule || workSchedule.length === 0) {
      return false;
    }
    
    // Получаем день недели (0 = воскресенье, 1 = понедельник, ..., 6 = суббота)
    const dayOfWeek = getDay(date);
    
    // Проверяем, есть ли этот день недели в расписании
    const isWorkingDay = workSchedule.some(
      (day) => day.dayOfWeek === dayOfWeek
    );
    
    // Если дня нет в расписании, это выходной день
    return !isWorkingDay;
  };

  // Загружаем даты с записями для конкретного месяца (формат "yyyy-MM")
  const loadDatesWithAppointmentsForMonth = async (monthKey: string) => {
    // Проверяем, не загружен ли уже этот месяц
    if (loadedMonths.has(monthKey)) {
      return;
    }

    try {
      // Парсим месяц из строки "yyyy-MM"
      const [yearStr, monthStr] = monthKey.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // месяцы в JS начинаются с 0
      
      const monthDate = new Date(year, month, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const startYear = monthStart.getFullYear();
      const startMonth = monthStart.getMonth();
      const startDay = monthStart.getDate();
      
      const utcMonthStart = new Date(Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 0));
      
      const endYear = monthEnd.getFullYear();
      const endMonth = monthEnd.getMonth();
      const endDay = monthEnd.getDate();
      const utcMonthEnd = new Date(Date.UTC(endYear, endMonth, endDay, 23, 59, 59, 999));

      // Загружаем все записи за месяц для определения дат с записями
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
      
      // Сохраняем в кэш
      setDatesWithAppointmentsCache((prev) => {
        const next = new Map(prev);
        next.set(monthKey, datesSet);
        return next;
      });

      // Проверяем фотографии на основе уже загруженных данных за месяц
      // Не делаем дополнительные запросы для каждого дня - используем данные, которые уже есть
      const datesWithPhotosSet = new Set<string>();
      
      // Группируем записи по датам
      const datesMap = new Map<string, Appointment[]>();
      data.forEach((apt) => {
        const date = new Date(apt.startAt);
        const dateKey = format(date, "yyyy-MM-dd");
        if (!datesMap.has(dateKey)) {
          datesMap.set(dateKey, []);
        }
        datesMap.get(dateKey)!.push(apt);
      });
      
      // Проверяем каждую дату на наличие завершенных записей с фотографиями
      datesMap.forEach((appointments, dateKey) => {
        const hasCompletedWithPhotos = appointments.some(
          (apt) =>
            apt.status === "COMPLETED" &&
            apt.photos &&
            Array.isArray(apt.photos) &&
            apt.photos.length > 0
        );
        
        if (hasCompletedWithPhotos) {
          datesWithPhotosSet.add(dateKey);
        }
      });
      
      // Сохраняем в кэш
      setDatesWithCompletedPhotosCache((prev) => {
        const next = new Map(prev);
        next.set(monthKey, datesWithPhotosSet);
        return next;
      });
      
      // Отмечаем месяц как загруженный
      setLoadedMonths((prev) => {
        const next = new Set(prev);
        next.add(monthKey);
        return next;
      });
    } catch (err) {
      console.error(`Ошибка загрузки дат с записями за ${monthKey}:`, err);
    }
  };

  // Объединяем все загруженные данные из кэша в единые Set для отображения
  const getAllDatesWithAppointments = (): Set<string> => {
    const result = new Set<string>();
    datesWithAppointmentsCache.forEach((datesSet) => {
      datesSet.forEach((date) => result.add(date));
    });
    return result;
  };

  const getAllDatesWithCompletedPhotos = (): Set<string> => {
    const result = new Set<string>();
    datesWithCompletedPhotosCache.forEach((datesSet) => {
      datesSet.forEach((date) => result.add(date));
    });
    return result;
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
      
      // Обновляем кэш дат с фотографиями на основе загруженных данных для выбранного дня
      const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
      const monthKey = format(selectedDate, "yyyy-MM");
      const clientsWithPhotos = new Set<string>();
      
      data.forEach((apt) => {
        if (apt.photos && Array.isArray(apt.photos) && apt.photos.length > 0) {
          clientsWithPhotos.add(apt.clientId);
        }
      });
      
      const hasCompletedWithPhotos = data.some(
        (apt) =>
          apt.status === "COMPLETED" &&
          clientsWithPhotos.has(apt.clientId)
      );
      
      if (hasCompletedWithPhotos) {
        setDatesWithCompletedPhotosCache((prev) => {
          const next = new Map(prev);
          const monthSet = next.get(monthKey) || new Set<string>();
          const updatedSet = new Set(monthSet);
          updatedSet.add(selectedDateKey);
          next.set(monthKey, updatedSet);
          return next;
        });
      }
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
      // Обновляем кэш для месяца этой записи
      const appointmentDate = new Date(updatedAppointment.startAt);
      const monthKey = format(appointmentDate, "yyyy-MM");
      const dateKey = format(appointmentDate, "yyyy-MM-dd");
      setDatesWithAppointmentsCache((prev) => {
        const next = new Map(prev);
        const monthSet = next.get(monthKey) || new Set<string>();
        const updatedSet = new Set(monthSet);
        updatedSet.add(dateKey);
        next.set(monthKey, updatedSet);
        return next;
      });
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
      // Обновляем кэш для месяца этой записи (отмененные записи все еще показываются в календаре)
      const appointmentDate = new Date(updatedAppointment.startAt);
      const monthKey = format(appointmentDate, "yyyy-MM");
      const dateKey = format(appointmentDate, "yyyy-MM-dd");
      setDatesWithAppointmentsCache((prev) => {
        const next = new Map(prev);
        const monthSet = next.get(monthKey) || new Set<string>();
        const updatedSet = new Set(monthSet);
        updatedSet.add(dateKey);
        next.set(monthKey, updatedSet);
        return next;
      });
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
      // Обновляем даты с фотографиями после завершения записи
      const appointmentDate = new Date(updatedAppointment.startAt);
      const monthKey = format(appointmentDate, "yyyy-MM");
      const dateKey = format(appointmentDate, "yyyy-MM-dd");
      
      // Обновляем кэш дат с записями
      setDatesWithAppointmentsCache((prev) => {
        const next = new Map(prev);
        const monthSet = next.get(monthKey) || new Set<string>();
        const updatedSet = new Set(monthSet);
        updatedSet.add(dateKey);
        next.set(monthKey, updatedSet);
        return next;
      });
      
      // Сбрасываем кэш для этого месяца, чтобы перезагрузить данные о фотографиях
      setLoadedMonths((prev) => {
        const next = new Set(prev);
        next.delete(monthKey);
        return next;
      });
      await loadDatesWithAppointmentsForMonth(monthKey);
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
      // Перезагружаем даты с фотографиями после обновления
      if (selectedDate) {
        const monthKey = format(selectedDate, "yyyy-MM");
        // Сбрасываем кэш для этого месяца, чтобы перезагрузить данные
        setLoadedMonths((prev) => {
          const next = new Set(prev);
          next.delete(monthKey);
          return next;
        });
        await loadDatesWithAppointmentsForMonth(monthKey);
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: "client",
      headerName: "Клиент",
      width: 250,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const { name, phone, telegramUsername } = params.row.client;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {name}
            </Typography>
            {(phone || telegramUsername) && (
              <Typography variant="caption" color="text.secondary">
                {phone && `📞 ${phone}`}
                {phone && telegramUsername && " • "}
                {telegramUsername && `✈️ @${telegramUsername}`}
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
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setQuickBookingOpen(true)}
              sx={{ textTransform: "none" }}
            >
              Быстрая запись
            </Button>
            <CalendarIcon sx={{ color: "primary.main", display: { xs: "none", sm: "block" } }} />
            <DatePicker
              label="Выберите дату"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              onMonthChange={(newMonth) => {
                // Загружаем данные для нового месяца и соседних месяцев при переключении
                if (newMonth) {
                  const currentMonth = format(newMonth, "yyyy-MM");
                  const prevMonth = format(subMonths(newMonth, 1), "yyyy-MM");
                  const nextMonth = format(addMonths(newMonth, 1), "yyyy-MM");
                  
                  const monthsToLoad = [currentMonth, prevMonth, nextMonth].filter(
                    (month) => !loadedMonths.has(month)
                  );
                  
                  if (monthsToLoad.length > 0) {
                    Promise.all(monthsToLoad.map((month) => loadDatesWithAppointmentsForMonth(month)));
                  }
                }
              }}
              disabled={loading}
              slots={{
                day: (props) => {
                  const { day, ...other } = props;
                  const dateKey = format(day, "yyyy-MM-dd");
                  const allDatesWithAppointments = getAllDatesWithAppointments();
                  const allDatesWithCompletedPhotos = getAllDatesWithCompletedPhotos();
                  const hasAppointments = allDatesWithAppointments.has(dateKey);
                  const hasCompletedPhotos = allDatesWithCompletedPhotos.has(dateKey);
                  const isTodayDate = isToday(day);
                  const isPastDate = isPast(startOfDay(day)) && !isTodayDate;
                  const isDayOffDate = isDayOff(day);
                  
                  return (
                    <Box sx={{ position: "relative", display: "inline-block" }}>
                      <PickersDay
                        {...other}
                        day={day}
                        sx={{
                          position: "relative",
                          // Стили для выходных дней (будущих) без записей
                          ...(isDayOffDate && !isPastDate && !hasAppointments && {
                            color: "error.main",
                            fontWeight: 600,
                          }),
                          // Стили для выходных дней (будущих) с записями - красный цвет, но с фоном
                          ...(isDayOffDate && !isPastDate && hasAppointments && {
                            color: "error.main",
                            fontWeight: 600,
                            bgcolor: "error.light",
                            "&:hover": {
                              bgcolor: "error.main",
                              color: "error.contrastText",
                            },
                            "&.Mui-selected": {
                              bgcolor: "error.main",
                              color: "error.contrastText",
                              "&:hover": {
                                bgcolor: "error.dark",
                              },
                            },
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
                      {/* Индикатор завершенных записей с фотографиями */}
                      {hasCompletedPhotos && (
                        <Box
                          component="span"
                          sx={{
                            position: "absolute",
                            bottom: 2,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: "#FFD700",
                            zIndex: 10,
                            border: "1px solid #FFA500",
                            pointerEvents: "none",
                          }}
                          title={`Есть завершенные записи с фотографиями`}
                        />
                      )}
                    </Box>
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

        {/* Skeleton при загрузке */}
        {loading && appointments.length === 0 ? (
          isMobile ? (
            // Skeleton для мобильного вида (карточки)
            <Stack spacing={2}>
              {[1, 2, 3].map((index) => (
                <Card key={index}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width={200} height={28} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width={150} height={20} />
                      </Box>
                      <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} />
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1}>
                      <Box>
                        <Skeleton variant="text" width={60} height={16} />
                        <Skeleton variant="text" width={150} height={20} />
                      </Box>
                      <Box>
                        <Skeleton variant="text" width={100} height={16} />
                        <Skeleton variant="text" width={200} height={20} />
                      </Box>
                      <Box>
                        <Skeleton variant="text" width={50} height={16} />
                        <Skeleton variant="text" width={100} height={20} />
                      </Box>
                    </Stack>
                    <Box sx={{ mt: 2, display: "flex", gap: 1, flexDirection: "column" }}>
                      <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1 }} />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            // Skeleton для десктопного вида (таблица)
            <Box 
              sx={{ 
                height: 600, 
                width: "100%",
                overflowX: "auto",
              }}
            >
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {columns.map((column, index) => (
                        <TableCell key={index}>
                          <Skeleton variant="text" width={column.width ? `${column.width}px` : 150} height={24} />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                      <TableRow key={row}>
                        {columns.map((column, index) => (
                          <TableCell key={index}>
                            <Skeleton variant="text" width="80%" height={20} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )
        ) : (
          /* Таблица записей или карточки для мобильных */
          appointments.length === 0 ? (
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
                        {(client.phone || client.telegramUsername) && (
                          <Typography variant="body2" color="text.secondary">
                            {client.phone && `📞 ${client.phone}`}
                            {client.phone && client.telegramUsername && " • "}
                            {client.telegramUsername && `✈️ @${client.telegramUsername}`}
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
          )
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

        {/* Модальное окно быстрой записи */}
        {masterSlug && (
          <QuickBookingModal
            open={quickBookingOpen}
            onClose={() => setQuickBookingOpen(false)}
            masterSlug={masterSlug}
            onSuccess={() => {
              loadAppointments();
              if (selectedDate) {
                const monthKey = format(selectedDate, "yyyy-MM");
                // Сбрасываем кэш для этого месяца, чтобы перезагрузить данные
                setLoadedMonths((prev) => {
                  const next = new Set(prev);
                  next.delete(monthKey);
                  return next;
                });
                loadDatesWithAppointmentsForMonth(monthKey);
              }
            }}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

