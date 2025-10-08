import { useState, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  Paper,
} from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import { useServices } from "../hooks/useServices";
import { ServiceCard } from "../components/ServiceCard";
import { ServiceForm } from "../components/ServiceForm";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { ServicesFilter } from "../components/ServicesFilter";
import type {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
} from "../types/service";

export function ServicesManagementPage() {
  const {
    services,
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
    refreshServices,
    searchServices,
    filterServices,
  } = useServices();

  // Состояние поиска для индикатора
  const [isSearching, setIsSearching] = useState(false);

  // Состояния для модальных окон
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Обработчики для карточек услуг
  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsFormOpen(true);
    setFormError(null);
  };

  const handleDeleteService = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await updateService(service.id, { isActive: !service.isActive });
    } catch (err) {
      console.error("Ошибка изменения статуса услуги:", err);
    }
  };

  // Обработчики для формы
  const handleCreateService = () => {
    setSelectedService(null);
    setIsFormOpen(true);
    setFormError(null);
  };

  const handleFormSubmit = async (
    data: CreateServiceRequest | UpdateServiceRequest
  ) => {
    try {
      setFormError(null);

      if (selectedService) {
        // Редактирование
        await updateService(selectedService.id, data);
      } else {
        // Создание
        await createService(data as CreateServiceRequest);
      }

      setIsFormOpen(false);
      setSelectedService(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Произошла ошибка");
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedService(null);
    setFormError(null);
  };

  // Обработчики для диалога удаления
  const handleDeleteConfirm = async () => {
    if (!selectedService) return;

    try {
      setDeleteError(null);
      await deleteService(selectedService.id);
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Произошла ошибка при удалении"
      );
    }
  };

  const handleDeleteClose = () => {
    setIsDeleteDialogOpen(false);
    setSelectedService(null);
    setDeleteError(null);
  };

  // Обработчики для фильтров
  const handleSearch = useCallback(
    async (query: string) => {
      setIsSearching(true);
      try {
        await searchServices(query);
      } finally {
        setIsSearching(false);
      }
    },
    [searchServices]
  );

  const handleFilter = useCallback(
    (isActive: boolean | undefined) => {
      filterServices(isActive);
    },
    [filterServices]
  );

  const handleClearFilters = useCallback(() => {
    refreshServices();
  }, [refreshServices]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Заголовок и действия */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h4" component="h1">
            Управление услугами
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<Refresh />}
              onClick={refreshServices}
              disabled={isLoading}
              variant="outlined"
            >
              Обновить
            </Button>
            <Button
              startIcon={<Add />}
              onClick={handleCreateService}
              variant="contained"
              color="primary"
            >
              Добавить услугу
            </Button>
          </Stack>
        </Stack>

        <Typography variant="body1" color="text.secondary">
          Управляйте услугами вашего салона. Создавайте, редактируйте и удаляйте
          услуги.
        </Typography>
      </Box>

      {/* Фильтры */}
      <ServicesFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        onClear={handleClearFilters}
        isLoading={isLoading}
        isSearching={isSearching}
      />

      {/* Ошибки */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Загрузка */}
      {isLoading && services.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Статистика */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
            <Stack direction="row" spacing={4} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Всего услуг: <strong>{services.length}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Активных:{" "}
                <strong>{services.filter((s) => s.isActive).length}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Неактивных:{" "}
                <strong>{services.filter((s) => !s.isActive).length}</strong>
              </Typography>
            </Stack>
          </Paper>

          {/* Список услуг */}
          {services.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Услуги не найдены
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {error
                  ? "Произошла ошибка при загрузке услуг"
                  : "Создайте первую услугу для начала работы"}
              </Typography>
              {!error && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateService}
                >
                  Добавить услугу
                </Button>
              )}
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {services.map((service) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={service.id}>
                  <ServiceCard
                    service={service}
                    onEdit={handleEditService}
                    onDelete={handleDeleteService}
                    onToggleActive={handleToggleActive}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Модальные окна */}
      <ServiceForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        service={selectedService}
        isLoading={isLoading}
        error={formError}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        service={selectedService}
        isLoading={isLoading}
        error={deleteError}
      />
    </Container>
  );
}
