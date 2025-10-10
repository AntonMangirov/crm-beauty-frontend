import { useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Box, Container, Stack } from "@mui/material";
import axios from "axios";
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
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!slug) {
      setBookingError("Ошибка: не найден мастер");
      return;
    }

    setIsLoading(true);
    setBookingError(null);

    try {
      const response = await axios.post(`/api/public/${slug}/book`, {
        name: data.name,
        phone: data.phone,
        service: data.service,
        datetime: data.datetime,
        comment: data.comment || "",
      });

      console.log("Запись успешно создана:", response.data);
      setBookingSuccess(true);

      // Скрываем сообщение через 5 секунд
      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (error: any) {
      console.error("Ошибка при создании записи:", error);

      if (error.response?.data?.message) {
        setBookingError(error.response.data.message);
      } else if (error.response?.status === 404) {
        setBookingError("Мастер не найден");
      } else if (error.response?.status === 400) {
        setBookingError("Неверные данные. Проверьте заполнение формы");
      } else {
        setBookingError(
          "Произошла ошибка при отправке записи. Попробуйте позже"
        );
      }
    } finally {
      setIsLoading(false);
    }
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

          {bookingError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {bookingError}
            </Alert>
          )}

          <BookingForm onSubmit={handleBookingSubmit} isLoading={isLoading} />
        </Box>
      </Stack>
    </Container>
  );
}
