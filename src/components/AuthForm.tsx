import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import {
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  Typography,
} from "@mui/material";
import { apiClient } from "../api";
import { meApi } from "../api/me";
import { useSnackbar } from "./SnackbarProvider";
import { useNavigate } from "react-router-dom";

interface AuthFormProps {
  defaultTab?: "login" | "register";
  onSuccess?: () => void;
  onClose?: () => void;
  mode?: "dialog" | "page"; // Режим отображения
  showButtons?: boolean; // Показывать ли кнопки внутри формы
  onLoadingChange?: (loading: boolean) => void; // Callback для изменения состояния загрузки
  onTabChange?: (tab: "login" | "register") => void; // Callback для изменения вкладки
}

export interface AuthFormRef {
  submit: () => void;
  getActiveTab: () => "login" | "register";
}

export const AuthForm = forwardRef<AuthFormRef, AuthFormProps>(({
  defaultTab = "login",
  onSuccess,
  onClose,
  mode = "dialog",
  showButtons = true,
  onLoadingChange,
  onTabChange,
}, ref) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const formRef = useRef<HTMLFormElement>(null);

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    },
    getActiveTab: () => activeTab,
  }));

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: "login" | "register"
  ) => {
    setActiveTab(newValue);
    onTabChange?.(newValue);
    setError(null);
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    // Обновляем URL для страницы
    if (mode === "page") {
      navigate(`/login?tab=${newValue}`, { replace: true });
    }
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    onLoadingChange?.(true);

    try {
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      const { token } = response.data;
      localStorage.setItem("authToken", token);
      
      // Очищаем форму
      setEmail("");
      setPassword("");
      setError(null);
      
      showSnackbar("Успешный вход!", "success");

      // Загружаем данные мастера после успешного входа
      try {
        await meApi.getMe();
      } catch (error) {
        console.error("Ошибка загрузки данных мастера:", error);
      }

      // Отправляем событие для обновления других компонентов
      window.dispatchEvent(new Event("authChange"));

      // Закрываем диалог, если он открыт
      if (onClose) {
        onClose();
      }

      // Перенаправляем на кабинет мастера
      navigate("/master");
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Ошибка входа. Проверьте данные.";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    onLoadingChange?.(true);

    try {
      await apiClient.post("/api/auth/register", {
        email,
        password,
        name,
        phone: phone || undefined,
      });

      showSnackbar("Регистрация успешна! Теперь вы можете войти.", "success");

      // После успешной регистрации переключаемся на вкладку входа
      setActiveTab("login");
      setPassword("");
      setName("");
      setPhone("");
      setError(null);
      
      if (mode === "page") {
        navigate("/login?tab=login", { replace: true });
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Ошибка регистрации. Проверьте данные.";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "login") {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleSubmit(e);
    }
  };

  return (
    <>
      {mode === "page" && (
        <Typography
          variant="h4"
          sx={{ mb: 3, textAlign: "center", fontWeight: 600 }}
        >
          {activeTab === "login"
            ? "Вход в кабинет мастера"
            : "Регистрация нового мастера"}
        </Typography>
      )}

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: mode === "page" ? 3 : 2 }}
        centered={mode === "page"}
      >
        <Tab label="Вход" value="login" />
        <Tab label="Регистрация нового мастера" value="register" />
      </Tabs>

      {activeTab === "register" && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            fontStyle: "italic",
            textAlign: mode === "page" ? "center" : "left",
          }}
        >
          Регистрация доступна только для мастеров
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form ref={formRef} onSubmit={handleSubmit}>
        {activeTab === "register" && (
          <TextField
            fullWidth
            label="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 2, mt: mode === "dialog" ? 1 : 0 }}
            autoComplete="name"
            placeholder="Анна Красоткина"
            onKeyPress={handleKeyPress}
          />
        )}

        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          sx={{ mb: 2, mt: mode === "dialog" && activeTab === "login" ? 1 : 0 }}
          autoComplete="email"
          placeholder="anna@example.com"
          onKeyPress={handleKeyPress}
        />

        {activeTab === "register" && (
          <TextField
            fullWidth
            label="Телефон (необязательно)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            sx={{ mb: 2 }}
            autoComplete="tel"
            placeholder="+7-999-123-45-67"
            onKeyPress={handleKeyPress}
          />
        )}

        <TextField
          fullWidth
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          sx={{ mb: mode === "page" ? 3 : 2 }}
          autoComplete={
            activeTab === "login" ? "current-password" : "new-password"
          }
          placeholder={
            activeTab === "login" ? "password123" : "Минимум 6 символов"
          }
          onKeyPress={handleKeyPress}
        />

        {showButtons && (
          <Button
            type="submit"
            fullWidth={mode === "page"}
            variant="contained"
            size={mode === "page" ? "large" : "medium"}
            disabled={
              loading ||
              (activeTab === "register" && (!name || !email || !password))
            }
            sx={{ mb: mode === "page" ? 2 : 0, mt: mode === "dialog" ? 2 : 0 }}
          >
            {loading
              ? activeTab === "login"
                ? "Вход..."
                : "Регистрация..."
              : activeTab === "login"
              ? "Войти"
              : "Зарегистрироваться"}
          </Button>
        )}
      </form>
    </>
  );
});

AuthForm.displayName = "AuthForm";

