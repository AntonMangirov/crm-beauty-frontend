import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ru } from "date-fns/locale";
import { format, isAfter } from "date-fns";
import { meApi, type Service, type ClientListItem } from "../api/me";
import { mastersApi } from "../api/masters";
import { useSnackbar } from "./SnackbarProvider";

interface QuickBookingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  masterSlug: string;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  open,
  onClose,
  onSuccess,
  masterSlug,
}) => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<"phone" | "telegram">("phone");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]); // Занятые слоты
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSettings, setExpandedSettings] = useState(false);
  const [comment, setComment] = useState("");
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [searchingClient, setSearchingClient] = useState(false);
  const [autoFilled, setAutoFilled] = useState<{ name?: boolean; contact?: boolean }>({});
  const [lastManualAppointments, setLastManualAppointments] = useState<Array<{
    id: string;
    serviceId: string;
    service: Service;
    createdAt: string;
  }>>([]);
  const [topServices, setTopServices] = useState<Array<Service & { usageCount: number }>>([]);
  const [loadingLastAppointments, setLoadingLastAppointments] = useState(false);
  const { showSnackbar } = useSnackbar();

  // Загружаем услуги при открытии модального окна
  // Использует: GET /api/me/services
  useEffect(() => {
    if (open) {
      loadServices();
      loadLastManualAppointments();
      loadTopServices();
      // Устанавливаем ближайшую доступную дату (завтра)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      setSelectedDate(tomorrow);
    } else {
      // Сбрасываем форму при закрытии
      resetForm();
    }
  }, [open]);

  // Загружаем свободные слоты при изменении даты или услуги
  useEffect(() => {
    if (open && selectedDate && selectedService) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDate, selectedService]);

  // Устанавливаем ближайший свободный слот при загрузке слотов
  useEffect(() => {
    if (availableSlots.length > 0 && !selectedTime) {
      const firstSlot = availableSlots[0];
      const slotDate = new Date(firstSlot);
      setSelectedTime(slotDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSlots]);

  // Загружает список услуг мастера
  // Эндпоинт: GET /api/me/services
  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const data = await meApi.getServices();
      const activeServices = data.filter((s) => s.isActive);
      setServices(activeServices);
      // Автоматически выбираем первую услугу, если есть
      if (activeServices.length > 0 && !selectedService) {
        setSelectedService(activeServices[0]);
      }
    } catch (err) {
      console.error("Ошибка загрузки услуг:", err);
      showSnackbar("Не удалось загрузить услуги", "error");
    } finally {
      setLoadingServices(false);
    }
  };

  // Загружает последние ручные записи для быстрого повтора услуги
  const loadLastManualAppointments = async () => {
    try {
      setLoadingLastAppointments(true);
      const data = await meApi.getLastManualAppointments(3);
      setLastManualAppointments(data);
    } catch (err) {
      console.error("Ошибка загрузки последних записей:", err);
    } finally {
      setLoadingLastAppointments(false);
    }
  };

  // Загружает топ-5 наиболее используемых услуг
  const loadTopServices = async () => {
    try {
      const data = await meApi.getTopServices(5, 90);
      setTopServices(data);
    } catch (err) {
      console.error("Ошибка загрузки топ услуг:", err);
    }
  };

  // Обновляем выбранную услугу после загрузки последних записей и услуг
  useEffect(() => {
    if (lastManualAppointments.length > 0 && !selectedService && services.length > 0) {
      const lastService = services.find(s => s.id === lastManualAppointments[0].serviceId);
      if (lastService) {
        setSelectedService(lastService);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastManualAppointments, services]);

  // Загружает ближайшие свободные слоты для выбранной даты и услуги
  // Эндпоинт: GET /api/public/:slug/timeslots?date=YYYY-MM-DD&serviceId=xxx
  // Возвращает массив ISO строк, отсортированных по времени (первый - ближайший)
  // Также загружает занятые слоты для отображения как disabled
  const loadAvailableSlots = async () => {
    if (!selectedDate || !selectedService || !masterSlug) return;

    try {
      setLoadingSlots(true);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Загружаем свободные слоты
      const response = await mastersApi.getTimeslots(
        masterSlug,
        dateStr,
        selectedService.id
      );

      // Слоты уже отсортированы по времени (первый - ближайший)
      setAvailableSlots(response.available);

      // Загружаем занятые слоты для отображения как disabled
      const utcStartOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const utcEndOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

      try {
        const appointments = await meApi.getAppointments({
          from: utcStartOfDay.toISOString(),
          to: utcEndOfDay.toISOString(),
        });

        // Извлекаем занятые временные слоты (исключаем отмененные)
        const booked: string[] = [];
        appointments.forEach((apt) => {
          if (apt.status !== "CANCELED" && apt.status !== "NO_SHOW") {
            booked.push(apt.startAt);
          }
        });
        setBookedSlots(booked);
      } catch (err) {
        console.error("Ошибка загрузки занятых слотов:", err);
        setBookedSlots([]);
      }
    } catch (err) {
      console.error("Ошибка загрузки свободных слотов:", err);
      setAvailableSlots([]);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const resetForm = () => {
    setName("");
    setContact("");
    setContactType("phone");
    setSelectedService(null);
    setServiceSearch("");
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableSlots([]);
    setBookedSlots([]);
    setError(null);
    setComment("");
    setCustomPrice(null);
    setExpandedSettings(false);
    setAutoFilled({});
  };

  // Поиск клиента по имени (с debounce)
  useEffect(() => {
    if (!name.trim() || name.trim().length < 2 || autoFilled.name) {
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setSearchingClient(true);
        const clients = await meApi.getClients({ name: name.trim() });
        if (clients.length > 0) {
          const client = clients[0]; // Берем первого найденного
          // Подставляем контакт, если он не заполнен
          if (!contact.trim()) {
            if (client.phone) {
              setContactType("phone");
              const formatted = formatPhoneDisplay(client.phone);
              setContact(formatted);
              setAutoFilled({ ...autoFilled, contact: true });
            } else if (client.telegramUsername) {
              setContactType("telegram");
              setContact(client.telegramUsername);
              setAutoFilled({ ...autoFilled, contact: true });
            }
          }
        }
      } catch (err) {
        console.error("Ошибка поиска клиента:", err);
      } finally {
        setSearchingClient(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(searchTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // Поиск клиента по контакту (обратная логика)
  useEffect(() => {
    if (!contact.trim() || contact.trim().length < 3 || autoFilled.contact) {
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setSearchingClient(true);
        const searchQuery = contactType === "phone" 
          ? contact.replace(/[^\d+]/g, "")
          : contact.trim().replace(/^@/, "");
        
        const clients = await meApi.getClients({ 
          phone: searchQuery 
        });
        
        if (clients.length > 0) {
          const client = clients[0]; // Берем первого найденного
          // Подставляем имя, если оно не заполнено
          if (!name.trim()) {
            setName(client.name);
            setAutoFilled({ ...autoFilled, name: true });
          }
        }
      } catch (err) {
        console.error("Ошибка поиска клиента:", err);
      } finally {
        setSearchingClient(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(searchTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact, contactType]);

  const formatPhoneDisplay = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("8")) {
      cleaned = "+7" + cleaned.slice(1);
    } else if (cleaned.startsWith("7") && !cleaned.startsWith("+7")) {
      cleaned = "+7" + cleaned.slice(1);
    } else if (!cleaned.startsWith("+7") && /^\d/.test(cleaned)) {
      cleaned = "+7" + cleaned;
    }
    if (cleaned.length > 12) {
      cleaned = cleaned.slice(0, 12);
    }
    if (cleaned.startsWith("+7")) {
      const digits = cleaned.slice(2);
      if (digits.length === 0) return "+7";
      if (digits.length <= 3) return `+7 (${digits}`;
      if (digits.length <= 6)
        return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
      if (digits.length <= 8)
        return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
    }
    return cleaned;
  };

  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/[^\d+\s()-]/g, "");
    if (!cleaned || cleaned === "+") {
      cleaned = "+7";
    } else if (cleaned.startsWith("8") && !cleaned.startsWith("+7")) {
      cleaned = "+7" + cleaned.slice(1);
    }
    if (cleaned.length > 18) {
      cleaned = cleaned.slice(0, 18);
    }
    const formatted = formatPhoneDisplay(cleaned);
    setContact(formatted);
  };

  const handleTelegramChange = (value: string) => {
    // Убираем @ если пользователь его ввел
    const cleaned = value.replace(/^@/, "").replace(/\s/g, "");
    setContact(cleaned);
  };

  const handleContactTypeChange = (type: "phone" | "telegram") => {
    setContactType(type);
    setContact("");
  };

  const handleSave = async () => {
    setError(null);

    // Валидация
    if (!masterSlug) {
      setError("Ошибка: не указан мастер");
      return;
    }

    if (!name.trim()) {
      setError("Введите имя клиента");
      return;
    }

    if (!selectedService) {
      setError("Выберите услугу");
      return;
    }

    if (!contact.trim()) {
      setError("Введите контакт (телефон или Telegram)");
      return;
    }

    if (contactType === "phone") {
      const phoneDigits = contact.replace(/[^\d]/g, "");
      if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
        setError("Неверный формат телефона");
        return;
      }
    }

    if (!selectedDate || !selectedTime) {
      setError("Выберите дату и время");
      return;
    }

    // Формируем дату и время начала записи в UTC
    // Используем локальные компоненты даты и создаём UTC дату
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();

    // Создаём UTC дату с UTC временем (API ожидает UTC)
    const startDateTime = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));

    // Проверяем, что время в будущем
    if (!isAfter(startDateTime, new Date())) {
      setError("Выберите время в будущем");
      return;
    }

    // Формируем ISO строку для отправки на сервер
    const startAtISO = startDateTime.toISOString();

    try {
      setSaving(true);

      const bookingData: {
        name: string;
        serviceId: string;
        startAt: string;
        phone?: string;
        telegramUsername?: string;
        comment?: string;
        source?: 'MANUAL' | 'PHONE' | 'WEB' | 'TELEGRAM' | 'VK' | 'WHATSAPP';
      } = {
        name: name.trim(),
        serviceId: selectedService.id,
        startAt: startAtISO,
        source: 'MANUAL', // Устанавливаем source=MANUAL для записей из ЛК мастера
      };

      if (contactType === "phone") {
        const phoneDigits = contact.replace(/[^\d]/g, "");
        bookingData.phone = `+${phoneDigits}`;
      } else {
        bookingData.telegramUsername = contact.trim();
      }

      if (comment.trim()) {
        bookingData.comment = comment.trim();
      }

      // Создание записи через публичный API
      // Эндпоинт: POST /api/public/:slug/book
      // В dev режиме reCAPTCHA не требуется, в production требуется
      await mastersApi.bookAppointment(masterSlug, bookingData);

      showSnackbar("Запись успешно создана!", "success");
      resetForm();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Ошибка создания записи:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось создать запись";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSlotClick = (slotISO: string) => {
    const slotDate = new Date(slotISO);
    setSelectedTime(slotDate);
  };

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Быстрая запись
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Имя */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Имя клиента"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  // Сбрасываем флаг автоподстановки при ручном изменении
                  if (autoFilled.name) {
                    setAutoFilled({ ...autoFilled, name: false });
                  }
                }}
                required
                placeholder="Введите имя"
                autoFocus
                InputProps={{
                  endAdornment: searchingClient ? (
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                  ) : autoFilled.name ? (
                    <Chip
                      label="Найдено"
                      size="small"
                      color="success"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  ) : null,
                }}
                helperText={
                  autoFilled.name
                    ? "Имя найдено по контакту"
                    : name.trim().length >= 2
                    ? "Идет поиск клиента..."
                    : undefined
                }
              />
            </Grid>

            {/* Контакт */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <Button
                  variant={contactType === "phone" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => handleContactTypeChange("phone")}
                  sx={{ textTransform: "none" }}
                >
                  Телефон
                </Button>
                <Button
                  variant={contactType === "telegram" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => handleContactTypeChange("telegram")}
                  sx={{ textTransform: "none" }}
                >
                  Telegram
                </Button>
              </Box>
              <TextField
                fullWidth
                label={contactType === "phone" ? "Телефон" : "Telegram (@ник)"}
                value={contact}
                onChange={(e) => {
                  if (contactType === "phone") {
                    handlePhoneChange(e.target.value);
                  } else {
                    handleTelegramChange(e.target.value);
                  }
                  // Сбрасываем флаг автоподстановки при ручном изменении
                  if (autoFilled.contact) {
                    setAutoFilled({ ...autoFilled, contact: false });
                  }
                }}
                required
                placeholder={
                  contactType === "phone"
                    ? "+7 (999) 123-45-67"
                    : "username"
                }
                InputProps={{
                  startAdornment:
                    contactType === "telegram" ? (
                      <Typography sx={{ mr: 1, color: "text.secondary" }}>
                        @
                      </Typography>
                    ) : null,
                  endAdornment: searchingClient ? (
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                  ) : autoFilled.contact ? (
                    <Chip
                      label="Найдено"
                      size="small"
                      color="success"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  ) : null,
                }}
                helperText={
                  autoFilled.contact
                    ? "Контакт найден по имени"
                    : contact.trim().length >= 3
                    ? "Идет поиск клиента..."
                    : undefined
                }
              />
            </Grid>

            {/* Услуга */}
            <Grid size={{ xs: 12 }}>
              {/* Кнопка "Повторить прошлую услугу" */}
              {lastManualAppointments.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const lastAppointment = lastManualAppointments[0];
                      const service = services.find(s => s.id === lastAppointment.serviceId);
                      if (service) {
                        setSelectedService(service);
                        setServiceSearch("");
                      }
                    }}
                    sx={{ textTransform: "none", fontSize: "0.875rem" }}
                    disabled={loadingLastAppointments}
                  >
                    🔄 Повторить прошлую услугу: {lastManualAppointments[0].service.name}
                  </Button>
                </Box>
              )}
              
              {/* Топ-5 услуг */}
              {topServices.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Популярные услуги:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {topServices.slice(0, 5).map((service) => (
                      <Chip
                        key={service.id}
                        label={`${service.name} (${service.usageCount})`}
                        size="small"
                        onClick={() => {
                          const fullService = services.find(s => s.id === service.id);
                          if (fullService) {
                            setSelectedService(fullService);
                            setServiceSearch("");
                          }
                        }}
                        sx={{
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          height: "24px",
                          bgcolor: selectedService?.id === service.id ? "primary.main" : "action.selected",
                          color: selectedService?.id === service.id ? "primary.contrastText" : "text.primary",
                          "&:hover": {
                            bgcolor: selectedService?.id === service.id ? "primary.dark" : "action.hover",
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              <Autocomplete
                options={filteredServices}
                getOptionLabel={(option) => option.name}
                value={selectedService}
                onChange={(_, newValue) => {
                  setSelectedService(newValue);
                  setServiceSearch("");
                }}
                inputValue={serviceSearch}
                onInputChange={(_, newInputValue) => {
                  setServiceSearch(newInputValue);
                }}
                loading={loadingServices}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Услуга"
                    required
                    placeholder="Выберите или введите для поиска"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.price.toLocaleString("ru-RU")} ₽ •{" "}
                        {option.durationMin} мин
                      </Typography>
                    </Box>
                  </Box>
                )}
                freeSolo={false}
              />
            </Grid>

            {/* Дата и время */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label="Дата"
                value={selectedDate}
                onChange={(newValue) => {
                  setSelectedDate(newValue);
                  setSelectedTime(null);
                }}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TimePicker
                label="Время"
                value={selectedTime}
                onChange={(newValue) => setSelectedTime(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            {/* Быстрые кнопки со свободными слотами */}
            {selectedDate && selectedService && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Быстрый выбор времени
                  </Typography>
                  {loadingSlots ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {/* Генерируем все возможные слоты для дня (9:00-18:00) */}
                      {(() => {
                        const allSlots: Array<{ time: string; iso: string; available: boolean }> = [];
                        const year = selectedDate.getFullYear();
                        const month = selectedDate.getMonth();
                        const day = selectedDate.getDate();

                        // Генерируем все слоты с 9:00 до 18:00
                        for (let hour = 9; hour < 18; hour++) {
                          const slotDate = new Date(Date.UTC(year, month, day, hour, 0, 0, 0));
                          const timeStr = format(slotDate, "HH:mm");
                          const slotISO = slotDate.toISOString();
                          const isAvailable = availableSlots.includes(slotISO);
                          const isBooked = bookedSlots.some((booked) => {
                            const bookedDate = new Date(booked);
                            return (
                              bookedDate.getUTCHours() === hour &&
                              bookedDate.getUTCMinutes() === 0
                            );
                          });

                          allSlots.push({
                            time: timeStr,
                            iso: slotISO,
                            available: isAvailable && !isBooked,
                          });
                        }

                        return allSlots.slice(0, 10).map((slot) => {
                          const slotDate = new Date(slot.iso);
                          const isSelected =
                            selectedTime &&
                            Math.abs(selectedTime.getTime() - slotDate.getTime()) < 60000;

                          return (
                            <Button
                              key={slot.iso}
                              variant={isSelected ? "contained" : "outlined"}
                              size="small"
                              onClick={() => slot.available && handleQuickSlotClick(slot.iso)}
                              disabled={!slot.available}
                              startIcon={<TimeIcon />}
                              sx={{
                                textTransform: "none",
                                opacity: slot.available ? 1 : 0.5,
                              }}
                              title={
                                slot.available
                                  ? `Выбрать ${slot.time}`
                                  : `Время ${slot.time} занято`
                              }
                            >
                              {slot.time}
                            </Button>
                          );
                        });
                      })()}
                    </Box>
                  )}
                </Box>
              </Grid>
            )}

            {/* Расширенные настройки */}
            <Grid size={{ xs: 12 }}>
              <Button
                fullWidth
                onClick={() => setExpandedSettings(!expandedSettings)}
                endIcon={expandedSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                  textTransform: "none",
                  justifyContent: "space-between",
                  color: "text.secondary",
                }}
              >
                Расширенные настройки
              </Button>
              <Collapse in={expandedSettings}>
                <Box sx={{ mt: 2, pl: 2, borderLeft: 2, borderColor: "divider" }}>
                  <TextField
                    fullWidth
                    label="Комментарий"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Дополнительная информация о записи..."
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Цена (опционально)"
                    type="number"
                    value={customPrice || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomPrice(value ? parseFloat(value) : null);
                    }}
                    placeholder={
                      selectedService
                        ? `По умолчанию: ${selectedService.price.toLocaleString("ru-RU")} ₽`
                        : "Укажите цену"
                    }
                    InputProps={{
                      endAdornment: <Typography sx={{ mr: 1 }}>₽</Typography>,
                    }}
                  />
                </Box>
              </Collapse>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none" }}>
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
            {saving ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Сохранение...
              </>
            ) : (
              "Сохранить"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

