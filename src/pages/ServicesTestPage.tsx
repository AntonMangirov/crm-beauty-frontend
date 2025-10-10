import { Container, Typography, Box, Stack } from "@mui/material";
import { MockApiTester } from "../components/MockApiTester";
import { PerformanceTest } from "../components/PerformanceTest";

export function ServicesTestPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🧪 Тестирование Mock API
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Эта страница предназначена для тестирования mock API и localStorage
          функциональности. Используйте кнопки ниже для проверки работы системы.
        </Typography>
      </Box>

      <Stack spacing={3}>
        <MockApiTester />
        <PerformanceTest />
      </Stack>
    </Container>
  );
}
