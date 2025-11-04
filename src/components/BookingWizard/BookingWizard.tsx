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

interface BookingWizardProps {
  masterSlug: string;
  onBookingComplete?: (appointmentId: string) => void;
  onClose?: () => void;
}

const steps = ["Выбор услуг", "Дата и время", "Контактные данные"];

export const BookingWizard: React.FC<BookingWizardProps> = ({
  masterSlug,
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
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
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
    console.log("handleFormSubmit вызван с данными:", formData);
    console.log("Проверка данных:", {
      master: !!master,
      selectedServices: selectedServices.length,
      selectedDate,
      selectedTime,
    });

    if (
      !master ||
      selectedServices.length === 0 ||
      !selectedDate ||
      !selectedTime
    ) {
      console.error("Недостаточно данных для создания записи");
      const errorMsg =
        "Не все данные заполнены. Пожалуйста, вернитесь к предыдущим шагам.";
      setError(errorMsg);
      showSnackbar(errorMsg, "error");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const [hours, minutes] = selectedTime.split(":").map(Number);

      const startAtDate = new Date(
        Date.UTC(year, month - 1, day, hours, minutes, 0, 0)
      );

      if (isNaN(startAtDate.getTime())) {
        throw new Error(
          `Неверный формат даты/времени: ${year}-${month}-${day} ${selectedTime}`
        );
      }

      const bookingData = {
        name: formData.name,
        phone: formData.phone,
        serviceId: selectedServices[0],
        startAt: startAtDate.toISOString(),
        comment: formData.comment || undefined,
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
            serviceName: selectedService.name,
            servicePrice: selectedService.price,
            serviceDuration: selectedService.durationMin,
            startAt: response.startAt,
            endAt: response.endAt,
            clientName: formData.name,
          },
        });
      }, 500);

      if (onBookingComplete) {
        onBookingComplete(response.id);
      }
    } catch (err: unknown) {
      console.error("Ошибка создания записи:", err);

      const error = err as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      let errorMessage = "Не удалось создать запись. Попробуйте еще раз.";

      if (error.response?.status === 400) {
        if (error.response.data?.details?.fieldErrors) {
          const fieldErrors = error.response.data.details.fieldErrors;
          const errorFields = Object.keys(fieldErrors);
          if (errorFields.length > 0) {
            const firstError = fieldErrors[errorFields[0]];
            errorMessage = Array.isArray(firstError)
              ? firstError[0]
              : firstError || errorMessage;
          } else {
            errorMessage = error.response.data?.message || errorMessage;
          }
        } else {
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            errorMessage;
        }
      } else if (error.response?.status === 404) {
        errorMessage = "Мастер не найден";
      } else if (error.response?.status === 409) {
        errorMessage =
          "Выбранное время уже занято. Пожалуйста, выберите другое время";
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
    </Container>
  );
};
