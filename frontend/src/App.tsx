import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Rutas públicas - redirigen a / si el usuario está autenticado */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/registro"
                        element={
                            <PublicRoute>
                                <RegisterPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/verificacion"
                        element={
                            <PublicRoute>
                                <VerifyEmailPage />
                            </PublicRoute>
                        }
                    />

                    {/* Rutas protegidas - requieren autenticación */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<HomePage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
