import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  IconButton,
  Alert,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import type { DaySchedule, WorkInterval } from "../../types/schedule";

interface DayScheduleCardProps {
  dayOfWeek: number;
  daySchedule: DaySchedule | null;
  onChange: (daySchedule: DaySchedule | null) => void;
}

const DAY_NAMES = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

export const DayScheduleCard: React.FC<DayScheduleCardProps> = ({
  dayOfWeek,
  daySchedule,
  onChange,
}) => {
  const [errors, setErrors] = useState<Record<number, string>>({});

  const isWorkingDay = daySchedule !== null;

  const handleToggleWorkingDay = (checked: boolean) => {
    if (checked) {
      // Создаём рабочий день с одним интервалом по умолчанию
      onChange({
        dayOfWeek,
        intervals: [{ from: "09:00", to: "18:00" }],
      });
    } else {
      // Делаем день выходным
      onChange(null);
      setErrors({});
    }
  };

  const handleAddInterval = () => {
    if (!daySchedule) return;

    const newIntervals = [
      ...daySchedule.intervals,
      { from: "09:00", to: "18:00" },
    ];

    const validationError = validateIntervals(newIntervals);
    if (validationError) {
      return;
    }

    onChange({
      ...daySchedule,
      intervals: newIntervals,
    });
  };

  const handleUpdateInterval = (
    index: number,
    field: "from" | "to",
    value: string
  ) => {
    if (!daySchedule) return;

    const newIntervals = [...daySchedule.intervals];
    newIntervals[index] = {
      ...newIntervals[index],
      [field]: value,
    };

    const validationError = validateIntervals(newIntervals, index);
    if (validationError) {
      setErrors({ ...errors, [index]: validationError });
      // Всё равно обновляем интервал, чтобы пользователь мог видеть изменения
      onChange({
        ...daySchedule,
        intervals: newIntervals,
      });
      return;
    }

    // Очищаем ошибку для этого интервала
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);

    onChange({
      ...daySchedule,
      intervals: newIntervals,
    });
  };

  const handleDeleteInterval = (index: number) => {
    if (!daySchedule) return;

    if (daySchedule.intervals.length === 1) {
      // Нельзя удалить последний интервал, делаем день выходным
      onChange(null);
      setErrors({});
      return;
    }

    const newIntervals = daySchedule.intervals.filter((_, i) => i !== index);
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);

    onChange({
      ...daySchedule,
      intervals: newIntervals,
    });
  };

  const validateIntervals = (
    intervals: WorkInterval[],
    skipIndex?: number
  ): string | null => {
    for (let i = 0; i < intervals.length; i++) {
      const interval = intervals[i];

      // Проверка формата времени
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(interval.from)) {
        return "Неверный формат времени начала";
      }
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(interval.to)) {
        return "Неверный формат времени окончания";
      }

      // Преобразуем время в минуты для сравнения
      const [fromHours, fromMinutes] = interval.from.split(":").map(Number);
      const [toHours, toMinutes] = interval.to.split(":").map(Number);
      const fromTime = fromHours * 60 + fromMinutes;
      const toTime = toHours * 60 + toMinutes;

      // Проверка: from < to
      if (fromTime >= toTime) {
        return "Время начала должно быть меньше времени окончания";
      }

      // Проверка пересечений с другими интервалами
      for (let j = i + 1; j < intervals.length; j++) {
        const otherInterval = intervals[j];
        const [otherFromHours, otherFromMinutes] = otherInterval.from
          .split(":")
          .map(Number);
        const [otherToHours, otherToMinutes] = otherInterval.to
          .split(":")
          .map(Number);
        const otherFromTime = otherFromHours * 60 + otherFromMinutes;
        const otherToTime = otherToHours * 60 + otherToMinutes;

        // Интервалы пересекаются если: from1 < to2 && from2 < to1
        if (fromTime < otherToTime && otherFromTime < toTime) {
          return "Интервалы не должны пересекаться";
        }
      }
    }

    return null;
  };

  return (
    <Card
      sx={{
        mb: 2,
        border: isWorkingDay ? "1px solid" : "1px solid",
        borderColor: isWorkingDay ? "primary.main" : "divider",
        bgcolor: isWorkingDay ? "background.paper" : "action.hover",
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: isWorkingDay ? 2 : 0,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            {DAY_NAMES[dayOfWeek]}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isWorkingDay}
                onChange={(e) => handleToggleWorkingDay(e.target.checked)}
                color="primary"
              />
            }
            label={isWorkingDay ? "Рабочий день" : "Выходной"}
            sx={{ m: 0 }}
          />
        </Box>

        {isWorkingDay && daySchedule && (
          <Box>
            {daySchedule.intervals.map((interval, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                {errors[index] && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {errors[index]}
                  </Alert>
                )}
                <Grid container spacing={1.5} alignItems="center">
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="От"
                      type="time"
                      value={interval.from}
                      onChange={(e) =>
                        handleUpdateInterval(index, "from", e.target.value)
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
                      label="До"
                      type="time"
                      value={interval.to}
                      onChange={(e) =>
                        handleUpdateInterval(index, "to", e.target.value)
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
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: { xs: "flex-start", sm: "flex-end" },
                      }}
                    >
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteInterval(index)}
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

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddInterval}
              size="small"
              fullWidth
              sx={{ mt: 1 }}
            >
              Добавить интервал
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};









