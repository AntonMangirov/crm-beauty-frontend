import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Stack,
} from "@mui/material";
import { Edit, Delete, Visibility, VisibilityOff } from "@mui/icons-material";
import type { Service } from "../types/service";

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onToggleActive: (service: Service) => void;
}

export function ServiceCard({
  service,
  onEdit,
  onDelete,
  onToggleActive,
}: ServiceCardProps) {
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
      return mins > 0 ? `${hours}ч ${mins}мин` : `${hours}ч`;
    }
    return `${mins}мин`;
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: service.isActive ? 1 : 0.7,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2}>
          {/* Заголовок с названием и статусом */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
              {service.name}
            </Typography>
            <Chip
              label={service.isActive ? "Активна" : "Неактивна"}
              color={service.isActive ? "success" : "default"}
              size="small"
            />
          </Box>

          {/* Цена и длительность */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {formatPrice(service.price)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDuration(service.durationMin)}
            </Typography>
          </Box>

          {/* Описание */}
          {service.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {service.description}
            </Typography>
          )}

          {/* Даты создания и обновления */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              fontSize: "0.75rem",
              color: "text.secondary",
            }}
          >
            <Typography variant="caption">
              Создана: {new Date(service.createdAt).toLocaleDateString("ru-RU")}
            </Typography>
            {service.updatedAt !== service.createdAt && (
              <Typography variant="caption">
                Обновлена:{" "}
                {new Date(service.updatedAt).toLocaleDateString("ru-RU")}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={service.isActive ? <VisibilityOff /> : <Visibility />}
          onClick={() => onToggleActive(service)}
          color={service.isActive ? "warning" : "success"}
        >
          {service.isActive ? "Деактивировать" : "Активировать"}
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            startIcon={<Edit />}
            onClick={() => onEdit(service)}
            variant="outlined"
          >
            Редактировать
          </Button>
          <Button
            size="small"
            startIcon={<Delete />}
            onClick={() => onDelete(service)}
            color="error"
            variant="outlined"
          >
            Удалить
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
}
