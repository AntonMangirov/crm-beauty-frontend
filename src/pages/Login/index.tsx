import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Box, Card, Typography } from "@mui/material";
import { meApi } from "../../api/me";
import { AuthForm } from "../../components/AuthForm";
import { logError } from "../../utils/logger";

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultTab =
    (searchParams.get("tab") as "login" | "register") || "login";
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Проверяем, не залогинен ли уже пользователь
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          // Проверяем валидность токена
          await meApi.getMe();
          // Если токен валидный, редиректим на кабинет мастера
          navigate("/master", { replace: true });
        } catch (error: any) {
          // Если токен невалидный, очищаем его и показываем форму логина
          // Не логируем ошибку 401, так как это ожидаемо для неавторизованных пользователей
          if (error?.response?.status !== 401) {
            logError("Ошибка проверки авторизации:", error);
          }
          localStorage.removeItem("authToken");
        }
      }
      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  if (checkingAuth) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "80vh",
          }}
        >
          <Typography>Проверка авторизации...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
        }}
      >
        <Card sx={{ p: 4, width: "100%", maxWidth: 500 }}>
          <AuthForm defaultTab={defaultTab} mode="page" />
        </Card>
      </Box>
    </Container>
  );
};
