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
  Pagination,
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
import { getCachedServices, setCachedServices } from "../utils/servicesCache";

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
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [alternativeDays, setAlternativeDays] = useState<Array<{ date: Date; slots: string[] }>>([]);
  const [slotsPage, setSlotsPage] = useState(1);
  const slotsPerPage = 12;
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSettings, setExpandedSettings] = useState(false);
  const [comment, setComment] = useState("");
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [durationOverride, setDurationOverride] = useState<number | null>(null);
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

  // Загружает список услуг мастера с использованием кеша
  // Эндпоинт: GET /api/me/services
  const loadServices = async () => {
    try {
      setLoadingServices(true);
      
      // Пытаемся получить услуги из кеша
      const cachedServices = getCachedServices();
      if (cachedServices) {
        const activeServices = cachedServices.filter((s) => s.isActive);
        setServices(activeServices);
        // Автоматически выбираем первую услугу, если есть
        if (activeServices.length > 0 && !selectedService) {
          setSelectedService(activeServices[0]);
        }
        setLoadingServices(false);
        
        // Загружаем свежие данные в фоне для обновления кеша
        meApi.getServices()
          .then((data) => {
            setCachedServices(data);
            const activeServices = data.filter((s) => s.isActive);
            setServices(activeServices);
          })
          .catch((err) => {
            console.error("Ошибка фоновой загрузки услуг:", err);
            // Игнорируем ошибку, используем кеш
          });
        return;
      }
      
      // Если кеша нет, загружаем с сервера
      const data = await meApi.getServices();
      const activeServices = data.filter((s) => s.isActive);
      setServices(activeServices);
      // Сохраняем в кеш
      setCachedServices(data);
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
  // Бэкенд уже учитывает расписание, перерывы, буферы и существующие записи
  const loadAvailableSlots = async () => {
    if (!selectedDate || !selectedService || !masterSlug) return;

    try {
      setLoadingSlots(true);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Загружаем доступные слоты (бэкенд уже учитывает все факторы)
      const response = await mastersApi.getTimeslots(
        masterSlug,
        dateStr,
        selectedService.id
      );

      // Слоты уже отсортированы по времени (первый - ближайший)
      setAvailableSlots(response.available);

      // Если нет свободных слотов, ищем альтернативные дни
      if (response.available.length === 0) {
        loadAlternativeDays(selectedDate, selectedService);
      } else {
        setAlternativeDays([]);
      }
    } catch (err) {
      console.error("Ошибка загрузки свободных слотов:", err);
      setAvailableSlots([]);
      setAlternativeDays([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Загружает альтернативные дни со свободными слотами
  const loadAlternativeDays = async (currentDate: Date | null, service: Service | null) => {
    if (!currentDate || !service || !masterSlug) return;

    try {
      setLoadingAlternatives(true);
      const alternatives: Array<{ date: Date; slots: string[] }> = [];
      const checkedDays = new Set<string>();

      // Проверяем следующие 7 дней
      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        checkDate.setHours(0, 0, 0, 0);

        const dateKey = format(checkDate, "yyyy-MM-dd");
        if (checkedDays.has(dateKey)) continue;
        checkedDays.add(dateKey);

        const year = checkDate.getFullYear();
        const month = checkDate.getMonth();
        const day = checkDate.getDate();
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        try {
          const response = await mastersApi.getTimeslots(
            masterSlug,
            dateStr,
            service.id
          );

          if (response.available.length > 0) {
            alternatives.push({
              date: checkDate,
              slots: response.available,
            });

            // Останавливаемся, когда найдем 3 дня со свободными слотами
            if (alternatives.length >= 3) {
              break;
            }
          }
        } catch (err) {
          // Игнорируем ошибки для отдельных дней
          console.error(`Ошибка проверки дня ${dateStr}:`, err);
        }
      }

      setAlternativeDays(alternatives);
    } catch (err) {
      console.error("Ошибка загрузки альтернативных дней:", err);
      setAlternativeDays([]);
    } finally {
      setLoadingAlternatives(false);
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
    setError(null);
    setComment("");
    setCustomPrice(null);
    setDurationOverride(null);
    setExpandedSettings(false);
    setAutoFilled({});
  };

  // Пересчитываем цену при изменении услуги
  useEffect(() => {
    if (selectedService) {
      // При изменении услуги сбрасываем кастомную цену, чтобы показать цену новой услуги
      // Пользователь может установить свою цену вручную
      setCustomPrice(null);
      setDurationOverride(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService]);

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

  // Поиск клиента по имени (с debounce 300 мс)
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
    }, 300); // Debounce 300ms

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
        name?: string;
        serviceId: string;
        startAt: string;
        phone?: string;
        telegramUsername?: string;
        comment?: string;
        source?: 'MANUAL' | 'PHONE' | 'WEB' | 'TELEGRAM' | 'VK' | 'WHATSAPP';
        price?: number;
        durationOverride?: number;
      } = {
        serviceId: selectedService.id,
        startAt: startAtISO,
        source: 'MANUAL', // Устанавливаем source=MANUAL для записей из ЛК мастера
      };

      // Добавляем имя только если оно заполнено
      if (name.trim()) {
        bookingData.name = name.trim();
      }

      if (contactType === "phone") {
        const phoneDigits = contact.replace(/[^\d]/g, "");
        bookingData.phone = `+${phoneDigits}`;
      } else {
        bookingData.telegramUsername = contact.trim();
      }

      if (comment.trim()) {
        bookingData.comment = comment.trim();
      }

      // Добавляем кастомную цену, если указана
      if (customPrice !== null && customPrice > 0) {
        bookingData.price = customPrice;
      }

      // Добавляем кастомную длительность, если указана
      if (durationOverride !== null && durationOverride > 0) {
        bookingData.durationOverride = durationOverride;
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
      const errorCode = err?.response?.data?.code;

      // Логируем ошибки для разработчиков
      if (errorCode === 'TIME_SLOT_CONFLICT' || errorMessage.includes('занято')) {
        console.error('[DEV_ANALYTICS] invalidTimeslot:', {
          masterSlug,
          serviceId: selectedService.id,
          startAt: startAtISO,
          error: errorMessage,
        });
      } else if (errorCode === 'SERVICE_NOT_FOUND' || errorMessage.includes('Услуга не найдена')) {
        console.error('[DEV_ANALYTICS] noServices:', {
          masterSlug,
          serviceId: selectedService.id,
          error: errorMessage,
        });
      } else if (errorCode === 'VALIDATION_ERROR' || err?.response?.status === 400) {
        console.error('[DEV_ANALYTICS] validationFailed:', {
          masterSlug,
          error: errorMessage,
          errorCode,
          formData: {
            hasName: !!name.trim(),
            hasContact: !!contact.trim(),
            contactType,
            hasService: !!selectedService,
            hasDate: !!selectedDate,
            hasTime: !!selectedTime,
          },
        });
      }

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
            fontWeight: 600,
          }}
        >
          Быстрая запись
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
                placeholder="Введите имя клиента (необязательно)"
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
                    : "Необязательно"
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
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.price.toLocaleString("ru-RU")} ₽ •{" "}
                          {option.durationMin} мин
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
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
                  ) : availableSlots.length === 0 && !loadingAlternatives ? (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        В этот день нет свободных слотов
                      </Alert>
                      {alternativeDays.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Ближайшие дни со свободными слотами:
                          </Typography>
                          {alternativeDays.map((altDay) => {
                            const dateStr = format(altDay.date, "dd.MM.yyyy (EEEE)", { locale: ru });
                            return (
                              <Button
                                key={altDay.date.toISOString()}
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  setSelectedDate(altDay.date);
                                  setSelectedTime(null);
                                }}
                                sx={{
                                  textTransform: "none",
                                  mb: 1,
                                  mr: 1,
                                  display: "block",
                                }}
                              >
                                {dateStr} ({altDay.slots.length} слотов)
                              </Button>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {/* Показываем доступные слоты с пагинацией */}
                        {availableSlots
                          .slice((slotsPage - 1) * slotsPerPage, slotsPage * slotsPerPage)
                          .map((slotISO) => {
                            const slotDate = new Date(slotISO);
                            const timeStr = format(slotDate, "HH:mm");
                            const isSelected =
                              selectedTime &&
                              Math.abs(selectedTime.getTime() - slotDate.getTime()) < 60000;

                            return (
                              <Button
                                key={slotISO}
                                variant={isSelected ? "contained" : "outlined"}
                                size="small"
                                onClick={() => handleQuickSlotClick(slotISO)}
                                startIcon={<TimeIcon />}
                                sx={{
                                  textTransform: "none",
                                }}
                                title={`Выбрать ${timeStr}`}
                              >
                                {timeStr}
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
                    helperText={
                      selectedService && customPrice === null
                        ? `Текущая цена услуги: ${selectedService.price.toLocaleString("ru-RU")} ₽`
                        : undefined
                    }
                    InputProps={{
                      endAdornment: <Typography sx={{ mr: 1 }}>₽</Typography>,
                    }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Длительность (опционально, минуты)"
                    type="number"
                    value={durationOverride || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDurationOverride(value ? parseInt(value, 10) : null);
                    }}
                    placeholder={
                      selectedService
                        ? `По умолчанию: ${selectedService.durationMin} мин`
                        : "Укажите длительность"
                    }
                    helperText={
                      selectedService && durationOverride === null
                        ? `Текущая длительность услуги: ${selectedService.durationMin} мин`
                        : durationOverride
                        ? `Будет использовано: ${durationOverride} мин вместо ${selectedService?.durationMin || 0} мин`
                        : undefined
                    }
                    InputProps={{
                      endAdornment: <Typography sx={{ mr: 1 }}>мин</Typography>,
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

