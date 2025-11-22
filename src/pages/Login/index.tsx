import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
} from "@mui/material";
import { apiClient } from "../../api";
import { useSnackbar } from "../../components/SnackbarProvider";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      const { token } = response.data;
      localStorage.setItem("authToken", token);
      showSnackbar("Успешный вход!", "success");
      navigate("/master");
    } catch (err: unknown) {
      let errorMessage = "Ошибка входа. Проверьте данные.";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        errorMessage = axiosError.response?.data?.error || errorMessage;
      }
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

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
        <Card sx={{ p: 4, width: "100%", maxWidth: 400 }}>
          <Typography variant="h4" sx={{ mb: 3, textAlign: "center", fontWeight: 600 }}>
            Вход в кабинет мастера
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
            Нет аккаунта?{" "}
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // Можно добавить страницу регистрации
                alert("Используйте API /api/auth/register для регистрации");
              }}
            >
              Зарегистрироваться
            </Link>
          </Typography>
        </Card>
      </Box>
    </Container>
  );
};

