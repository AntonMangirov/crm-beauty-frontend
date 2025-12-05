import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { normalizeImageUrl } from "../utils/imageUrl";

interface PhotoViewerProps {
  open: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex?: number;
  title?: string;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  open,
  onClose,
  photos,
  currentIndex: initialIndex = 0,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  React.useEffect(() => {
    if (open && photos.length > 0) {
      const index = Math.min(initialIndex, photos.length - 1);
      setCurrentIndex(Math.max(0, index));
    }
  }, [open, initialIndex, photos.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      handlePrevious();
    } else if (event.key === "ArrowRight") {
      handleNext();
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "rgba(0, 0, 0, 0.95)",
          backgroundImage: "none",
          position: "relative",
        },
      }}
      onKeyDown={handleKeyDown}
    >
      <DialogContent sx={{ p: 0, position: "relative", minHeight: "70vh" }}>
        {/* Кнопка закрытия */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            zIndex: 1001,
            bgcolor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.7)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Кнопка предыдущего фото */}
        {photos.length > 1 && (
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1001,
              bgcolor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.7)",
              },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}

        {/* Кнопка следующего фото */}
        {photos.length > 1 && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1001,
              bgcolor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.7)",
              },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        )}

        {/* Заголовок */}
        {title && (
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1001,
              bgcolor: "rgba(0, 0, 0, 0.5)",
              px: 2,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: "white" }}>
              {title}
            </Typography>
          </Box>
        )}

        {/* Счетчик фото */}
        {photos.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1001,
              bgcolor: "rgba(0, 0, 0, 0.5)",
              px: 2,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: "white" }}>
              {currentIndex + 1} / {photos.length}
            </Typography>
          </Box>
        )}

        {/* Изображение */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            p: 2,
          }}
        >
          <Box
            component="img"
            src={normalizeImageUrl(photos[currentIndex])}
            alt={title || `Фото ${currentIndex + 1}`}
            sx={{
              maxWidth: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
              borderRadius: 1,
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

