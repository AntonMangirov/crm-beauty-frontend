import { useState, useEffect } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { mockServiceApi } from "../services/mockServiceApi";

export function PerformanceTest() {
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setResults([]);

    addResult("🚀 Начинаем тест производительности...");

    try {
      // Тест 1: Загрузка услуг
      const start1 = performance.now();
      await mockServiceApi.getServices();
      const end1 = performance.now();
      addResult(`✅ Загрузка услуг: ${(end1 - start1).toFixed(2)}ms`);

      // Тест 2: Поиск
      const start2 = performance.now();
      await mockServiceApi.searchServices("маникюр");
      const end2 = performance.now();
      addResult(`✅ Поиск: ${(end2 - start2).toFixed(2)}ms`);

      // Тест 3: Создание
      const start3 = performance.now();
      await mockServiceApi.createService({
        name: "Тестовая услуга",
        price: 1000,
        durationMin: 30,
        description: "Тест",
      });
      const end3 = performance.now();
      addResult(`✅ Создание: ${(end3 - start3).toFixed(2)}ms`);

      // Тест 4: Обновление
      const start4 = performance.now();
      await mockServiceApi.updateService("test-id", { name: "Обновлено" });
      const end4 = performance.now();
      addResult(`✅ Обновление: ${(end4 - start4).toFixed(2)}ms`);

      addResult("🎉 Тест завершен успешно!");
    } catch (error) {
      addResult(`❌ Ошибка: ${error}`);
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
        🧪 Тест производительности
      </Typography>

      <Button
        variant="contained"
        onClick={runPerformanceTest}
        disabled={isRunning}
        sx={{ mb: 2 }}
      >
        {isRunning ? "Тестирование..." : "Запустить тест"}
      </Button>

      {results.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {results.map((result, index) => (
            <Alert
              key={index}
              severity="info"
              sx={{ mb: 1, fontSize: "0.875rem" }}
            >
              {result}
            </Alert>
          ))}
        </Box>
      )}
    </Box>
  );
}
