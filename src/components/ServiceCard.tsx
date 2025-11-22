import { Card, CardContent, Typography, Box, Button, CardMedia } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { normalizeImageUrl } from "../utils/imageUrl";

interface ServiceCardProps {
  id: string;
  name: string;
  price: number;
  durationMin?: number;
  description?: string;
  photoUrl?: string | null;
  masterSlug: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  name,
  price,
  durationMin,
  description,
  photoUrl,
  masterSlug,
}) => {
  const navigate = useNavigate();
  
  const handleBookClick = () => {
    navigate(`/${masterSlug}/book`, {
      state: { serviceId: id },
    });
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
    }
    return `${mins}м`;
  };

  const normalizedPhotoUrl = normalizeImageUrl(photoUrl);

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Фото услуги */}
      {normalizedPhotoUrl && (
        <CardMedia
          component="img"
          image={normalizedPhotoUrl}
          alt={name}
          sx={{
            height: 140,
            objectFit: "cover",
          }}
        />
      )}
      
      <CardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 1.5 }}
      >
        {/* Header: название */}
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 0.5 }}>
          {name}
        </Typography>

        {/* Subline: durationMin • price */}
        <Box sx={{ display: "flex", gap: 0.5, mb: 1.5, alignItems: "center" }}>
          {durationMin && (
            <Typography variant="caption" color="text.secondary">
              {formatDuration(durationMin)}
            </Typography>
          )}
          {durationMin && (
            <Typography variant="caption" color="text.secondary">
              •
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {formatPrice(price)}
          </Typography>
        </Box>

        {/* Description */}
        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1.5, flexGrow: 1 }}
          >
            {description}
          </Typography>
        )}

        {/* CTA Button */}
        <Button
          variant="contained"
          fullWidth
          size="small"
          onClick={handleBookClick}
          sx={{
            mt: "auto",
            borderRadius: 1,
            textTransform: "none",
          }}
        >
          Записаться
        </Button>
      </CardContent>
    </Card>
  );
};
