import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SnackbarProvider } from "../components/SnackbarProvider";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Dashboard } from "../pages/Dashboard";
import { MasterPage } from "../pages/MasterPage";
import { MasterCabinet } from "../pages/MasterCabinet";
import { BookPage } from "../pages/BookPage";
import { BookingSuccess } from "../pages/BookingSuccess";
import { Login } from "../pages/Login";
import { FAQPage } from "../pages/FAQPage";
import { AboutPage } from "../pages/AboutPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { TermsPage } from "../pages/TermsPage";
import { NotFound } from "../pages/NotFound";
import theme from "../theme";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <BrowserRouter>
          <Box
            sx={{
              minHeight: "100vh",
              bgcolor: "background.default",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Header />
            <Box sx={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/services" element={<Dashboard />} />
                <Route path="/appointments" element={<Dashboard />} />
                <Route path="/booking-success" element={<BookingSuccess />} />
                {/* Страница входа */}
                <Route path="/login" element={<Login />} />
                {/* Публичные информационные страницы */}
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                {/* Защищенные роуты кабинета мастера */}
                <Route
                  path="/master/*"
                  element={
                    <ProtectedRoute>
                      <MasterCabinet />
                    </ProtectedRoute>
                  }
                />
                {/* Публичные роуты */}
                <Route path="/:slug/book" element={<BookPage />} />
                <Route path="/:slug" element={<MasterPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Box>
            <Footer />
          </Box>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
