import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { meApi, type PortfolioPhoto } from "../api/me";
import { useSnackbar } from "./SnackbarProvider";
import { normalizeImageUrl } from "../utils/imageUrl";

export const PortfolioManager: React.FC = () => {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const data = await meApi.getPortfolio();
      setPhotos(data.photos);
    } catch (error) {
      console.error("Ошибка загрузки портфолио:", error);
      showSnackbar("Не удалось загрузить портфолио", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setUploadDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const response = await meApi.uploadPortfolioPhoto(
        selectedFile,
        description.trim() || undefined
      );
      setPhotos([response.photo, ...photos]);
      showSnackbar("Фото успешно загружено", "success");
      handleCloseUploadDialog();
    } catch (error: any) {
      console.error("Ошибка загрузки фото:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Не удалось загрузить фото";
      showSnackbar(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm("Вы уверены, что хотите удалить это фото?")) {
      return;
    }

    try {
      setDeletingPhotoId(photoId);
      await meApi.deletePortfolioPhoto(photoId);
      setPhotos(photos.filter((p) => p.id !== photoId));
      showSnackbar("Фото успешно удалено", "success");
    } catch (error: any) {
      console.error("Ошибка удаления фото:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Не удалось удалить фото";
      showSnackbar(errorMessage, "error");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDescription("");
    setPreview(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Примеры работ
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component="label"
              sx={{ textTransform: "none" }}
            >
              Загрузить фото
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>

          {photos.length === 0 ? (
            <Alert severity="info">
              У вас пока нет загруженных примеров работ. Загрузите фото, чтобы
              показать их на вашей публичной странице.
            </Alert>
          ) : (
            <ImageList variant="masonry" cols={3} gap={8}>
              {photos.map((photo) => (
                <ImageListItem key={photo.id}>
                  <img
                    src={normalizeImageUrl(photo.url)}
                    alt={photo.description || "Пример работы"}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: "8px",
                      display: "block",
                    }}
                  />
                  <ImageListItemBar
                    title={photo.description || ""}
                    actionIcon={
                      <IconButton
                        sx={{ color: "rgba(255, 255, 255, 0.9)" }}
                        onClick={() => handleDelete(photo.id)}
                        disabled={deletingPhotoId === photo.id}
                      >
                        {deletingPhotoId === photo.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <DeleteIcon />
                        )}
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </CardContent>
      </Card>

      {/* Диалог загрузки фото */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Загрузить фото в портфолио</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {preview && (
              <Box
                component="img"
                src={preview}
                alt="Превью"
                sx={{
                  width: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            )}
            <TextField
              label="Описание (необязательно)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Добавьте описание к фото..."
              inputProps={{ maxLength: 200 }}
              helperText={`${description.length}/200 символов`}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            Отмена
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !selectedFile}
            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
          >
            {uploading ? "Загрузка..." : "Загрузить"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

