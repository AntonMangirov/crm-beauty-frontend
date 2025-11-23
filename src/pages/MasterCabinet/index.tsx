import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  Avatar,
  Button,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { Sidebar } from "../../components/Sidebar";
import { LocationMapPreview } from "../../components/LocationMapPreview";
import { ServicesPage } from "../ServicesPage";
import { CalendarPage } from "../CalendarPage";
import { ClientsPage } from "../ClientsPage";
import {
  meApi,
  type MeResponse,
  type UpdateProfileRequest,
} from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";
import { normalizeImageUrl } from "../../utils/imageUrl";

export const ProfilePage: React.FC = () => {
  const [master, setMaster] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateProfileRequest>({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadMaster();
  }, []);

  const loadMaster = async () => {
    try {
      setLoading(true);
      setError(null);
      const masterData = await meApi.getMe();
      setMaster(masterData);
    } catch (err) {
      console.error("Ошибка загрузки профиля:", err);
      setError("Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (master) {
      setEditFormData({
        name: master.name,
        description: master.description,
        address: master.address,
        photoUrl: master.photoUrl,
      });
      setPhotoPreview(master.photoUrl);
      setEditDialogOpen(true);
    }
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      showSnackbar("Выберите изображение", "error");
      return;
    }

    // Проверяем размер файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar("Размер файла не должен превышать 5MB", "error");
      return;
    }

    // Показываем превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Загружаем фото
    try {
      setUploadingPhoto(true);
      const updatedMaster = await meApi.uploadPhoto(file);
      setMaster(updatedMaster);
      setEditFormData({ ...editFormData, photoUrl: updatedMaster.photoUrl });
      showSnackbar("Фото успешно загружено", "success");
    } catch (err) {
      console.error("Ошибка загрузки фото:", err);
      showSnackbar("Не удалось загрузить фото", "error");
      setPhotoPreview(master?.photoUrl || null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!master) return;

    try {
      setSaving(true);
      const updatedMaster = await meApi.updateProfile(editFormData);
      setMaster(updatedMaster);
      setEditDialogOpen(false);
      showSnackbar("Профиль успешно обновлен", "success");
    } catch (err) {
      console.error("Ошибка обновления профиля:", err);
      showSnackbar("Не удалось обновить профиль", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !master) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || "Профиль не найден"}</Alert>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 2.5 } }}>
        {/* Hero Section */}
        <Card
          sx={{
            mb: { xs: 2, sm: 2.5 },
            overflow: "hidden",
            position: "relative",
            background: master.backgroundImageUrl
              ? `url(${master.backgroundImageUrl})`
              : "linear-gradient(135deg, #0F3B35 0%, #0A2D28 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "1px solid",
            borderColor: "divider",
            color: "white",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: master.backgroundImageUrl
                ? "linear-gradient(135deg, rgba(15, 59, 53, 0.85) 0%, rgba(10, 45, 40, 0.75) 100%)"
                : "none",
              zIndex: 0,
            },
          }}
        >
          <Box sx={{ p: { xs: 1.5, sm: 2 }, position: "relative", zIndex: 2 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1.5 }}>
              {/* Аватар */}
              {master.photoUrl ? (
                <Avatar
                  src={normalizeImageUrl(master.photoUrl)}
                  alt={master.name}
                  sx={{
                    width: { xs: 64, sm: 80 },
                    height: { xs: 64, sm: 80 },
                    mr: { xs: 1.5, sm: 2 },
                    border: "2px solid",
                    borderColor: "white",
                    boxShadow: 2,
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: { xs: 64, sm: 80 },
                    height: { xs: 64, sm: 80 },
                    bgcolor: "primary.main",
                    color: "white",
                    fontSize: { xs: "1.5rem", sm: "2rem" },
                    fontWeight: 600,
                    mr: { xs: 1.5, sm: 2 },
                    border: "2px solid",
                    borderColor: "white",
                    boxShadow: 2,
                  }}
                >
                  {master.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </Avatar>
              )}

              {/* Информация */}
              <Box sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      color: "white",
                    }}
                  >
                    {master.name}
                  </Typography>
                  {master.rating !== null && master.rating !== undefined && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.25,
                      }}
                    >
                      <StarIcon sx={{ fontSize: 16, color: "#FFD700" }} />
                      <Typography variant="body2" sx={{ color: "white" }}>
                        {master.rating.toFixed(1)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {master.address && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 1,
                    }}
                  >
                    <LocationIcon
                      fontSize="small"
                      sx={{ fontSize: 16, color: "rgba(255, 255, 255, 0.9)" }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255, 255, 255, 0.9)" }}
                    >
                      {master.address}
                    </Typography>
                  </Box>
                )}

                {master.phone && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 1,
                    }}
                  >
                    <PhoneIcon
                      fontSize="small"
                      sx={{ fontSize: 16, color: "rgba(255, 255, 255, 0.9)" }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255, 255, 255, 0.9)" }}
                    >
                      {master.phone}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Кнопка редактирования */}
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.95)",
                  color: "text.primary",
                  "&:hover": {
                    bgcolor: "white",
                  },
                }}
              >
                Редактировать профиль
              </Button>
            </Box>
          </Box>
        </Card>

        {/* Описание и карта */}
        {(master.description || (master.lat && master.lng)) && (
          <Grid container spacing={2} sx={{ mb: { xs: 2, sm: 2.5 } }}>
            {master.description && (
              <Grid size={{ xs: 12, md: master.lat && master.lng ? 6 : 12 }}>
                <Card sx={{ height: "100%", p: { xs: 1.5, sm: 2 } }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
                  >
                    {master.description}
                  </Typography>
                </Card>
              </Grid>
            )}

            {master.lat && master.lng && (
              <Grid size={{ xs: 12, md: master.description ? 6 : 12 }}>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    }}
                  >
                    Расположение
                  </Typography>
                  <LocationMapPreview
                    lat={master.lat}
                    lng={master.lng}
                    address={master.address}
                    masterName={master.name}
                    height={{ xs: 200, sm: 250 }}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        )}

        {/* Услуги */}
        <Box sx={{ mb: { xs: 2, sm: 2.5 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: { xs: 1.5, sm: 2 },
              fontWeight: 600,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            Услуги ({master.stats.activeServices})
          </Typography>

          {/* Здесь нужно будет загрузить услуги через API */}
          <Typography variant="body2" color="text.secondary">
            Список услуг будет загружен из API /me/services
          </Typography>
        </Box>
      </Container>

      {/* Диалог редактирования профиля */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setPhotoPreview(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Редактировать профиль</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Загрузка фото */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Avatar
                  src={
                    photoPreview
                      ? photoPreview.startsWith("data:")
                        ? photoPreview
                        : normalizeImageUrl(photoPreview)
                      : undefined
                  }
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 2,
                    border: "2px solid",
                    borderColor: "divider",
                  }}
                >
                  {master.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="photo-upload"
                  type="file"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                />
                <label htmlFor="photo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploadingPhoto}
                    sx={{ textTransform: "none" }}
                  >
                    {uploadingPhoto ? "Загрузка..." : "Загрузить фото"}
                  </Button>
                </label>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Максимальный размер: 5MB
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Имя"
                value={editFormData.name || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Описание"
                value={editFormData.description || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value || null,
                  })
                }
                placeholder="Расскажите о себе, своем опыте и специализации..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Адрес"
                value={editFormData.address || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    address: e.target.value || null,
                  })
                }
                placeholder="Например: г. Москва, ул. Примерная, д. 1"
                helperText="Адрес будет автоматически геокодирован для отображения на карте"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={saving || uploadingPhoto}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const MasterCabinet: React.FC = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          width: { md: `calc(100% - 240px)` },
        }}
      >
        <Routes>
          <Route path="/" element={<ProfilePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/clients" element={<ClientsPage />} />
        </Routes>
      </Box>
    </Box>
  );
};
