import { Box, Typography } from "@mui/material";

export function Landing() {
  return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Добро пожаловать в CRM Beauty
      </Typography>
      <Typography color="text.secondary">
        Страница мастера появится по адресу /{`<slug>`}
      </Typography>
    </Box>
  );
}

