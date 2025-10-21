import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Checkbox,
  Button,
  Chip,
} from "@mui/material";
import type { Service } from "../../api/masters";

interface StepSelectServiceProps {
  services: Service[];
  selectedServices: string[];
  onServiceToggle: (serviceId: string) => void;
  onNext: () => void;
}

export const StepSelectService: React.FC<StepSelectServiceProps> = ({
  services,
  selectedServices,
  onServiceToggle,
  onNext,
}) => {
  const [localSelected, setLocalSelected] =
    useState<string[]>(selectedServices);

  const handleServiceToggle = (serviceId: string) => {
    const newSelected = localSelected.includes(serviceId)
      ? localSelected.filter((id) => id !== serviceId)
      : [...localSelected, serviceId];

    setLocalSelected(newSelected);
    onServiceToggle(serviceId);
  };

  const handleNext = () => {
    if (localSelected.length > 0) {
      onNext();
    }
  };

  const getTotalPrice = () => {
    return localSelected.reduce((total, serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return total + (service ? parseFloat(service.price) : 0);
    }, 0);
  };

  const getTotalDuration = () => {
    return localSelected.reduce((total, serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return total + (service ? service.durationMin : 0);
    }, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
    }
    return `${mins}м`;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Выберите услуги
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
        Выберите одну или несколько услуг для записи
      </Typography>

      <Grid container spacing={3}>
        {services.map((service) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
            <Card
              sx={{
                cursor: "pointer",
                border: localSelected.includes(service.id)
                  ? "2px solid"
                  : "1px solid",
                borderColor: localSelected.includes(service.id)
                  ? "primary.main"
                  : "divider",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "primary.main",
                  transform: "translateY(-2px)",
                },
              }}
              onClick={() => handleServiceToggle(service.id)}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                  <Checkbox
                    checked={localSelected.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    sx={{ mr: 1, mt: -0.5 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {service.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {formatPrice(parseFloat(service.price))} •{" "}
                      {formatDuration(service.durationMin)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {localSelected.length > 0 && (
        <Box sx={{ mt: 4, p: 3, bgcolor: "background.paper", borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Выбранные услуги
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            {localSelected.map((serviceId) => {
              const service = services.find((s) => s.id === serviceId);
              return service ? (
                <Chip
                  key={serviceId}
                  label={service.name}
                  onDelete={() => handleServiceToggle(serviceId)}
                  color="primary"
                  variant="outlined"
                />
              ) : null;
            })}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                Общая стоимость: {formatPrice(getTotalPrice())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Общее время: {formatDuration(getTotalDuration())}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleNext}
              disabled={localSelected.length === 0}
              sx={{ textTransform: "none", px: 4 }}
            >
              Продолжить
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
