import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  Stack,
  Alert,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import type {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
} from "../types/service";

interface ServiceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateServiceRequest | UpdateServiceRequest
  ) => Promise<void>;
  service?: Service | null;
  isLoading?: boolean;
  error?: string | null;
}

interface FormData {
  name: string;
  price: number;
  durationMin: number;
  description: string;
  isActive: boolean;
}

export function ServiceForm({
  open,
  onClose,
  onSubmit,
  service,
  isLoading = false,
  error,
}: ServiceFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      price: 0,
      durationMin: 60,
      description: "",
      isActive: true,
    },
    mode: "onChange",
  });

  // Сброс формы при изменении услуги
  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        price: service.price,
        durationMin: service.durationMin,
        description: service.description || "",
        isActive: service.isActive,
      });
    } else {
      reset({
        name: "",
        price: 0,
        durationMin: 60,
        description: "",
        isActive: true,
      });
    }
    setFormError(null);
  }, [service, reset]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      setFormError(null);

      // Подготавливаем данные для отправки
      const submitData = {
        name: data.name.trim(),
        price: data.price,
        durationMin: data.durationMin,
        description: data.description.trim() || undefined,
        ...(service && { isActive: data.isActive }),
      };

      await onSubmit(submitData);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Произошла ошибка");
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setFormError(null);
    }
  };

  const isEdit = !!service;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? "Редактировать услугу" : "Создать новую услугу"}
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {/* Название услуги */}
            <Controller
              name="name"
              control={control}
              rules={{
                required: "Название услуги обязательно",
                minLength: {
                  value: 2,
                  message: "Название должно содержать минимум 2 символа",
                },
                maxLength: {
                  value: 100,
                  message: "Название не должно превышать 100 символов",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Название услуги"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Цена и длительность */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Controller
                name="price"
                control={control}
                rules={{
                  required: "Цена обязательна",
                  min: {
                    value: 1,
                    message: "Цена должна быть больше 0",
                  },
                  max: {
                    value: 999999,
                    message: "Цена не должна превышать 999,999",
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Цена (₽)"
                    type="number"
                    fullWidth
                    error={!!errors.price}
                    helperText={errors.price?.message}
                    disabled={isLoading}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />

              <Controller
                name="durationMin"
                control={control}
                rules={{
                  required: "Длительность обязательна",
                  min: {
                    value: 1,
                    message: "Длительность должна быть больше 0 минут",
                  },
                  max: {
                    value: 1440,
                    message: "Длительность не должна превышать 24 часа",
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Длительность (мин)"
                    type="number"
                    fullWidth
                    error={!!errors.durationMin}
                    helperText={errors.durationMin?.message}
                    disabled={isLoading}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </Box>

            {/* Описание */}
            <Controller
              name="description"
              control={control}
              rules={{
                maxLength: {
                  value: 500,
                  message: "Описание не должно превышать 500 символов",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Описание (необязательно)"
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Статус активности (только для редактирования) */}
            {isEdit && (
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        {...field}
                        checked={field.value}
                        disabled={isLoading}
                      />
                    }
                    label="Услуга активна"
                  />
                )}
              />
            )}

            {/* Ошибки */}
            {(error || formError) && (
              <Alert severity="error">{error || formError}</Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isLoading}
            sx={{ minWidth: 120 }}
          >
            {isLoading ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
