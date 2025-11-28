import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Alert,
  Card,
  useMediaQuery,
  useTheme,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { People as PeopleIcon, PhotoCamera as PhotoCameraIcon, Image as ImageIcon } from "@mui/icons-material";
import { meApi, type ClientListItem } from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";
import { ClientHistoryModal } from "../../components/ClientHistoryModal";

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientListItem | null>(null);
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

  const handleRowClick = (params: { row: ClientListItem }) => {
    setSelectedClient(params.row);
    setHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false);
    setSelectedClient(null);
  };

  const handleClientUpdated = (updatedClient: ClientListItem) => {
    // Обновляем клиента в списке
    setClients((prevClients) =>
      prevClients.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
    // Обновляем выбранного клиента
    setSelectedClient(updatedClient);
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
      headerName: "Контакты",
      width: 220,
      flex: isMobile ? 0 : 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<ClientListItem>) => {
        const { phone, telegramUsername } = params.row;
        if (!phone && !telegramUsername) {
          return (
            <Typography variant="body2" color="text.secondary">
              —
            </Typography>
          );
        }
        return (
          <Box>
            {phone && (
              <Typography variant="body2">
                📞 {phone}
              </Typography>
            )}
            {telegramUsername && (
              <Typography variant="body2" color="text.secondary">
                ✈️ @{telegramUsername}
              </Typography>
            )}
          </Box>
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
      field: "photos",
      headerName: "Фото",
      width: 100,
      flex: isMobile ? 0 : 0.6,
      minWidth: 80,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<ClientListItem>) => {
        const photosCount = params.row.photosCount || 0;
        
        if (photosCount === 0) {
          return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
              <ImageIcon sx={{ fontSize: 18, color: "text.disabled" }} />
            </Box>
          );
        }

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            <PhotoCameraIcon sx={{ fontSize: 18, color: "success.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: "success.main" }}>
              {photosCount}
            </Typography>
          </Box>
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

      {/* Ошибка */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Skeleton таблицы при загрузке */}
      {loading ? (
        <Card
          sx={{
            overflow: "hidden",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableCell key={index}>
                      <Skeleton variant="text" width={column.width || 150} height={24} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                  <TableRow key={row}>
                    {columns.map((column, index) => (
                      <TableCell key={index}>
                        <Skeleton variant="text" width="80%" height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        /* Таблица */
        <Card
          sx={{
            overflow: "hidden",
            "&:hover": {
              transform: "none",
              boxShadow: 3,
            },
          }}
        >
          <Box
            sx={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <DataGrid
              rows={clients}
              columns={columns}
              getRowId={(row) => row.id}
              autoHeight
              disableRowSelectionOnClick
              onRowClick={handleRowClick}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: isMobile ? 10 : 25 },
                },
              }}
              sx={{
                border: "none",
                cursor: "pointer",
                minWidth: isMobile ? 800 : "auto",
                "& .MuiDataGrid-row:hover": {
                  bgcolor: "action.hover",
                  transform: "none",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                },
                "& .MuiDataGrid-columnHeaders": {
                  borderBottom: "2px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "1px solid",
                  borderColor: "divider",
                },
              }}
            />
          </Box>
        </Card>
      )}

      {/* Модальное окно истории клиента */}
      <ClientHistoryModal
        open={historyModalOpen}
        client={selectedClient}
        onClose={handleCloseHistoryModal}
        onClientUpdated={handleClientUpdated}
      />
    </Container>
  );
};

