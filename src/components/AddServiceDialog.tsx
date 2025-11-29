import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
} from "@mui/material";
import {
  type CreateServiceRequest,
} from "../api/me";

interface AddServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateServiceRequest) => Promise<void>;
}

const durationOptions = [
  { value: 15, label: "15 минут" },
  { value: 30, label: "30 минут" },
  { value: 45, label: "45 минут" },
  { value: 60, label: "1 час" },
  { value: 90, label: "1 час 30 минут" },
  { value: 120, label: "2 часа" },
  { value: 150, label: "2 часа 30 минут" },
  { value: 180, label: "3 часа" },
  { value: 240, label: "4 часа" },
  { value: 300, label: "5 часов" },
];

export const AddServiceDialog: React.FC<AddServiceDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<CreateServiceRequest>({
    name: "",
    price: 0,
    durationMin: 60,
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof CreateServiceRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      field === "price" || field === "durationMin"
        ? Number(e.target.value)
        : e.target.value;
    setFormData({ ...formData, [field]: value });
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Название обязательно";
    } else if (formData.name.length > 60) {
      newErrors.name = "Название не должно превышать 60 символов";
    }

    if (formData.price < 0) {
      newErrors.price = "Цена не может быть отрицательной";
    }

    if (formData.durationMin < 15 || formData.durationMin > 300) {
      newErrors.durationMin = "Длительность должна быть от 15 до 300 минут";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      await onSave({
        ...formData,
        description: formData.description || undefined,
      });
      // Сброс формы
      setFormData({
        name: "",
        price: 0,
        durationMin: 60,
        description: "",
      });
      setErrors({});
    } catch (err) {
      // Ошибка уже обработана в родительском компоненте
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({
        name: "",
        price: 0,
        durationMin: 60,
        description: "",
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить услугу</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Название услуги"
              value={formData.name}
              onChange={handleChange("name")}
              error={!!errors.name}
              helperText={errors.name}
              required
              inputProps={{ maxLength: 60 }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Цена (₽)"
              type="number"
              value={formData.price}
              onChange={handleChange("price")}
              error={!!errors.price}
              helperText={errors.price}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              select
              label="Длительность"
              value={formData.durationMin}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  durationMin: Number(e.target.value),
                })
              }
              error={!!errors.durationMin}
              helperText={errors.durationMin}
              required
            >
              {durationOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Описание (необязательно)"
              value={formData.description}
              onChange={handleChange("description")}
              placeholder="Добавьте описание услуги..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Отмена
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
        >
          {saving ? "Сохранение..." : "Добавить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};







