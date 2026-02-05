import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Info } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import recurringService, {
    type Recurring,
    type CreateRecurringData,
    type UpdateRecurringData,
    type RecurringFrequency,
    type TransactionType,
} from "../services/recurringService";
import accountService, { type Account } from "../services/accountService";
import categoryService, { type Category } from "../services/categoryService";
import logger from "../lib/logger";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    CASH: "Efectivo",
    DEBIT: "Débito",
    CREDIT: "Crédito",
    SAVINGS: "Ahorros",
};

const TYPE_LABELS: Record<string, string> = {
    INCOME: "Ingreso",
    EXPENSE: "Gasto",
};

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
    { value: "DAILY", label: "Diario" },
    { value: "WEEKLY", label: "Semanal" },
    { value: "MONTHLY", label: "Mensual" },
    { value: "YEARLY", label: "Anual" },
];

interface RecurringFormProps {
    recurring?: Recurring | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function RecurringForm({
    recurring,
    onSuccess,
    onCancel,
}: RecurringFormProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        accountId: "",
        type: "" as "" | TransactionType,
        amount: "",
        categoryId: "",
        description: "",
        frequency: "MONTHLY" as RecurringFrequency,
        interval: "1",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
    });
    const [loading, setLoading] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showFrequencyTip, setShowFrequencyTip] = useState(false);
    const [showDatesTip, setShowDatesTip] = useState(false);

    useEffect(() => {
        loadAccounts();
        loadCategories();
    }, []);

    useEffect(() => {
        if (recurring) {
            const newFormData = {
                accountId: recurring.accountId,
                type: recurring.type,
                amount: recurring.amount,
                categoryId: recurring.categoryId || "",
                description: recurring.description || "",
                frequency: recurring.frequency,
                interval: recurring.interval.toString(),
                startDate: new Date(recurring.startDate)
                    .toISOString()
                    .split("T")[0],
                endDate: recurring.endDate
                    ? new Date(recurring.endDate).toISOString().split("T")[0]
                    : "",
            };
            setFormData(newFormData);
        } else {
            setFormData({
                accountId: "",
                type: "",
                amount: "",
                categoryId: "",
                description: "",
                frequency: "MONTHLY",
                interval: "1",
                startDate: new Date().toISOString().split("T")[0],
                endDate: "",
            });
        }
    }, [recurring, accounts]);

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

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;

        try {
            const newCategory =
                await categoryService.createCategory(newCategoryName);
            setCategories([...categories, newCategory]);
            setFormData({ ...formData, categoryId: newCategory.id });
            setNewCategoryName("");
            setShowNewCategory(false);
        } catch (error) {
            logger.error("Error al crear categoría:", error);
            setErrors({ category: "Error al crear la categoría" });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.accountId) {
            newErrors.accountId = "Debes seleccionar una cuenta";
        }

        if (!formData.type) {
            newErrors.type = "Debes seleccionar un tipo de movimiento";
        }

        if (
            (formData.type === "INCOME" || formData.type === "EXPENSE") &&
            !formData.categoryId
        ) {
            newErrors.categoryId =
                "La categoría es obligatoria para ingresos y gastos";
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

        const interval = parseInt(formData.interval);
        if (!formData.interval || isNaN(interval) || interval < 1) {
            newErrors.interval = "El intervalo debe ser mayor o igual a 1";
        }

        if (formData.endDate && formData.startDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end <= start) {
                newErrors.endDate =
                    "La fecha de fin debe ser posterior a la fecha de inicio";
            }
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

            const data: CreateRecurringData | UpdateRecurringData = {
                accountId: formData.accountId,
                type: formData.type as TransactionType,
                amount: formData.amount,
                categoryId:
                    formData.categoryId && formData.categoryId !== "none"
                        ? formData.categoryId
                        : undefined,
                description: formData.description || undefined,
                frequency: formData.frequency,
                interval: parseInt(formData.interval),
                startDate: formData.startDate,
                endDate: formData.endDate || undefined,
            };

            if (recurring) {
                await recurringService.updateRecurring(recurring.id, data);
            } else {
                await recurringService.createRecurring(
                    data as CreateRecurringData,
                );
            }

            onSuccess();
        } catch (error) {
            logger.error("Error al guardar recurrente:", error);
            setErrors({
                submit: "Error al guardar el recurrente. Intenta nuevamente.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
                <Label
                    htmlFor="accountId"
                    className="dark:text-gray-200 text-sm"
                >
                    Cuenta
                </Label>
                <Select
                    value={formData.accountId || ""}
                    onValueChange={(value) =>
                        setFormData({ ...formData, accountId: value })
                    }
                >
                    <SelectTrigger className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11">
                        <SelectValue placeholder="Selecciona una cuenta">
                            {formData.accountId && accounts.length > 0
                                ? (() => {
                                      const account = accounts.find(
                                          (a) => a.id === formData.accountId,
                                      );
                                      return account
                                          ? `${account.name} (${ACCOUNT_TYPE_LABELS[account.type]})`
                                          : "Selecciona una cuenta";
                                  })()
                                : null}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-blue-900/50">
                        {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                                {account.name} (
                                {ACCOUNT_TYPE_LABELS[account.type]})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.accountId && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {errors.accountId}
                    </p>
                )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="type" className="dark:text-gray-200 text-sm">
                    Tipo de Movimiento
                </Label>
                <Select
                    value={formData.type || ""}
                    onValueChange={(value) =>
                        setFormData({
                            ...formData,
                            type: value as TransactionType,
                        })
                    }
                >
                    <SelectTrigger className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11">
                        <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-blue-900/50">
                        <SelectItem value="INCOME">
                            {TYPE_LABELS["INCOME"]}
                        </SelectItem>
                        <SelectItem value="EXPENSE">
                            {TYPE_LABELS["EXPENSE"]}
                        </SelectItem>
                    </SelectContent>
                </Select>
                {errors.type && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {errors.type}
                    </p>
                )}
            </div>

            {formData.type &&
                (formData.type === "INCOME" || formData.type === "EXPENSE") && (
                    <div className="space-y-1.5 sm:space-y-2">
                        <Label
                            htmlFor="categoryId"
                            className="dark:text-gray-200 text-sm"
                        >
                            Categoría
                        </Label>
                        <div className="flex gap-2">
                            <Select
                                value={formData.categoryId || ""}
                                onValueChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        categoryId: value,
                                    })
                                }
                            >
                                <SelectTrigger className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11 flex-1">
                                    <SelectValue placeholder="Sin categoría" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-800 dark:border-blue-900/50">
                                    <SelectItem value="none">
                                        Sin categoría
                                    </SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                    setShowNewCategory(!showNewCategory)
                                }
                                className="h-11 w-11 flex-shrink-0"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {showNewCategory && (
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={newCategoryName}
                                    onChange={(e) =>
                                        setNewCategoryName(e.target.value)
                                    }
                                    placeholder="Nombre de la categoría"
                                    className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddCategory();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    onClick={handleAddCategory}
                                    size="sm"
                                >
                                    Agregar
                                </Button>
                            </div>
                        )}
                        {(errors.categoryId || errors.category) && (
                            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                                {errors.categoryId || errors.category}
                            </p>
                        )}
                    </div>
                )}

            <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="amount" className="dark:text-gray-200 text-sm">
                    Monto
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
                <div className="flex items-center gap-2">
                    <Label className="dark:text-gray-200 text-sm">
                        Frecuencia y Cada
                    </Label>
                    <div className="relative">
                        <Info
                            className="h-4 w-4 text-gray-400 cursor-help"
                            onClick={() =>
                                setShowFrequencyTip(!showFrequencyTip)
                            }
                            onMouseEnter={() => setShowFrequencyTip(true)}
                            onMouseLeave={() => setShowFrequencyTip(false)}
                        />
                        {showFrequencyTip && (
                            <div className="absolute left-0 top-6 z-50 w-64 p-2 text-xs bg-gray-900 dark:bg-gray-700 text-white rounded shadow-lg">
                                Define cada cuánto se repite el movimiento.
                                Ejemplo: "Mensual" con "2" = cada 2 meses,
                                "Semanal" con "1" = cada semana.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                    <Label
                        htmlFor="frequency"
                        className="dark:text-gray-200 text-sm"
                    >
                        Frecuencia
                    </Label>
                    <Select
                        value={formData.frequency}
                        onValueChange={(value) =>
                            setFormData({
                                ...formData,
                                frequency: value as RecurringFrequency,
                            })
                        }
                    >
                        <SelectTrigger className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800 dark:border-blue-900/50">
                            {FREQUENCY_OPTIONS.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                    <Label
                        htmlFor="interval"
                        className="dark:text-gray-200 text-sm"
                    >
                        Cada
                    </Label>
                    <Input
                        id="interval"
                        type="number"
                        value={formData.interval}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                interval: e.target.value,
                            })
                        }
                        min="1"
                        className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11"
                    />
                    {errors.interval && (
                        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                            {errors.interval}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2">
                    <Label className="dark:text-gray-200 text-sm">Fechas</Label>
                    <div className="relative">
                        <Info
                            className="h-4 w-4 text-gray-400 cursor-help"
                            onClick={() => setShowDatesTip(!showDatesTip)}
                            onMouseEnter={() => setShowDatesTip(true)}
                            onMouseLeave={() => setShowDatesTip(false)}
                        />
                        {showDatesTip && (
                            <div className="absolute left-0 top-6 z-50 w-64 p-2 text-xs bg-gray-900 dark:bg-gray-700 text-white rounded shadow-lg">
                                Fecha de inicio: cuándo comienza a ejecutarse el
                                recurrente. Fecha de fin (opcional): cuándo se
                                desactiva automáticamente.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                    <Label
                        htmlFor="endDate"
                        className="dark:text-gray-200 text-sm"
                    >
                        Fecha de Fin (opcional)
                    </Label>
                    <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                endDate: e.target.value,
                            })
                        }
                        className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11"
                    />
                    {errors.endDate && (
                        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                            {errors.endDate}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
                <Label
                    htmlFor="description"
                    className="dark:text-gray-200 text-sm"
                >
                    Descripción (opcional)
                </Label>
                <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            description: e.target.value,
                        })
                    }
                    placeholder="Ej: Sueldo mensual, Netflix, Arriendo"
                    className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11"
                />
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
                    {loading
                        ? "Guardando..."
                        : recurring
                          ? "Actualizar"
                          : "Crear"}
                </Button>
            </div>
        </form>
    );
}
