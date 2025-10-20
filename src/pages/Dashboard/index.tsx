import { useState, useEffect } from "react";
import { Typography, Container, Paper, Button, Grid } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { ServiceCard } from "../../components/ServiceCard";
import { servicesApi } from "../../api/services";
import type { Service } from "../../api/services";

export const Dashboard: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const servicesData = await servicesApi.getAll();
      setServices(servicesData);
    } catch (error) {
      console.error("Ошибка загрузки услуг:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Панель управления
      </Typography>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Добро пожаловать в Beauty CRM
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
          Здесь будет панель управления с услугами, записями и статистикой
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ textTransform: "none" }}
        >
          Добавить услугу
        </Button>
      </Paper>

      {/* Заглушка услуг */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Услуги
        </Typography>

        {loading ? (
          <Typography>Загрузка...</Typography>
        ) : (
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
                <ServiceCard
                  name={service.name}
                  price={service.price}
                  durationMin={service.durationMin}
                  description={service.description}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};
