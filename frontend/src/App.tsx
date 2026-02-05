import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AuthLayout from "./components/AuthLayout";
import MainLayout from "./components/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Rutas públicas - con AuthLayout */}
                        <Route
                            element={
                                <PublicRoute>
                                    <AuthLayout />
                                </PublicRoute>
                            }
                        >
                            <Route path="/login" element={<LoginPage />} />
                            <Route
                                path="/registro"
                                element={<RegisterPage />}
                            />
                            <Route
                                path="/verificacion"
                                element={<VerifyEmailPage />}
                            />
                        </Route>

                        {/* Rutas protegidas - con MainLayout */}
                        <Route
                            element={
                                <ProtectedRoute>
                                    <MainLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="/" element={<HomePage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
