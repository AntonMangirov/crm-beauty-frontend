import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Card,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { People as PeopleIcon } from "@mui/icons-material";
import { meApi, type ClientListItem } from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientsData = await meApi.getClients();
      setClients(clientsData);
    } catch (err) {
      console.error("Ошибка загрузки клиентов:", err);
      setError("Не удалось загрузить список клиентов");
      showSnackbar("Не удалось загрузить список клиентов", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd.MM.yyyy", { locale: ru });
    } catch {
      return "—";
    }
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Имя",
      width: 200,
      flex: isMobile ? 0 : 1,
      minWidth: 150,
    },
    {
      field: "phone",
      headerName: "Телефон",
      width: 180,
      flex: isMobile ? 0 : 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<ClientListItem>) => {
        return (
          <Typography variant="body2">
            {params.row.phone || "—"}
          </Typography>
        );
      },
    },
    {
      field: "visitsCount",
      headerName: "Кол-во посещений",
      width: 160,
      flex: isMobile ? 0 : 0.8,
      minWidth: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<ClientListItem>) => {
        return (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.row.visitsCount}
          </Typography>
        );
      },
    },
    {
      field: "lastVisit",
      headerName: "Дата последнего посещения",
      width: 220,
      flex: isMobile ? 0 : 1.2,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<ClientListItem>) => {
        return (
          <Typography variant="body2" color="text.secondary">
            {formatDate(params.row.lastVisit)}
          </Typography>
        );
      },
    },
  ];

  if (loading) {
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 2.5 } }}>
      {/* Заголовок */}
      <Box sx={{ mb: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 1,
          }}
        >
          <PeopleIcon sx={{ fontSize: 28, color: "primary.main" }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            Клиенты
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Список всех ваших клиентов с историей посещений
        </Typography>
      </Box>

      {/* Таблица */}
      <Card sx={{ overflow: "hidden" }}>
        <DataGrid
          rows={clients}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid",
              borderColor: "divider",
            },
            "& .MuiDataGrid-columnHeaders": {
              borderBottom: "2px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid",
              borderColor: "divider",
            },
          }}
        />
      </Card>
    </Container>
  );
};

