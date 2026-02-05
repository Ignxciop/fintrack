import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import budgetService, {
    type Budget,
    type CreateBudgetData,
    type UpdateBudgetData,
    type BudgetPeriod,
} from "../services/budgetService";
import accountService, { type Account } from "../services/accountService";
import categoryService, { type Category } from "../services/categoryService";
import logger from "../lib/logger";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    CASH: "Efectivo",
    DEBIT: "Débito",
    CREDIT: "Crédito",
    SAVINGS: "Ahorros",
};

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
    { value: "WEEKLY", label: "Semanal" },
    { value: "MONTHLY", label: "Mensual" },
    { value: "YEARLY", label: "Anual" },
];

interface BudgetFormProps {
    budget?: Budget | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function BudgetForm({
    budget,
    onSuccess,
    onCancel,
}: BudgetFormProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        period: "MONTHLY" as BudgetPeriod,
        categoryId: "",
        accountId: "",
        startDate: new Date().toISOString().split("T")[0],
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadAccounts();
        loadCategories();
    }, []);

    useEffect(() => {
        if (budget) {
            setFormData({
                name: budget.name,
                amount: budget.amount,
                period: budget.period,
                categoryId: budget.categoryId || "",
                accountId: budget.accountId || "",
                startDate: new Date(budget.startDate)
                    .toISOString()
                    .split("T")[0],
            });
        } else {
            setFormData({
                name: "",
                amount: "",
                period: "MONTHLY",
                categoryId: "",
                accountId: "",
                startDate: new Date().toISOString().split("T")[0],
            });
        }
    }, [budget]);

    const loadAccounts = async () => {
        try {
            const data = await accountService.getAccounts(false);
            setAccounts(data);
        } catch (error) {
            logger.error("Error al cargar cuentas:", error);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await categoryService.getCategories();
            setCategories(data);
        } catch (error) {
            logger.error("Error al cargar categorías:", error);
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "El nombre es requerido";
        }

        if (!formData.amount) {
            newErrors.amount = "El monto es requerido";
        } else {
            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) {
                newErrors.amount = "El monto debe ser mayor a 0";
            }
        }

        if (!formData.startDate) {
            newErrors.startDate = "La fecha de inicio es requerida";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            setLoading(true);

            const data: CreateBudgetData | UpdateBudgetData = {
                name: formData.name,
                amount: formData.amount,
                period: formData.period,
                categoryId:
                    formData.categoryId && formData.categoryId !== "none"
                        ? formData.categoryId
                        : undefined,
                accountId:
                    formData.accountId && formData.accountId !== "none"
                        ? formData.accountId
                        : undefined,
                startDate: formData.startDate,
            };

            if (budget) {
                await budgetService.updateBudget(budget.id, data);
            } else {
                await budgetService.createBudget(data as CreateBudgetData);
            }

            onSuccess();
        } catch (error) {
            logger.error("Error al guardar presupuesto:", error);
            setErrors({
                submit: "Error al guardar el presupuesto. Intenta nuevamente.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="dark:text-gray-200 text-sm">
                    Nombre del Presupuesto
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Gastos mensuales, Supermercado"
                    className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11"
                />
                {errors.name && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="amount" className="dark:text-gray-200 text-sm">
                    Monto Límite
                </Label>
                <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0"
                    step="1"
                    className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11"
                />
                {errors.amount && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {errors.amount}
                    </p>
                )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="period" className="dark:text-gray-200 text-sm">
                    Período
                </Label>
                <Select
                    value={formData.period}
                    onValueChange={(value) =>
                        setFormData({
                            ...formData,
                            period: value as BudgetPeriod,
                        })
                    }
                >
                    <SelectTrigger className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-blue-900/50">
                        {PERIOD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
                <Label
                    htmlFor="categoryId"
                    className="dark:text-gray-200 text-sm"
                >
                    Categoría (opcional)
                </Label>
                <Select
                    value={formData.categoryId || "none"}
                    onValueChange={(value) =>
                        setFormData({
                            ...formData,
                            categoryId: value === "none" ? "" : value,
                        })
                    }
                >
                    <SelectTrigger className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11">
                        <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-blue-900/50">
                        <SelectItem value="none">
                            Todas las categorías
                        </SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Limita el presupuesto solo a esta categoría
                </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
                <Label
                    htmlFor="accountId"
                    className="dark:text-gray-200 text-sm"
                >
                    Cuenta (opcional)
                </Label>
                <Select
                    value={formData.accountId || "none"}
                    onValueChange={(value) =>
                        setFormData({
                            ...formData,
                            accountId: value === "none" ? "" : value,
                        })
                    }
                >
                    <SelectTrigger className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11">
                        <SelectValue placeholder="Todas las cuentas" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-blue-900/50">
                        <SelectItem value="none">Todas las cuentas</SelectItem>
                        {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                                {account.name} (
                                {ACCOUNT_TYPE_LABELS[account.type]})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Limita el presupuesto solo a esta cuenta
                </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
                <Label
                    htmlFor="startDate"
                    className="dark:text-gray-200 text-sm"
                >
                    Fecha de Inicio
                </Label>
                <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            startDate: e.target.value,
                        })
                    }
                    className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11"
                />
                {errors.startDate && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {errors.startDate}
                    </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    A partir de esta fecha se comenzará a evaluar el presupuesto
                </p>
            </div>

            {errors.submit && (
                <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.submit}
                </p>
            )}

            <div className="flex gap-2 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1"
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Guardando..." : budget ? "Actualizar" : "Crear"}
                </Button>
            </div>
        </form>
    );
}
