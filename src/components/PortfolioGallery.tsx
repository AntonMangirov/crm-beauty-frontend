import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Button,
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import type { PortfolioPhoto } from "../api/masters";
import { normalizeImageUrl } from "../utils/imageUrl";

interface PortfolioGalleryProps {
  photos: PortfolioPhoto[];
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  photos,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_PHOTOS_COUNT = 3; // Показываем первые 3 фото

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleCloseDialog = () => {
    setSelectedPhotoIndex(null);
  };

  const handlePreviousPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  // Обработка клавиатуры для навигации и защиты
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;

      if (e.key === "Escape") {
        handleCloseDialog();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedPhotoIndex > 0) {
          setSelectedPhotoIndex(selectedPhotoIndex - 1);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedPhotoIndex < photos.length - 1) {
          setSelectedPhotoIndex(selectedPhotoIndex + 1);
        }
      }
      // Блокируем F12 и другие клавиши разработчика
      else if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))
      ) {
        e.preventDefault();
        return false;
      }
      // Блокируем сохранение и копирование
      else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "a" || e.key === "c" || e.key === "v" || e.key === "p")
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Защита от копирования через буфер обмена
    const handleCopy = (e: ClipboardEvent) => {
      if (selectedPhotoIndex !== null) {
        e.preventDefault();
        return false;
      }
    };

    // Защита от сохранения страницы
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (selectedPhotoIndex !== null) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [selectedPhotoIndex, photos.length]);

  // Защита от скачивания и копирования
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Блокируем Ctrl+S, Ctrl+A, Ctrl+C, Ctrl+V
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "s" || e.key === "a" || e.key === "c" || e.key === "v")
    ) {
      e.preventDefault();
      return false;
    }
  };


  if (!photos || photos.length === 0) {
    return null;
  }

  const displayedPhotos = showAll ? photos : photos.slice(0, INITIAL_PHOTOS_COUNT);
  const hasMorePhotos = photos.length > INITIAL_PHOTOS_COUNT;

  return (
    <>
      <Box sx={{ mb: { xs: 2, sm: 2.5 } }}>
        <Typography
          variant="h6"
          sx={{
            mb: { xs: 1.5, sm: 2 },
            fontWeight: 600,
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Примеры работ
        </Typography>

        <ImageList
          variant="masonry"
          cols={3}
          gap={8}
          sx={{
            mb: 0,
            maxHeight: showAll ? "none" : "300px",
            overflow: "hidden",
            "& .MuiImageListItem-root": {
              cursor: "pointer",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.02)",
              },
            },
          }}
        >
          {displayedPhotos.map((photo, index) => {
            // Индекс в исходном массиве photos
            const photoIndex = showAll ? index : index;
            return (
              <ImageListItem
                key={photo.id}
                onClick={() => handlePhotoClick(photoIndex)}
              >
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
                {photo.description && (
                  <ImageListItemBar
                    title={photo.description}
                    sx={{
                      "& .MuiImageListItemBar-title": {
                        fontSize: "0.75rem",
                        lineHeight: 1.2,
                      },
                    }}
                  />
                )}
              </ImageListItem>
            );
          })}
        </ImageList>
        {hasMorePhotos && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowAll(!showAll)}
              endIcon={<ExpandMoreIcon sx={{ transform: showAll ? "rotate(180deg)" : "none", transition: "transform 0.3s" }} />}
              sx={{ textTransform: "none" }}
            >
              {showAll ? "Скрыть" : `Показать все (${photos.length})`}
            </Button>
          </Box>
        )}
      </Box>

      {/* Диалог для просмотра фото в полном размере */}
      <Dialog
        open={selectedPhotoIndex !== null}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.95)",
            backgroundImage: "none",
          },
        }}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
      >
        <DialogContent
          sx={{
            p: 0,
            position: "relative",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
        >
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              zIndex: 2,
              bgcolor: "rgba(0, 0, 0, 0.6)",
              color: "white",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.8)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Кнопка "Назад" */}
          {selectedPhotoIndex !== null && selectedPhotoIndex > 0 && (
            <IconButton
              onClick={handlePreviousPhoto}
              sx={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                bgcolor: "rgba(0, 0, 0, 0.6)",
                color: "white",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          )}

          {/* Кнопка "Вперед" */}
          {selectedPhotoIndex !== null &&
            selectedPhotoIndex < photos.length - 1 && (
              <IconButton
                onClick={handleNextPhoto}
                sx={{
                  position: "absolute",
                  right: 56,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  bgcolor: "rgba(0, 0, 0, 0.6)",
                  color: "white",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.8)",
                  },
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            )}

          {/* Индикатор текущего фото */}
          {selectedPhotoIndex !== null && photos.length > 1 && (
            <Box
              sx={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 2,
                bgcolor: "rgba(0, 0, 0, 0.6)",
                color: "white",
                px: 2,
                py: 0.5,
                borderRadius: 2,
                fontSize: "0.875rem",
              }}
            >
              {selectedPhotoIndex + 1} / {photos.length}
            </Box>
          )}

          {/* Защитный overlay для предотвращения копирования */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              pointerEvents: "none",
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
            }}
          />

          {/* Watermark overlay для защиты от копирования */}
          {selectedPhotoIndex !== null && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1,
                pointerEvents: "none",
                color: "rgba(255, 255, 255, 0.1)",
                fontSize: "3rem",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                userSelect: "none",
                WebkitUserSelect: "none",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
              ЗАЩИТА АВТОРСКИХ ПРАВ
            </Box>
          )}

          {/* Изображение с защитой */}
          {selectedPhotoIndex !== null && (
            <Box
              sx={{
                position: "relative",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "90vh",
                p: 2,
              }}
            >
              <Box
                component="img"
                src={normalizeImageUrl(photos[selectedPhotoIndex].url)}
                alt={
                  photos[selectedPhotoIndex].description || "Пример работы"
                }
                draggable={false}
                onContextMenu={handleContextMenu}
                onDragStart={handleDragStart}
                onMouseDown={(e) => {
                  // Предотвращаем выделение при клике
                  if (e.detail > 1) {
                    e.preventDefault();
                  }
                }}
                onSelect={(e) => {
                  e.preventDefault();
                  return false;
                }}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "90vh",
                  height: "auto",
                  display: "block",
                  objectFit: "contain",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                  WebkitUserDrag: "none",
                  KhtmlUserDrag: "none",
                  pointerEvents: "auto",
                  // Защита от копирования через CSS
                  WebkitTouchCallout: "none",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "none",
                  // Дополнительная защита
                  imageRendering: "auto",
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

