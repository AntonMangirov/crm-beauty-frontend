import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Box,
  Button,
  Grid,
  Avatar,
  Container,
  IconButton,
  Link,
  Chip,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  RateReview as ReviewIcon,
} from "@mui/icons-material";
import { ServiceCard } from "./ServiceCard";
import { LocationMapPreview } from "./LocationMapPreview";
import type { Master } from "../api/masters";
import { normalizeImageUrl } from "../utils/imageUrl";

interface MasterProfileProps {
  master: Master;
  masterSlug: string;
}

export const MasterProfile: React.FC<MasterProfileProps> = ({
  master,
  masterSlug,
}) => {
  const navigate = useNavigate();

  const handleBookClick = () => {
    navigate(`/${masterSlug}/book`);
  };

  const normalizedPhotoUrl = normalizeImageUrl(master.photoUrl);
  const normalizedBackgroundUrl = normalizeImageUrl(master.backgroundImageUrl);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 2.5 } }}>
      {/* Hero Section - Компактный блок с аватаркой */}
      <Card
        sx={{
          mb: { xs: 2, sm: 2.5 },
          overflow: "hidden",
          position: "relative",
          background: normalizedBackgroundUrl
            ? `url(${normalizedBackgroundUrl})`
            : "linear-gradient(135deg, #0F3B35 0%, #0A2D28 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid",
          borderColor: "divider",
          color: "white",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: normalizedBackgroundUrl
              ? "linear-gradient(135deg, rgba(15, 59, 53, 0.85) 0%, rgba(10, 45, 40, 0.75) 100%)"
              : "none",
            zIndex: 0,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: "-50%",
            right: "-20%",
            width: "60%",
            height: "200%",
            background:
              "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
            zIndex: 1,
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2 }, position: "relative", zIndex: 2 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1.5 }}>
            {/* Аватар */}
            {normalizedPhotoUrl ? (
              <Avatar
                src={normalizedPhotoUrl}
                alt={master.name}
                sx={{
                  width: { xs: 64, sm: 80 },
                  height: { xs: 64, sm: 80 },
                  mr: { xs: 1.5, sm: 2 },
                  border: "2px solid",
                  borderColor: "white",
                  boxShadow: 2,
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: { xs: 64, sm: 80 },
                  height: { xs: 64, sm: 80 },
                  bgcolor: "primary.main",
                  color: "white",
                  fontSize: { xs: "1.5rem", sm: "2rem" },
                  fontWeight: 600,
                  mr: { xs: 1.5, sm: 2 },
                  border: "2px solid",
                  borderColor: "white",
                  boxShadow: 2,
                }}
              >
                {master.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>
            )}

            {/* Информация */}
            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.5,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
                    color: "white",
                  }}
                >
                  {master.name}
                </Typography>
                {(() => {
                  const rating =
                    typeof master.rating === "number"
                      ? master.rating
                      : master.rating !== null && master.rating !== undefined
                      ? Number(master.rating)
                      : null;
                  return rating !== null && !isNaN(rating) && rating > 0 ? (
                    <Chip
                      icon={
                        <StarIcon sx={{ fontSize: 16, color: "#FFD700" }} />
                      }
                      label={rating.toFixed(1)}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.95)",
                        fontWeight: 600,
                        color: "text.primary",
                      }}
                    />
                  ) : null;
                })()}
              </Box>

              {master.address && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  <LocationIcon
                    fontSize="small"
                    sx={{ fontSize: 16, color: "rgba(255, 255, 255, 0.9)" }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255, 255, 255, 0.9)" }}
                  >
                    {master.address}
                  </Typography>
                </Box>
              )}

              {/* Контакты, иконки соцсетей и отзывы */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                {/* Номер телефона */}
                {master.phone && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PhoneIcon
                      fontSize="small"
                      sx={{ fontSize: 16, color: "rgba(255, 255, 255, 0.9)" }}
                    />
                    <Link
                      href={`tel:${master.phone}`}
                      sx={{
                        textDecoration: "none",
                        color: "rgba(255, 255, 255, 0.9)",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        "&:hover": {
                          color: "white",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {master.phone}
                    </Link>
                  </Box>
                )}

                {/* Иконки соцсетей */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {master.telegramUrl && (
                    <IconButton
                      component="a"
                      href={master.telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: "rgba(255, 255, 255, 0.9)",
                        p: 0.5,
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.2)",
                          color: "white",
                        },
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.89 8.908c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                      </svg>
                    </IconButton>
                  )}
                  {master.whatsappUrl && (
                    <IconButton
                      component="a"
                      href={master.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: "rgba(255, 255, 255, 0.9)",
                        p: 0.5,
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.2)",
                          color: "white",
                        },
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </IconButton>
                  )}
                  {master.vkUrl && (
                    <IconButton
                      component="a"
                      href={master.vkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: "rgba(255, 255, 255, 0.9)",
                        p: 0.5,
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.2)",
                          color: "white",
                        },
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12.785 16.241s.287-.032.435-.194c.135-.148.131-.427.131-.427s-.02-1.305.58-1.498c.594-.188 1.354.95 2.16 1.37.605.315 1.064.246 1.064.246l2.141-.031s1.118-.069.587-.95c-.044-.072-.31-.652-1.605-1.844-1.357-1.264-1.176-.53.451-1.625.984-.664 1.379-1.09 1.245-1.265-.133-.175-.95-.129-.95-.129l-2.436.015s-.177-.024-.308.055c-.13.077-.212.258-.212.258s-.38 1.015-.882 1.88c-1.064 1.865-1.49 1.964-1.664 1.847-.405-.277-.304-1.11-.304-1.702 0-1.85.28-2.623-.546-2.835-.274-.071-.475-.118-1.176-.125-.899-.009-1.656.003-2.086.165-.283.106-.5.343-.368.357.163.018.533.078.726.285.252.27.243.876.243.876s.144 2.142-.336 2.406c-.33.18-.78-.188-1.75-1.996-.495-.906-.87-1.906-.87-1.906s-.072-.18-.201-.278c-.156-.12-.374-.158-.374-.158l-2.28.015s-.343.01-.469.16c-.112.13-.009.401-.009.401s1.78 4.18 3.79 6.29c1.844 1.93 3.95 1.803 3.95 1.803h.951s.337-.02.508-.23c.155-.193.15-.45.15-.45s-.02-1.29.202-1.48c.197-.175.45-.116.45-.116z" />
                      </svg>
                    </IconButton>
                  )}
                </Box>

                {/* Ссылка на отзывы с рейтингом */}
                <Box
                  component="a"
                  href="#reviews"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    textDecoration: "none",
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                    },
                  }}
                >
                  <ReviewIcon sx={{ fontSize: 16 }} />
                  <span>Отзывы</span>
                  {(() => {
                    const rating =
                      typeof master.rating === "number"
                        ? master.rating
                        : master.rating !== null && master.rating !== undefined
                        ? Number(master.rating)
                        : null;
                    return rating !== null && !isNaN(rating) && rating > 0 ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.25,
                          ml: 0.25,
                        }}
                      >
                        <StarIcon sx={{ fontSize: 14, color: "#FFD700" }} />
                        <span>{rating.toFixed(1)}</span>
                      </Box>
                    ) : null;
                  })()}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Описание и карта */}
      {(master.description || (master.lat && master.lng)) && (
        <Grid container spacing={2} sx={{ mb: { xs: 2, sm: 2.5 } }}>
          {/* Описание мастера */}
          {master.description && (
            <Grid size={{ xs: 12, md: master.lat && master.lng ? 6 : 12 }}>
              <Card sx={{ height: "100%", p: { xs: 1.5, sm: 2 } }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
                >
                  {master.description}
                </Typography>
              </Card>
            </Grid>
          )}

          {/* Карта (превью) */}
          {master.lat && master.lng && (
            <Grid size={{ xs: 12, md: master.description ? 6 : 12 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  }}
                >
                  Расположение
                </Typography>
                <LocationMapPreview
                  lat={master.lat}
                  lng={master.lng}
                  address={master.address}
                  masterName={master.name}
                  height={{ xs: 200, sm: 250 }}
                />
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Услуги */}
      <Box sx={{ mb: { xs: 2, sm: 2.5 } }}>
        <Typography
          variant="h6"
          sx={{
            mb: { xs: 1.5, sm: 2 },
            fontWeight: 600,
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Услуги
        </Typography>

        <Grid container spacing={2}>
          {master.services.map((service) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
              <ServiceCard
                id={service.id}
                name={service.name}
                price={parseFloat(service.price)}
                durationMin={service.durationMin}
                photoUrl={service.photoUrl}
                masterSlug={masterSlug}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Отзывы */}
      <Box id="reviews" sx={{ mb: { xs: 2, sm: 2.5 }, scrollMarginTop: 20 }}>
        <Typography
          variant="h6"
          sx={{
            mb: { xs: 1.5, sm: 2 },
            fontWeight: 600,
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Отзывы
        </Typography>

        {/* Демо-отзыв */}
        <Card sx={{ p: { xs: 1.5, sm: 2 }, mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                mr: 1.5,
                bgcolor: "primary.main",
                fontSize: "0.875rem",
              }}
            >
              МК
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.5,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Мария К.
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      sx={{
                        fontSize: 16,
                        color: star <= 5 ? "#FFD700" : "grey.300",
                      }}
                    />
                  ))}
                </Box>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
              >
                Отличный мастер! Очень довольна результатом. Профессиональный
                подход, внимательное отношение к деталям. Обязательно вернусь
                еще раз.
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                2 недели назад
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* CTA Section */}
      <Card
        sx={{
          p: { xs: 2, sm: 2.5 },
          textAlign: "center",
          mt: { xs: 2, sm: 2.5 },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: { xs: 1, sm: 1.5 },
            fontWeight: 600,
            fontSize: { xs: "1.125rem", sm: "1.25rem" },
          }}
        >
          Готовы записаться?
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: { xs: 1.5, sm: 2 },
            color: "text.secondary",
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          }}
        >
          Выберите услугу и удобное время для записи
        </Typography>
        <Button
          variant="contained"
          size="medium"
          onClick={handleBookClick}
          sx={{
            px: { xs: 3, sm: 4 },
            py: 1,
            textTransform: "none",
            fontSize: { xs: "0.9375rem", sm: "1rem" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Записаться
        </Button>
      </Card>
    </Container>
  );
};
