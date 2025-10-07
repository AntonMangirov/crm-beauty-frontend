import { useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Box, Container, Stack, Typography } from "@mui/material";
import { MasterSkeleton } from "../components/MasterSkeleton";
import { BookingForm } from "../components/BookingForm";

interface BookingFormData {
  name: string;
  phone: string;
  service: string;
  datetime: string;
  comment: string;
}

export function MasterPage() {
  const { slug } = useParams();
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBookingSubmit = (data: BookingFormData) => {
    // Здесь будет логика отправки данных на сервер
    console.log("Данные записи:", data);

    // Показываем сообщение об успехе
    setBookingSuccess(true);

    // Скрываем сообщение через 3 секунды
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  // Пока без данных — показываем скелет и форму
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Информация о мастере (пока скелет) */}
        <MasterSkeleton />

        {/* Форма записи */}
        <Box>
          {bookingSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Запись успешно отправлена! Мы свяжемся с вами для подтверждения.
            </Alert>
          )}

          <BookingForm onSubmit={handleBookingSubmit} />
        </Box>
      </Stack>
    </Container>
  );
}
