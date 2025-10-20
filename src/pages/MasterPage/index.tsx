import { Box, Typography, Container, Paper, Avatar } from "@mui/material";

export const MasterPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Avatar
          sx={{
            width: 120,
            height: 120,
            bgcolor: "primary.main",
            fontSize: "3rem",
            mx: "auto",
            mb: 3,
          }}
        >
          М
        </Avatar>

        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          Страница мастера
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
          Здесь будет информация о мастере, его услуги и форма записи
        </Typography>
      </Paper>
    </Container>
  );
};
