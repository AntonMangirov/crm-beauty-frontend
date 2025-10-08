import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
} from "@mui/material";
import { Warning } from "@mui/icons-material";
import type { Service } from "../types/service";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  service: Service | null;
  isLoading?: boolean;
  error?: string | null;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  service,
  isLoading = false,
  error,
}: DeleteConfirmDialogProps) {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      // Ошибка обрабатывается в родительском компоненте
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Warning color="error" />
        Подтверждение удаления
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" paragraph>
            Вы уверены, что хотите удалить услугу{" "}
            <strong>"{service.name}"</strong>?
          </Typography>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Внимание:</strong> Это действие нельзя отменить. Все
              связанные с этой услугой записи могут быть затронуты.
            </Typography>
          </Alert>

          {/* Информация об услуге */}
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Информация об услуге:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Цена: {service.price.toLocaleString("ru-RU")} ₽
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Длительность: {service.durationMin} мин
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Статус: {service.isActive ? "Активна" : "Неактивна"}
            </Typography>
            {service.description && (
              <Typography variant="body2" color="text.secondary">
                • Описание: {service.description}
              </Typography>
            )}
          </Box>

          {/* Ошибка */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Отмена
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={isLoading}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? "Удаление..." : "Удалить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
