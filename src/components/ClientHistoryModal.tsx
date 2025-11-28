import React, { useState, useEffect, useMemo } from "react";
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
  Tabs,
  Tab,
  TextField,
} from "@mui/material";
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Build as BuildIcon,
  Photo as PhotoIcon,
  History as HistoryIcon,
  Collections as CollectionsIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
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
  onClientUpdated?: (updatedClient: ClientListItem) => void;
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
  onClientUpdated,
}) => {
  const [history, setHistory] = useState<ClientHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    appointmentDate?: string;
    services?: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);
  const [currentClient, setCurrentClient] = useState<ClientListItem | null>(client);
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Собираем все фотографии из истории в один массив для галереи с информацией о посещении
  const allPhotos = useMemo(() => {
    return history.flatMap((item) =>
      item.photos.map((photo) => ({
        ...photo,
        appointmentDate: item.date,
        serviceName: item.service.name,
      }))
    );
  }, [history]);

  const hasPhotos = allPhotos.length > 0;

  useEffect(() => {
    if (open && client) {
      setCurrentClient(client);
      setEditedName(client.name);
      setIsEditingName(false);
      loadHistory();
      setActiveTab(0); // Сбрасываем вкладку при открытии
    } else {
      setHistory([]);
      setError(null);
      setSelectedPhoto(null);
      setActiveTab(0);
      setIsEditingName(false);
      setCurrentClient(null);
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

  const handleStartEditName = () => {
    if (currentClient) {
      setEditedName(currentClient.name);
      setIsEditingName(true);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    if (currentClient) {
      setEditedName(currentClient.name);
    }
  };

  const handleSaveName = async () => {
    if (!currentClient) return;

    const trimmedName = editedName.trim();
    if (trimmedName === currentClient.name) {
      setIsEditingName(false);
      return;
    }

    try {
      setUpdatingName(true);
      const updatedClient = await meApi.updateClient(currentClient.id, {
        name: trimmedName || "-",
      });
      setCurrentClient(updatedClient);
      setIsEditingName(false);
      showSnackbar("Имя клиента успешно обновлено", "success");
      
      // Обновляем имя в родительском компоненте через callback
      if (onClientUpdated) {
        onClientUpdated(updatedClient);
      }
    } catch (err) {
      console.error("Ошибка обновления имени клиента:", err);
      showSnackbar("Не удалось обновить имя клиента", "error");
    } finally {
      setUpdatingName(false);
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
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            История клиента
          </Typography>
          {currentClient && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              {isEditingName ? (
                <>
                  <TextField
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    size="small"
                    placeholder="Введите имя"
                    disabled={updatingName}
                    autoFocus
                    sx={{
                      flex: 1,
                      "& .MuiInputBase-root": {
                        fontSize: "0.875rem",
                      },
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveName();
                      } else if (e.key === "Escape") {
                        handleCancelEditName();
                      }
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleSaveName}
                    disabled={updatingName}
                    color="primary"
                    sx={{ p: 0.5 }}
                  >
                    {updatingName ? (
                      <CircularProgress size={16} />
                    ) : (
                      <CheckIcon fontSize="small" />
                    )}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleCancelEditName}
                    disabled={updatingName}
                    sx={{ p: 0.5 }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {currentClient.name === "-" ? "—" : currentClient.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleStartEditName}
                    sx={{ p: 0.5, ml: 0.5 }}
                    title="Редактировать имя"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
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

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Вкладки */}
        {!loading && !error && history.length > 0 && (
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ px: { xs: 1, sm: 2 } }}
            >
              <Tab
                icon={<HistoryIcon />}
                iconPosition="start"
                label="История"
                sx={{ textTransform: "none", minHeight: 64 }}
              />
              {hasPhotos && (
                <Tab
                  icon={<CollectionsIcon />}
                  iconPosition="start"
                  label={`Галерея (${allPhotos.length})`}
                  sx={{ textTransform: "none", minHeight: 64 }}
                />
              )}
            </Tabs>
          </Box>
        )}

        {/* Содержимое вкладок */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
          ) : activeTab === 0 ? (
            // Вкладка "История"
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
                                onClick={() =>
                                setSelectedPhoto({
                                  url: photo.url,
                                  appointmentDate: item.date,
                                  services: [item.service.name],
                                })
                              }
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
          ) : (
            // Вкладка "Галерея"
            hasPhotos ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Все фотографии клиента ({allPhotos.length})
                </Typography>
                <Grid container spacing={2}>
                  {allPhotos.map((photo) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={photo.id}>
                      <Card
                        sx={{
                          cursor: "pointer",
                          transition: "transform 0.2s",
                          "&:hover": {
                            transform: "scale(1.02)",
                          },
                        }}
                        onClick={() =>
                          setSelectedPhoto({
                            url: photo.url,
                            appointmentDate: photo.appointmentDate,
                            services: photo.serviceName ? [photo.serviceName] : undefined,
                          })
                        }
                      >
                        <CardMedia
                          component="img"
                          image={normalizeImageUrl(photo.url)}
                          alt={photo.description || "Фото работы"}
                          sx={{
                            height: { xs: 150, sm: 200 },
                            objectFit: "cover",
                          }}
                        />
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          {photo.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                mb: 0.5,
                              }}
                            >
                              {photo.description}
                            </Typography>
                          )}
                          {photo.appointmentDate && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", fontSize: "0.7rem", fontWeight: 500 }}
                            >
                              {formatDate(photo.appointmentDate)}
                            </Typography>
                          )}
                          {photo.serviceName && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", fontSize: "0.7rem" }}
                            >
                              {photo.serviceName}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <Alert severity="info">Нет фотографий для отображения</Alert>
            )
          )}
        </Box>
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
              bgcolor: "rgba(0, 0, 0, 0.95)",
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
              src={normalizeImageUrl(selectedPhoto.url)}
              alt="Фото работы"
              sx={{
                width: "100%",
                height: "auto",
                maxHeight: "85vh",
                objectFit: "contain",
                display: "block",
              }}
            />
            {/* Информация о посещении */}
            {(selectedPhoto.appointmentDate || selectedPhoto.services) && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                  color: "white",
                  p: 2,
                  backdropFilter: "blur(10px)",
                }}
              >
                {selectedPhoto.appointmentDate && (
                  <Box sx={{ mb: selectedPhoto.services ? 1 : 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontWeight: 500,
                      }}
                    >
                      <CalendarIcon sx={{ fontSize: 18 }} />
                      {formatDate(selectedPhoto.appointmentDate)}
                    </Typography>
                  </Box>
                )}
                {selectedPhoto.services && selectedPhoto.services.length > 0 && (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontWeight: 500,
                      }}
                    >
                      <BuildIcon sx={{ fontSize: 18 }} />
                      {selectedPhoto.services.join(", ")}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};





