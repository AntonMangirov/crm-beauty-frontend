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
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { Avatar, CardMedia } from "@mui/material";

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
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Card
        sx={{
          p: 2.5,
          textAlign: "center",
          background: "linear-gradient(135deg, #1F8A49 0%, #0F3B35 100%)",
          color: "white",
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <CheckCircleIcon sx={{ fontSize: { xs: 60, sm: 70 }, color: "white" }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Вы записаны!
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Запись успешно создана. Мы свяжемся с вами для подтверждения.
        </Typography>
      </Card>

      {/* Фото мастера */}
      {bookingData.masterPhotoUrl && (
        <Card sx={{ mb: 2, overflow: "hidden" }}>
          <CardMedia
            component="img"
            image={bookingData.masterPhotoUrl}
            alt={bookingData.masterName}
            sx={{
              height: { xs: 180, sm: 250 },
              objectFit: "cover",
            }}
          />
        </Card>
      )}

      <Card sx={{ p: 2.5, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Детали записи
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              {bookingData.masterPhotoUrl ? (
                <Avatar
                  src={bookingData.masterPhotoUrl}
                  alt={bookingData.masterName}
                  sx={{ width: 48, height: 48, mr: 1.5 }}
                />
              ) : (
                <PersonIcon sx={{ mr: 1.5, color: "primary.main", fontSize: 32 }} />
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Мастер
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{bookingData.masterName}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <CalendarIcon sx={{ mr: 1.5, color: "primary.main", fontSize: 24 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Дата
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {formatDate(bookingData.startAt)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <TimeIcon sx={{ mr: 1.5, color: "primary.main", fontSize: 24 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Время
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {formatTime(bookingData.startAt)} -{" "}
                  {formatTime(bookingData.endAt)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <CheckCircleIcon sx={{ mr: 1.5, color: "primary.main", fontSize: 24 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Услуга
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{bookingData.serviceName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatPrice(bookingData.servicePrice)} •{" "}
                  {bookingData.serviceDuration} мин
                </Typography>
              </Box>
            </Box>
          </Grid>

          {bookingData.masterAddress && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1.5 }}>
                <LocationIcon sx={{ mr: 1.5, color: "primary.main", mt: 0.5, fontSize: 24 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Адрес
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{bookingData.masterAddress}</Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Card>

      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="contained"
          size="medium"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToMaster}
          sx={{
            px: 3,
            py: 1,
            textTransform: "none",
          }}
        >
          Вернуться к мастеру
        </Button>
      </Box>
    </Container>
  );
};
