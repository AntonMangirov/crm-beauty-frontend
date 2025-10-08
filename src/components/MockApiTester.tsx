import { useState } from "react";
import { Button, Box, Typography, Alert, Stack } from "@mui/material";
import { testMockApi, initializeTestData } from "../services/testMockApi";

export function MockApiTester() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string>("");

  const runTests = async () => {
    setIsRunning(true);
    setResult("");

    // Перехватываем console.log для отображения результатов
    const originalLog = console.log;
    const logs: string[] = [];

    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    try {
      await testMockApi();
      setResult(logs.join("\n"));
    } catch (error) {
      setResult(`Ошибка: ${error}`);
    } finally {
      console.log = originalLog;
      setIsRunning(false);
    }
  };

  const initializeData = async () => {
    setIsRunning(true);
    setResult("");

    try {
      const services = await initializeTestData();
      setResult(`Инициализировано ${services.length} тестовых услуг`);
    } catch (error) {
      setResult(`Ошибка инициализации: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        border: "1px solid #ccc",
        borderRadius: 2,
        bgcolor: "#f5f5f5",
      }}
    >
      <Typography variant="h6" gutterBottom>
        🧪 Тестирование Mock API
      </Typography>

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={runTests}
          disabled={isRunning}
          color="primary"
        >
          {isRunning ? "Запуск тестов..." : "Запустить тесты"}
        </Button>

        <Button
          variant="outlined"
          onClick={initializeData}
          disabled={isRunning}
          color="secondary"
        >
          Инициализировать тестовые данные
        </Button>
      </Stack>

      {result && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography
            variant="body2"
            component="pre"
            sx={{ whiteSpace: "pre-wrap", fontSize: "0.875rem" }}
          >
            {result}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
