import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Container,
  Box,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Grid,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Star as StarIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { mastersApi } from "../../api/masters";
import type { Master } from "../../api/masters";
import { normalizeImageUrl } from "../../utils/imageUrl";

// Тестовые мастера для быстрого доступа
const TEST_MASTER_SLUGS = [
  "anna-krasotkina",
  "maria-stilnaya",
];

interface MasterCardProps {
  master: Master;
  onClick: () => void;
}

const MasterCard: React.FC<MasterCardProps> = ({ master, onClick }) => {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: "0 12px 32px rgba(15,59,53,0.15)",
        },
      }}
      onClick={onClick}
    >
      {master.backgroundImageUrl ? (
        <CardMedia
          component="img"
          height="200"
          image={normalizeImageUrl(master.backgroundImageUrl)}
          alt={master.name}
          sx={{ objectFit: "cover" }}
        />
      ) : (
        <Box
          sx={{
            height: 200,
            bgcolor: "primary.light",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {master.photoUrl ? (
            <Avatar
              src={normalizeImageUrl(master.photoUrl)}
              alt={master.name}
              sx={{
                width: 120,
                height: 120,
                border: "4px solid white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: "primary.dark",
                fontSize: "3rem",
                border: "4px solid white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {master.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </Avatar>
          )}
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {master.name}
            </Typography>
            {master.rating && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <StarIcon sx={{ fontSize: 18, color: "secondary.main" }} />
                <Typography variant="body2" color="text.secondary">
                  {master.rating.toFixed(1)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {master.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {master.description}
          </Typography>
        )}

        {master.address && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 2 }}>
            <LocationIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {master.address}
            </Typography>
          </Box>
        )}

        {master.services && master.services.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`${master.services.length} ${master.services.length === 1 ? "услуга" : master.services.length < 5 ? "услуги" : "услуг"}`}
              size="small"
              sx={{
                bgcolor: "primary.light",
                color: "white",
                fontWeight: 500,
              }}
            />
          </Box>
        )}

        <Button
          variant="contained"
          fullWidth
          endIcon={<ArrowForwardIcon />}
          sx={{ mt: "auto" }}
        >
          Записаться
        </Button>
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Защита от множественных запросов (особенно важно для React StrictMode)
    if (loadingRef.current) {
      return;
    }

    loadMasters();

    // Очистка при размонтировании
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      loadingRef.current = false;
    };
  }, []);

  const loadMasters = async () => {
    // Предотвращаем множественные одновременные запросы
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);

      // Создаем AbortController для возможности отмены запросов
      abortControllerRef.current = new AbortController();

      const mastersData = await Promise.all(
        TEST_MASTER_SLUGS.map((slug) =>
          mastersApi.getBySlug(slug).catch((error) => {
            // Игнорируем ошибки отмены запроса
            if (error.name === 'AbortError' || error.name === 'CanceledError') {
              return null;
            }
            // Не логируем CORS и rate limit ошибки в консоль, чтобы не засорять
            if (error.code !== 'ERR_NETWORK' && error.response?.status !== 429) {
              console.error(`Ошибка загрузки мастера ${slug}:`, error);
            }
            return null;
          })
        )
      );
      
      // Проверяем, не был ли компонент размонтирован
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setMasters(mastersData.filter((m): m is Master => m !== null));
    } catch (error: any) {
      // Игнорируем ошибки отмены
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return;
      }
      console.error("Ошибка загрузки мастеров:", error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleMasterClick = (slug: string) => {
    navigate(`/${slug}`);
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          py: { xs: 6, md: 10 },
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", maxWidth: 700, mx: "auto" }}>
            <Typography
              variant="h1"
              sx={{
                mb: 3,
                fontWeight: 700,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Добро пожаловать в Beauty CRM
            </Typography>
            <Typography
              variant="h6"
              sx={{
                opacity: 0.9,
                fontWeight: 400,
                fontSize: { xs: "1rem", md: "1.25rem" },
              }}
            >
              Найдите своего мастера и запишитесь на прием онлайн
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Masters Section */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 600,
              mb: 1,
              textAlign: { xs: "center", md: "left" },
            }}
          >
            Наши мастера
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: { xs: "center", md: "left" } }}
          >
            Выберите мастера для просмотра услуг и записи
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : masters.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Мастера не найдены
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Попробуйте позже или обратитесь к администратору
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {masters.map((master) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={master.slug}>
                <MasterCard
                  master={master}
                  onClick={() => handleMasterClick(master.slug)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};
