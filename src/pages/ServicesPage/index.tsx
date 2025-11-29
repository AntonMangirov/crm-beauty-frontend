import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Skeleton,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { ServiceItem } from "../../components/ServiceItem";
import { AddServiceDialog } from "../../components/AddServiceDialog";
import { EditServiceDialog } from "../../components/EditServiceDialog";
import {
  meApi,
  type Service,
  type CreateServiceRequest,
  type UpdateServiceRequest,
} from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";
import { clearServicesCache } from "../../utils/servicesCache";
import { logError } from "../../utils/logger";

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await meApi.getServices();
      setServices(data);
    } catch (err) {
      logError("Ошибка загрузки услуг:", err);
      setError("Не удалось загрузить услуги");
      showSnackbar("Не удалось загрузить услуги", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (data: CreateServiceRequest) => {
    try {
      await meApi.createService(data);
      showSnackbar("Услуга успешно добавлена", "success");
      setAddDialogOpen(false);
      clearServicesCache(); // Очищаем кеш при добавлении услуги
      loadServices();
    } catch (err) {
      logError("Ошибка создания услуги:", err);
      showSnackbar("Не удалось добавить услугу", "error");
      throw err;
    }
  };

  const handleEditService = async (id: string, data: UpdateServiceRequest) => {
    try {
      await meApi.updateService(id, data);
      showSnackbar("Услуга успешно обновлена", "success");
      setEditDialogOpen(false);
      setEditingService(null);
      clearServicesCache(); // Очищаем кеш при обновлении услуги
      loadServices();
    } catch (err) {
      logError("Ошибка обновления услуги:", err);
      showSnackbar("Не удалось обновить услугу", "error");
      throw err;
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту услугу?")) {
      return;
    }

    try {
      await meApi.deleteService(id);
      showSnackbar("Услуга успешно удалена", "success");
      clearServicesCache(); // Очищаем кеш при удалении услуги
      loadServices();
    } catch (err: any) {
      logError("Ошибка удаления услуги:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Не удалось удалить услугу";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
    setEditDialogOpen(true);
  };

  return (
    <>
        <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 2.5 } }}>
          {/* Заголовок и кнопка добавления */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              mb: { xs: 2, sm: 2.5 },
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1.5, sm: 0 },
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              Мои услуги
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{
                textTransform: "none",
                width: { xs: "100%", sm: "auto" },
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
              disabled={loading}
            >
              Добавить услугу
            </Button>
          </Box>

          {/* Ошибка */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Skeleton при загрузке */}
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[1, 2, 3].map((index) => (
                <Card key={index}>
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
                          <Skeleton variant="text" width={200} height={32} />
                          <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 1 }} />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 3,
                            flexWrap: "wrap",
                            mb: 1,
                          }}
                        >
                          <Skeleton variant="text" width={150} height={24} />
                          <Skeleton variant="text" width={150} height={24} />
                        </Box>
                        <Skeleton variant="text" width="80%" height={20} />
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="circular" width={40} height={40} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            /* Список услуг */
            services.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="body1" color="text.secondary" align="center">
                    У вас пока нет услуг. Добавьте первую услугу, чтобы начать.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {services.map((service) => (
                  <ServiceItem
                    key={service.id}
                    service={service}
                    onEdit={() => handleEditClick(service)}
                    onDelete={() => handleDeleteService(service.id)}
                  />
                ))}
              </Box>
            )
          )}
        </Container>

      {/* Модальное окно добавления услуги */}
      <AddServiceDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleAddService}
      />

      {/* Модальное окно редактирования услуги */}
      {editingService && (
        <EditServiceDialog
          open={editDialogOpen}
          service={editingService}
          onClose={() => {
            setEditDialogOpen(false);
            setEditingService(null);
          }}
          onSave={(data) => handleEditService(editingService.id, data)}
        />
      )}
    </>
  );
};

