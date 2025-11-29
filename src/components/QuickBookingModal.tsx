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
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
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
import { logError } from "../utils/logger";

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
  const [smartPaste, setSmartPaste] = useState(""); // Поле для умной вставки сообщения
  const [name, setName] = useState(""); // Отдельное поле для имени клиента
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<"phone" | "telegram">("phone");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedSlotISO, setSelectedSlotISO] = useState<string | null>(null); // ISO строка выбранного слота для точного сохранения
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [alternativeDays, setAlternativeDays] = useState<
    Array<{ date: Date; slots: string[] }>
  >([]);
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
  const [autoFilled, setAutoFilled] = useState<{
    name?: boolean;
    contact?: boolean;
  }>({});
  const [lastManualAppointments, setLastManualAppointments] = useState<
    Array<{
      id: string;
      serviceId: string;
      service: Service;
      createdAt: string;
    }>
  >([]);
  const [topServices, setTopServices] = useState<
    Array<Service & { usageCount: number }>
  >([]);
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
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Загружаем свободные слоты при изменении даты или услуг
  useEffect(() => {
    if (open && selectedDate && selectedServices.length > 0) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDate, selectedServices]);

  // Устанавливаем ближайший свободный слот при загрузке слотов
  useEffect(() => {
    if (availableSlots.length > 0 && !selectedTime) {
      const firstSlot = availableSlots[0];
      const slotDate = new Date(firstSlot);
      setSelectedTime(slotDate);
      setSelectedSlotISO(firstSlot); // Сохраняем ISO строку для точного сохранения
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
        if (activeServices.length > 0 && selectedServices.length === 0) {
          setSelectedServices([activeServices[0]]);
        }
        setLoadingServices(false);

        // Загружаем свежие данные в фоне для обновления кеша
        meApi
          .getServices()
          .then((data) => {
            setCachedServices(data);
            const activeServices = data.filter((s) => s.isActive);
            setServices(activeServices);
          })
          .catch((err) => {
            logError("Ошибка фоновой загрузки услуг:", err);
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
      if (activeServices.length > 0 && selectedServices.length === 0) {
        setSelectedServices([activeServices[0]]);
      }
    } catch (err) {
      logError("Ошибка загрузки услуг:", err);
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
      logError("Ошибка загрузки последних записей:", err);
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
      logError("Ошибка загрузки топ услуг:", err);
    }
  };

  // Обновляем выбранную услугу после загрузки последних записей и услуг
  // Только если услуги еще не выбраны (не перезаписываем пользовательский выбор)
  useEffect(() => {
    if (
      lastManualAppointments.length > 0 &&
      selectedServices.length === 0 &&
      services.length > 0
    ) {
      const lastService = services.find(
        (s) => s.id === lastManualAppointments[0].serviceId
      );
      if (lastService) {
        setSelectedServices([lastService]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastManualAppointments, services]);

  // Загружает ближайшие свободные слоты для выбранной даты и услуг
  // Эндпоинт: GET /api/public/:slug/timeslots?date=YYYY-MM-DD&serviceId=xxx
  // Возвращает массив ISO строк, отсортированных по времени (первый - ближайший)
  // Бэкенд уже учитывает расписание, перерывы, буферы и существующие записи
  // Используем первую услугу для расчета слотов (или можно использовать максимальную длительность)
  const loadAvailableSlots = async () => {
    if (!selectedDate || selectedServices.length === 0 || !masterSlug) return;

    try {
      setLoadingSlots(true);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      // Загружаем доступные слоты (бэкенд уже учитывает все факторы)
      // Используем первую услугу для расчета слотов
      const response = await mastersApi.getTimeslots(
        masterSlug,
        dateStr,
        selectedServices[0].id
      );

      // Слоты уже отсортированы по времени (первый - ближайший)
      setAvailableSlots(response.available);

      // Если нет свободных слотов, ищем альтернативные дни
      if (response.available.length === 0) {
        loadAlternativeDays(selectedDate, selectedServices[0]);
      } else {
        setAlternativeDays([]);
      }
    } catch (err) {
      logError("Ошибка загрузки свободных слотов:", err);
      setAvailableSlots([]);
      setAlternativeDays([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Загружает альтернативные дни со свободными слотами
  const loadAlternativeDays = async (
    currentDate: Date | null,
    service: Service | null
  ) => {
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
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;

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
          logError(`Ошибка проверки дня ${dateStr}:`, err);
        }
      }

      setAlternativeDays(alternatives);
    } catch (err) {
      logError("Ошибка загрузки альтернативных дней:", err);
      setAlternativeDays([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSmartPaste("");
    setContact("");
    setContactType("phone");
    setSelectedServices([]);
    setServiceSearch("");
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedSlotISO(null);
    setAvailableSlots([]);
    setError(null);
    setComment("");
    setCustomPrice(null);
    setDurationOverride(null);
    setExpandedSettings(false);
    setAutoFilled({});
  };

  // Пересчитываем цену при изменении услуг
  useEffect(() => {
    if (selectedServices.length > 0) {
      // При изменении услуг сбрасываем кастомную цену, чтобы показать цену новых услуг
      // Пользователь может установить свою цену вручную
      setCustomPrice(null);
      setDurationOverride(null);
    }
  }, [selectedServices]);

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
        return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
          6
        )}`;
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
        6,
        8
      )}-${digits.slice(8, 10)}`;
    }
    return cleaned;
  };

  // Функция для распознавания ключевых слов дат и установки даты
  const parseDateKeywords = (
    text: string
  ): { date: Date | null; textWithoutDate: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ключевые слова для дат
    // Используем более простой и надежный подход: ищем слово как отдельное слово
    // \b не работает с кириллицей, поэтому используем явные границы
    const dateKeywords: Array<{
      pattern: RegExp;
      getOffset: (match: RegExpMatchArray) => number;
    }> = [
      // Ищем слово, перед которым начало строки, пробел или не буква/цифра
      // И после которого пробел, не буква/цифра или конец строки
      // Используем простой поиск слова с учетом границ
      // Ищем слово, перед которым пробел, начало строки или не буква/цифра
      // И после которого пробел, конец строки или не буква/цифра
      // Для кириллицы используем явную проверку [^а-яёa-z0-9]
      {
        pattern: /(?:^|\s|[^а-яёa-z0-9])сегодня(?:\s|[^а-яёa-z0-9]|$)/i,
        getOffset: () => 0,
      },
      {
        pattern: /(?:^|\s|[^а-яёa-z0-9])завтра(?:\s|[^а-яёa-z0-9]|$)/i,
        getOffset: () => 1,
      },
      {
        pattern: /(?:^|\s|[^а-яёa-z0-9])послезавтра(?:\s|[^а-яёa-z0-9]|$)/i,
        getOffset: () => 2,
      },
      {
        pattern: /(?:^|\s|[^а-яёa-z0-9])через\s+день(?:\s|[^а-яёa-z0-9]|$)/i,
        getOffset: () => 1,
      },
      {
        pattern: /(?:^|\s|[^а-яёa-z0-9])через\s+(\d+)\s+дн/i,
        getOffset: (match) => parseInt(match[1], 10),
      },
    ];

    let foundDate: Date | null = null;
    let textWithoutDate = text;

    for (const { pattern, getOffset } of dateKeywords) {
      const match = text.match(pattern);
      if (match) {
        const daysOffset = getOffset(match);
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + daysOffset);
        foundDate = targetDate;

        // Убираем ключевое слово из текста (включая возможные знаки препинания вокруг)
        // Заменяем найденное совпадение на пробел, затем убираем лишние пробелы
        textWithoutDate = text
          .replace(pattern, " ")
          .replace(/\s+/g, " ")
          .trim();
        break;
      }
    }

    return { date: foundDate, textWithoutDate };
  };

  // Обработка умной вставки сообщения (с debounce 300 мс)
  // Парсит сообщение и заполняет соответствующие поля
  useEffect(() => {
    const pasteTrimmed = smartPaste.trim();

    if (!pasteTrimmed || pasteTrimmed.length < 2) {
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setSearchingClient(true);

        // Проверяем, содержит ли введенный текст телефон
        // Паттерн для российских телефонов: +7, 7, 8 с последующими 10 цифрами (возможно с разделителями)
        const phonePattern =
          /(\+?7|8)[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d/;
        const phoneMatch = pasteTrimmed.match(phonePattern);

        // Проверяем, содержит ли текст Telegram username
        const telegramPattern = /@[\w]+/;
        const telegramMatch = pasteTrimmed.match(telegramPattern);

        // Извлекаем текст без телефона и Telegram для поиска услуги и даты
        // Важно: удаляем телефон точно по найденному совпадению
        let textForParsing = pasteTrimmed;
        if (phoneMatch) {
          // Заменяем найденный телефон на пустую строку
          textForParsing = textForParsing.replace(phoneMatch[0], "").trim();
        }
        if (telegramMatch) {
          textForParsing = textForParsing.replace(telegramMatch[0], "").trim();
        }

        // Парсим ключевые слова дат
        const { date: parsedDate, textWithoutDate } =
          parseDateKeywords(textForParsing);

        // Устанавливаем дату, если найдена
        if (parsedDate) {
          // Убеждаемся, что дата устанавливается правильно
          const dateToSet = new Date(parsedDate);
          dateToSet.setHours(0, 0, 0, 0);
          setSelectedDate(dateToSet);
          setSelectedTime(null);
          setSelectedSlotISO(null);
        }

        // Используем текст без даты для поиска услуги
        const searchText = textWithoutDate;

        let clients: ClientListItem[] = [];

        if (phoneMatch) {
          // Если найден телефон, извлекаем его и ищем по телефону
          // Извлекаем только цифры из найденного телефона
          const phoneDigits = phoneMatch[0].replace(/[^\d]/g, "");
          let cleanedPhone = phoneDigits;

          // Нормализуем телефон: должен быть формат 7XXXXXXXXXX (11 цифр)
          if (phoneDigits.startsWith("8") && phoneDigits.length === 11) {
            // Заменяем 8 на 7
            cleanedPhone = "7" + phoneDigits.slice(1);
          } else if (phoneDigits.startsWith("7") && phoneDigits.length === 11) {
            // Уже в правильном формате
            cleanedPhone = phoneDigits;
          } else if (phoneDigits.length === 10) {
            // Если 10 цифр, добавляем 7 в начало
            cleanedPhone = "7" + phoneDigits;
          } else if (
            phoneDigits.length === 11 &&
            !phoneDigits.startsWith("7") &&
            !phoneDigits.startsWith("8")
          ) {
            // Если 11 цифр, но не начинается с 7 или 8, добавляем 7 в начало
            cleanedPhone = "7" + phoneDigits;
          }

          // Ищем по телефону
          if (cleanedPhone.length >= 10) {
            clients = await meApi.getClients({ phone: cleanedPhone });
          }

          // Если не найдено по телефону, пробуем поиск по имени (без телефона)
          if (clients.length === 0) {
            const nameWithoutPhone = pasteTrimmed
              .replace(phonePattern, "")
              .trim();
            if (nameWithoutPhone.length >= 2) {
              clients = await meApi.getClients({ name: nameWithoutPhone });
            }
          }
        } else if (telegramMatch) {
          // Если найден Telegram username, ищем по нему
          // API getClients поддерживает поиск по telegramUsername через параметр phone
          const telegramUsername = telegramMatch[0].replace(/^@/, "");
          clients = await meApi.getClients({ phone: telegramUsername });
          // Если не найдено, пробуем поиск по имени
          if (clients.length === 0) {
            const nameWithoutTelegram = pasteTrimmed
              .replace(telegramPattern, "")
              .trim();
            if (nameWithoutTelegram.length >= 2) {
              clients = await meApi.getClients({ name: nameWithoutTelegram });
            }
          }
        } else {
          // Если телефона и Telegram нет, ищем только по имени
          clients = await meApi.getClients({ name: pasteTrimmed });
        }

        if (clients.length > 0) {
          const client = clients[0]; // Берем первого найденного

          // Подставляем имя в поле имени, если оно не заполнено
          if (!name.trim()) {
            setName(client.name);
            setAutoFilled({ ...autoFilled, name: true });
          }

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
        } else {
          // Если клиент не найден, но есть контакт в тексте, заполняем поле контакта
          if (!contact.trim()) {
            if (phoneMatch) {
              // Если есть телефон в тексте, заполняем поле контакта
              // Извлекаем только цифры из найденного телефона
              const phoneDigits = phoneMatch[0].replace(/[^\d]/g, "");
              let cleanedPhone = phoneDigits;

              // Нормализуем телефон: должен быть формат 7XXXXXXXXXX (11 цифр)
              if (phoneDigits.startsWith("8") && phoneDigits.length === 11) {
                // Заменяем 8 на 7
                cleanedPhone = "7" + phoneDigits.slice(1);
              } else if (
                phoneDigits.startsWith("7") &&
                phoneDigits.length === 11
              ) {
                // Уже в правильном формате
                cleanedPhone = phoneDigits;
              } else if (phoneDigits.length === 10) {
                // Если 10 цифр, добавляем 7 в начало
                cleanedPhone = "7" + phoneDigits;
              } else if (
                phoneDigits.length === 11 &&
                !phoneDigits.startsWith("7") &&
                !phoneDigits.startsWith("8")
              ) {
                // Если 11 цифр, но не начинается с 7 или 8, добавляем 7 в начало
                cleanedPhone = "7" + phoneDigits;
              }

              if (cleanedPhone.length >= 10) {
                setContactType("phone");
                // formatPhoneDisplay ожидает телефон в формате "7XXXXXXXXXX" или "+7XXXXXXXXXX"
                // Передаем без "+", функция сама добавит его
                const formatted = formatPhoneDisplay(cleanedPhone);
                setContact(formatted);
                setAutoFilled({ ...autoFilled, contact: true });
              }
            } else if (telegramMatch) {
              // Если есть Telegram username в тексте, заполняем поле контакта
              const telegramUsername = telegramMatch[0].replace(/^@/, "");
              setContactType("telegram");
              setContact(telegramUsername);
              setAutoFilled({ ...autoFilled, contact: true });
            }
          }
        }

        // Ищем услугу по ключевым словам из текста (после телефона и даты)
        // Работает независимо от того, найден ли клиент
        // Используем текст без даты для поиска, если он достаточно длинный
        // Иначе используем текст без телефона и Telegram (но с датой, если она была)
        const finalSearchText =
          searchText.length >= 2 ? searchText : textForParsing;
        const finalHasSearchText = finalSearchText.length >= 2;

        // Поиск услуги выполняется всегда, если есть текст для поиска
        if (services.length > 0 && finalHasSearchText) {
          // Ищем услугу, название которой содержит ключевые слова из текста
          // Очищаем слова от знаков препинания перед поиском
          const searchWords = finalSearchText
            .toLowerCase()
            .split(/\s+/)
            .map((word) => word.replace(/[^\wа-яё]/gi, "")) // Удаляем все знаки препинания
            .filter((word) => word.length >= 2);

          if (searchWords.length > 0) {
            // Ищем услугу, которая содержит хотя бы одно ключевое слово
            const matchingService = services.find((service) => {
              const serviceNameLower = service.name.toLowerCase();
              // Проверяем, содержит ли название услуги хотя бы одно из ключевых слов
              return searchWords.some((word) =>
                serviceNameLower.includes(word)
              );
            });

            if (matchingService) {
              // Если найдена услуга по ключевому слову, заменяем все выбранные услуги на неё
              // Это позволяет пользователю вставить текст и автоматически выбрать нужную услугу
              setSelectedServices([matchingService]);
            } else {
              // Если в тексте есть слова для поиска, но услуга не найдена,
              // очищаем выбранные услуги, чтобы пользователь мог выбрать нужную вручную
              // Это предотвращает ситуацию, когда автоматически выбранная услуга остается,
              // хотя в тексте её не было
              setSelectedServices([]);
            }
          }
        }
      } catch (err) {
        logError("Ошибка обработки умной вставки:", err);
      } finally {
        setSearchingClient(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smartPaste, services]);

  // Поиск клиента по имени (с debounce 300 мс)
  // Работает только для поля имени, не для умной вставки
  useEffect(() => {
    const nameTrimmed = name.trim();

    // Если имя пустое или слишком короткое, не ищем
    if (!nameTrimmed || nameTrimmed.length < 2 || autoFilled.name) {
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setSearchingClient(true);

        // Ищем клиента только по имени
        const clients = await meApi.getClients({ name: nameTrimmed });

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
        logError("Ошибка поиска клиента:", err);
      } finally {
        setSearchingClient(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, services]);

  // Поиск клиента по контакту (обратная логика)
  useEffect(() => {
    if (!contact.trim() || contact.trim().length < 3 || autoFilled.contact) {
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setSearchingClient(true);
        const searchQuery =
          contactType === "phone"
            ? contact.replace(/[^\d+]/g, "")
            : contact.trim().replace(/^@/, "");

        const clients = await meApi.getClients({
          phone: searchQuery,
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
        logError("Ошибка поиска клиента:", err);
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

    if (selectedServices.length === 0) {
      setError("Выберите хотя бы одну услугу");
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
    let startAtISO: string;

    // Если слот был выбран из списка доступных слотов, используем его ISO строку напрямую
    // Это гарантирует точное соответствие времени, которое вернул API
    if (selectedSlotISO) {
      // Проверяем, что выбранный слот все еще доступен
      if (!availableSlots.includes(selectedSlotISO)) {
        setError(
          "Выбранное время больше не доступно. Пожалуйста, выберите другое время."
        );
        // Обновляем список слотов
        loadAvailableSlots();
        return;
      }
      startAtISO = selectedSlotISO;
    } else {
      // Если время выбрано вручную через TimePicker, преобразуем локальное время в UTC
      // Используем локальные компоненты даты и создаём UTC дату
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();

      // Создаём UTC дату с UTC временем (API ожидает UTC)
      const startDateTime = new Date(
        Date.UTC(year, month, day, hours, minutes, 0, 0)
      );
      startAtISO = startDateTime.toISOString();
    }

    // Проверяем, что время в будущем
    const startDateTime = new Date(startAtISO);
    if (!isAfter(startDateTime, new Date())) {
      setError("Выберите время в будущем");
      return;
    }

    try {
      setSaving(true);

      // Создаем записи для всех выбранных услуг последовательно
      let currentStartAt = new Date(startAtISO);
      const createdAppointments: string[] = [];

      for (let i = 0; i < selectedServices.length; i++) {
        const service = selectedServices[i];

        // Для первой услуги используем выбранное время
        // Для последующих - добавляем длительность предыдущей услуги
        if (i > 0) {
          const previousService = selectedServices[i - 1];
          const previousDuration =
            durationOverride && i === 1
              ? durationOverride
              : previousService.durationMin;
          currentStartAt = new Date(
            currentStartAt.getTime() + previousDuration * 60000
          );
        }

        const bookingData: {
          name: string;
          serviceId: string;
          startAt: string;
          phone?: string;
          telegramUsername?: string;
          comment?: string;
          source?: "MANUAL" | "PHONE" | "WEB" | "TELEGRAM" | "VK" | "WHATSAPP";
          price?: number;
          durationOverride?: number;
        } = {
          name: name.trim() || "Клиент", // Имя обязательно, используем "Клиент" если не указано
          serviceId: service.id,
          startAt: currentStartAt.toISOString(),
          source: "MANUAL", // Устанавливаем source=MANUAL для записей из ЛК мастера
        };

        // Добавляем контакт только для первой записи
        if (i === 0) {
          if (contactType === "phone") {
            const phoneDigits = contact.replace(/[^\d]/g, "");
            bookingData.phone = `+${phoneDigits}`;
          } else {
            bookingData.telegramUsername = contact.trim();
          }
        }

        // Добавляем комментарий только для первой записи
        if (comment.trim() && i === 0) {
          bookingData.comment = comment.trim();
        }

        // Добавляем кастомную цену, если указана (только для первой услуги)
        if (customPrice !== null && customPrice > 0 && i === 0) {
          bookingData.price = customPrice;
        }

        // Добавляем кастомную длительность, если указана (только для первой услуги)
        if (durationOverride !== null && durationOverride > 0 && i === 0) {
          bookingData.durationOverride = durationOverride;
        }

        // Создание записи через публичный API
        // Эндпоинт: POST /api/public/:slug/book
        // В dev режиме reCAPTCHA не требуется, в production требуется
        const response = await mastersApi.bookAppointment(
          masterSlug,
          bookingData
        );
        createdAppointments.push(response.id);
      }

      const successMessage =
        selectedServices.length > 1
          ? `Создано ${selectedServices.length} записей!`
          : "Запись успешно создана!";
      showSnackbar(successMessage, "success");
      resetForm();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      logError("Ошибка создания записи:", err);
      const errResponse = err as {
        response?: {
          status?: number;
          data?: { code?: string; message?: string; error?: string };
        };
      };
      const errorMessage =
        errResponse?.response?.data?.message ||
        errResponse?.response?.data?.error ||
        "Не удалось создать запись";
      const errorCode = errResponse?.response?.data?.code;

      // Логируем ошибки для разработчиков
      if (
        errorCode === "TIME_SLOT_CONFLICT" ||
        errorMessage.includes("занято")
      ) {
        logError("[DEV_ANALYTICS] invalidTimeslot:", {
          masterSlug,
          serviceIds: selectedServices.map((s) => s.id),
          startAt: startAtISO,
          error: errorMessage,
        });
      } else if (
        errorCode === "SERVICE_NOT_FOUND" ||
        errorMessage.includes("Услуга не найдена")
      ) {
        logError("[DEV_ANALYTICS] noServices:", {
          masterSlug,
          serviceIds: selectedServices.map((s) => s.id),
          error: errorMessage,
        });
      } else if (
        errorCode === "VALIDATION_ERROR" ||
        errResponse?.response?.status === 400
      ) {
        logError("[DEV_ANALYTICS] validationFailed:", {
          masterSlug,
          error: errorMessage,
          errorCode,
          formData: {
            hasName: !!name.trim(),
            hasContact: !!contact.trim(),
            contactType,
            servicesCount: selectedServices.length,
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
    setSelectedSlotISO(slotISO); // Сохраняем ISO строку для точного сохранения
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
            {/* Поле умной вставки */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" sx={{ flex: 1 }}>
                  Автоопределение
                </Typography>
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{ mb: 0.5, fontWeight: 600 }}
                      >
                        Умная вставка
                      </Typography>
                      <Typography variant="caption" component="div">
                        Просто скопируйте сообщение клиента в это поле — система
                        автоматически распознает:
                      </Typography>
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{ mt: 0.5 }}
                      >
                        • Телефон клиента
                      </Typography>
                      <Typography variant="caption" component="div">
                        • Название услуги
                      </Typography>
                      <Typography variant="caption" component="div">
                        • Дату (сегодня, завтра, послезавтра)
                      </Typography>
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{ mt: 0.5, fontStyle: "italic" }}
                      >
                        Вам останется только проверить данные и создать запись!
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <InfoIcon
                    sx={{
                      fontSize: 18,
                      color: "text.secondary",
                      cursor: "help",
                    }}
                  />
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                value={smartPaste}
                onChange={(e) => {
                  setSmartPaste(e.target.value);
                }}
                placeholder="Вставьте сообщение клиента целиком"
                autoFocus
                InputProps={{
                  endAdornment: (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      {searchingClient && (
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                      )}
                      {smartPaste.trim().length > 0 && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSmartPaste("");
                          }}
                          sx={{ p: 0.5 }}
                          title="Очистить поле"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ),
                }}
                helperText="Вставьте сообщение — система автоматически заполнит все поля"
              />
            </Grid>

            {/* Имя клиента */}
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
                InputProps={{
                  endAdornment: (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      {searchingClient && !smartPaste.trim() ? (
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                      ) : autoFilled.name ? (
                        <Chip
                          label="Найдено"
                          size="small"
                          color="success"
                          sx={{ height: 20, fontSize: "0.7rem", mr: 0.5 }}
                        />
                      ) : null}
                      {name.trim().length > 0 && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setName("");
                            setAutoFilled({ ...autoFilled, name: false });
                          }}
                          sx={{ p: 0.5 }}
                          title="Очистить поле"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ),
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
                  variant={
                    contactType === "telegram" ? "contained" : "outlined"
                  }
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
                  contactType === "phone" ? "+7 (999) 123-45-67" : "username"
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
                      const service = services.find(
                        (s) => s.id === lastAppointment.serviceId
                      );
                      if (
                        service &&
                        !selectedServices.find((s) => s.id === service.id)
                      ) {
                        setSelectedServices([...selectedServices, service]);
                        setServiceSearch("");
                      }
                    }}
                    sx={{ textTransform: "none", fontSize: "0.875rem" }}
                    disabled={loadingLastAppointments}
                  >
                    🔄 Повторить прошлую услугу:{" "}
                    {lastManualAppointments[0].service.name}
                  </Button>
                </Box>
              )}

              {/* Топ-5 услуг */}
              {topServices.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Популярные услуги:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {topServices.slice(0, 5).map((service) => (
                      <Chip
                        key={service.id}
                        label={`${service.name} (${service.usageCount})`}
                        size="small"
                        onClick={() => {
                          const fullService = services.find(
                            (s) => s.id === service.id
                          );
                          if (
                            fullService &&
                            !selectedServices.find(
                              (s) => s.id === fullService.id
                            )
                          ) {
                            setSelectedServices([
                              ...selectedServices,
                              fullService,
                            ]);
                            setServiceSearch("");
                          }
                        }}
                        sx={{
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          height: "24px",
                          bgcolor: selectedServices.find(
                            (s) => s.id === service.id
                          )
                            ? "primary.main"
                            : "action.selected",
                          color: selectedServices.find(
                            (s) => s.id === service.id
                          )
                            ? "primary.contrastText"
                            : "text.primary",
                          "&:hover": {
                            bgcolor: selectedServices.find(
                              (s) => s.id === service.id
                            )
                              ? "primary.dark"
                              : "action.hover",
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Выбранные услуги */}
              {selectedServices.length > 0 && (
                <Box
                  sx={{ mb: 1.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}
                >
                  {selectedServices.map((service) => (
                    <Chip
                      key={service.id}
                      label={`${service.name} (${service.price.toLocaleString(
                        "ru-RU"
                      )} ₽, ${service.durationMin} мин)`}
                      onDelete={() => {
                        setSelectedServices(
                          selectedServices.filter((s) => s.id !== service.id)
                        );
                      }}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              )}

              <Autocomplete
                options={filteredServices.filter(
                  (s) => !selectedServices.find((sel) => sel.id === s.id)
                )}
                getOptionLabel={(option) => option.name}
                value={null}
                onChange={(_, newValue) => {
                  if (
                    newValue &&
                    !selectedServices.find((s) => s.id === newValue.id)
                  ) {
                    setSelectedServices([...selectedServices, newValue]);
                    setServiceSearch("");
                  }
                }}
                inputValue={serviceSearch}
                onInputChange={(_, newInputValue) => {
                  setServiceSearch(newInputValue);
                }}
                loading={loadingServices}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Добавить услугу"
                    placeholder="Выберите или введите для поиска"
                    helperText={
                      selectedServices.length === 0
                        ? "Выберите хотя бы одну услугу"
                        : undefined
                    }
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
                  setSelectedSlotISO(null); // Сбрасываем выбранный слот при смене даты
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
                onChange={(newValue) => {
                  setSelectedTime(newValue);
                  setSelectedSlotISO(null); // Сбрасываем выбранный слот при ручном выборе времени
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            {/* Быстрые кнопки со свободными слотами */}
            {selectedDate && selectedServices.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Быстрый выбор времени
                  </Typography>
                  {loadingSlots ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 1 }}
                    >
                      <CircularProgress size={20} />
                    </Box>
                  ) : availableSlots.length === 0 && !loadingAlternatives ? (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        В этот день нет свободных слотов
                      </Alert>
                      {alternativeDays.length > 0 && (
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, fontWeight: 600 }}
                          >
                            Ближайшие дни со свободными слотами:
                          </Typography>
                          {alternativeDays.map((altDay) => {
                            const dateStr = format(
                              altDay.date,
                              "dd.MM.yyyy (EEEE)",
                              { locale: ru }
                            );
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
                          .slice(
                            (slotsPage - 1) * slotsPerPage,
                            slotsPage * slotsPerPage
                          )
                          .map((slotISO) => {
                            const slotDate = new Date(slotISO);
                            const timeStr = format(slotDate, "HH:mm");
                            const isSelected =
                              selectedTime &&
                              Math.abs(
                                selectedTime.getTime() - slotDate.getTime()
                              ) < 60000;

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
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            mt: 2,
                          }}
                        >
                          <Pagination
                            count={Math.ceil(
                              availableSlots.length / slotsPerPage
                            )}
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
                endIcon={
                  expandedSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />
                }
                sx={{
                  textTransform: "none",
                  justifyContent: "space-between",
                  color: "text.secondary",
                }}
              >
                Расширенные настройки
              </Button>
              <Collapse in={expandedSettings}>
                <Box
                  sx={{ mt: 2, pl: 2, borderLeft: 2, borderColor: "divider" }}
                >
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
                      selectedServices.length > 0
                        ? `По умолчанию: ${selectedServices
                            .reduce((sum, s) => sum + s.price, 0)
                            .toLocaleString("ru-RU")} ₽`
                        : "Укажите цену"
                    }
                    helperText={
                      selectedServices.length > 0 && customPrice === null
                        ? `Общая цена услуг: ${selectedServices
                            .reduce((sum, s) => sum + s.price, 0)
                            .toLocaleString("ru-RU")} ₽`
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
                      selectedServices.length > 0
                        ? `По умолчанию: ${selectedServices.reduce(
                            (sum, s) => sum + s.durationMin,
                            0
                          )} мин`
                        : "Укажите длительность"
                    }
                    helperText={
                      selectedServices.length > 0 && durationOverride === null
                        ? `Общая длительность услуг: ${selectedServices.reduce(
                            (sum, s) => sum + s.durationMin,
                            0
                          )} мин`
                        : durationOverride
                        ? `Будет использовано: ${durationOverride} мин вместо ${selectedServices.reduce(
                            (sum, s) => sum + s.durationMin,
                            0
                          )} мин`
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
          <Button
            onClick={onClose}
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
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
