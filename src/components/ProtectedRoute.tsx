import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { meApi } from "../api/me";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Компонент защищенного роута
 * Проверяет наличие и валидность токена через API запрос
 * Перенаправляет на логин если токена нет или он невалидный
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      try {
        // Проверяем валидность токена через API запрос
        await meApi.getMe();
        setIsAuthenticated(true);
      } catch (error: any) {
        // Если токен невалидный, очищаем его
        // Не логируем ошибку 401, так как это ожидаемо для неавторизованных пользователей
        const status = error?.response?.status;
        if (status && status !== 401) {
          console.error("Ошибка проверки авторизации:", error);
        }
        // Очищаем токен только если это действительно ошибка авторизации
        if (status === 401 || !status) {
          localStorage.removeItem("authToken");
        }
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Перенаправляем на страницу логина
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

