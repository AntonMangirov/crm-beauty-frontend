import { createTheme } from "@mui/material/styles";

// Цветовая палитра: минимализм, премиальность, бутылочное стекло
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0F3B35", // Темно-бутылочный зеленый (accent)
      light: "#1F8A49",
      dark: "#0A2A25",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#C6A15E", // Теплый золотой (accent-2)
      light: "#D4B876",
      dark: "#A68B4A",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#FBFBFB", // Почти белый (bg)
      paper: "#FFFFFF", // Белый для карточек (surface)
    },
    text: {
      primary: "#111318", // Почти черный для контраста (text)
      secondary: "#8A8F93", // Серый для подсказок (muted)
    },
    // Дополнительные цвета
    success: {
      main: "#1F8A49", // Success green
      light: "#4CAF50",
      dark: "#1B5E20",
    },
    error: {
      main: "#C43B3B", // Danger red
      light: "#EF5350",
      dark: "#B71C1C",
    },
    divider: "rgba(17,19,24,0.06)", // Тонкая линия
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    h1: {
      fontSize: "28px", // Mobile: 28px, Desktop: 36px
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "20px", // Mobile: 20px, Desktop: 24px
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "18px",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    body1: {
      fontSize: "16px",
      lineHeight: 1.5, // 24px
      fontWeight: 400,
    },
    body2: {
      fontSize: "14px",
      lineHeight: 1.4,
      fontWeight: 400,
    },
    caption: {
      fontSize: "12px",
      lineHeight: 1.3,
      fontWeight: 400,
    },
    button: {
      fontSize: "16px",
      fontWeight: 600,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 12, // Премиальные карточки
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          padding: "12px 24px",
        },
        containedPrimary: {
          boxShadow: "0 6px 18px rgba(15,59,53,0.06)",
          "&:hover": {
            filter: "brightness(1.05)",
            boxShadow: "0 8px 24px rgba(15,59,53,0.12)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 6px 18px rgba(15,59,53,0.06)", // Тонкий бутылочный оттенок в тени
          border: "1px solid rgba(17,19,24,0.06)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 24px rgba(15,59,53,0.12)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0F3B35", // Темно-бутылочный зеленый
          color: "#FFFFFF",
          boxShadow: "0 2px 8px rgba(15,59,53,0.15)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default theme;
