import { AppBar, Box, Container, Toolbar } from "@mui/material";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Logo } from "../components/Logo";
import { MasterSkeleton } from "../components/MasterSkeleton";
import { Landing } from "../pages/Landing";
import { MasterPage } from "../pages/MasterPage";

export default function App() {
  return (
    <BrowserRouter>
      <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <Logo />
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path=":slug" element={<MasterPage />} />
            {/* Фолбек на скелет */}
            <Route path="*" element={<MasterSkeleton />} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  );
}

