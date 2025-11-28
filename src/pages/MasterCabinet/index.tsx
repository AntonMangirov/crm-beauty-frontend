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
  IconButton,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Divider,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { Sidebar } from "../../components/Sidebar";
import { LocationMapPreview } from "../../components/LocationMapPreview";
import { ServicesPage } from "../ServicesPage";
import { CalendarPage } from "../CalendarPage";
import { ClientsPage } from "../ClientsPage";
import { AnalyticsPage } from "../AnalyticsPage";
import { PortfolioPage } from "../PortfolioPage";
import { SettingsPage } from "../SettingsPage";
import { SchedulePage } from "../SchedulePage";
import {
  meApi,
  type MeResponse,
  type UpdateProfileRequest,
  type PortfolioPhoto,
} from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { QuickBookingModal } from "../../components/QuickBookingModal";

export const ProfilePage: React.FC = () => {
  const [master, setMaster] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateProfileRequest>({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [quickBookingOpen, setQuickBookingOpen] = useState(false);
  const [profilePhotos, setProfilePhotos] = useState<PortfolioPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
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
      loadProfilePhotos();
      setEditDialogOpen(true);
    }
  };

  const loadProfilePhotos = async () => {
    if (!master) return;
    
    try {
      setLoadingPhotos(true);
      // Загружаем фото профиля из localStorage
      const storedPhotos = localStorage.getItem(`profilePhotos_${master.id}`);
      let photos: PortfolioPhoto[] = [];
      
      if (storedPhotos) {
        try {
          photos = JSON.parse(storedPhotos);
        } catch (e) {
          console.error("Ошибка парсинга сохраненных фото:", e);
        }
      }
      
      // Добавляем текущее фото профиля в начало списка, если его нет
      if (master.photoUrl && !photos.find(p => p.url === master.photoUrl)) {
        photos = [{
          id: 'current',
          url: master.photoUrl,
          description: 'Текущее фото профиля',
          createdAt: new Date().toISOString(),
        } as PortfolioPhoto, ...photos];
      }
      
      setProfilePhotos(photos);
    } catch (err) {
      console.error("Ошибка загрузки фото профиля:", err);
    } finally {
      setLoadingPhotos(false);
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

    // Загружаем фото через uploadPortfolioPhoto, чтобы не заменять основное фото
    try {
      setUploadingPhoto(true);
      const response = await meApi.uploadPortfolioPhoto(file);
      const newPhoto = response.photo;
      
      // Добавляем новое фото в список фото профиля
      const updatedPhotos = [newPhoto, ...profilePhotos];
      
      // Сохраняем в localStorage
      if (master?.id) {
        localStorage.setItem(`profilePhotos_${master.id}`, JSON.stringify(updatedPhotos));
      }
      
      setProfilePhotos(updatedPhotos);
      showSnackbar("Фото успешно загружено. Выберите его как основное, если нужно.", "success");
    } catch (err) {
      console.error("Ошибка загрузки фото:", err);
      showSnackbar("Не удалось загрузить фото", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSetMainPhoto = async (photoUrl: string) => {
    try {
      // Обновляем основное фото профиля
      await meApi.updateProfile({ photoUrl });
      
      // Обновляем данные мастера
      const updatedMaster = await meApi.getMe();
      setMaster(updatedMaster);
      setEditFormData({ ...editFormData, photoUrl });
      setPhotoPreview(photoUrl);
      
      // Обновляем список фото
      await loadProfilePhotos();
      
      showSnackbar("Основное фото обновлено", "success");
    } catch (err) {
      console.error("Ошибка обновления основного фото:", err);
      showSnackbar("Не удалось обновить основное фото", "error");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Удалить это фото?")) return;

    try {
      const deletedPhoto = profilePhotos.find(p => p.id === photoId);
      const isMainPhoto = master?.photoUrl && deletedPhoto?.url === master.photoUrl;
      
      // Удаляем фото из списка
      const updatedPhotos = profilePhotos.filter(p => p.id !== photoId);
      
      // Сохраняем в localStorage
      if (master?.id) {
        localStorage.setItem(`profilePhotos_${master.id}`, JSON.stringify(updatedPhotos));
      }
      
      setProfilePhotos(updatedPhotos);
      
      // Если удалили основное фото, нужно обновить профиль
      if (isMainPhoto) {
        await meApi.updateProfile({ photoUrl: null });
        const updatedMaster = await meApi.getMe();
        setMaster(updatedMaster);
        setEditFormData({ ...editFormData, photoUrl: null });
        setPhotoPreview(null);
      }
      
      showSnackbar("Фото удалено", "success");
    } catch (err) {
      console.error("Ошибка удаления фото:", err);
      showSnackbar("Не удалось удалить фото", "error");
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
        {/* Кнопка быстрой записи - выделена ярким цветом */}
        <Box sx={{ mb: { xs: 2, sm: 2.5 } }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => setQuickBookingOpen(true)}
            sx={{
              bgcolor: "success.main",
              color: "white",
              py: 2,
              fontSize: { xs: "1rem", sm: "1.125rem" },
              fontWeight: 600,
              textTransform: "none",
              boxShadow: 3,
              "&:hover": {
                bgcolor: "success.dark",
                boxShadow: 6,
                transform: "translateY(-2px)",
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            Быстрая запись
          </Button>
        </Box>

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
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                mb: 1.5,
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1.5, sm: 0 },
              }}
            >
              {/* Аватар и информация */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  flexGrow: 1,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
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
                      flexShrink: 0,
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
                      flexShrink: 0,
                    }}
                  >
                    {master.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Avatar>
                )}

                {/* Информация */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
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
                        sx={{
                          color: "rgba(255, 255, 255, 0.9)",
                          wordBreak: "break-word",
                        }}
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
              </Box>

              {/* Кнопка редактирования */}
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                fullWidth={false}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.95)",
                  color: "text.primary",
                  "&:hover": {
                    bgcolor: "white",
                  },
                  width: { xs: "100%", sm: "auto" },
                  mt: { xs: 1, sm: 0 },
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  px: { xs: 2, sm: 2 },
                }}
              >
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
                  Редактировать профиль
                </Box>
                <Box
                  component="span"
                  sx={{ display: { xs: "inline", sm: "none" } }}
                >
                  Редактировать
                </Box>
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
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Фото профиля
              </Typography>
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
                      : master?.photoUrl
                      ? normalizeImageUrl(master.photoUrl)
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
                  {master?.name
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
                    {uploadingPhoto ? "Загрузка..." : "Добавить фото"}
                  </Button>
                </label>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Максимальный размер: 5MB. Фото не заменяет существующие.
                </Typography>
              </Box>

              {/* Список всех фото профиля */}
              {loadingPhotos ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : profilePhotos.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Все фото профиля ({profilePhotos.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                    Выберите основное фото, нажав на зеленую галочку
                  </Typography>
                  <ImageList cols={3} gap={8} sx={{ mb: 0 }}>
                    {profilePhotos.map((photo) => {
                      const isMain = master?.photoUrl === photo.url;
                      return (
                        <ImageListItem
                          key={photo.id}
                          sx={{
                            position: "relative",
                            cursor: "pointer",
                            "&:hover": {
                              opacity: 0.9,
                            },
                          }}
                        >
                          <img
                            src={normalizeImageUrl(photo.url)}
                            alt={photo.description || "Фото профиля"}
                            loading="lazy"
                            style={{
                              width: "100%",
                              height: "auto",
                              borderRadius: "8px",
                              display: "block",
                            }}
                          />
                          <ImageListItemBar
                            title={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                {isMain && (
                                  <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
                                )}
                                <Typography variant="caption" sx={{ fontWeight: isMain ? 600 : 400 }}>
                                  {isMain ? "Основное" : "Нажмите галочку"}
                                </Typography>
                              </Box>
                            }
                            actionIcon={
                              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                                {!isMain ? (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetMainPhoto(photo.url);
                                    }}
                                    sx={{ 
                                      color: "white", 
                                      bgcolor: "rgba(76, 175, 80, 0.9)",
                                      "&:hover": {
                                        bgcolor: "rgba(76, 175, 80, 1)",
                                      }
                                    }}
                                    title="Сделать основным фото"
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                ) : (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                      bgcolor: "rgba(76, 175, 80, 0.9)",
                                    }}
                                  >
                                    <CheckCircleIcon sx={{ fontSize: 14, color: "white" }} />
                                    <Typography variant="caption" sx={{ color: "white", fontWeight: 600, fontSize: "0.7rem" }}>
                                      Основное
                                    </Typography>
                                  </Box>
                                )}
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePhoto(photo.id);
                                  }}
                                  sx={{ 
                                    color: "white", 
                                    bgcolor: "rgba(211, 47, 47, 0.9)",
                                    "&:hover": {
                                      bgcolor: "rgba(211, 47, 47, 1)",
                                    }
                                  }}
                                  title="Удалить фото"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            }
                            sx={{
                              "& .MuiImageListItemBar-title": {
                                fontSize: "0.7rem",
                              },
                              "& .MuiImageListItemBar-actionIcon": {
                                marginRight: "4px",
                              },
                            }}
                          />
                        </ImageListItem>
                      );
                    })}
                  </ImageList>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
                  Нет загруженных фото. Загрузите первое фото выше.
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
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

      {/* Модальное окно быстрой записи */}
      {master && master.slug && (
        <QuickBookingModal
          open={quickBookingOpen}
          onClose={() => setQuickBookingOpen(false)}
          masterSlug={master.slug}
          onSuccess={() => {
            loadMaster();
          }}
        />
      )}
    </>
  );
};

export const MasterCabinet: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {/* Мобильный AppBar с бургер-меню */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Кабинет мастера
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Box sx={{ display: "flex", flexGrow: 1, mt: isMobile ? 8 : 0 }}>
        <Sidebar open={mobileOpen} onClose={handleDrawerClose} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            width: { md: `calc(100% - 240px)` },
            p: { xs: 0, sm: 0 },
          }}
        >
          <Routes>
            <Route path="/" element={<ProfilePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};
