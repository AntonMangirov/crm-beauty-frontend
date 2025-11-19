import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardMedia,
  Typography,
  Box,
  Button,
  Grid,
  Avatar,
  Container,
} from "@mui/material";
import { LocationOn as LocationIcon } from "@mui/icons-material";
import { ServiceCard } from "./ServiceCard";
import { LocationMap } from "./LocationMap";
import type { Master } from "../api/masters";

interface MasterProfileProps {
  master: Master;
  masterSlug: string;
}

export const MasterProfile: React.FC<MasterProfileProps> = ({
  master,
  masterSlug,
}) => {
  const navigate = useNavigate();

  const handleBookClick = () => {
    navigate(`/${masterSlug}/book`);
  };

  const formatPrice = (priceString: string) => {
    const price = parseFloat(priceString);
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(price);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* Hero Section */}
      <Card sx={{ mb: { xs: 3, sm: 4 }, overflow: "hidden" }}>
        <Box sx={{ position: "relative" }}>
          {/* Фото мастера */}
          {master.photoUrl ? (
            <CardMedia
              component="img"
              height={{ xs: 200, sm: 300 }}
              image={master.photoUrl}
              alt={master.name}
              sx={{
                objectFit: "cover",
                filter: "brightness(0.9)",
              }}
            />
          ) : (
            <Box
              sx={{
                height: { xs: 200, sm: 300 },
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 80, sm: 120 },
                  height: { xs: 80, sm: 120 },
                  bgcolor: "white",
                  color: "primary.main",
                  fontSize: { xs: "2rem", sm: "3rem" },
                  fontWeight: 600,
                }}
              >
                {master.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>
            </Box>
          )}

          {/* Overlay с информацией */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              p: 3,
              color: "white",
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem" },
              }}
            >
              {master.name}
            </Typography>

            {master.description && (
              <Typography
                variant="body1"
                sx={{
                  mb: 2,
                  opacity: 0.9,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                }}
              >
                {master.description}
              </Typography>
            )}

            {master.address && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationIcon fontSize="small" />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {master.address}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Card>

      {/* Карта (если есть координаты) */}
      {master.lat && master.lng && (
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h4"
            sx={{
              mb: { xs: 2, sm: 3 },
              fontWeight: 600,
              fontSize: { xs: "1.75rem", sm: "2.125rem" },
            }}
          >
            Расположение
          </Typography>
          <LocationMap
            lat={master.lat}
            lng={master.lng}
            address={master.address}
            masterName={master.name}
            height={{ xs: 300, sm: 400 }}
          />
        </Box>
      )}

      {/* Услуги */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography
          variant="h4"
          sx={{
            mb: { xs: 2, sm: 3 },
            fontWeight: 600,
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
          }}
        >
          Услуги
        </Typography>

        <Grid container spacing={3}>
          {master.services.map((service) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
              <ServiceCard
                name={service.name}
                price={parseFloat(service.price)}
                durationMin={service.durationMin}
                description={`${formatPrice(service.price)} • ${
                  service.durationMin
                } мин`}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA Section */}
      <Card sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
        <Typography
          variant="h5"
          sx={{
            mb: { xs: 1.5, sm: 2 },
            fontWeight: 600,
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
          }}
        >
          Готовы записаться?
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mb: { xs: 2, sm: 3 },
            color: "text.secondary",
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          Выберите услугу и удобное время для записи
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleBookClick}
          fullWidth={{ xs: true, sm: false }}
          sx={{
            px: { xs: 2, sm: 4 },
            py: 1.5,
            textTransform: "none",
            fontSize: { xs: "1rem", sm: "1.1rem" },
          }}
        >
          Записаться
        </Button>
      </Card>
    </Container>
  );
};
