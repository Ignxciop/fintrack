import { useState, useEffect } from "react";
import { Plus, Filter } from "lucide-react";
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
    ADJUSTMENT: "Ajuste",
};

const TRANSACTION_TYPE_COLORS = {
    INCOME: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    EXPENSE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    ADJUSTMENT:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
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
        const value = parseFloat(amount);
        return `${currency} ${value.toLocaleString("es-CL", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("es-CL", {
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
                <div className="space-y-3">
                    {transactions.map((transaction) => (
                        <Card
                            key={transaction.id}
                            className="hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-800"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CardTitle className="text-base sm:text-lg dark:text-gray-100 truncate">
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
                                        {transaction.description && (
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                                {transaction.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p
                                            className={`text-lg sm:text-xl font-bold ${
                                                transaction.type === "INCOME"
                                                    ? "text-green-600 dark:text-green-400"
                                                    : transaction.type ===
                                                        "EXPENSE"
                                                      ? "text-red-600 dark:text-red-400"
                                                      : "text-yellow-600 dark:text-yellow-400"
                                            }`}
                                        >
                                            {transaction.type === "INCOME"
                                                ? "+"
                                                : transaction.type === "EXPENSE"
                                                  ? "-"
                                                  : ""}
                                            {formatCurrency(
                                                transaction.amount,
                                                transaction.account?.currency ||
                                                    "CLP",
                                            )}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(transaction.date)}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(transaction)}
                                        className="flex-1 text-xs sm:text-sm"
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleDelete(transaction.id)
                                        }
                                        className="flex-1 text-xs sm:text-sm text-red-600 hover:text-red-700 dark:text-red-400"
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
