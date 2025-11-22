import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Card,
  Typography,
  Button,
  Divider,
  Grid,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

interface BookingSuccessData {
  appointmentId: string;
  masterName: string;
  masterSlug: string;
  serviceName: string;
  servicePrice: string;
  serviceDuration: number;
  startAt: string;
  endAt: string;
  clientName: string;
}

export const BookingSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state as BookingSuccessData | null;

  if (!bookingData) {
    navigate("/");
    return null;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Не указано";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error("Invalid date string:", dateString);
      return "Неверная дата";
    }
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "Не указано";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error("Invalid time string:", dateString);
      return "Неверное время";
    }
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date);
  };

  const formatPrice = (priceString: string) => {
    const price = parseFloat(priceString);
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(price);
  };

  const handleBackToMaster = () => {
    navigate(`/${bookingData.masterSlug}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Card
        sx={{
          p: 4,
          textAlign: "center",
          background: "linear-gradient(135deg, #1F8A49 0%, #0F3B35 100%)",
          color: "white",
          borderRadius: 3,
          mb: 4,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: "white" }} />
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          Вы записаны!
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Запись успешно создана. Мы свяжемся с вами для подтверждения.
        </Typography>
      </Card>

      <Card sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Детали записи
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <PersonIcon sx={{ mr: 2, color: "primary.main" }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Мастер
                </Typography>
                <Typography variant="h6">{bookingData.masterName}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <CalendarIcon sx={{ mr: 2, color: "primary.main" }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Дата
                </Typography>
                <Typography variant="h6">
                  {formatDate(bookingData.startAt)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <TimeIcon sx={{ mr: 2, color: "primary.main" }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Время
                </Typography>
                <Typography variant="h6">
                  {formatTime(bookingData.startAt)} -{" "}
                  {formatTime(bookingData.endAt)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <CheckCircleIcon sx={{ mr: 2, color: "primary.main" }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Услуга
                </Typography>
                <Typography variant="h6">{bookingData.serviceName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatPrice(bookingData.servicePrice)} •{" "}
                  {bookingData.serviceDuration} мин
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToMaster}
          sx={{
            px: 4,
            py: 1.5,
            textTransform: "none",
            fontSize: "1.1rem",
          }}
        >
          Вернуться к мастеру
        </Button>
      </Box>
    </Container>
  );
};
