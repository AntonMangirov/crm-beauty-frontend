import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Person as PersonIcon,
  Build as BuildIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  AccessTime as ScheduleIcon,
} from "@mui/icons-material";

const drawerWidth = 240;

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const menuItems: MenuItem[] = [
  { label: "Профиль", icon: <PersonIcon />, path: "/master" },
  { label: "Мои услуги", icon: <BuildIcon />, path: "/master/services" },
  { label: "Календарь", icon: <CalendarIcon />, path: "/master/calendar" },
  { label: "Клиенты", icon: <PeopleIcon />, path: "/master/clients" },
  { label: "Портфолио", icon: <PhotoLibraryIcon />, path: "/master/portfolio" },
  { label: "Аналитика", icon: <AnalyticsIcon />, path: "/master/analytics" },
  { label: "Расписание", icon: <ScheduleIcon />, path: "/master/schedule" },
  { label: "Настройки", icon: <SettingsIcon />, path: "/master/settings" },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? open : true}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Лучше для мобильных устройств
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
          position: "relative", // Убеждаемся, что сайдбар в потоке документа
          height: "auto", // Автоматическая высота по содержимому
          overflow: "visible", // Убираем отдельную прокрутку
        },
      }}
    >
      <Box sx={{ pt: 2 }}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
            Кабинет мастера
          </Typography>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => {
            // Для "/master" проверяем точное совпадение, чтобы не выделять при переходе на другие страницы
            // Для остальных путей проверяем точное совпадение или что путь начинается с этого пути + "/"
            const isActive =
              item.path === "/master"
                ? location.pathname === item.path
                : location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/");
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                      "& .MuiListItemIcon-root": {
                        color: "primary.contrastText",
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive
                        ? "primary.contrastText"
                        : "text.secondary",
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};
