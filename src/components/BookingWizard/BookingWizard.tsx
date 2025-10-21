import React, { useState, useEffect } from "react";
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
import type { Master, Service, BookingRequest } from "../../api/masters";

interface BookingWizardProps {
  masterSlug: string;
  onBookingComplete?: (appointmentId: string) => void;
}

const steps = ["Выбор услуг", "Дата и время", "Контактные данные"];

export const BookingWizard: React.FC<BookingWizardProps> = ({
  masterSlug,
  onBookingComplete,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Данные записи
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
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
    } catch (err) {
      console.error("Ошибка загрузки мастера:", err);
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
    if (
      !master ||
      selectedServices.length === 0 ||
      !selectedDate ||
      !selectedTime
    ) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Подготавливаем данные для отправки
      const bookingData: BookingRequest = {
        name: formData.name,
        phone: formData.phone,
        serviceId: selectedServices[0], // Пока отправляем только первую услугу
        startAt: new Date(
          `${selectedDate.toISOString().split("T")[0]}T${selectedTime}:00.000Z`
        ),
        comment: formData.comment,
      };

      console.log("Отправка данных записи:", bookingData);

      // Отправляем запрос на API
      const response = await mastersApi.bookAppointment(
        masterSlug,
        bookingData
      );

      console.log("Запись создана успешно:", response);

      if (onBookingComplete) {
        onBookingComplete(response.id);
      }
    } catch (err: unknown) {
      console.error("Ошибка создания записи:", err);

      // Обрабатываем разные типы ошибок
      const error = err as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (error.response?.status === 400) {
        setError("Проверьте правильность заполнения полей");
      } else if (error.response?.status === 404) {
        setError("Мастер не найден");
      } else if (error.response?.status === 409) {
        setError(
          "Выбранное время уже занято. Пожалуйста, выберите другое время"
        );
      } else {
        setError("Не удалось создать запись. Попробуйте еще раз.");
      }
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Stepper */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Содержимое шагов */}
      <Box sx={{ minHeight: 400 }}>
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

      {/* Индикатор загрузки */}
      {isSubmitting && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Создание записи...
          </Typography>
        </Box>
      )}
    </Container>
  );
};
