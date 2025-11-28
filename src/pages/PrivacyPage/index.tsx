import React from "react";
import { Container, Typography, Box } from "@mui/material";
import { Policy as PolicyIcon } from "@mui/icons-material";

export const PrivacyPage: React.FC = () => {
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
          <PolicyIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.75rem", md: "2.125rem" },
            }}
          >
            Политика конфиденциальности
          </Typography>
        </Box>
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
          Мы серьезно относимся к защите ваших персональных данных и соблюдаем
          требования законодательства о защите персональных данных.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            mt: 2,
          }}
        >
          1. Сбор информации
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          Мы собираем только ту информацию, которая необходима для предоставления
          наших услуг: имя, email, телефон и другую информацию, которую вы
          добровольно предоставляете при регистрации и использовании платформы.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            mt: 2,
          }}
        >
          2. Использование информации
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          Ваши данные используются исключительно для предоставления услуг
          платформы, связи с вами и улучшения качества сервиса. Мы не передаем
          ваши данные третьим лицам без вашего согласия.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            mt: 2,
          }}
        >
          3. Защита данных
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          Мы используем современные методы шифрования и защиты данных для
          обеспечения безопасности вашей информации.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            mt: 2,
          }}
        >
          4. Ваши права
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1rem" },
            lineHeight: 1.8,
            color: "text.secondary",
          }}
        >
          Вы имеете право запросить доступ к вашим данным, их исправление или
          удаление. Для этого свяжитесь с нами по адресу{" "}
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


