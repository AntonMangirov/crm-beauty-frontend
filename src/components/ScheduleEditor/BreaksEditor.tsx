import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  Alert,
  Grid,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import type { Break, DaySchedule } from "../../types/schedule";

interface BreaksEditorProps {
  breaks: Break[] | null;
  workSchedule: DaySchedule[] | null;
  onChange: (breaks: Break[] | null) => void;
}

export const BreaksEditor: React.FC<BreaksEditorProps> = ({
  breaks,
  workSchedule,
  onChange,
}) => {
  const [errors, setErrors] = useState<Record<number, string>>({});

  const breaksList = breaks || [];

  const validateBreak = (
    breakItem: Break,
    index: number,
    skipIndex?: number
  ): string | null => {
    // Проверка формата времени
    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(breakItem.from)) {
      return "Неверный формат времени начала";
    }
    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(breakItem.to)) {
      return "Неверный формат времени окончания";
    }

    // Преобразуем время в минуты для сравнения
    const [fromHours, fromMinutes] = breakItem.from.split(":").map(Number);
    const [toHours, toMinutes] = breakItem.to.split(":").map(Number);
    const breakFromTime = fromHours * 60 + fromMinutes;
    const breakToTime = toHours * 60 + toMinutes;

    // Проверка: from < to
    if (breakFromTime >= breakToTime) {
      return "Время начала должно быть меньше времени окончания";
    }

    // Проверка пересечения с другими перерывами
    for (let i = 0; i < breaksList.length; i++) {
      if (i === index || i === skipIndex) continue;

      const otherBreak = breaksList[i];
      const [otherFromHours, otherFromMinutes] = otherBreak.from
        .split(":")
        .map(Number);
      const [otherToHours, otherToMinutes] = otherBreak.to
        .split(":")
        .map(Number);
      const otherFromTime = otherFromHours * 60 + otherFromMinutes;
      const otherToTime = otherToHours * 60 + otherToMinutes;

      // Перерывы пересекаются если: from1 < to2 && from2 < to1
      if (breakFromTime < otherToTime && otherFromTime < breakToTime) {
        return "Перерывы не должны пересекаться";
      }
    }

    // Проверка, что перерыв находится внутри хотя бы одного рабочего интервала
    if (!workSchedule || workSchedule.length === 0) {
      return "Сначала настройте рабочие дни";
    }

    let foundInWorkInterval = false;
    for (const daySchedule of workSchedule) {
      for (const interval of daySchedule.intervals) {
        const [intervalFromHours, intervalFromMinutes] = interval.from
          .split(":")
          .map(Number);
        const [intervalToHours, intervalToMinutes] = interval.to
          .split(":")
          .map(Number);
        const intervalFromTime = intervalFromHours * 60 + intervalFromMinutes;
        const intervalToTime = intervalToHours * 60 + intervalToMinutes;

        // Перерыв находится внутри интервала если
        // breakFrom >= intervalFrom && breakTo <= intervalTo
        if (
          breakFromTime >= intervalFromTime &&
          breakToTime <= intervalToTime
        ) {
          foundInWorkInterval = true;
          break;
        }
      }
      if (foundInWorkInterval) break;
    }

    if (!foundInWorkInterval) {
      return "Перерыв должен находиться внутри рабочего интервала";
    }

    return null;
  };

  const handleAddBreak = () => {
    const newBreak: Break = {
      from: "13:00",
      to: "14:00",
      reason: "",
    };

    const validationError = validateBreak(newBreak, breaksList.length);
    if (validationError) {
      setErrors({ ...errors, [breaksList.length]: validationError });
      return;
    }

    const newBreaks = [...breaksList, newBreak];
    onChange(newBreaks.length > 0 ? newBreaks : null);
  };

  const handleUpdateBreak = (
    index: number,
    field: "from" | "to" | "reason",
    value: string
  ) => {
    const newBreaks = [...breaksList];
    newBreaks[index] = {
      ...newBreaks[index],
      [field]: value,
    };

    const validationError = validateBreak(newBreaks[index], index);
    if (validationError) {
      setErrors({ ...errors, [index]: validationError });
      // Всё равно обновляем перерыв, чтобы пользователь мог видеть изменения
      onChange(newBreaks.length > 0 ? newBreaks : null);
      return;
    }

    // Очищаем ошибку для этого перерыва
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);

    onChange(newBreaks.length > 0 ? newBreaks : null);
  };

  const handleDeleteBreak = (index: number) => {
    const newBreaks = breaksList.filter((_, i) => i !== index);
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);

    onChange(newBreaks.length > 0 ? newBreaks : null);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            Перерывы
          </Typography>
        </Box>

        {breaksList.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Перерывы не заданы
          </Typography>
        ) : (
          <Box sx={{ mb: 2 }}>
            {breaksList.map((breakItem, index) => (
              <Box key={index}>
                {index > 0 && <Divider sx={{ my: 2 }} />}
                {errors[index] && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {errors[index]}
                  </Alert>
                )}
                <Grid container spacing={1.5} alignItems="center">
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="От"
                      type="time"
                      value={breakItem.from}
                      onChange={(e) =>
                        handleUpdateBreak(index, "from", e.target.value)
                      }
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 300, // 5 минут
                      }}
                      error={!!errors[index]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="До"
                      type="time"
                      value={breakItem.to}
                      onChange={(e) =>
                        handleUpdateBreak(index, "to", e.target.value)
                      }
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 300, // 5 минут
                      }}
                      error={!!errors[index]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Причина (необязательно)"
                      value={breakItem.reason || ""}
                      onChange={(e) =>
                        handleUpdateBreak(index, "reason", e.target.value)
                      }
                      placeholder="Например: Обед"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: { xs: "flex-start", sm: "flex-end" },
                      }}
                    >
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteBreak(index)}
                        sx={{
                          "&:hover": {
                            bgcolor: "error.light",
                            color: "error.contrastText",
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        )}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddBreak}
          size="small"
          fullWidth
        >
          Добавить перерыв
        </Button>
      </CardContent>
    </Card>
  );
};


