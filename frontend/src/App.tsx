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
import AccountsPage from "./pages/AccountsPage";
import TransactionsPage from "./pages/TransactionsPage";
import RecurrentsPage from "./pages/RecurrentsPage";
import BudgetsPage from "./pages/BudgetsPage";
import CalendarPage from "./pages/Calendar";

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
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

                        <Route
                            element={
                                <ProtectedRoute>
                                    <MainLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="/" element={<HomePage />} />
                            <Route path="/cuentas" element={<AccountsPage />} />
                            <Route
                                path="/movimientos"
                                element={<TransactionsPage />}
                            />
                            <Route
                                path="/recurrentes"
                                element={<RecurrentsPage />}
                            />
                            <Route
                                path="/presupuestos"
                                element={<BudgetsPage />}
                            />
                            <Route
                                path="/calendario"
                                element={<CalendarPage />}
                            />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
