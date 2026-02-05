import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import budgetService, { type Budget } from "../services/budgetService";
import logger from "../lib/logger";
import { Card, CardContent } from "../components/ui/card";
import {
    Dialog,
    DialogContent,
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
import { Switch } from "../components/ui/switch";
import BudgetForm from "../components/BudgetForm";

const PERIOD_LABELS: Record<string, string> = {
    WEEKLY: "Semanal",
    MONTHLY: "Mensual",
    YEARLY: "Anual",
};

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadBudgets();
    }, []);

    const loadBudgets = async () => {
        try {
            setLoading(true);
            const data = await budgetService.getBudgets();
            setBudgets(data);
        } catch (error) {
            logger.error("Error al cargar presupuestos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (budgetId: string) => {
        try {
            await budgetService.toggleActive(budgetId);
            loadBudgets();
        } catch (error) {
            logger.error("Error al cambiar estado del presupuesto:", error);
        }
    };

    const handleDelete = async () => {
        if (!budgetToDelete) return;

        try {
            await budgetService.deleteBudget(budgetToDelete);
            setBudgetToDelete(null);
            loadBudgets();
        } catch (error) {
            logger.error("Error al eliminar presupuesto:", error);
        }
    };

    const handleEdit = (budget: Budget) => {
        setSelectedBudget(budget);
        setShowDialog(true);
    };

    const handleCreate = () => {
        setSelectedBudget(null);
        setShowDialog(true);
    };

    const handleDialogClose = () => {
        setShowDialog(false);
        setSelectedBudget(null);
    };

    const handleSuccess = () => {
        handleDialogClose();
        loadBudgets();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ok":
                return "bg-green-500";
            case "warning":
                return "bg-yellow-500";
            case "exceeded":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case "ok":
                return "text-green-600 dark:text-green-400";
            case "warning":
                return "text-yellow-600 dark:text-yellow-400";
            case "exceeded":
                return "text-red-600 dark:text-red-400";
            default:
                return "text-gray-600 dark:text-gray-400";
        }
    };

    const formatAmount = (amount: string | number) => {
        const num = typeof amount === "string" ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
        }).format(num);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 dark:text-gray-400">
                    Cargando presupuestos...
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Presupuestos
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Controla tus límites de gasto
                    </p>
                </div>
                <Button
                    onClick={handleCreate}
                    size="sm"
                    className="w-full sm:w-auto"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Presupuesto
                </Button>
            </div>

            {budgets.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">
                            No hay presupuestos creados
                        </p>
                        <Button onClick={handleCreate} variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Crear primer presupuesto
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgets.map((budget) => (
                        <Card
                            key={budget.id}
                            className={`hover:shadow-lg transition-shadow dark:bg-slate-900/50 dark:border-blue-900/30 ${
                                budget.isActive
                                    ? ""
                                    : "border-dashed opacity-60"
                            }`}
                        >
                            <CardContent className="space-y-3">
                                {/* Header con nombre y switch */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {budget.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {PERIOD_LABELS[budget.period]}
                                            {budget.category &&
                                                ` • ${budget.category.name}`}
                                            {budget.account &&
                                                ` • ${budget.account.name}`}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={budget.isActive}
                                        onCheckedChange={() =>
                                            handleToggleActive(budget.id)
                                        }
                                    />
                                </div>

                                {/* Monto gastado vs total */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-baseline">
                                        <span
                                            className={`text-lg font-bold ${getStatusTextColor(budget.status || "ok")}`}
                                        >
                                            {formatAmount(budget.spent || 0)}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            de {formatAmount(budget.amount)}
                                        </span>
                                    </div>

                                    {/* Barra de progreso */}
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${getStatusColor(budget.status || "ok")}`}
                                            style={{
                                                width: `${Math.min(budget.percentage || 0, 100)}%`,
                                            }}
                                        />
                                    </div>

                                    {/* Porcentaje y estado */}
                                    <div className="flex justify-between items-center text-xs">
                                        <span
                                            className={getStatusTextColor(
                                                budget.status || "ok",
                                            )}
                                        >
                                            {(budget.percentage || 0).toFixed(
                                                1,
                                            )}
                                            %
                                        </span>
                                        <span
                                            className={getStatusTextColor(
                                                budget.status || "ok",
                                            )}
                                        >
                                            {budget.status === "ok" &&
                                                "En control"}
                                            {budget.status === "warning" &&
                                                "Advertencia"}
                                            {budget.status === "exceeded" &&
                                                "Excedido"}
                                        </span>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(budget)}
                                        className="flex-1"
                                    >
                                        <Pencil className="mr-1 h-3 w-3" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setBudgetToDelete(budget.id)
                                        }
                                        className="flex-1 text-red-600 hover:text-red-700 dark:text-red-400"
                                    >
                                        <Trash2 className="mr-1 h-3 w-3" />
                                        Eliminar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dialog para crear/editar */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">
                            {selectedBudget
                                ? "Editar Presupuesto"
                                : "Nuevo Presupuesto"}
                        </DialogTitle>
                    </DialogHeader>
                    <BudgetForm
                        budget={selectedBudget}
                        onSuccess={handleSuccess}
                        onCancel={handleDialogClose}
                    />
                </DialogContent>
            </Dialog>

            {/* Alert Dialog para eliminar */}
            <AlertDialog
                open={!!budgetToDelete}
                onOpenChange={() => setBudgetToDelete(null)}
            >
                <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">
                            ¿Eliminar presupuesto?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-400">
                            Esta acción no se puede deshacer. El presupuesto
                            será eliminado permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
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
