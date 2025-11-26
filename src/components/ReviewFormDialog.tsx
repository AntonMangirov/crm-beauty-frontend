import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Rating,
  Typography,
  Alert,
} from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import { reviewsApi, type CreateReviewRequest } from "../api/reviews";
import { useSnackbar } from "./SnackbarProvider";

interface ReviewFormDialogProps {
  open: boolean;
  onClose: () => void;
  masterSlug: string;
  onSuccess?: () => void;
}

export const ReviewFormDialog: React.FC<ReviewFormDialogProps> = ({
  open,
  onClose,
  masterSlug,
  onSuccess,
}) => {
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState<number | null>(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const handleClose = () => {
    if (!loading) {
      setAuthorName("");
      setRating(5);
      setText("");
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async () => {
    // Валидация
    if (!authorName.trim()) {
      setError("Пожалуйста, укажите ваше имя");
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setError("Пожалуйста, выберите оценку");
      return;
    }

    if (!text.trim()) {
      setError("Пожалуйста, напишите отзыв");
      return;
    }

    if (text.trim().length < 10) {
      setError("Отзыв должен содержать минимум 10 символов");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const reviewData: Omit<CreateReviewRequest, "masterSlug"> = {
        authorName: authorName.trim(),
        rating,
        text: text.trim(),
      };

      await reviewsApi.create(masterSlug, reviewData);
      showSnackbar("Отзыв успешно добавлен!", "success");
      
      // Очищаем форму
      setAuthorName("");
      setRating(5);
      setText("");
      setError(null);
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Ошибка создания отзыва:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Не удалось добавить отзыв. Попробуйте позже.";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Написать отзыв</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Ваше имя"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            fullWidth
            required
            disabled={loading}
            autoFocus
            inputProps={{ maxLength: 100 }}
          />

          <Box>
            <Typography component="legend" sx={{ mb: 0.5 }}>
              Оценка
            </Typography>
            <Rating
              value={rating}
              onChange={(_, newValue) => setRating(newValue)}
              icon={<StarIcon fontSize="inherit" />}
              size="large"
              disabled={loading}
            />
          </Box>

          <TextField
            label="Отзыв"
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            disabled={loading}
            placeholder="Поделитесь своими впечатлениями..."
            inputProps={{ maxLength: 1000 }}
            helperText={`${text.length}/1000 символов`}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !authorName.trim() || !rating || !text.trim()}
        >
          {loading ? "Отправка..." : "Отправить отзыв"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

