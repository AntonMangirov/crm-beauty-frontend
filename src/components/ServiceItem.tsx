import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import type { Service } from "../api/me";

interface ServiceItemProps {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}

export const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  onEdit,
  onDelete,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ч ${mins > 0 ? `${mins} мин` : ""}`;
    }
    return `${mins} мин`;
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {service.name}
              </Typography>
              {!service.isActive && (
                <Chip
                  label="Неактивна"
                  size="small"
                  color="default"
                  sx={{ height: 20 }}
                />
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 3,
                flexWrap: "wrap",
                mb: service.description ? 1 : 0,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>Цена:</strong> {formatPrice(service.price)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Длительность:</strong> {formatDuration(service.durationMin)}
              </Typography>
            </Box>

            {service.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {service.description}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              onClick={onEdit}
              color="primary"
              size="small"
              aria-label="Редактировать"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={onDelete}
              color="error"
              size="small"
              aria-label="Удалить"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};






