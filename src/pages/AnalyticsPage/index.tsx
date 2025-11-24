import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  Grid,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import { LineChart } from "@mui/x-charts";
import {
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { meApi, type AnalyticsResponse, type Appointment } from "../../api/me";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { ru } from "date-fns/locale";

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const year = monthStart.getFullYear();
      const month = monthStart.getMonth();
      const day = monthStart.getDate();

      const utcMonthStart = new Date(
        Date.UTC(year, month, day, 0, 0, 0, 0)
      );

      const endYear = monthEnd.getFullYear();
      const endMonth = monthEnd.getMonth();
      const endDay = monthEnd.getDate();
      const utcMonthEnd = new Date(
        Date.UTC(endYear, endMonth, endDay, 23, 59, 59, 999)
      );

      const [analyticsData, appointmentsData] = await Promise.all([
        meApi.getAnalytics(),
        meApi.getAppointments({
          from: utcMonthStart.toISOString(),
          to: utcMonthEnd.toISOString(),
        }),
      ]);

      setAnalytics(analyticsData);
      setAppointments(appointmentsData);
    } catch (err) {
      console.error("Ошибка загрузки аналитики:", err);
      setError("Не удалось загрузить аналитику");
    } finally {
      setLoading(false);
    }
  };

  // Группируем записи по дням для графика
  const getDailyData = () => {
    if (!appointments.length) return { dates: [], counts: [], revenues: [] };

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const dailyStats = new Map<string, { count: number; revenue: number }>();

    // Инициализируем все дни нулями
    days.forEach((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      dailyStats.set(dateKey, { count: 0, revenue: 0 });
    });

    // Подсчитываем записи и доход по дням
    appointments.forEach((apt) => {
      const date = new Date(apt.startAt);
      const dateKey = format(date, "yyyy-MM-dd");

      const stats = dailyStats.get(dateKey);
      if (stats) {
        stats.count += 1;
        if (apt.status === "COMPLETED" && apt.price) {
          stats.revenue += apt.price;
        }
      }
    });

    const sortedDays = Array.from(dailyStats.entries()).sort(
      ([dateA], [dateB]) => dateA.localeCompare(dateB)
    );

    return {
      dates: sortedDays.map(([date]) =>
        format(new Date(date), "d MMM", { locale: ru })
      ),
      counts: sortedDays.map(([, stats]) => stats.count),
      revenues: sortedDays.map(([, stats]) => stats.revenue),
    };
  };

  const dailyData = getDailyData();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !analytics) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || "Данные не найдены"}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 2.5 } }}>
      <Typography
        variant="h4"
        sx={{
          mb: { xs: 2, sm: 3 },
          fontWeight: 600,
          fontSize: { xs: "1.5rem", sm: "2rem" },
        }}
      >
        Аналитика
      </Typography>

      {/* Статистические карточки */}
      <Grid container spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
        {/* Доход за месяц */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: { xs: 1.5, sm: 2 },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <TrendingUpIcon sx={{ mr: 1, fontSize: 28 }} />
              <Typography
                variant="subtitle2"
                sx={{ opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Доход за месяц
              </Typography>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.5rem", sm: "2rem" },
              }}
            >
              {analytics.revenue.toLocaleString("ru-RU")} ₽
            </Typography>
          </Card>
        </Grid>

        {/* Количество записей */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: { xs: 1.5, sm: 2 },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CalendarIcon sx={{ mr: 1, fontSize: 28 }} />
              <Typography
                variant="subtitle2"
                sx={{ opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Количество записей
              </Typography>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.5rem", sm: "2rem" },
              }}
            >
              {analytics.appointmentsCount}
            </Typography>
          </Card>
        </Grid>

        {/* Процент новых клиентов */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: { xs: 1.5, sm: 2 },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <StarIcon sx={{ mr: 1, fontSize: 28 }} />
              <Typography
                variant="subtitle2"
                sx={{ opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Новые клиенты
              </Typography>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.5rem", sm: "2rem" },
              }}
            >
              {analytics.newClientsPercentage.toFixed(1)}%
            </Typography>
          </Card>
        </Grid>

        {/* Средний чек */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: { xs: 1.5, sm: 2 },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              color: "white",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <TrendingUpIcon sx={{ mr: 1, fontSize: 28 }} />
              <Typography
                variant="subtitle2"
                sx={{ opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Средний чек
              </Typography>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.5rem", sm: "2rem" },
              }}
            >
              {analytics.appointmentsCount > 0
                ? Math.round(analytics.revenue / analytics.appointmentsCount)
                    .toLocaleString("ru-RU")
                : 0}{" "}
              ₽
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* График по дням */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: { xs: 1.5, sm: 2 }, height: "100%" }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
              }}
            >
              График по дням
            </Typography>
            {dailyData.dates.length > 0 ? (
              <Box sx={{ width: "100%", height: 400, overflow: "auto" }}>
                <LineChart
                  width={Math.max(600, dailyData.dates.length * 50)}
                  height={400}
                  xAxis={[
                    {
                      data: dailyData.dates,
                      scaleType: "point",
                      label: "День месяца",
                    },
                  ]}
                  yAxis={[
                    {
                      id: "left",
                      label: "Количество записей",
                    },
                    {
                      id: "right",
                      label: "Доход (₽)",
                    },
                  ]}
                  series={[
                    {
                      id: "appointments",
                      label: "Записи",
                      data: dailyData.counts,
                      yAxisId: "left",
                      color: "#667eea",
                    },
                    {
                      id: "revenue",
                      label: "Доход",
                      data: dailyData.revenues,
                      yAxisId: "right",
                      color: "#f5576c",
                    },
                  ]}
                  sx={{
                    "& .MuiChartsAxis-root": {
                      fontSize: "0.75rem",
                    },
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 400,
                  color: "text.secondary",
                }}
              >
                <Typography>Нет данных за текущий месяц</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        {/* TOP-5 услуг */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: { xs: 1.5, sm: 2 }, height: "100%" }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
              }}
            >
              TOP-5 услуг
            </Typography>
            {analytics.topServices.length > 0 ? (
              <List>
                {analytics.topServices.map((service, index) => (
                  <ListItem
                    key={service.id}
                    sx={{
                      borderBottom:
                        index < analytics.topServices.length - 1
                          ? "1px solid"
                          : "none",
                      borderColor: "divider",
                      py: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                      <Chip
                        label={index + 1}
                        size="small"
                        color="primary"
                        sx={{
                          mr: 1.5,
                          minWidth: 32,
                          fontWeight: 600,
                        }}
                      />
                      <ListItemText
                        primary={service.name}
                        secondary={`${service.count} записей`}
                        primaryTypographyProps={{
                          sx: {
                            fontWeight: 500,
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                          },
                        }}
                        secondaryTypographyProps={{
                          sx: {
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          },
                        }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 200,
                  color: "text.secondary",
                }}
              >
                <Typography>Нет данных об услугах</Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

