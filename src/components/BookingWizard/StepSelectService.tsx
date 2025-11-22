import React from "react";
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
  const handleServiceToggle = (serviceId: string) => {
    onServiceToggle(serviceId);
  };

  const handleNext = () => {
    if (selectedServices.length > 0) {
      onNext();
    }
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return total + (service ? parseFloat(service.price) : 0);
    }, 0);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((total, serviceId) => {
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
      <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600 }}>
        Выберите услуги
      </Typography>

      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        Выберите одну или несколько услуг для записи
      </Typography>

      <Grid container spacing={2}>
        {services.map((service) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
            <Card
              sx={{
                cursor: "pointer",
                border: selectedServices.includes(service.id)
                  ? "2px solid"
                  : "1px solid",
                borderColor: selectedServices.includes(service.id)
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
              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  <Checkbox
                    checked={selectedServices.includes(service.id)}
                    onChange={(e) => {
                      e.stopPropagation(); // Предотвращаем всплытие события
                      handleServiceToggle(service.id);
                    }}
                    onClick={(e) => e.stopPropagation()} // Предотвращаем всплытие при клике
                    sx={{ mr: 1, mt: -0.5 }}
                    size="small"
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {service.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
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

      {selectedServices.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
            Выбранные услуги
          </Typography>

          <Box sx={{ display: "flex", gap: 0.5, mb: 1.5, flexWrap: "wrap" }}>
            {selectedServices.map((serviceId) => {
              const service = services.find((s) => s.id === serviceId);
              return service ? (
                <Chip
                  key={serviceId}
                  label={service.name}
                  onDelete={() => handleServiceToggle(serviceId)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ) : null;
            })}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Общая стоимость: <strong>{formatPrice(getTotalPrice())}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Общее время: {formatDuration(getTotalDuration())}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="medium"
              onClick={handleNext}
              disabled={selectedServices.length === 0}
              sx={{ textTransform: "none", px: 3 }}
            >
              Продолжить
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
