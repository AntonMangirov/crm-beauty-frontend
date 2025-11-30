import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Container,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";
import { StepSelectService } from "./StepSelectService";
import { StepSelectTime } from "./StepSelectTime";
import { StepClientForm } from "./StepClientForm";
import type { ClientFormData } from "./StepClientForm";
import { mastersApi } from "../../api/masters";
import type { Master, Service } from "../../api/masters";
import { useSnackbar } from "../SnackbarProvider";
import { getRecaptchaToken } from "../../utils/recaptcha";

interface BookingWizardProps {
  masterSlug: string;
  preselectedServiceId?: string; // Предвыбранная услуга
  onBookingComplete?: (appointmentId: string) => void;
  onClose?: () => void;
}

const steps = ["Выбор услуг", "Дата и время", "Контактные данные"];

export const BookingWizard: React.FC<BookingWizardProps> = ({
  masterSlug,
  preselectedServiceId,
  onBookingComplete,
  onClose,
}) => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Данные записи
  const [selectedServices, setSelectedServices] = useState<string[]>(
    preselectedServiceId ? [preselectedServiceId] : []
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMaster();
  }, [masterSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMaster = async () => {
    try {
      setLoading(true);
      setError(null);
      const masterData = await mastersApi.getBySlug(masterSlug);
      setMaster(masterData);
      
      // Если есть предвыбранная услуга, проверяем её существование
      if (preselectedServiceId) {
        const serviceExists = masterData.services.some(
          (s) => s.id === preselectedServiceId
        );
        if (serviceExists) {
          setSelectedServices([preselectedServiceId]);
        }
      }
    } catch (err) {
      setError("Не удалось загрузить данные мастера");
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFormSubmit = async (formData: ClientFormData) => {
    // Проверяем наличие всех необходимых данных для создания записи
    if (
      !master ||
      selectedServices.length === 0 ||
      !selectedDate ||
      !selectedTime
    ) {
      const errorMsg =
        "Не все данные заполнены. Пожалуйста, вернитесь к предыдущим шагам.";
      setError(errorMsg);
      showSnackbar(errorMsg, "error");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Преобразуем выбранное время в UTC формат для отправки на сервер
      // selectedTime в формате "HH:MM" (UTC время из API)
      // selectedDate - локальная дата из DatePicker
      const [hours, minutes] = selectedTime.split(":").map(Number);
      
      // Используем локальные компоненты даты и создаём UTC дату с UTC временем
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();

      const startAtDate = new Date(
        Date.UTC(year, month, day, hours, minutes, 0, 0)
      );

      if (isNaN(startAtDate.getTime())) {
        throw new Error(
          `Неверный формат даты/времени: ${year}-${month}-${day} ${selectedTime}`
        );
      }

      // Получаем токен reCAPTCHA для защиты от ботов
      const recaptchaToken = await getRecaptchaToken('booking');

      // formData уже содержит нормализованные данные из StepClientForm
      const bookingData = {
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.telegramUsername && { telegramUsername: formData.telegramUsername }),
        serviceId: selectedServices[0],
        startAt: startAtDate.toISOString(),
        ...(formData.comment && { comment: formData.comment }),
        // Отправляем токен только если он получен (в dev режиме может быть null)
        ...(recaptchaToken && { recaptchaToken }),
      };

      const response = await mastersApi.bookAppointment(
        masterSlug,
        bookingData
      );

      const selectedService = master.services.find(
        (s) => s.id === selectedServices[0]
      );

      if (!selectedService) {
        throw new Error("Услуга не найдена");
      }

      showSnackbar("Запись успешно создана!", "success");

      if (onClose) {
        onClose();
      }

      setTimeout(() => {
        navigate("/booking-success", {
          state: {
            appointmentId: response.id,
            masterName: master.name,
            masterSlug: masterSlug,
            masterPhotoUrl: master.photoUrl,
            masterAddress: master.address,
            serviceName: selectedService.name,
            servicePrice: selectedService.price,
            serviceDuration: selectedService.durationMin,
            startAt: response.startAt,
            endAt: response.endAt,
          },
        });
      }, 500);

      if (onBookingComplete) {
        onBookingComplete(response.id);
      }
    } catch (err: unknown) {
      const error = err as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      let errorMessage = "Не удалось создать запись. Попробуйте еще раз.";

      // Обработка различных статусов ошибок
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            // Ошибка валидации (дата, формат и т.д.)
            if (data?.details?.issues) {
              // Zod validation errors
              const firstIssue = data.details.issues[0];
              errorMessage = firstIssue?.message || "Ошибка валидации данных";
            } else if (data?.details?.fieldErrors) {
              // Field-specific errors
              const fieldErrors = data.details.fieldErrors;
              const errorFields = Object.keys(fieldErrors);
              if (errorFields.length > 0) {
                const firstError = fieldErrors[errorFields[0]];
                errorMessage = Array.isArray(firstError)
                  ? firstError[0]
                  : firstError || errorMessage;
              } else {
                errorMessage = data?.message || errorMessage;
              }
            } else {
              // Общая ошибка 400
              errorMessage =
                data?.message ||
                data?.error ||
                "Ошибка валидации. Проверьте введенные данные.";
            }
            break;

          case 404:
            // Мастер не найден или неактивен
            errorMessage = data?.message || "Мастер не найден или неактивен";
            break;

          case 409:
            // Конфликт времени (слот занят)
            errorMessage =
              data?.message ||
              "Выбранное время уже занято. Пожалуйста, выберите другое время";
            break;

          case 500:
            // Внутренняя ошибка сервера
            errorMessage =
              "Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.";
            break;

          default:
            errorMessage = data?.message || errorMessage;
        }
      } else if (error.request) {
        // Запрос отправлен, но ответа нет
        errorMessage = "Не удалось подключиться к серверу. Проверьте подключение.";
      }

      setError(errorMessage);

      // Показываем уведомление об ошибке
      showSnackbar(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedServicesData = (): Service[] => {
    if (!master) return [];
    return master.services.filter((service) =>
      selectedServices.includes(service.id)
    );
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Загрузка данных мастера...
        </Typography>
      </Container>
    );
  }

  if (error || !master) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Ошибка загрузки
          </Typography>
          <Typography variant="body2">{error || "Мастер не найден"}</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Stepper */}
      <Box sx={{ mb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Содержимое шагов */}
      <Box sx={{ minHeight: 300 }}>
        {activeStep === 0 && (
          <StepSelectService
            services={master.services}
            selectedServices={selectedServices}
            onServiceToggle={handleServiceToggle}
            onNext={handleNext}
          />
        )}

        {activeStep === 1 && (
          <StepSelectTime
            masterSlug={masterSlug}
            selectedServices={getSelectedServicesData()}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {activeStep === 2 && selectedDate && (
          <StepClientForm
            selectedServices={getSelectedServicesData()}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onFormSubmit={handleFormSubmit}
            onBack={handleBack}
          />
        )}
      </Box>

      {/* Ошибки */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
};
