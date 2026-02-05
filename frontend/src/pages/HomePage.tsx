import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    CreditCard,
    BarChart3,
    Eye,
    EyeOff,
} from "lucide-react";
import accountService, { type Account } from "../services/accountService";
import transactionService from "../services/transactionService";
import logger from "../lib/logger";

export default function HomePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [hideBalances, setHideBalances] = useState(() => {
        const saved = localStorage.getItem("hideBalances");
        return saved === "true";
    });

    const toggleBalances = () => {
        const newValue = !hideBalances;
        setHideBalances(newValue);
        localStorage.setItem("hideBalances", String(newValue));
    };

    // Métricas
    const [totalBalance, setTotalBalance] = useState(0);
    const [totalDebt, setTotalDebt] = useState(0);
    const [monthIncome, setMonthIncome] = useState(0);
    const [monthExpense, setMonthExpense] = useState(0);
    const [monthBalance, setMonthBalance] = useState(0);
    const [prevMonthIncome, setPrevMonthIncome] = useState(0);
    const [prevMonthExpense, setPrevMonthExpense] = useState(0);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Cargar cuentas activas
            const accounts = await accountService.getAccounts(false);

            // Calcular saldo total y deuda total
            let balance = 0;
            let debt = 0;

            accounts.forEach((account: Account) => {
                const currentBalance = parseFloat(account.currentBalance);
                if (account.type === "CREDIT") {
                    debt += currentBalance;
                } else {
                    balance += currentBalance;
                }
            });

            setTotalBalance(balance);
            setTotalDebt(debt);

            // Obtener transacciones del mes actual
            const now = new Date();
            const firstDayOfMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
            );
            const lastDayOfMonth = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
            );

            const currentMonthTransactions =
                await transactionService.getTransactions({
                    startDate: firstDayOfMonth.toISOString().split("T")[0],
                    endDate: lastDayOfMonth.toISOString().split("T")[0],
                    limit: 1000,
                });

            // Calcular ingresos y gastos del mes
            let income = 0;
            let expense = 0;

            currentMonthTransactions.transactions.forEach((t) => {
                const amount = parseFloat(t.amount);
                if (t.type === "INCOME") {
                    income += amount;
                } else if (t.type === "EXPENSE") {
                    expense += amount;
                }
            });

            setMonthIncome(income);
            setMonthExpense(expense);
            setMonthBalance(income - expense);

            // Obtener transacciones del mes anterior
            const firstDayPrevMonth = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1,
            );
            const lastDayPrevMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                0,
            );

            const prevMonthTransactions =
                await transactionService.getTransactions({
                    startDate: firstDayPrevMonth.toISOString().split("T")[0],
                    endDate: lastDayPrevMonth.toISOString().split("T")[0],
                    limit: 1000,
                });

            // Calcular ingresos y gastos del mes anterior
            let prevIncome = 0;
            let prevExpense = 0;

            prevMonthTransactions.transactions.forEach((t) => {
                const amount = parseFloat(t.amount);
                if (t.type === "INCOME") {
                    prevIncome += amount;
                } else if (t.type === "EXPENSE") {
                    prevExpense += amount;
                }
            });

            setPrevMonthIncome(prevIncome);
            setPrevMonthExpense(prevExpense);
        } catch (error) {
            logger.error("Error al cargar datos del dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        if (hideBalances) {
            return "CLP ••••••";
        }
        return `CLP ${amount.toLocaleString("es-CL", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const getChangeIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="h-4 w-4" />;
        if (change < 0) return <TrendingDown className="h-4 w-4" />;
        return null;
    };

    const getChangeColor = (change: number, inverse: boolean = false) => {
        if (change > 0)
            return inverse
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400";
        if (change < 0)
            return inverse
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400";
        return "text-gray-600 dark:text-gray-400";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
        );
    }

    const incomeChange = calculatePercentageChange(
        monthIncome,
        prevMonthIncome,
    );
    const expenseChange = calculatePercentageChange(
        monthExpense,
        prevMonthExpense,
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Bienvenido, {user?.name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Resumen de tus finanzas
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleBalances}
                    title={hideBalances ? "Mostrar saldos" : "Ocultar saldos"}
                >
                    {hideBalances ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Métricas principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Saldo Total */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Saldo Total
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalBalance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Cuentas activas
                        </p>
                    </CardContent>
                </Card>

                {/* Deuda Total */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Deuda Total
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(totalDebt)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tarjetas de crédito
                        </p>
                    </CardContent>
                </Card>

                {/* Ingresos del Mes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ingresos del Mes
                        </CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(monthIncome)}
                        </div>
                        {!hideBalances && prevMonthIncome > 0 && (
                            <p
                                className={`text-xs flex items-center gap-1 mt-1 ${getChangeColor(incomeChange)}`}
                            >
                                {getChangeIcon(incomeChange)}
                                {incomeChange > 0 ? "+" : ""}
                                {incomeChange.toFixed(1)}% vs mes anterior
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Gastos del Mes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Gastos del Mes
                        </CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(monthExpense)}
                        </div>
                        {!hideBalances && prevMonthExpense > 0 && (
                            <p
                                className={`text-xs flex items-center gap-1 mt-1 ${getChangeColor(expenseChange, true)}`}
                            >
                                {getChangeIcon(expenseChange)}
                                {expenseChange > 0 ? "+" : ""}
                                {expenseChange.toFixed(1)}% vs mes anterior
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Balance Mensual */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Balance del Mes
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`text-2xl font-bold ${
                                monthBalance >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                            }`}
                        >
                            {formatCurrency(monthBalance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {monthBalance >= 0 ? "Superávit" : "Déficit"}{" "}
                            mensual
                        </p>
                    </CardContent>
                </Card>

                {/* Tendencia */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tendencia
                        </CardTitle>
                        {monthBalance >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {!hideBalances && (
                                <>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Ingresos:
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(monthIncome)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Gastos:
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(monthExpense)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                                        <span className="text-muted-foreground font-medium">
                                            Diferencia:
                                        </span>
                                        <span
                                            className={`font-bold ${
                                                monthBalance >= 0
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-red-600 dark:text-red-400"
                                            }`}
                                        >
                                            {monthBalance >= 0 ? "+" : ""}
                                            {formatCurrency(
                                                Math.abs(monthBalance),
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}
                            {hideBalances && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Activa la visibilidad de saldos para ver el
                                    detalle
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
