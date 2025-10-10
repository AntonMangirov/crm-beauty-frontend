import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  useForm,
  Controller,
  type ControllerRenderProps,
} from "react-hook-form";

interface BookingFormData {
  name: string;
  phone: string;
  service: string;
  datetime: string;
  comment: string;
}

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  isLoading?: boolean;
}

const services = [
  "Маникюр",
  "Педикюр",
  "Массаж лица",
  "Макияж",
  "Прическа",
  "Брови",
  "Ресницы",
];

export function BookingForm({ onSubmit, isLoading = false }: BookingFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: {
      name: "",
      phone: "",
      service: "",
      datetime: "",
      comment: "",
    },
  });

  return (
    <Card sx={{ width: "100%", maxWidth: 600, mx: "auto" }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Записаться на прием
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            {/* Имя */}
            <Controller
              name="name"
              control={control}
              rules={{ required: "Имя обязательно для заполнения" }}
              render={({
                field,
              }: {
                field: ControllerRenderProps<BookingFormData, "name">;
              }) => (
                <TextField
                  {...field}
                  label="Имя"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            {/* Телефон */}
            <Controller
              name="phone"
              control={control}
              rules={{
                required: "Телефон обязателен для заполнения",
                pattern: {
                  value: /^[+]?[0-9\s\-()]{10,}$/,
                  message: "Введите корректный номер телефона",
                },
              }}
              render={({
                field,
              }: {
                field: ControllerRenderProps<BookingFormData, "phone">;
              }) => (
                <TextField
                  {...field}
                  label="Телефон"
                  fullWidth
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              )}
            />

            {/* Выбор услуги */}
            <Controller
              name="service"
              control={control}
              rules={{ required: "Выберите услугу" }}
              render={({
                field,
              }: {
                field: ControllerRenderProps<BookingFormData, "service">;
              }) => (
                <FormControl fullWidth error={!!errors.service}>
                  <InputLabel>Услуга</InputLabel>
                  <Select {...field} label="Услуга">
                    {services.map((service) => (
                      <MenuItem key={service} value={service}>
                        {service}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.service && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 1.5 }}
                    >
                      {errors.service.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            {/* Дата и время */}
            <Controller
              name="datetime"
              control={control}
              rules={{ required: "Выберите дату и время" }}
              render={({
                field,
              }: {
                field: ControllerRenderProps<BookingFormData, "datetime">;
              }) => (
                <TextField
                  {...field}
                  label="Дата и время"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!!errors.datetime}
                  helperText={errors.datetime?.message}
                />
              )}
            />

            {/* Комментарий */}
            <Controller
              name="comment"
              control={control}
              render={({
                field,
              }: {
                field: ControllerRenderProps<BookingFormData, "comment">;
              }) => (
                <TextField
                  {...field}
                  label="Комментарий (необязательно)"
                  fullWidth
                  multiline
                  rows={3}
                />
              )}
            />

            {/* Кнопка отправки */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
              sx={{ mt: 2 }}
            >
              {isLoading ? "Отправка..." : "Записаться"}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
