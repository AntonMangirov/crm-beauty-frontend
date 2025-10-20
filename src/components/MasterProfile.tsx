import React from "react";
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
import type { Master } from "../api/masters";

interface MasterProfileProps {
  master: Master;
  onBookService?: (serviceId: string) => void;
}

export const MasterProfile: React.FC<MasterProfileProps> = ({ master }) => {
  const formatPrice = (priceString: string) => {
    const price = parseFloat(priceString);
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(price);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Card sx={{ mb: 4, overflow: "hidden" }}>
        <Box sx={{ position: "relative" }}>
          {/* Фото мастера */}
          {master.photoUrl ? (
            <CardMedia
              component="img"
              height="300"
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
                height: 300,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: "white",
                  color: "primary.main",
                  fontSize: "3rem",
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
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {master.name}
            </Typography>

            {master.description && (
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
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

      {/* Услуги */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
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
      <Card sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Готовы записаться?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
          Выберите услугу и удобное время для записи
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            textTransform: "none",
            fontSize: "1.1rem",
          }}
        >
          Записаться на услугу
        </Button>
      </Card>
    </Container>
  );
};
