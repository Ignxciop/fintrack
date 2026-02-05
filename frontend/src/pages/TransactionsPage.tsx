import { useState, useEffect } from "react";
import { Plus, Filter, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import transactionService, {
    type Transaction,
} from "../services/transactionService";
import TransactionForm from "../components/TransactionForm";
import logger from "../lib/logger";

const TRANSACTION_TYPE_LABELS = {
    INCOME: "Ingreso",
    EXPENSE: "Gasto",
    ADJUSTMENT_POSITIVE: "Ajuste +",
    ADJUSTMENT_NEGATIVE: "Ajuste -",
    TRANSFER: "Transferencia",
};

const TRANSACTION_TYPE_COLORS = {
    INCOME: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    EXPENSE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    ADJUSTMENT_POSITIVE:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    ADJUSTMENT_NEGATIVE:
        "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
    TRANSFER: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] =
        useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<
        string | null
    >(null);
    const [hideBalances, setHideBalances] = useState(() => {
        const saved = localStorage.getItem("hideBalances");
        return saved === "true";
    });

    const toggleBalances = () => {
        const newValue = !hideBalances;
        setHideBalances(newValue);
        localStorage.setItem("hideBalances", String(newValue));
    };

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const data = await transactionService.getTransactions({
                limit: 50,
            });
            setTransactions(data.transactions);
        } catch (error) {
            logger.error("Error al cargar movimientos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    const handleCreateSuccess = () => {
        setIsDialogOpen(false);
        setSelectedTransaction(null);
        loadTransactions();
    };

    const handleEdit = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setTransactionToDelete(id);
    };

    const confirmDelete = async () => {
        if (!transactionToDelete) return;

        try {
            await transactionService.deleteTransaction(transactionToDelete);
            loadTransactions();
        } catch (error) {
            logger.error("Error al eliminar movimiento:", error);
        } finally {
            setTransactionToDelete(null);
        }
    };

    const formatCurrency = (amount: string, currency: string) => {
        if (hideBalances) {
            return `${currency} ••••••`;
        }
        const value = parseFloat(amount);
        return `${currency} ${value.toLocaleString("es-CL", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    const formatDate = (date: string) => {
        // Parsear la fecha como local, no UTC
        const [year, month, day] = date.split("T")[0].split("-");
        const localDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
        );
        return localDate.toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Movimientos
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Registra tus ingresos, gastos y ajustes
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleBalances}
                        title={
                            hideBalances ? "Mostrar montos" : "Ocultar montos"
                        }
                        className="flex-shrink-0"
                    >
                        {hideBalances ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Filtros
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedTransaction(null);
                            setIsDialogOpen(true);
                        }}
                        size="sm"
                        className="flex-1 sm:flex-none"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo
                    </Button>
                </div>
            </div>

            {transactions.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">
                            No tienes movimientos registrados
                        </p>
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            variant="outline"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Crear primer movimiento
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {transactions.map((transaction) => (
                        <Card
                            key={transaction.id}
                            className="hover:shadow-lg transition-shadow dark:bg-slate-900/50 dark:border-blue-900/30"
                        >
                            <CardHeader className="pb-2">
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base dark:text-gray-100 truncate flex-1">
                                            {transaction.account?.name}
                                        </CardTitle>
                                        <Badge
                                            className={
                                                TRANSACTION_TYPE_COLORS[
                                                    transaction.type
                                                ]
                                            }
                                        >
                                            {
                                                TRANSACTION_TYPE_LABELS[
                                                    transaction.type
                                                ]
                                            }
                                        </Badge>
                                    </div>
                                    <p
                                        className={`text-xl font-bold ${
                                            transaction.type === "INCOME" ||
                                            transaction.type ===
                                                "ADJUSTMENT_POSITIVE"
                                                ? "text-green-600 dark:text-green-400"
                                                : transaction.type ===
                                                        "EXPENSE" ||
                                                    transaction.type ===
                                                        "ADJUSTMENT_NEGATIVE"
                                                  ? "text-red-600 dark:text-red-400"
                                                  : "text-blue-600 dark:text-blue-400"
                                        }`}
                                    >
                                        {transaction.type === "INCOME" ||
                                        transaction.type ===
                                            "ADJUSTMENT_POSITIVE"
                                            ? "+"
                                            : transaction.type === "EXPENSE" ||
                                                transaction.type ===
                                                    "ADJUSTMENT_NEGATIVE"
                                              ? "-"
                                              : ""}
                                        {formatCurrency(
                                            transaction.amount,
                                            transaction.account?.currency ||
                                                "CLP",
                                        )}
                                    </p>
                                    {transaction.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {transaction.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        {formatDate(transaction.date)}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(transaction)}
                                        className="flex-1 text-xs"
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleDelete(transaction.id)
                                        }
                                        className="flex-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">
                            {selectedTransaction
                                ? "Editar Movimiento"
                                : "Nuevo Movimiento"}
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {selectedTransaction
                                ? "Actualiza la información del movimiento"
                                : "Registra un ingreso, gasto o ajuste en tus cuentas"}
                        </DialogDescription>
                    </DialogHeader>
                    <TransactionForm
                        transaction={selectedTransaction}
                        onSuccess={handleCreateSuccess}
                        onCancel={() => {
                            setIsDialogOpen(false);
                            setSelectedTransaction(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!transactionToDelete}
                onOpenChange={() => setTransactionToDelete(null)}
            >
                <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-gray-100">
                            ¿Estás seguro?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-400">
                            Esta acción no se puede deshacer. Se eliminará el
                            movimiento permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
