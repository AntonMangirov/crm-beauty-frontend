import React, { useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import type { PortfolioPhoto } from "../api/masters";
import { normalizeImageUrl } from "../utils/imageUrl";

interface PortfolioGalleryProps {
  photos: PortfolioPhoto[];
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  photos,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handlePhotoClick = (url: string) => {
    setSelectedPhoto(url);
  };

  const handleCloseDialog = () => {
    setSelectedPhoto(null);
  };

  if (!photos || photos.length === 0) {
    return null;
  }

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
            "& .MuiImageListItem-root": {
              cursor: "pointer",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.02)",
              },
            },
          }}
        >
          {photos.map((photo) => (
            <ImageListItem key={photo.id} onClick={() => handlePhotoClick(photo.url)}>
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
          ))}
        </ImageList>
      </Box>

      {/* Диалог для просмотра фото в полном размере */}
      <Dialog
        open={!!selectedPhoto}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.9)",
            backgroundImage: "none",
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative" }}>
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              zIndex: 1,
              bgcolor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.7)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedPhoto && (
            <Box
              component="img"
              src={normalizeImageUrl(selectedPhoto)}
              alt="Пример работы"
              sx={{
                width: "100%",
                height: "auto",
                display: "block",
                maxHeight: "90vh",
                objectFit: "contain",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

