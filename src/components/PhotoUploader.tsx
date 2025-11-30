import React, { useCallback, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useSnackbar } from "./SnackbarProvider";
import { normalizeImageUrl } from "../utils/imageUrl";
import { logError } from "../utils/logger";

interface PhotoUploaderProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  existingPhotos?: Array<{
    id: string;
    url: string;
    description: string | null;
    createdAt: string;
  }>;
  onPhotosUpdated?: () => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  open,
  onClose,
  appointmentId,
  existingPhotos = [],
  onPhotosUpdated,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<
    Array<{ file: File; preview: string }>
  >([]);
  const [uploading, setUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length === 0) {
      showSnackbar("Выберите изображения", "error");
      return;
    }

    handleFiles(files);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith("image/")
      );

      if (files.length === 0) {
        showSnackbar("Выберите изображения", "error");
        return;
      }

      handleFiles(files);
      e.target.value = "";
    },
    []
  );

  const handleFiles = (files: File[]) => {
    const validFiles: Array<{ file: File; preview: string }> = [];

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        showSnackbar(
          `Файл ${file.name} превышает 10MB и будет пропущен`,
          "warning"
        );
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        validFiles.push({
          file,
          preview: reader.result as string,
        });

        if (validFiles.length === files.length) {
          setPreviewFiles((prev) => [...prev, ...validFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreview = (index: number) => {
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (previewFiles.length === 0) {
      showSnackbar("Выберите фото для загрузки", "warning");
      return;
    }

    try {
      setUploading(true);
      const { meApi } = await import("../api/me");
      await meApi.uploadAppointmentPhotos(
        appointmentId,
        previewFiles.map((p) => p.file),
        []
      );

      showSnackbar("Фото успешно загружены", "success");
      setPreviewFiles([]);
      onPhotosUpdated?.();
      onClose();
    } catch (err: any) {
      logError("Ошибка загрузки фото:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Не удалось загрузить фото";
      showSnackbar(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Удалить это фото?")) {
      return;
    }

    try {
      setDeletingPhotoId(photoId);
      const { meApi } = await import("../api/me");
      await meApi.deleteAppointmentPhoto(appointmentId, photoId);
      showSnackbar("Фото удалено", "success");
      onPhotosUpdated?.();
    } catch (err: any) {
      logError("Ошибка удаления фото:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Не удалось удалить фото";
      showSnackbar(errorMessage, "error");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setPreviewFiles([]);
      setDragActive(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Фото-галерея</Typography>
          <IconButton onClick={handleClose} disabled={uploading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Существующие фото */}
        {existingPhotos.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Загруженные фото
            </Typography>
            <ImageList cols={3} gap={8}>
              {existingPhotos.map((photo) => (
                <ImageListItem key={photo.id}>
                  <img
                    src={normalizeImageUrl(photo.url)}
                    alt={photo.description || "Фото"}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                  />
                  <ImageListItemBar
                    title={photo.description || ""}
                    actionIcon={
                      <IconButton
                        sx={{ color: "rgba(255, 255, 255, 0.9)" }}
                        onClick={() => handleDeletePhoto(photo.id)}
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
          </Box>
        )}

        {/* Загрузка новых фото */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Добавить фото
          </Typography>

          {/* Drag and Drop зона */}
          <Paper
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              p: 4,
              border: "2px dashed",
              borderColor: dragActive ? "primary.main" : "divider",
              bgcolor: dragActive ? "action.hover" : "background.paper",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "action.hover",
              },
            }}
          >
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="photo-upload-input"
              type="file"
              multiple
              onChange={handleFileInput}
              disabled={uploading}
            />
            <label htmlFor="photo-upload-input">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <CloudUploadIcon
                  sx={{ fontSize: 48, color: "text.secondary" }}
                />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Перетащите фото сюда или нажмите для выбора
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Поддерживаются форматы: JPG, PNG, GIF. Максимальный размер:
                    10MB
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={uploading}
                >
                  Выбрать файлы
                </Button>
              </Box>
            </label>
          </Paper>

          {/* Предпросмотр выбранных фото */}
          {previewFiles.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Предпросмотр ({previewFiles.length})
              </Typography>
              <ImageList cols={3} gap={8}>
                {previewFiles.map((item, index) => (
                  <ImageListItem key={index}>
                    <img
                      src={item.preview}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                    <ImageListItemBar
                      actionIcon={
                        <IconButton
                          sx={{ color: "rgba(255, 255, 255, 0.9)" }}
                          onClick={() => removePreview(index)}
                          disabled={uploading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Отмена
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={previewFiles.length === 0 || uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : undefined}
        >
          {uploading ? "Загрузка..." : "Загрузить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

