import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Build as BuildIcon,
  Photo as PhotoIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { meApi, type ClientHistoryItem, type ClientListItem } from "../api/me";
import { normalizeImageUrl } from "../utils/imageUrl";
import { useSnackbar } from "./SnackbarProvider";

interface ClientHistoryModalProps {
  open: boolean;
  client: ClientListItem | null;
  onClose: () => void;
}

const statusColors: Record<
  ClientHistoryItem["status"],
  "default" | "primary" | "success" | "warning" | "error"
> = {
  PENDING: "warning",
  CONFIRMED: "primary",
  COMPLETED: "success",
  CANCELED: "error",
  NO_SHOW: "error",
};

const statusLabels: Record<ClientHistoryItem["status"], string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждена",
  COMPLETED: "Завершена",
  CANCELED: "Отменена",
  NO_SHOW: "Не явился",
};

export const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  open,
  client,
  onClose,
}) => {
  const [history, setHistory] = useState<ClientHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (open && client) {
      loadHistory();
    } else {
      setHistory([]);
      setError(null);
      setSelectedPhoto(null);
    }
  }, [open, client]);

  const loadHistory = async () => {
    if (!client) return;

    try {
      setLoading(true);
      setError(null);
      const historyData = await meApi.getClientHistory(client.id);
      setHistory(historyData);
    } catch (err) {
      console.error("Ошибка загрузки истории клиента:", err);
      setError("Не удалось загрузить историю клиента");
      showSnackbar("Не удалось загрузить историю клиента", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string): string => {
    try {
      return format(new Date(dateString), "HH:mm", { locale: ru });
    } catch {
      return "";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? "100vh" : "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            История клиента
          </Typography>
          {client && (
            <Typography variant="body2" color="text.secondary">
              {client.name}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "text.secondary",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {loading && history.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : history.length === 0 ? (
          <Alert severity="info">История посещений пуста</Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {history.map((item) => (
              <Card key={item.id} variant="outlined">
                <CardContent>
                  {/* Дата и статус */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {formatDate(item.date)}
                      </Typography>
                    </Box>
                    <Chip
                      label={statusLabels[item.status]}
                      color={statusColors[item.status]}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Услуга */}
                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <BuildIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {item.service.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      {item.service.price.toLocaleString("ru-RU")} ₽
                    </Typography>
                  </Box>

                  {/* Фото */}
                  {item.photos.length > 0 && (
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                        }}
                      >
                        <PhotoIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Фото работ ({item.photos.length})
                        </Typography>
                      </Box>
                      <Grid container spacing={1.5}>
                        {item.photos.map((photo) => (
                          <Grid size={{ xs: 6, sm: 4 }} key={photo.id}>
                            <Card
                              sx={{
                                cursor: "pointer",
                                transition: "transform 0.2s",
                                "&:hover": {
                                  transform: "scale(1.02)",
                                },
                              }}
                              onClick={() => setSelectedPhoto(photo.url)}
                            >
                              <CardMedia
                                component="img"
                                image={normalizeImageUrl(photo.url)}
                                alt={photo.description || "Фото работы"}
                                sx={{
                                  height: { xs: 120, sm: 150 },
                                  objectFit: "cover",
                                }}
                              />
                              {photo.description && (
                                <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {photo.description}
                                  </Typography>
                                </CardContent>
                              )}
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Закрыть
        </Button>
      </DialogActions>

      {/* Модальное окно для просмотра фото в полном размере */}
      {selectedPhoto && (
        <Dialog
          open={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.9)",
              borderRadius: 1,
            },
          }}
        >
          <DialogContent sx={{ p: 0, position: "relative" }}>
            <IconButton
              onClick={() => setSelectedPhoto(null)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 1000,
                bgcolor: "rgba(255, 255, 255, 0.9)",
                "&:hover": {
                  bgcolor: "white",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box
              component="img"
              src={normalizeImageUrl(selectedPhoto)}
              alt="Фото работы"
              sx={{
                width: "100%",
                height: "auto",
                maxHeight: "90vh",
                objectFit: "contain",
                display: "block",
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};





