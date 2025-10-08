import { Button, Stack } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { Home, Business, Science } from "@mui/icons-material";

export function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Главная", icon: <Home /> },
    { path: "/services", label: "Услуги", icon: <Business /> },
    { path: "/test", label: "Тест API", icon: <Science /> },
  ];

  return (
    <Stack direction="row" spacing={1}>
      {navItems.map((item) => (
        <Button
          key={item.path}
          component={Link}
          to={item.path}
          startIcon={item.icon}
          color={location.pathname === item.path ? "primary" : "inherit"}
          variant={location.pathname === item.path ? "contained" : "text"}
          size="small"
        >
          {item.label}
        </Button>
      ))}
    </Stack>
  );
}
