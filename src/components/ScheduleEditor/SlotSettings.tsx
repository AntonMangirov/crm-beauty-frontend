import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Grid,
} from "@mui/material";

interface SlotSettingsProps {
  defaultBufferMinutes: number | null;
  slotStepMinutes: number | null;
  onChange: (settings: {
    defaultBufferMinutes: number | null;
    slotStepMinutes: number | null;
  }) => void;
}

export const SlotSettings: React.FC<SlotSettingsProps> = ({
  defaultBufferMinutes,
  slotStepMinutes,
  onChange,
}) => {
  const [bufferError, setBufferError] = useState<string | null>(null);

  const handleBufferChange = (value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10);

    if (value === "") {
      setBufferError(null);
      onChange({
        defaultBufferMinutes: null,
        slotStepMinutes,
      });
      return;
    }

    if (isNaN(numValue!) || numValue! < 10 || numValue! > 30) {
      setBufferError("Буфер должен быть от 10 до 30 минут");
      return;
    }

    setBufferError(null);
    onChange({
      defaultBufferMinutes: numValue,
      slotStepMinutes,
    });
  };

  const handleSlotStepChange = (value: number | "") => {
    const numValue = value === "" ? null : (value as 5 | 10 | 15);
    onChange({
      defaultBufferMinutes,
      slotStepMinutes: numValue,
    });
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1rem", sm: "1.125rem" },
            mb: 2,
          }}
        >
          Настройки слотов
        </Typography>

        {bufferError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {bufferError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Буфер после услуги (минут)"
              type="number"
              value={defaultBufferMinutes ?? ""}
              onChange={(e) => handleBufferChange(e.target.value)}
              inputProps={{
                min: 10,
                max: 30,
                step: 1,
              }}
              helperText="Время между услугами (10-30 минут)"
              error={!!bufferError}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="slot-step-label">Шаг слотов (минут)</InputLabel>
              <Select
                labelId="slot-step-label"
                id="slot-step-select"
                value={slotStepMinutes ?? ""}
                label="Шаг слотов (минут)"
                onChange={(e) =>
                  handleSlotStepChange(
                    e.target.value === "" ? "" : (e.target.value as 5 | 10 | 15)
                  )
                }
              >
                <MenuItem value="">
                  <em>Не задано</em>
                </MenuItem>
                <MenuItem value={5}>5 минут</MenuItem>
                <MenuItem value={10}>10 минут</MenuItem>
                <MenuItem value={15}>15 минут</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};


