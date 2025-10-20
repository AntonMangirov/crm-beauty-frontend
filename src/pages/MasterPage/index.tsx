import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Typography, Container, CircularProgress, Alert } from "@mui/material";
import { MasterProfile } from "../../components/MasterProfile";
import { mastersApi } from "../../api/masters";
import type { Master } from "../../api/masters";

export const MasterPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadMaster(slug);
    }
  }, [slug]);

  const loadMaster = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);
      const masterData = await mastersApi.getBySlug(slug);
      setMaster(masterData);
    } catch (err) {
      console.error("Ошибка загрузки мастера:", err);
      setError("Мастер не найден");
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (serviceId: string) => {
    console.log("Запись на услугу:", serviceId);
    // TODO: Реализовать логику записи
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

  return <MasterProfile master={master} onBookService={handleBookService} />;
};
