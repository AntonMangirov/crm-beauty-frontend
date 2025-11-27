import React, { useState } from "react";
import {
  TextField,
  Button,
  Alert,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { apiClient } from "../api";
import { useSnackbar } from "./SnackbarProvider";
import { useNavigate } from "react-router-dom";
import { getRecaptchaToken } from "../utils/recaptcha";
import { loadRecaptchaScript } from "../utils/loadRecaptcha";
import { validatePhone, formatPhoneForDisplay } from "../utils/passwordReset";

interface PasswordResetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: "dialog" | "page";
}

type StepType = "request" | "verify" | "reset";

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  onSuccess,
  onCancel,
  mode = "dialog",
}) => {
  const [step, setStep] = useState<StepType>("request");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+7");
  const [resetMethod, setResetMethod] = useState<"email" | "phone">("email");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // Загружаем скрипт reCAPTCHA при монтировании
  React.useEffect(() => {
    loadRecaptchaScript();
  }, []);

  const getPhoneDigits = (phone: string): string => {
    return phone.replace(/[^\d]/g, "");
  };

  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/[^\d+\s()-]/g, "");

    if (!cleaned || cleaned === "+") {
      cleaned = "+7";
    } else if (cleaned.startsWith("8") && !cleaned.startsWith("+7")) {
      cleaned = "+7" + cleaned.slice(1);
    } else if (
      cleaned.startsWith("+7") &&
      cleaned.length > 2 &&
      cleaned[2] === "8"
    ) {
      cleaned = "+7" + cleaned.slice(3);
    }

    if (!cleaned.startsWith("+7")) {
      cleaned = "+7" + cleaned.replace(/[^\d]/g, "");
    }

    const digits = getPhoneDigits(cleaned);
    if (digits.length > 12) {
      return;
    }

    setPhone(cleaned);
    setPhoneError(null);
  };

  const validatePhoneInput = (): boolean => {
    if (resetMethod === "phone") {
      if (!phone || phone === "+7") {
        setPhoneError("Введите номер телефона");
        return false;
      }
      if (!validatePhone(phone)) {
        setPhoneError("Неверный формат телефона");
        return false;
      }
    }
    return true;
  };

  const validatePasswords = (): boolean => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return false;
    }
    if (newPassword.length < 6) {
      setPasswordError("Пароль должен содержать минимум 6 символов");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleRequestReset = async () => {
    setError(null);
    setPhoneError(null);

    if (resetMethod === "email") {
      if (!email || !email.includes("@")) {
        setError("Введите корректный email");
        return;
      }
    } else {
      if (!validatePhoneInput()) {
        return;
      }
    }

    setLoading(true);

    try {
      const recaptchaToken = await getRecaptchaToken("password-reset");

      const requestData: any = {
        ...(recaptchaToken && { recaptchaToken }),
      };

      if (resetMethod === "email") {
        requestData.email = email;
      } else {
        const phoneDigits = getPhoneDigits(phone);
        if (phoneDigits.length === 12 && phoneDigits.startsWith("7")) {
          requestData.phone = `+${phoneDigits}`;
        } else {
          requestData.phone = phone;
        }
      }

      const response = await apiClient.post(
        "/api/auth/password-reset/request",
        requestData
      );

      // Токен должен быть возвращен всегда для работы функционала
      // В production код не показывается пользователю, но токен нужен для следующего шага
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
      } else {
        setError("Ошибка: токен восстановления не получен. Попробуйте снова.");
        return;
      }

      showSnackbar(
        "Код восстановления отправлен. Проверьте вашу почту или телефон.",
        "success"
      );
      setStep("verify");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Ошибка отправки кода. Попробуйте снова.";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);

    if (!code || code.length !== 6) {
      setError("Введите 6-значный код");
      return;
    }

    if (!resetToken) {
      setError("Токен восстановления не найден. Начните заново.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post(
        "/api/auth/password-reset/verify",
        {
          resetToken,
          code,
        }
      );

      setResetToken(response.data.verifiedToken);
      showSnackbar("Код подтвержден. Установите новый пароль.", "success");
      setStep("reset");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Неверный код. Попробуйте снова.";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setPasswordError(null);

    if (!validatePasswords()) {
      return;
    }

    if (!resetToken) {
      setError("Токен восстановления не найден. Начните заново.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post("/api/auth/password-reset/reset", {
        verifiedToken: resetToken,
        newPassword,
      });

      showSnackbar("Пароль успешно изменен!", "success");
      onSuccess?.();
      if (mode === "page") {
        navigate("/login");
      } else if (onCancel) {
        onCancel();
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Ошибка сброса пароля. Попробуйте снова.";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Запрос кода", "Подтверждение кода", "Новый пароль"];

  return (
    <Box sx={{ width: "100%", maxWidth: 500, mx: "auto" }}>
      <Typography
        variant="h5"
        sx={{ mb: 3, textAlign: "center", fontWeight: 600 }}
      >
        Восстановление пароля
      </Typography>

      <Stepper activeStep={step === "request" ? 0 : step === "verify" ? 1 : 2} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {step === "request" && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Button
              variant={resetMethod === "email" ? "contained" : "outlined"}
              onClick={() => setResetMethod("email")}
              sx={{ mr: 1 }}
            >
              Email
            </Button>
            <Button
              variant={resetMethod === "phone" ? "contained" : "outlined"}
              onClick={() => setResetMethod("phone")}
            >
              Телефон
            </Button>
          </Box>

          {resetMethod === "email" ? (
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              sx={{ mb: 2 }}
              disabled={loading}
            />
          ) : (
            <TextField
              fullWidth
              label="Телефон"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              error={!!phoneError}
              helperText={phoneError}
              sx={{ mb: 2 }}
              disabled={loading}
              placeholder="+7 (999) 123-45-67"
            />
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleRequestReset}
              disabled={loading}
            >
              Отправить код
            </Button>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
              >
                Отмена
              </Button>
            )}
          </Box>
        </Box>
      )}

      {step === "verify" && (
        <Box>
          <Typography sx={{ mb: 2, color: "text.secondary" }}>
            Введите 6-значный код, отправленный на{" "}
            {resetMethod === "email" ? email : formatPhoneForDisplay(phone)}
          </Typography>

          <TextField
            fullWidth
            label="Код подтверждения"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(value);
              setError(null);
            }}
            sx={{ mb: 2 }}
            disabled={loading}
            placeholder="000000"
            inputProps={{ maxLength: 6 }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
            >
              Подтвердить
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setStep("request");
                setCode("");
                setResetToken(null);
              }}
              disabled={loading}
            >
              Назад
            </Button>
          </Box>
        </Box>
      )}

      {step === "reset" && (
        <Box>
          <TextField
            fullWidth
            label="Новый пароль"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError(null);
            }}
            error={!!passwordError}
            helperText={passwordError}
            sx={{ mb: 2 }}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Подтвердите пароль"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError(null);
            }}
            error={!!passwordError}
            helperText={passwordError}
            sx={{ mb: 2 }}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
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

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleResetPassword}
              disabled={loading}
            >
              Изменить пароль
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setStep("verify");
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={loading}
            >
              Назад
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

