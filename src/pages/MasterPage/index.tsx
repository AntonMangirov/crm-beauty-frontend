import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Container,
  CircularProgress,
  Alert,
  Button,
  Box,
} from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import { MasterProfile } from "../../components/MasterProfile";
import { mastersApi } from "../../api/masters";
import { meApi } from "../../api/me";
import type { Master } from "../../api/masters";
import { logError } from "../../utils/logger";

export const MasterPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);

  useEffect(() => {
    if (slug) {
      loadMaster(slug);
      checkIfOwner(slug);
    }
  }, [slug]);

  const loadMaster = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);
      const masterData = await mastersApi.getBySlug(slug);
      setMaster(masterData);
    } catch (err) {
      logError("Ошибка загрузки мастера:", err);
      setError("Мастер не найден");
    } finally {
      setLoading(false);
    }
  };

  const checkIfOwner = async (pageSlug: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsOwner(false);
        setCheckingOwner(false);
        return;
      }

      const currentUser = await meApi.getMe();
      if (currentUser.slug === pageSlug) {
        setIsOwner(true);
      }
    } catch {
      // Если ошибка (например, токен невалидный), просто не показываем кнопку
      setIsOwner(false);
    } finally {
      setCheckingOwner(false);
    }
  };

  const handleGoToCabinet = () => {
    navigate("/master");
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Загрузка мастера...
        </Typography>
      </Container>
    );
  }

  if (error || !master) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Мастер не найден
          </Typography>
          <Typography variant="body2">
            Проверьте правильность ссылки или попробуйте позже
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      {/* Кнопка "Войти в кабинет" для владельца страницы */}
      {!checkingOwner && isOwner && (
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={handleGoToCabinet}
              sx={{
                textTransform: "none",
              }}
            >
              Войти в кабинет
            </Button>
          </Box>
        </Container>
      )}
      <MasterProfile master={master} masterSlug={slug || ""} />
    </>
  );
};
