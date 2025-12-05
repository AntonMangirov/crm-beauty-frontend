import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Container, IconButton, Typography, Box } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { BookingWizard } from "../../components/BookingWizard/BookingWizard";

export const BookPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Получаем предвыбранную услугу из state или URL параметра
  const preselectedServiceId =
    (location.state as { serviceId?: string })?.serviceId ||
    new URLSearchParams(location.search).get("serviceId") ||
    undefined;

  const handleClose = () => {
    if (slug) {
      navigate(`/${slug}`);
    } else {
      navigate("/");
    }
  };

  const handleBookingComplete = (appointmentId: string) => {
    navigate("/booking-success", {
      state: { appointmentId, masterSlug: slug },
    });
  };

  if (!slug) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Ошибка: не указан мастер
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 3,
          gap: 2,
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Запись к мастеру
        </Typography>
      </Box>

      <BookingWizard
        masterSlug={slug}
        preselectedServiceId={preselectedServiceId}
        onBookingComplete={handleBookingComplete}
        onClose={handleClose}
      />
    </Container>
  );
};


