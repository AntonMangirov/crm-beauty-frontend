import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  TextField,
  Button,
  Grid,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { meApi, type MeResponse, type PortfolioPhoto } from "../../api/me";
import { useSnackbar } from "../../components/SnackbarProvider";
import { PhotoViewer } from "../../components/PhotoViewer";
import { normalizeImageUrl } from "../../utils/imageUrl";

export const SettingsPage: React.FC = () => {
  const [master, setMaster] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Состояния для изменения пароля
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Состояния для изменения email
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [changingEmail, setChangingEmail] = useState(false);

  // Состояния для изменения телефона
  const [newPhone, setNewPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [changingPhone, setChangingPhone] = useState(false);

  // Состояния для управления фото профиля
  const [profilePhotos, setProfilePhotos] = useState<PortfolioPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);
  const [viewerTitle, setViewerTitle] = useState<string>("");
  const [viewerCurrentIndex, setViewerCurrentIndex] = useState(0);

  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadMaster();
  }, []);

  useEffect(() => {
    if (master) {
      loadProfilePhotos();
    }
  }, [master]);

  const loadMaster = async () => {
    try {
      setLoading(true);
      const masterData = await meApi.getMe();
      setMaster(masterData);
      setNewEmail(masterData.email);
      setNewPhone(masterData.phone || "");
    } catch (err) {
      console.error("Ошибка загрузки профиля:", err);
      showSnackbar("Не удалось загрузить данные", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadProfilePhotos = async () => {
    if (!master) return;
    
    try {
      setLoadingPhotos(true);
      // Загружаем фото профиля из localStorage или используем только текущее фото
      // В будущем можно добавить отдельный API endpoint для фото профиля
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showSnackbar("Выберите изображение", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar("Размер файла не должен превышать 5MB", "error");
      return;
    }

    try {
      setUploadingPhoto(true);
      // Загружаем фото через uploadPortfolioPhoto, чтобы не заменять основное фото
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
      
      // Обновляем список фото, чтобы отметить новое основное
      const updatedPhotos = profilePhotos.map(p => ({
        ...p,
        // Обновляем id 'current' для нового основного фото
      }));
      
      // Обновляем localStorage
      if (master?.id) {
        localStorage.setItem(`profilePhotos_${master.id}`, JSON.stringify(updatedPhotos));
      }
      
      await loadMaster();
      await loadProfilePhotos(); // Перезагружаем список фото
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
      
      // Удаляем фото из списка (фото профиля хранятся в localStorage)
      const updatedPhotos = profilePhotos.filter(p => p.id !== photoId);
      
      // Сохраняем в localStorage
      if (master?.id) {
        localStorage.setItem(`profilePhotos_${master.id}`, JSON.stringify(updatedPhotos));
      }
      
      setProfilePhotos(updatedPhotos);
      
      // Если удалили основное фото, нужно обновить профиль
      if (isMainPhoto) {
        await meApi.updateProfile({ photoUrl: null });
        await loadMaster();
      }
      
      showSnackbar("Фото удалено", "success");
    } catch (err) {
      console.error("Ошибка удаления фото:", err);
      showSnackbar("Не удалось удалить фото", "error");
    }
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[^\d+]/g, "");
    return cleaned.startsWith("+7") && cleaned.length === 12;
  };

  const formatPhoneDisplay = (phone: string): string => {
    const cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+7") && cleaned.length === 12) {
      const digits = cleaned.slice(2);
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
    }
    return phone;
  };

  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/[^\d+\s()-]/g, "");

    if (!cleaned || cleaned === "+") {
      cleaned = "+7";
    } else if (cleaned.startsWith("8") && !cleaned.startsWith("+7")) {
      cleaned = "+7" + cleaned.slice(1);
    } else if (
      cleaned.startsWith("+7") &&
      cleaned.length > 2 &&
      cleaned[2] === "8"
    ) {
      cleaned = "+7" + cleaned.slice(3);
    }

    if (!cleaned.startsWith("+7")) {
      cleaned = "+7" + cleaned.replace(/[^\d]/g, "");
    }

    const digits = cleaned.replace(/[^\d]/g, "");
    if (digits.length > 12) {
      return;
    }

    setNewPhone(cleaned);
    setPhoneError(null);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Заполните все поля");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Пароль должен содержать минимум 6 символов");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Новый пароль должен отличаться от текущего");
      return;
    }

    try {
      setChangingPassword(true);
      await meApi.changePassword({
        currentPassword,
        newPassword,
      });
      showSnackbar("Пароль успешно изменен", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось изменить пароль";
      setPasswordError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailError(null);

    if (!newEmail || !newEmail.includes("@")) {
      setEmailError("Введите корректный email");
      return;
    }

    if (!emailPassword) {
      setEmailError("Введите пароль для подтверждения");
      return;
    }

    if (newEmail === master?.email) {
      setEmailError("Новый email совпадает с текущим");
      return;
    }

    try {
      setChangingEmail(true);
      const response = await meApi.changeEmail({
        newEmail,
        password: emailPassword,
      });
      showSnackbar("Email успешно изменен", "success");
      setMaster({ ...master!, email: response.email });
      setEmailPassword("");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось изменить email";
      setEmailError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePhone = async () => {
    setPhoneError(null);

    if (!newPhone || newPhone === "+7") {
      setPhoneError("Введите номер телефона");
      return;
    }

    if (!validatePhone(newPhone)) {
      setPhoneError("Неверный формат телефона");
      return;
    }

    try {
      setChangingPhone(true);
      const response = await meApi.changePhone({
        newPhone,
      });
      showSnackbar("Телефон успешно изменен", "success");
      setMaster({ ...master!, phone: response.phone });
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Не удалось изменить телефон";
      setPhoneError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setChangingPhone(false);
    }
  };

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
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 1.5, sm: 2.5 } }}>
      <Typography
        variant="h4"
        sx={{
          mb: { xs: 2, sm: 3 },
          fontWeight: 600,
          fontSize: { xs: "1.5rem", sm: "2rem" },
        }}
      >
        Настройки
      </Typography>

      {/* Изменение пароля */}
      <Card sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <LockIcon sx={{ mr: 1, color: "primary.main", fontSize: 20 }} />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            Изменить пароль
          </Typography>
        </Box>

        {passwordError && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {passwordError}
          </Alert>
        )}

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Текущий пароль"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Новый пароль"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Минимум 6 символов"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Подтвердите новый пароль"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? "Изменение..." : "Изменить пароль"}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Изменение email */}
      <Card sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <EmailIcon sx={{ mr: 1, color: "primary.main", fontSize: 20 }} />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            Изменить email
          </Typography>
        </Box>

        {emailError && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {emailError}
          </Alert>
        )}

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Новый email"
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setEmailError(null);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Пароль для подтверждения"
              type={showEmailPassword ? "text" : "password"}
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              helperText="Введите текущий пароль для подтверждения"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                      edge="end"
                    >
                      {showEmailPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleChangeEmail}
              disabled={changingEmail}
            >
              {changingEmail ? "Изменение..." : "Изменить email"}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Управление фото профиля */}
      <Card sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <PhotoCameraIcon sx={{ mr: 1, color: "primary.main", fontSize: 20 }} />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            Фото профиля
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Загрузите несколько фото и выберите основное, которое будет отображаться в вашем профиле
        </Typography>

        {/* Загрузка нового фото */}
        <Box sx={{ mb: 2 }}>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="photo-upload"
            type="file"
            onChange={handlePhotoUpload}
            disabled={uploadingPhoto}
          />
          <label htmlFor="photo-upload">
            <Button
              variant="outlined"
              component="span"
              disabled={uploadingPhoto}
              startIcon={<PhotoCameraIcon />}
              size="small"
            >
              {uploadingPhoto ? "Загрузка..." : "Загрузить фото"}
            </Button>
          </label>
        </Box>

        {/* Список фото */}
        {loadingPhotos ? (
          <Typography variant="body2" color="text.secondary">
            Загрузка...
          </Typography>
        ) : profilePhotos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Нет загруженных фото
          </Typography>
        ) : (
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
                  onClick={() => {
                    const allPhotos = profilePhotos.map(p => p.url);
                    const currentIndex = profilePhotos.findIndex(p => p.id === photo.id);
                    setViewerPhotos(allPhotos);
                    setViewerCurrentIndex(Math.max(0, currentIndex));
                    setViewerTitle("Фото профиля");
                    setPhotoViewerOpen(true);
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {isMain && (
                          <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                        )}
                        <Typography variant="caption" sx={{ fontWeight: isMain ? 600 : 400 }}>
                          {isMain ? "Основное фото" : "Нажмите галочку, чтобы сделать основным"}
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
                            <CheckCircleIcon sx={{ fontSize: 16, color: "white" }} />
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
                        fontSize: "0.75rem",
                      },
                    }}
                  />
                </ImageListItem>
              );
            })}
          </ImageList>
        )}
      </Card>

      {/* Изменение телефона */}
      <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <PhoneIcon sx={{ mr: 1, color: "primary.main", fontSize: 20 }} />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            Изменить телефон
          </Typography>
        </Box>

        {phoneError && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {phoneError}
          </Alert>
        )}

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Новый телефон"
              type="tel"
              value={newPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              error={!!phoneError}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleChangePhone}
              disabled={changingPhone}
            >
              {changingPhone ? "Изменение..." : "Изменить телефон"}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Просмотрщик фото */}
      <PhotoViewer
        open={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        photos={viewerPhotos}
        currentIndex={viewerCurrentIndex}
        title={viewerTitle}
      />
    </Container>
  );
};

export default SettingsPage;

