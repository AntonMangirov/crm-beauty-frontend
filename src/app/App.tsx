import { AppBar, Box, Container, Toolbar } from "@mui/material";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Navigation } from "../components/Navigation";
import { MasterSkeleton } from "../components/MasterSkeleton";
import { Landing } from "../pages/Landing";
import { MasterPage } from "../pages/MasterPage";
import { ServicesTestPage } from "../pages/ServicesTestPage";
import { ServicesManagementPage } from "../pages/ServicesManagementPage";

export default function App() {
  return (
    <BrowserRouter>
      <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Logo />
            <Navigation />
          </Toolbar>
        </AppBar>
        <Routes>
          <Route
            path="/"
            element={
              <Container maxWidth="md" sx={{ py: 4 }}>
                <Landing />
              </Container>
            }
          />
          <Route path="/services" element={<ServicesManagementPage />} />
          <Route
            path="/test"
            element={
              <Container maxWidth="md" sx={{ py: 4 }}>
                <ServicesTestPage />
              </Container>
            }
          />
          <Route
            path=":slug"
            element={
              <Container maxWidth="md" sx={{ py: 4 }}>
                <MasterPage />
              </Container>
            }
          />
          {/* Фолбек на скелет */}
          <Route
            path="*"
            element={
              <Container maxWidth="md" sx={{ py: 4 }}>
                <MasterSkeleton />
              </Container>
            }
          />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}
