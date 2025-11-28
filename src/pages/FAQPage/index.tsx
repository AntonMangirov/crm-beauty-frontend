import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
} from "@mui/icons-material";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Как записаться к мастеру?",
    answer:
      "Найдите мастера через поиск на главной странице или перейдите на его публичную страницу. Выберите услугу, удобное время и заполните форму записи. После подтверждения вы получите уведомление о записи.",
  },
  {
    question: "Можно ли отменить или перенести запись?",
    answer:
      "Да, вы можете отменить или перенести запись. Свяжитесь с мастером напрямую по указанным контактам или через систему уведомлений. Рекомендуем отменять запись не менее чем за 24 часа до назначенного времени.",
  },
  {
    question: "Как стать мастером на платформе?",
    answer:
      "Для регистрации в качестве мастера нажмите кнопку 'Войти' в правом верхнем углу, затем выберите 'Регистрация'. Заполните форму с вашими данными, подтвердите email и начните настраивать свой профиль.",
  },
  {
    question: "Сколько стоит использование платформы для мастеров?",
    answer:
      "Базовая версия платформы доступна бесплатно. Для расширенного функционала доступны платные тарифы. Подробную информацию о тарифах вы можете найти в разделе 'Настройки' после регистрации.",
  },
  {
    question: "Как работает система напоминаний?",
    answer:
      "Система автоматически отправляет напоминания клиентам о предстоящей записи за 24 часа и за 2 часа до назначенного времени. Мастера также получают уведомления о новых записях и изменениях.",
  },
  {
    question: "Можно ли загружать фото работ в портфолио?",
    answer:
      "Да, мастера могут загружать неограниченное количество фотографий своих работ в разделе 'Портфолио'. Эти фото будут отображаться на публичной странице мастера для привлечения новых клиентов.",
  },
  {
    question: "Как работает аналитика для мастеров?",
    answer:
      "В разделе 'Аналитика' мастера могут видеть статистику по доходам, количеству записей, популярным услугам и новым клиентам. Данные доступны за различные периоды: дни, недели и месяцы.",
  },
  {
    question: "Что делать, если забыл пароль?",
    answer:
      "На странице входа нажмите 'Забыли пароль?' и введите email, указанный при регистрации. Вы получите письмо с инструкциями по восстановлению пароля.",
  },
  {
    question: "Безопасны ли мои данные?",
    answer:
      "Да, мы используем современные методы шифрования и защиты данных. Ваша личная информация и данные клиентов хранятся в безопасности. Подробнее читайте в нашей Политике конфиденциальности.",
  },
  {
    question: "Как связаться с поддержкой?",
    answer:
      "Вы можете написать нам на email support@beautycrm.ru или использовать форму обратной связи. Мы отвечаем в течение 24 часов в рабочие дни.",
  },
];

export const FAQPage: React.FC = () => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

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
          <HelpIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.75rem", md: "2.125rem" },
            }}
          >
            Часто задаваемые вопросы
          </Typography>
        </Box>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.875rem", md: "1rem" } }}
        >
          Здесь собраны ответы на самые популярные вопросы о платформе Beauty
          CRM
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {faqData.map((item, index) => {
          const panelId = `panel-${index}`;
          return (
            <Accordion
              key={index}
              expanded={expanded === panelId}
              onChange={handleChange(panelId)}
              sx={{
                "&:before": {
                  display: "none",
                },
                boxShadow: 1,
                "&:hover": {
                  boxShadow: 2,
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  py: 2,
                  "& .MuiAccordionSummary-content": {
                    my: 0,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: { xs: "0.9375rem", md: "1rem" },
                  }}
                >
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  pt: 0,
                  pb: 2.5,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: "0.875rem", md: "0.9375rem" },
                    lineHeight: 1.7,
                  }}
                >
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Container>
  );
};


