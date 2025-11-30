import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { AuthForm, type AuthFormRef } from "./AuthForm";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
  onSuccess?: () => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onClose,
  defaultTab = "login",
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const formRef = useRef<AuthFormRef>(null);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    formRef.current?.submit();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>Вход в кабинет мастера</DialogTitle>
      <DialogContent>
        <AuthForm
          ref={formRef}
          defaultTab={defaultTab}
          onSuccess={onSuccess}
          onClose={handleClose}
          mode="dialog"
          showButtons={false}
          onLoadingChange={setLoading}
          onTabChange={setActiveTab}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading
            ? activeTab === "login"
              ? "Вход..."
              : "Регистрация..."
            : activeTab === "login"
            ? "Войти"
            : "Зарегистрироваться"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
