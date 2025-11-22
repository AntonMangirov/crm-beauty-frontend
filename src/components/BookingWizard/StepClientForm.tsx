import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Comment as CommentIcon,
} from "@mui/icons-material";
import type { Service } from "../../api/masters";

interface StepClientFormProps {
  selectedServices: Service[];
  selectedDate: Date;
  selectedTime: string;
  onFormSubmit: (formData: ClientFormData) => void;
  onBack: () => void;
}

export interface ClientFormData {
  name: string;
  phone: string;
  comment?: string;
}

export const StepClientForm: React.FC<StepClientFormProps> = ({
  selectedServices,
  selectedDate,
  selectedTime,
  onFormSubmit,
  onBack,
}) => {
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    phone: "",
    comment: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Форматирует телефон в формат +7 (999) 123-45-67
   */
  const formatPhoneDisplay = (phone: string): string => {
    // Удаляем все нецифровые символы кроме +
    let cleaned = phone.replace(/[^\d+]/g, "");

    // Если начинается с 8, заменяем на +7
    if (cleaned.startsWith("8")) {
      cleaned = "+7" + cleaned.slice(1);
    } else if (cleaned.startsWith("7") && !cleaned.startsWith("+7")) {
      cleaned = "+7" + cleaned.slice(1);
    } else if (!cleaned.startsWith("+7") && /^\d/.test(cleaned)) {
      cleaned = "+7" + cleaned;
    }

    // Если уже есть +7, убираем все лишние 8 в начале цифр после +7
    if (cleaned.startsWith("+7")) {
      let digits = cleaned.slice(2); // Убираем +7
      // Если первая цифра после +7 это 8, удаляем её (так как +7 уже есть)
      if (digits.startsWith("8")) {
        digits = digits.slice(1);
      }
      cleaned = "+7" + digits;
    }

    // Ограничиваем длину (максимум 12 символов: +7 + 10 цифр)
    if (cleaned.length > 12) {
      cleaned = cleaned.slice(0, 12);
    }

    // Форматируем: +7 (999) 123-45-67
    if (cleaned.startsWith("+7")) {
      const digits = cleaned.slice(2); // Убираем +7
      if (digits.length === 0) {
        return "+7";
      } else if (digits.length <= 3) {
        return `+7 (${digits}`;
      } else if (digits.length <= 6) {
        return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else if (digits.length <= 8) {
        return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
          6
        )}`;
      } else {
        return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
          6,
          8
        )}-${digits.slice(8, 10)}`;
      }
    }

    return cleaned;
  };

  /**
   * Извлекает только цифры из телефона для валидации
   */
  const getPhoneDigits = (phone: string): string => {
    return phone.replace(/[^\d]/g, "");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Имя обязательно";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Имя должно содержать минимум 2 символа";
    }

    const phoneDigits = getPhoneDigits(formData.phone);
    if (!phoneDigits || phoneDigits.length < 11) {
      newErrors.phone = "Телефон обязателен";
    } else if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
      newErrors.phone =
        "Неверный формат телефона. Используйте формат: +7 (999) 123-45-67";
    }

    if (formData.comment && formData.comment.length > 500) {
      newErrors.comment = "Комментарий не должен превышать 500 символов";
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log("Результат валидации:", { isValid, errors: newErrors });
    return isValid;
  };

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    // Специальная обработка для телефона
    if (field === "phone") {
      // Разрешаем только цифры, +, пробелы, скобки и дефисы
      let cleaned = value.replace(/[^\d+\s()-]/g, "");

      // Если поле пустое или содержит только +, устанавливаем +7
      if (!cleaned || cleaned === "+") {
        cleaned = "+7";
      }
      // Если начинается с 8 (и нет +7), заменяем на +7
      else if (cleaned.startsWith("8") && !cleaned.startsWith("+7")) {
        cleaned = "+7" + cleaned.slice(1);
      }
      // Если уже есть +7 и пользователь вводит 8, удаляем эту 8 (так как +7 уже есть)
      else if (cleaned.startsWith("+7") && cleaned.includes("8")) {
        // Убираем все 8, которые идут сразу после +7
        let digits = cleaned.slice(2); // Убираем +7
        digits = digits.replace(/^8+/, ""); // Удаляем все 8 в начале
        cleaned = "+7" + digits;
      }

      // Ограничиваем длину (максимум 18 символов с форматированием: +7 (999) 123-45-67)
      if (cleaned.length > 18) {
        cleaned = cleaned.slice(0, 18);
      }

      // Форматируем для отображения
      const formatted = formatPhoneDisplay(cleaned);
      setFormData((prev) => ({ ...prev, [field]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Нормализуем телефон перед отправкой (убираем форматирование, оставляем только +7XXXXXXXXXX)
    const phoneDigits = getPhoneDigits(formData.phone);
    let normalizedPhone: string;

    if (phoneDigits.startsWith("7")) {
      normalizedPhone = "+" + phoneDigits;
    } else if (phoneDigits.length === 10) {
      // Если 10 цифр без кода страны, добавляем +7
      normalizedPhone = "+7" + phoneDigits;
    } else {
      // Если что-то не так, пробуем исправить
      normalizedPhone = "+7" + phoneDigits.replace(/^7/, "");
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Отправляем нормализованный телефон без форматирования
      await onFormSubmit({
        ...formData,
        phone: normalizedPhone,
      });
    } catch (error) {
      console.error("Ошибка отправки формы:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getTotalPrice = () => {
    return selectedServices.reduce(
      (total, service) => total + parseFloat(service.price),
      0
    );
  };

  const getTotalDuration = () => {
    return selectedServices.reduce(
      (total, service) => total + service.durationMin,
      0
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
    }
    return `${mins}м`;
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600 }}>
        Ваши данные
      </Typography>

      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        Заполните контактную информацию для записи
      </Typography>

      {/* Сводка записи */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Сводка записи
          </Typography>

          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.5 }}
            >
              Дата и время:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatDate(selectedDate)} в {selectedTime}
            </Typography>
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.5 }}
            >
              Услуги:
            </Typography>
            {selectedServices.map((service) => (
              <Typography
                key={service.id}
                variant="caption"
                sx={{ ml: 1.5, display: "block" }}
              >
                • {service.name} - {formatPrice(parseFloat(service.price))}
              </Typography>
            ))}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Общее время: {formatDuration(getTotalDuration())}
            </Typography>
            <Typography
              variant="subtitle1"
              color="primary"
              sx={{ fontWeight: 600 }}
            >
              {formatPrice(getTotalPrice())}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Форма */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Имя *"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                startAdornment: (
                  <PersonIcon
                    sx={{ mr: 1, color: "action.active", fontSize: 20 }}
                  />
                ),
              }}
              placeholder="Введите ваше имя"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Телефон *"
              value={formData.phone}
              onChange={(e) => {
                let value = e.target.value;

                // Разрешаем только цифры, +, пробелы, скобки и дефисы
                value = value.replace(/[^\d+\s()-]/g, "");

                // Если поле пустое или содержит только +, устанавливаем +7
                if (!value || value === "+") {
                  value = "+7";
                }
                // Если начинается с 8 (и нет +7), заменяем на +7
                else if (value.startsWith("8") && !value.startsWith("+7")) {
                  value = "+7" + value.slice(1);
                }
                // Если уже есть +7 и пользователь вводит 8, удаляем эту 8
                else if (
                  value.startsWith("+7") &&
                  value.length > 2 &&
                  value[2] === "8"
                ) {
                  // Убираем первую 8 после +7
                  value = "+7" + value.slice(3);
                }

                // Ограничиваем длину (максимум 18 символов с форматированием: +7 (999) 123-45-67)
                if (value.length > 18) {
                  value = value.slice(0, 18);
                }

                // Форматируем через handleInputChange, который применит formatPhoneDisplay
                handleInputChange("phone", value);
              }}
              onFocus={(e) => {
                const value = e.target.value.trim();
                if (!value || value === "") {
                  handleInputChange("phone", "+7");
                }
              }}
              onPaste={(e) => {
                // Обрабатываем вставку текста
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text").trim();

                // Удаляем все нецифровые символы кроме +
                let cleaned = pastedText.replace(/[^\d+]/g, "");

                // Если начинается с +7, оставляем как есть (но убираем дубликаты +7)
                if (cleaned.startsWith("+7")) {
                  cleaned = "+7" + cleaned.replace(/^\+7/g, "");
                  // Убираем первую 8 после +7 если она есть
                  if (cleaned.length > 2 && cleaned[2] === "8") {
                    cleaned = "+7" + cleaned.slice(3);
                  }
                } else if (cleaned.startsWith("7")) {
                  cleaned = "+" + cleaned;
                } else if (cleaned.startsWith("8")) {
                  cleaned = "+7" + cleaned.slice(1);
                } else if (/^\d/.test(cleaned)) {
                  cleaned = "+7" + cleaned;
                }

                // Ограничиваем длину (12 символов: +7 + 10 цифр)
                if (cleaned.length > 12) {
                  cleaned = cleaned.slice(0, 12);
                }

                handleInputChange("phone", cleaned);
              }}
              onKeyDown={(e) => {
                // Запрещаем ввод недопустимых символов
                const allowedKeys = [
                  "Backspace",
                  "Delete",
                  "Tab",
                  "Escape",
                  "Enter",
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                  "Home",
                  "End",
                ];

                if (allowedKeys.includes(e.key)) {
                  return;
                }

                // Разрешаем только цифры, +, пробелы, скобки и дефисы
                if (!/[\d+\s()-]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                }
              }}
              error={!!errors.phone}
              helperText={errors.phone || "Формат: +7 (999) 123-45-67"}
              InputProps={{
                startAdornment: (
                  <PhoneIcon
                    sx={{ mr: 1, color: "action.active", fontSize: 20 }}
                  />
                ),
              }}
              placeholder="+7 (999) 123-45-67"
              inputProps={{
                maxLength: 18, // +7 (999) 123-45-67 = 18 символов
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Комментарий"
              value={formData.comment}
              onChange={(e) => handleInputChange("comment", e.target.value)}
              error={!!errors.comment}
              helperText={
                errors.comment || "Дополнительные пожелания (необязательно)"
              }
              multiline
              rows={2}
              InputProps={{
                startAdornment: (
                  <CommentIcon
                    sx={{ mr: 1, color: "action.active", fontSize: 20 }}
                  />
                ),
              }}
              placeholder="Расскажите о ваших пожеланиях..."
            />
          </Grid>
        </Grid>

        {isSubmitting && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              mt: 2,
              py: 1.5,
              bgcolor: "background.paper",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Создание записи...
            </Typography>
          </Box>
        )}

        {/* Навигация */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button
            variant="outlined"
            size="medium"
            onClick={onBack}
            disabled={isSubmitting}
            sx={{ textTransform: "none" }}
          >
            Назад
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="medium"
            disabled={isSubmitting}
            sx={{ textTransform: "none", px: 3 }}
          >
            {isSubmitting ? "Отправка..." : "Записаться"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};
