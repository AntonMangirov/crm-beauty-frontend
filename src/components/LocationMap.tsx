import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Typography } from "@mui/material";

// Исправление иконок для Leaflet (проблема с путями в некоторых сборках)
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapProps {
  lat: number;
  lng: number;
  address?: string | null;
  masterName?: string;
  height?: string | number | { xs?: number; sm?: number; md?: number };
}

// Компонент для обновления центра карты при изменении координат
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);

  return null;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  lat,
  lng,
  address,
  masterName,
  height = 400,
}) => {
  // Обработка height для адаптивности
  const getHeight = () => {
    if (typeof height === "object" && height !== null) {
      return {
        xs: `${height.xs || 300}px`,
        sm: `${height.sm || 400}px`,
      };
    }
    if (typeof height === "number") {
      return `${height}px`;
    }
    return height;
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: getHeight(),
        borderRadius: { xs: 1, sm: 2 },
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: 1,
        // Адаптивность для мобильных
        minHeight: { xs: 300, sm: 400 },
      }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        // Отключаем zoom на мобильных для лучшего UX
        touchZoom={true}
        doubleClickZoom={true}
      >
        <MapUpdater lat={lat} lng={lng} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {masterName || "Мастер"}
            </Typography>
            {address && (
              <Typography variant="caption" color="text.secondary">
                {address}
              </Typography>
            )}
          </Popup>
        </Marker>
      </MapContainer>
    </Box>
  );
};

