import React from "react";
import { Container, Typography, Box } from "@mui/material";

export const TermsPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.75rem", md: "2.125rem" },
            mb: 2,
          }}
        >
          Условия использования
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.875rem", md: "1rem" } }}
        >
          Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
        </Typography>
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
          Используя платформу Beauty CRM, вы соглашаетесь с настоящими условиями
          использования.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            mt: 2,
          }}
        >
          1. Использование платформы
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          Платформа предназначена для управления записями и клиентами в салонах
          красоты. Вы обязуетесь использовать платформу в соответствии с ее
          назначением и не нарушать права других пользователей.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            mt: 2,
          }}
        >
          2. Регистрация и учетная запись
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          При регистрации вы предоставляете достоверную информацию и несете
          ответственность за сохранность ваших учетных данных. Вы обязаны
          немедленно уведомить нас о любом несанкционированном использовании
          вашей учетной записи.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            mt: 2,
          }}
        >
          3. Ответственность
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          Мы не несем ответственности за качество услуг, предоставляемых
          мастерами через платформу. Все договоренности между мастерами и
          клиентами заключаются напрямую между ними.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            mt: 2,
          }}
        >
          4. Изменения условий
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          Мы оставляем за собой право изменять условия использования. О
          существенных изменениях мы уведомим пользователей через платформу или
          по email.
        </Typography>
      </Box>
    </Container>
  );
};










