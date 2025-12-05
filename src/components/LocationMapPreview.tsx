import React, { useState } from "react";
import {
  Box,
  Card,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import { Close as CloseIcon, Map as MapIcon } from "@mui/icons-material";
import { LocationMap } from "./LocationMap";

interface LocationMapPreviewProps {
  lat: number;
  lng: number;
  address?: string | null;
  masterName?: string;
  height?: string | number | { xs?: number; sm?: number; md?: number };
}

export const LocationMapPreview: React.FC<LocationMapPreviewProps> = ({
  lat,
  lng,
  address,
  masterName,
  height = 250,
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Обработка height для адаптивности
  const getHeight = () => {
    if (typeof height === "object" && height !== null) {
      return {
        xs: `${height.xs || 200}px`,
        sm: `${height.sm || 250}px`,
      };
    }
    if (typeof height === "number") {
      return `${height}px`;
    }
    return height;
  };

  return (
    <>
      {/* Превью карты (неактивная) */}
      <Card
        sx={{
          width: "100%",
          height: getHeight(),
          borderRadius: { xs: 1, sm: 2 },
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          cursor: "pointer",
          position: "relative",
          "&:hover": {
            boxShadow: 3,
            borderColor: "primary.main",
          },
          transition: "all 0.2s ease-in-out",
        }}
        onClick={handleOpen}
      >
        {/* Превью карты */}
        <Box
          sx={{
            width: "100%",
            height: "100%",
            bgcolor: "#e0e0e0",
            background:
              "linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 50%, #e8e8e8 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            position: "relative",
            border: "1px solid",
            borderColor: "#bdbdbd",
          }}
        >
          <MapIcon
            sx={{
              fontSize: { xs: 40, sm: 48 },
              color: "primary.main",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: "text.primary",
              fontWeight: 500,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            Нажмите, чтобы открыть карту
          </Typography>
        </Box>
      </Card>

      {/* Диалог с активной картой */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative" }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1000,
              bgcolor: "background.paper",
              "&:hover": {
                bgcolor: "background.paper",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <LocationMap
            lat={lat}
            lng={lng}
            address={address}
            masterName={masterName}
            height={500}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
