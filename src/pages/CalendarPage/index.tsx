import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Button,
  ButtonGroup,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ru } from "date-fns/locale";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { meApi, type Appointment } from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";

const statusColors: Record<
  Appointment["status"],
  "default" | "primary" | "success" | "warning" | "error"
> = {
  PENDING: "warning",
  CONFIRMED: "primary",
  COMPLETED: "success",
  CANCELED: "error",
  NO_SHOW: "error",
};

const statusLabels: Record<Appointment["status"], string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждена",
  COMPLETED: "Завершена",
  CANCELED: "Отменена",
  NO_SHOW: "Не явился",
};

export const CalendarPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (selectedDate) {
      loadAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const loadAppointments = async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);
      setError(null);

      // Получаем начало и конец выбранного дня в локальном времени
      // Преобразуем в UTC для отправки на сервер
      const localStartOfDay = startOfDay(selectedDate);
      const localEndOfDay = endOfDay(selectedDate);
      
      // Создаем UTC даты с теми же компонентами даты
      const year = localStartOfDay.getFullYear();
      const month = localStartOfDay.getMonth();
      const day = localStartOfDay.getDate();
      
      const utcStartOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const utcEndOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

      const data = await meApi.getAppointments({
        from: utcStartOfDay.toISOString(),
        to: utcEndOfDay.toISOString(),
      });

      setAppointments(data);
    } catch (err) {
      console.error("Ошибка загрузки записей:", err);
      setError("Не удалось загрузить записи");
      showSnackbar("Не удалось загрузить записи", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, "dd.MM.yyyy HH:mm", { locale: ru });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: ru });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, "dd.MM.yyyy", { locale: ru });
  };

  const handleConfirm = async (appointmentId: string) => {
    try {
      const updatedAppointment = await meApi.updateAppointmentStatus(
        appointmentId,
        "CONFIRMED"
      );
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? updatedAppointment : apt))
      );
      showSnackbar("Запись подтверждена", "success");
    } catch (err: any) {
      console.error("Ошибка подтверждения записи:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Не удалось подтвердить запись";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (
      !window.confirm("Вы уверены, что хотите отменить эту запись?")
    ) {
      return;
    }

    try {
      const updatedAppointment = await meApi.updateAppointmentStatus(
        appointmentId,
        "CANCELED"
      );
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? updatedAppointment : apt))
      );
      showSnackbar("Запись отменена", "success");
    } catch (err: any) {
      console.error("Ошибка отмены записи:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Не удалось отменить запись";
      showSnackbar(errorMessage, "error");
    }
  };

  const columns: GridColDef[] = [
    {
      field: "client",
      headerName: "Клиент",
      width: 250,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const { name, phone } = params.row.client;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {name}
            </Typography>
            {phone && (
              <Typography variant="caption" color="text.secondary">
                {phone}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "service",
      headerName: "Услуга",
      width: 200,
      valueGetter: (value, row: Appointment) => row.service.name,
    },
    {
      field: "dateTime",
      headerName: "Дата / время",
      width: 180,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const date = formatDate(params.row.startAt);
        const time = `${formatTime(params.row.startAt)} - ${formatTime(params.row.endAt)}`;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {date}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {time}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "price",
      headerName: "Цена",
      width: 120,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const price = params.row.price ?? params.row.service.price;
        return (
          <Typography variant="body2">
            {price ? `${price.toLocaleString("ru-RU")} ₽` : "-"}
          </Typography>
        );
      },
    },
    {
      field: "status",
      headerName: "Статус",
      width: 150,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const status = params.row.status;
        return (
          <Chip
            label={statusLabels[status]}
            color={statusColors[status]}
            size="small"
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Действия",
      width: 220,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Appointment>) => {
        const { id, status } = params.row;
        const canConfirm = status === "PENDING";
        const canCancel = status === "PENDING" || status === "CONFIRMED";

        return (
          <ButtonGroup size="small" variant="outlined">
            <Button
              startIcon={<CheckIcon />}
              onClick={() => handleConfirm(id)}
              disabled={!canConfirm}
              color="primary"
              sx={{ textTransform: "none" }}
            >
              Подтвердить
            </Button>
            <Button
              startIcon={<CancelIcon />}
              onClick={() => handleCancel(id)}
              disabled={!canCancel}
              color="error"
              sx={{ textTransform: "none" }}
            >
              Отменить
            </Button>
          </ButtonGroup>
        );
      },
    },
  ];

  if (loading && appointments.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 2.5 } }}>
        {/* Заголовок и DatePicker */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: { xs: 2, sm: 2.5 },
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            Календарь записей
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarIcon sx={{ color: "primary.main" }} />
            <DatePicker
              label="Выберите дату"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { minWidth: 200 },
                },
              }}
            />
          </Box>
        </Box>

        {/* Ошибка */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Таблица записей */}
        {appointments.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                {selectedDate
                  ? `На ${format(selectedDate, "dd.MM.yyyy", { locale: ru })} записей нет`
                  : "Выберите дату для просмотра записей"}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ height: 600, width: "100%" }}>
            <DataGrid
              rows={appointments}
              columns={columns}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 },
                },
              }}
              sx={{
                "& .MuiDataGrid-cell": {
                  fontSize: "0.875rem",
                },
                "& .MuiDataGrid-columnHeaders": {
                  fontSize: "0.875rem",
                  fontWeight: 600,
                },
              }}
            />
          </Box>
        )}
      </Container>
    </LocalizationProvider>
  );
};

