import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Container, Typography, Link } from "@mui/material";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "background.default",
        borderTop: "1px solid",
        borderColor: "divider",
        mt: "auto",
        pt: { xs: 2, md: 2.5 },
        pb: { xs: 2, md: 2.5 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {/* Ссылки */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 1.5, md: 2.5 },
              alignItems: "center",
            }}
          >
            <Link
              component={RouterLink}
              to="/faq"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                opacity: 0.7,
                "&:hover": {
                  opacity: 1,
                  color: "text.primary",
                },
              }}
            >
              FAQ
            </Link>
            <Link
              component={RouterLink}
              to="/about"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                opacity: 0.7,
                "&:hover": {
                  opacity: 1,
                  color: "text.primary",
                },
              }}
            >
              О нас
            </Link>
            <Link
              component={RouterLink}
              to="/privacy"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                opacity: 0.7,
                "&:hover": {
                  opacity: 1,
                  color: "text.primary",
                },
              }}
            >
              Политика конфиденциальности
            </Link>
            <Link
              component={RouterLink}
              to="/terms"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                opacity: 0.7,
                "&:hover": {
                  opacity: 1,
                  color: "text.primary",
                },
              }}
            >
              Условия использования
            </Link>
            <Link
              href="mailto:support@beautycrm.ru"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                opacity: 0.7,
                "&:hover": {
                  opacity: 1,
                  color: "text.primary",
                },
              }}
            >
              Контакты
            </Link>
          </Box>

          {/* Копирайт */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.6875rem", sm: "0.75rem" },
              opacity: 0.6,
            }}
          >
            © {currentYear} Beauty CRM
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

