import React from "react";
import { Container, Box, Typography } from "@mui/material";
import { PortfolioManager } from "../../components/PortfolioManager";

export const PortfolioPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            mb: 1,
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
          }}
        >
          Управление портфолио
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Загружайте примеры своих работ, чтобы показать их на публичной
          странице. Эти фото будут видны всем посетителям вашего профиля.
        </Typography>
      </Box>
      <PortfolioManager />
    </Container>
  );
};


