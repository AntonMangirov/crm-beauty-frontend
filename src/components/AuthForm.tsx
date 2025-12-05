import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import {
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  Typography,
  InputAdornment,
  IconButton,
  Box,
  Link,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { apiClient } from "../api";
import { meApi } from "../api/me";
import { useSnackbar } from "./SnackbarProvider";
import { useNavigate } from "react-router-dom";
import { getRecaptchaToken } from "../utils/recaptcha";
import { loadRecaptchaScript } from "../utils/loadRecaptcha";
import { PasswordResetForm } from "./PasswordResetForm";
import { logError } from "../utils/logger";

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

export const AuthForm = forwardRef<AuthFormRef, AuthFormProps>(
  (
    {
      defaultTab = "login",
      onSuccess,
      onClose,
      mode = "dialog",
      showButtons = true,
      onLoadingChange,
      onTabChange,
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = useState<"login" | "register">(
      defaultTab
    );
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const formRef = useRef<HTMLFormElement>(null);

    // Загружаем скрипт reCAPTCHA при монтировании компонента
    useEffect(() => {
      if (activeTab === "register") {
        loadRecaptchaScript();
      }
    }, [activeTab]);

    /**
     * Форматирует телефон в формат +7 (999) 123-45-67
     */
    const formatPhoneDisplay = (phone: string): string => {
      // Удаляем все нецифровые символы кроме +
      let cleaned = phone.replace(/[^\d+]/g, "");

      // Если начинается с 8, заменяем на +7
      if (cleaned.startsWith("8")) {
        cleaned = "+7" + cleaned.slice(1);
      } else if (cleaned.startsWith("7") && !cleaned.startsWith("+7")) {
        cleaned = "+7" + cleaned.slice(1);
      } else if (!cleaned.startsWith("+7") && /^\d/.test(cleaned)) {
        cleaned = "+7" + cleaned;
      }

      // Если уже есть +7, убираем все лишние 8 в начале цифр после +7
      if (cleaned.startsWith("+7")) {
        let digits = cleaned.slice(2); // Убираем +7
        // Если первая цифра после +7 это 8, удаляем её (так как +7 уже есть)
        if (digits.startsWith("8")) {
          digits = digits.slice(1);
        }
        cleaned = "+7" + digits;
      }

      // Ограничиваем длину (максимум 12 символов: +7 + 10 цифр)
      if (cleaned.length > 12) {
        cleaned = cleaned.slice(0, 12);
      }

      // Форматируем: +7 (999) 123-45-67
      if (cleaned.startsWith("+7")) {
        const digits = cleaned.slice(2); // Убираем +7
        if (digits.length === 0) {
          return "+7";
        } else if (digits.length <= 3) {
          return `+7 (${digits}`;
        } else if (digits.length <= 6) {
          return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
        } else if (digits.length <= 8) {
          return `+7 (${digits.slice(0, 3)}) ${digits.slice(
            3,
            6
          )}-${digits.slice(6)}`;
        } else {
          return `+7 (${digits.slice(0, 3)}) ${digits.slice(
            3,
            6
          )}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
        }
      }

      return cleaned;
    };

    /**
     * Извлекает только цифры из телефона для валидации
     */
    const getPhoneDigits = (phone: string): string => {
      return phone.replace(/[^\d]/g, "");
    };

    /**
     * Валидация телефона
     */
    const validatePhone = (phoneValue: string): boolean => {
      if (!phoneValue || phoneValue.trim() === "" || phoneValue === "+7") {
        // Телефон необязательный, если пустой - валидно
        setPhoneError(null);
        return true;
      }

      const phoneDigits = getPhoneDigits(phoneValue);
      if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
        setPhoneError(
          "Неверный формат телефона. Используйте формат: +7 (999) 123-45-67"
        );
        return false;
      }

      setPhoneError(null);
      return true;
    };

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
      setPasswordError(null);
      setPhoneError(null);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      setPhone("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      // Обновляем URL для страницы
      if (mode === "page") {
        navigate(`/login?tab=${newValue}`, { replace: true });
      }
    };

    const handleLogin = async () => {
      setError(null);
      setPasswordError(null);
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
          logError("Ошибка загрузки данных мастера:", error);
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

    const validatePasswords = (): boolean => {
      if (activeTab === "register") {
        if (password !== confirmPassword) {
          setPasswordError("Пароли не совпадают");
          return false;
        }
        if (password.length < 6) {
          setPasswordError("Пароль должен содержать минимум 6 символов");
          return false;
        }
        setPasswordError(null);
      }
      return true;
    };

    const handleRegister = async () => {
      setError(null);
      setPasswordError(null);
      setPhoneError(null);

      // Валидация паролей
      if (!validatePasswords()) {
        return;
      }

      // Валидация телефона (если он введен)
      if (phone && phone.trim() !== "" && phone !== "+7") {
        if (!validatePhone(phone)) {
          return;
        }
      }

      setLoading(true);
      onLoadingChange?.(true);

      // Нормализуем телефон перед отправкой
      let normalizedPhone: string | undefined = undefined;
      if (phone && phone.trim() !== "" && phone !== "+7") {
        const phoneDigits = getPhoneDigits(phone);
        if (phoneDigits.length === 11 && phoneDigits.startsWith("7")) {
          normalizedPhone = `+${phoneDigits}`;
        }
      }

      // Получаем токен reCAPTCHA для защиты от ботов
      const recaptchaToken = await getRecaptchaToken("register");

      try {
        await apiClient.post("/api/auth/register", {
          email,
          password,
          name,
          phone: normalizedPhone,
          ...(recaptchaToken && { recaptchaToken }),
        });

        showSnackbar("Регистрация успешна! Теперь вы можете войти.", "success");

        // После успешной регистрации переключаемся на вкладку входа
        setActiveTab("login");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setPhone("");
        setError(null);
        setPasswordError(null);
        setPhoneError(null);
        setShowPassword(false);
        setShowConfirmPassword(false);

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

    const handlePhoneChange = (value: string) => {
      // Разрешаем только цифры, +, пробелы, скобки и дефисы
      let cleaned = value.replace(/[^\d+\s()-]/g, "");

      // Если поле пустое или содержит только +, устанавливаем +7
      if (!cleaned || cleaned === "+") {
        cleaned = "+7";
      }
      // Если начинается с 8 (и нет +7), заменяем на +7
      else if (cleaned.startsWith("8") && !cleaned.startsWith("+7")) {
        cleaned = "+7" + cleaned.slice(1);
      }
      // Если уже есть +7 и пользователь вводит 8, удаляем эту 8
      else if (
        cleaned.startsWith("+7") &&
        cleaned.length > 2 &&
        cleaned[2] === "8"
      ) {
        // Убираем первую 8 после +7
        cleaned = "+7" + cleaned.slice(3);
      }

      // Ограничиваем длину (максимум 18 символов с форматированием: +7 (999) 123-45-67)
      if (cleaned.length > 18) {
        cleaned = cleaned.slice(0, 18);
      }

      // Форматируем телефон
      const formatted = formatPhoneDisplay(cleaned);
      setPhone(formatted);

      // Валидация в реальном времени
      if (formatted && formatted.trim() !== "" && formatted !== "+7") {
        validatePhone(formatted);
      } else {
        setPhoneError(null);
      }
    };

    const handlePhoneFocus = () => {
      const value = phone.trim();
      if (!value || value === "") {
        setPhone("+7");
      }
    };

    const handlePhonePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text").trim();

      // Удаляем все нецифровые символы кроме +
      let cleaned = pastedText.replace(/[^\d+]/g, "");

      // Если начинается с +7, оставляем как есть (но убираем дубликаты +7)
      if (cleaned.startsWith("+7")) {
        cleaned = "+7" + cleaned.replace(/^\+7/g, "");
        // Убираем первую 8 после +7 если она есть
        if (cleaned.length > 2 && cleaned[2] === "8") {
          cleaned = "+7" + cleaned.slice(3);
        }
      } else if (cleaned.startsWith("7")) {
        cleaned = "+" + cleaned;
      } else if (cleaned.startsWith("8")) {
        cleaned = "+7" + cleaned.slice(1);
      } else if (/^\d/.test(cleaned)) {
        cleaned = "+7" + cleaned;
      }

      // Ограничиваем длину (12 символов: +7 + 10 цифр)
      if (cleaned.length > 12) {
        cleaned = cleaned.slice(0, 12);
      }

      const formatted = formatPhoneDisplay(cleaned);
      setPhone(formatted);
      validatePhone(formatted);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError(null);
      setPhoneError(null);

      if (activeTab === "login") {
        handleLogin();
      } else {
        // Проверяем пароли перед регистрацией
        if (validatePasswords()) {
          // Проверяем телефон перед регистрацией
          if (phone && phone.trim() !== "" && phone !== "+7") {
            if (validatePhone(phone)) {
              handleRegister();
            }
          } else {
            handleRegister();
          }
        }
      }
    };

    const handlePasswordChange = (value: string) => {
      setPassword(value);
      if (
        activeTab === "register" &&
        confirmPassword &&
        value !== confirmPassword
      ) {
        setPasswordError("Пароли не совпадают");
      } else if (activeTab === "register" && passwordError) {
        setPasswordError(null);
      }
    };

    const handleConfirmPasswordChange = (value: string) => {
      setConfirmPassword(value);
      if (value !== password) {
        setPasswordError("Пароли не совпадают");
      } else {
        setPasswordError(null);
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !loading) {
        handleSubmit(e);
      }
    };

    if (showPasswordReset) {
      return (
        <PasswordResetForm
          onSuccess={() => {
            setShowPasswordReset(false);
            setActiveTab("login");
          }}
          onCancel={() => setShowPasswordReset(false)}
          mode={mode}
        />
      );
    }

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

        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {passwordError}
          </Alert>
        )}

        {phoneError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {phoneError}
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
            sx={{
              mb: 2,
              mt: mode === "dialog" && activeTab === "login" ? 1 : 0,
            }}
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
              onChange={(e) => handlePhoneChange(e.target.value)}
              onFocus={handlePhoneFocus}
              onPaste={handlePhonePaste}
              error={!!phoneError}
              sx={{ mb: 2 }}
              autoComplete="tel"
              placeholder="+7 (999) 123-45-67"
              onKeyPress={handleKeyPress}
              onKeyDown={(e) => {
                // Запрещаем ввод недопустимых символов
                const allowedKeys = [
                  "Backspace",
                  "Delete",
                  "Tab",
                  "Escape",
                  "Enter",
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                  "Home",
                  "End",
                ];

                if (allowedKeys.includes(e.key)) {
                  return;
                }

                // Разрешаем только цифры, +, пробелы, скобки и дефисы
                if (!/[\d+\s()-]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          )}

          <TextField
            fullWidth
            label="Пароль"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
            error={!!passwordError}
            sx={{ mb: activeTab === "register" ? 2 : mode === "page" ? 3 : 2 }}
            autoComplete={
              activeTab === "login" ? "current-password" : "new-password"
            }
            placeholder={
              activeTab === "login" ? "password123" : "Минимум 6 символов"
            }
            onKeyPress={handleKeyPress}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {activeTab === "register" && (
            <TextField
              fullWidth
              label="Повторите пароль"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              required
              error={!!passwordError}
              sx={{ mb: mode === "page" ? 3 : 2 }}
              autoComplete="new-password"
              placeholder="Повторите пароль"
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {activeTab === "login" && (
            <Box sx={{ mb: 2, textAlign: "right" }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => setShowPasswordReset(true)}
                sx={{ textDecoration: "none" }}
              >
                Забыли пароль?
              </Link>
            </Box>
          )}

          {showButtons && (
            <Button
              type="submit"
              fullWidth={mode === "page"}
              variant="contained"
              size={mode === "page" ? "large" : "medium"}
              disabled={
                loading ||
                (activeTab === "register" &&
                  (!name ||
                    !email ||
                    !password ||
                    !confirmPassword ||
                    !!passwordError))
              }
              sx={{
                mb: mode === "page" ? 2 : 0,
                mt: mode === "dialog" ? 2 : 0,
              }}
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
  }
);

AuthForm.displayName = "AuthForm";
