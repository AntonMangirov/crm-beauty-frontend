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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Имя обязательно";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Имя должно содержать минимум 2 символа";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Телефон обязателен";
    } else if (!/^[+]?[0-9\s-()]{10,}$/.test(formData.phone.trim())) {
      newErrors.phone = "Неверный формат телефона";
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onFormSubmit(formData);
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
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Ваши данные
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
        Заполните контактную информацию для записи
      </Typography>

      {/* Сводка записи */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Сводка записи
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Дата и время:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formatDate(selectedDate)} в {selectedTime}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Услуги:
            </Typography>
            {selectedServices.map((service) => (
              <Typography key={service.id} variant="body2" sx={{ ml: 2 }}>
                • {service.name} - {formatPrice(parseFloat(service.price))}
              </Typography>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              Общее время: {formatDuration(getTotalDuration())}
            </Typography>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
              {formatPrice(getTotalPrice())}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Форма */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Имя *"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                startAdornment: (
                  <PersonIcon sx={{ mr: 1, color: "action.active" }} />
                ),
              }}
              placeholder="Введите ваше имя"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Телефон *"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              onFocus={(e) => {
                const value = e.target.value.trim();
                if (!value) {
                  handleInputChange("phone", "+7");
                } else if (value.startsWith("+")) {
                  return;
                } else if (/^8/.test(value)) {
                  handleInputChange("phone", "+7" + value.slice(1));
                } else if (/^9/.test(value)) {
                  handleInputChange("phone", "+7" + value);
                } else if (/^[0-9]/.test(value)) {
                  handleInputChange("phone", "+7" + value);
                }
              }}
              error={!!errors.phone}
              helperText={errors.phone}
              InputProps={{
                startAdornment: (
                  <PhoneIcon sx={{ mr: 1, color: "action.active" }} />
                ),
              }}
              placeholder="+7 (999) 123-45-67"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Комментарий"
              value={formData.comment}
              onChange={(e) => handleInputChange("comment", e.target.value)}
              error={!!errors.comment}
              helperText={
                errors.comment || "Дополнительные пожелания (необязательно)"
              }
              multiline
              rows={3}
              InputProps={{
                startAdornment: (
                  <CommentIcon sx={{ mr: 1, color: "action.active" }} />
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
              gap: 2,
              mt: 3,
              py: 2,
              bgcolor: "background.paper",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Создание записи...
            </Typography>
          </Box>
        )}

        {/* Навигация */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={isSubmitting}
            sx={{ textTransform: "none" }}
          >
            Назад
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ textTransform: "none", px: 4 }}
          >
            {isSubmitting ? "Отправка..." : "Записаться"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};
