import { Card, CardContent, Typography, Box, Button } from "@mui/material";

interface ServiceCardProps {
  name: string;
  price: number;
  durationMin?: number;
  description?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  name,
  price,
  durationMin,
  description,
}) => {
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

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        {/* Header: название */}
        <Typography variant="h3" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
          {name}
        </Typography>

        {/* Subline: durationMin • price */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          {durationMin && (
            <Typography variant="body2" color="text.secondary">
              {formatDuration(durationMin)}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            •
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatPrice(price)}
          </Typography>
        </Box>

        {/* Description */}
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, flexGrow: 1 }}
          >
            {description}
          </Typography>
        )}

        {/* CTA Button */}
        <Button
          variant="contained"
          fullWidth
          sx={{
            mt: "auto",
            borderRadius: 2,
          }}
        >
          Записаться
        </Button>
      </CardContent>
    </Card>
  );
};
