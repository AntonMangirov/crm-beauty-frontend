import React from "react";
import { Container, Typography, Box } from "@mui/material";
import { Info as InfoIcon } from "@mui/icons-material";

export const AboutPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <InfoIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.75rem", md: "2.125rem" },
            }}
          >
            О нас
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          Beauty CRM — это современная платформа для управления записями и
          клиентами в салонах красоты. Мы помогаем мастерам организовать свой
          бизнес, привлечь новых клиентов и повысить эффективность работы.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            mt: 2,
          }}
        >
          Наша миссия
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          Сделать управление салоном красоты простым и эффективным, чтобы мастера
          могли сосредоточиться на том, что у них получается лучше всего — на
          создании красоты.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            mt: 2,
          }}
        >
          Контакты
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          По всем вопросам обращайтесь на{" "}
          <a
            href="mailto:support@beautycrm.ru"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            support@beautycrm.ru
          </a>
        </Typography>
      </Box>
    </Container>
  );
};



