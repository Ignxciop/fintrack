import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { Switch } from "../components/ui/switch";
import recurringService, { type Recurring } from "../services/recurringService";
import RecurringForm from "../components/RecurringForm";
import logger from "../lib/logger";

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    INCOME: "Ingreso",
    EXPENSE: "Gasto",
    ADJUSTMENT_POSITIVE: "Ajuste +",
    ADJUSTMENT_NEGATIVE: "Ajuste -",
};

const TRANSACTION_TYPE_COLORS: Record<string, string> = {
    INCOME: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    EXPENSE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    ADJUSTMENT_POSITIVE:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    ADJUSTMENT_NEGATIVE:
        "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
};

const FREQUENCY_LABELS: Record<string, string> = {
    DAILY: "Diario",
    WEEKLY: "Semanal",
    MONTHLY: "Mensual",
    YEARLY: "Anual",
};

export default function RecurrentsPage() {
    const [recurrings, setRecurrings] = useState<Recurring[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRecurring, setSelectedRecurring] =
        useState<Recurring | null>(null);
    const [recurringToDelete, setRecurringToDelete] = useState<string | null>(
        null,
    );

    const loadRecurrings = async () => {
        try {
            setLoading(true);
            const data = await recurringService.getRecurrings();
            setRecurrings(data);
        } catch (error) {
            logger.error("Error al cargar recurrentes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecurrings();
    }, []);

    const handleSuccess = () => {
        setIsDialogOpen(false);
        setSelectedRecurring(null);
        loadRecurrings();
    };

    const handleEdit = (recurring: Recurring) => {
        setSelectedRecurring(recurring);
        setIsDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!recurringToDelete) return;

        try {
            await recurringService.deleteRecurring(recurringToDelete);
            await loadRecurrings();
        } catch (error) {
            logger.error("Error al eliminar recurrente:", error);
        } finally {
            setRecurringToDelete(null);
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            await recurringService.toggleActive(id);
            await loadRecurrings();
        } catch (error) {
            logger.error("Error al cambiar estado del recurrente:", error);
        }
    };

    const formatCurrency = (amount: string, currency: string = "CLP") => {
        const value = parseFloat(amount);
        return `${currency} ${value.toLocaleString("es-CL", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    const formatDate = (date: string) => {
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

    const getIntervalText = (frequency: string, interval: number) => {
        if (interval === 1) {
            return FREQUENCY_LABELS[frequency];
        }
        const frequencyMap: Record<string, string> = {
            DAILY: "días",
            WEEKLY: "semanas",
            MONTHLY: "meses",
            YEARLY: "años",
        };
        return `Cada ${interval} ${frequencyMap[frequency]}`;
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
                        Recurrentes
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Automatiza ingresos, gastos y ajustes recurrentes
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setSelectedRecurring(null);
                        setIsDialogOpen(true);
                    }}
                    size="sm"
                    className="w-full sm:w-auto"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Recurrente
                </Button>
            </div>

            {recurrings.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            No tienes recurrentes registrados
                        </p>
                        <Button
                            onClick={() => {
                                setSelectedRecurring(null);
                                setIsDialogOpen(true);
                            }}
                            variant="outline"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Crear primer recurrente
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recurrings.map((recurring) => (
                        <Card
                            key={recurring.id}
                            className={`hover:shadow-lg transition-shadow dark:bg-slate-900/50 dark:border-blue-900/30 ${
                                !recurring.isActive
                                    ? "opacity-60 border-dashed"
                                    : ""
                            }`}
                        >
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="flex-1">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        {recurring.account?.name}
                                        <Badge
                                            variant="outline"
                                            className={
                                                TRANSACTION_TYPE_COLORS[
                                                    recurring.type
                                                ]
                                            }
                                        >
                                            {
                                                TRANSACTION_TYPE_LABELS[
                                                    recurring.type
                                                ]
                                            }
                                        </Badge>
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={recurring.isActive}
                                        onCheckedChange={() =>
                                            handleToggleActive(recurring.id)
                                        }
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Monto:
                                    </span>
                                    <span
                                        className={`font-semibold ${
                                            recurring.type === "INCOME" ||
                                            recurring.type ===
                                                "ADJUSTMENT_POSITIVE"
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-red-600 dark:text-red-400"
                                        }`}
                                    >
                                        {formatCurrency(recurring.amount)}
                                    </span>
                                </div>

                                {recurring.category && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Categoría:
                                        </span>
                                        <Badge variant="secondary">
                                            {recurring.category.name}
                                        </Badge>
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Frecuencia:
                                    </span>
                                    <span className="text-sm font-medium">
                                        {getIntervalText(
                                            recurring.frequency,
                                            recurring.interval,
                                        )}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Inicia:
                                    </span>
                                    <span className="text-sm">
                                        {formatDate(recurring.startDate)}
                                    </span>
                                </div>

                                {recurring.endDate && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Termina:
                                        </span>
                                        <span className="text-sm">
                                            {formatDate(recurring.endDate)}
                                        </span>
                                    </div>
                                )}

                                {recurring.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t">
                                        {recurring.description}
                                    </p>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(recurring)}
                                        className="flex-1"
                                    >
                                        <Pencil className="mr-1 h-3 w-3" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setRecurringToDelete(recurring.id)
                                        }
                                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">
                            {selectedRecurring
                                ? "Editar Recurrente"
                                : "Nuevo Recurrente"}
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {selectedRecurring
                                ? "Modifica los detalles del recurrente. Los cambios no afectan el historial."
                                : "Crea un nuevo recurrente para automatizar movimientos periódicos."}
                        </DialogDescription>
                    </DialogHeader>
                    <RecurringForm
                        recurring={selectedRecurring}
                        onSuccess={handleSuccess}
                        onCancel={() => {
                            setIsDialogOpen(false);
                            setSelectedRecurring(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!recurringToDelete}
                onOpenChange={() => setRecurringToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Eliminar recurrente?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El recurrente será
                            eliminado pero los movimientos generados previamente
                            no se verán afectados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
