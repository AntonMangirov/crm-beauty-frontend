import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  Alert,
  Avatar,
} from "@mui/material";
import { Menu as MenuIcon, AccountCircle, Logout } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import { meApi, type MeResponse } from "../api/me";
import { useSnackbar } from "./SnackbarProvider";
import { normalizeImageUrl } from "../utils/imageUrl";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  showMenuButton = false,
}) => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [master, setMaster] = useState<MeResponse | null>(null);

  useEffect(() => {
    // Загружаем данные мастера при монтировании компонента
    const loadMaster = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const masterData = await meApi.getMe();
          setMaster(masterData);
        } catch (error) {
          // Если токен невалидный, очищаем его
          localStorage.removeItem("authToken");
          setMaster(null);
        }
      } else {
        setMaster(null);
      }
    };

    loadMaster();

    // Слушаем изменения токена (для обновления при выходе из других компонентов)
    const handleStorageChange = () => {
      loadMaster();
    };

    window.addEventListener("storage", handleStorageChange);

    // Также слушаем кастомное событие для обновления в той же вкладке
    window.addEventListener("authChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
    };
  }, []);

  const handleAccountClick = (event: React.MouseEvent<HTMLElement>) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // Если залогинен, показываем меню
      setAnchorEl(event.currentTarget);
    } else {
      // Если не залогинен, показываем диалог входа
      setLoginDialogOpen(true);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      const { token } = response.data;
      localStorage.setItem("authToken", token);
      setLoginDialogOpen(false);
      setEmail("");
      setPassword("");
      showSnackbar("Успешный вход!", "success");

      // Загружаем данные мастера после успешного входа
      try {
        const masterData = await meApi.getMe();
        setMaster(masterData);
      } catch (error) {
        console.error("Ошибка загрузки данных мастера:", error);
      }

      // Отправляем событие для обновления других компонентов
      window.dispatchEvent(new Event("authChange"));

      // Перенаправляем на кабинет мастера
      navigate("/master");
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Ошибка входа. Проверьте данные.";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Вызываем logout endpoint для очистки refresh token на сервере
      await apiClient.post("/api/auth/logout");
    } catch (error) {
      // Игнорируем ошибки при logout (может быть уже невалидный токен)
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("authToken");
      setMaster(null);
      setAnchorEl(null);
      showSnackbar("Вы вышли из системы", "info");
      // Отправляем событие для обновления других компонентов
      window.dispatchEvent(new Event("authChange"));
      navigate("/");
    }
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ minHeight: 64 }}>
        {showMenuButton && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h5"
          component="div"
          sx={{
            flexGrow: 1,
            cursor: "pointer",
            fontWeight: 700,
            letterSpacing: "0.5px",
          }}
          onClick={() => navigate("/")}
        >
          Beauty CRM
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            color="inherit"
            onClick={() => navigate("/dashboard")}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              px: 2,
              py: 1,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Панель управления
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate("/services")}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              px: 2,
              py: 1,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Услуги
          </Button>
          {master ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                ml: 1,
                cursor: "pointer",
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
              onClick={handleAccountClick}
            >
              {master.photoUrl ? (
                <Avatar
                  src={normalizeImageUrl(master.photoUrl)}
                  alt={master.name}
                  sx={{
                    width: 32,
                    height: 32,
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    fontSize: "0.875rem",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
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
              <Typography
                variant="body2"
                sx={{
                  display: { xs: "none", sm: "block" },
                  fontWeight: 500,
                }}
              >
                {master.name}
              </Typography>
            </Box>
          ) : (
            <IconButton
              color="inherit"
              onClick={handleAccountClick}
              sx={{
                ml: 1,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <AccountCircle />
            </IconButton>
          )}
        </Box>
      </Toolbar>

      {/* Меню пользователя */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {master && (
          <MenuItem disabled sx={{ opacity: 1, cursor: "default" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {master.photoUrl ? (
                <Avatar
                  src={normalizeImageUrl(master.photoUrl)}
                  alt={master.name}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "primary.main",
                    fontSize: "0.875rem",
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
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {master.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {master.email}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate("/master");
          }}
        >
          Кабинет мастера
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1, fontSize: 20 }} />
          Выйти
        </MenuItem>
      </Menu>

      {/* Диалог входа */}
      <Dialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Вход в кабинет мастера</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2, mt: 1 }}
            autoComplete="email"
            placeholder="anna@example.com"
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="password123"
            onKeyPress={(e) => {
              if (e.key === "Enter" && !loading) {
                handleLogin();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleLogin} variant="contained" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};
