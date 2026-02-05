import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import transactionService, {
    type Transaction,
    type CreateTransactionData,
    type UpdateTransactionData,
} from "../services/transactionService";
import accountService, { type Account } from "../services/accountService";
import categoryService, { type Category } from "../services/categoryService";
import logger from "../lib/logger";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    CASH: "Efectivo",
    DEBIT: "Débito",
    CREDIT: "Crédito",
    SAVINGS: "Ahorros",
};

const TYPE_DESCRIPTIONS: Record<
    string,
    { label: string; tip: string; creditLabel?: string; creditTip?: string }
> = {
    INCOME: {
        label: "Ingreso",
        tip: "Registra dinero que entra a tu cuenta",
        creditLabel: "Pago",
        creditTip: "Registra un pago a la tarjeta (reduce la deuda)",
    },
    EXPENSE: {
        label: "Gasto",
        tip: "Registra dinero que sale de tu cuenta",
        creditLabel: "Compra / Gasto",
        creditTip:
            "Registra una compra o gasto con la tarjeta (aumenta la deuda)",
    },
    ADJUSTMENT_POSITIVE: {
        label: "Ajuste Positivo",
        tip: "Suma un monto al saldo (correcciones, dinero encontrado, etc.)",
        creditTip:
            "Reduce la deuda / Aumenta el límite disponible (ajustes, bonificaciones, etc.)",
    },
    ADJUSTMENT_NEGATIVE: {
        label: "Ajuste Negativo",
        tip: "Resta un monto del saldo (correcciones, dinero faltante, comisiones, etc.)",
        creditTip:
            "Aumenta la deuda / Reduce el límite disponible (comisiones, cargos, etc.)",
    },
    TRANSFER: {
        label: "Transferencia",
        tip: "Mueve dinero de una cuenta a otra de tus cuentas",
    },
};

interface TransactionFormProps {
    transaction?: Transaction | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function TransactionForm({
    transaction,
    onSuccess,
    onCancel,
}: TransactionFormProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(
        null,
    );
    const [formData, setFormData] = useState({
        accountId: "",
        type: "" as
            | ""
            | "INCOME"
            | "EXPENSE"
            | "ADJUSTMENT_POSITIVE"
            | "ADJUSTMENT_NEGATIVE"
            | "TRANSFER",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        destinationAccountId: "",
        categoryId: "",
    });
    const [loading, setLoading] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Cargar cuentas al montar
    useEffect(() => {
        loadAccounts();
        loadCategories();
    }, []);

    // Sincronizar formData con transaction cuando cambia
    useEffect(() => {
        if (transaction) {
            const newFormData = {
                accountId: transaction.accountId,
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description || "",
                date: new Date(transaction.date).toISOString().split("T")[0],
                destinationAccountId: transaction.destinationAccountId || "",
                categoryId: transaction.categoryId || "",
            };
            setFormData(newFormData);

            // Buscar y setear la cuenta seleccionada inmediatamente
            if (accounts.length > 0) {
                const account = accounts.find(
                    (a) => a.id === transaction.accountId,
                );
                setSelectedAccount(account || null);
            }
        } else {
            setFormData({
                accountId: "",
                type: "",
                amount: "",
                description: "",
                date: new Date().toISOString().split("T")[0],
                destinationAccountId: "",
                categoryId: "",
            });
            setSelectedAccount(null);
        }
    }, [transaction, accounts]);

    // Actualizar selectedAccount cuando cambia accountId
    useEffect(() => {
        if (formData.accountId && accounts.length > 0) {
            const account = accounts.find((a) => a.id === formData.accountId);
            setSelectedAccount(account || null);
        } else if (!formData.accountId) {
            setSelectedAccount(null);
        }
    }, [formData.accountId, accounts]);

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
            const newCategory = await categoryService.createCategory(
                newCategoryName.trim(),
            );
            setCategories([...categories, newCategory]);
            setFormData({ ...formData, categoryId: newCategory.id });
            setNewCategoryName("");
            setShowNewCategory(false);
        } catch (error: any) {
            logger.error("Error al crear categoría:", error);
            setErrors({
                ...errors,
                category:
                    error.response?.data?.error ||
                    "Error al crear la categoría",
            });
        }
    };

    const getTypeLabel = (type: string) => {
        if (!selectedAccount) return TYPE_DESCRIPTIONS[type]?.label || type;

        if (
            selectedAccount.type === "CREDIT" &&
            TYPE_DESCRIPTIONS[type]?.creditLabel
        ) {
            return TYPE_DESCRIPTIONS[type].creditLabel!;
        }

        return TYPE_DESCRIPTIONS[type]?.label || type;
    };

    const getTypeDescription = () => {
        if (!formData.type) return null;

        const typeInfo = TYPE_DESCRIPTIONS[formData.type];
        if (!typeInfo) return null;

        if (selectedAccount?.type === "CREDIT" && typeInfo.creditTip) {
            return typeInfo.creditTip;
        }

        return typeInfo.tip;
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

        if (formData.type === "TRANSFER" && !formData.destinationAccountId) {
            newErrors.destinationAccountId =
                "Debes seleccionar una cuenta destino";
        }

        if (
            formData.type === "TRANSFER" &&
            formData.accountId === formData.destinationAccountId
        ) {
            newErrors.destinationAccountId =
                "No puedes transferir a la misma cuenta";
        }

        if (!formData.amount) {
            newErrors.amount = "El monto es requerido";
        } else {
            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) {
                newErrors.amount = "El monto debe ser mayor a 0";
            }
        }

        if (!formData.date) {
            newErrors.date = "La fecha es requerida";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            setLoading(true);

            if (transaction) {
                const updateData: UpdateTransactionData = {
                    ...(formData.type && { type: formData.type }),
                    amount: parseFloat(formData.amount),
                    description: formData.description || undefined,
                    date: formData.date,
                };

                await transactionService.updateTransaction(
                    transaction.id,
                    updateData,
                );
            } else {
                const createData: CreateTransactionData = {
                    accountId: formData.accountId,
                    type: formData.type as Exclude<typeof formData.type, "">,
                    amount: parseFloat(formData.amount),
                    description: formData.description || undefined,
                    date: formData.date,
                    destinationAccountId:
                        formData.type === "TRANSFER"
                            ? formData.destinationAccountId
                            : undefined,
                    categoryId:
                        formData.categoryId && formData.categoryId !== "none"
                            ? formData.categoryId
                            : undefined,
                };

                await transactionService.createTransaction(createData);
            }

            onSuccess();
        } catch (error: any) {
            logger.error("Error al guardar movimiento:", error);
            setErrors({
                submit:
                    error.response?.data?.error ||
                    "Error al guardar el movimiento",
            });
        } finally {
            setLoading(false);
        }
    };

    const availableDestinationAccounts = accounts.filter(
        (account) =>
            account.id !== formData.accountId && account.type !== "CREDIT",
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
                <Label
                    htmlFor="accountId"
                    className="dark:text-gray-200 text-sm"
                >
                    Cuenta {formData.type === "TRANSFER" ? "Origen" : ""}
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
                    Tipo de movimiento
                </Label>
                <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                        setFormData({
                            ...formData,
                            type: value,
                            destinationAccountId: "",
                        })
                    }
                    disabled={!formData.accountId}
                >
                    <SelectTrigger className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11">
                        <SelectValue
                            placeholder={
                                !formData.accountId
                                    ? "Selecciona una cuenta primero"
                                    : undefined
                            }
                        >
                            {formData.accountId && formData.type
                                ? getTypeLabel(formData.type)
                                : null}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-blue-900/50">
                        <SelectItem value="INCOME">
                            {getTypeLabel("INCOME")}
                        </SelectItem>
                        <SelectItem value="EXPENSE">
                            {getTypeLabel("EXPENSE")}
                        </SelectItem>
                        <SelectItem value="ADJUSTMENT_POSITIVE">
                            {getTypeLabel("ADJUSTMENT_POSITIVE")}
                        </SelectItem>
                        <SelectItem value="ADJUSTMENT_NEGATIVE">
                            {getTypeLabel("ADJUSTMENT_NEGATIVE")}
                        </SelectItem>
                        {selectedAccount?.type !== "CREDIT" && (
                            <SelectItem value="TRANSFER">
                                {getTypeLabel("TRANSFER")}
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
                {getTypeDescription() && (
                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                        {getTypeDescription()}
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
            {formData.type === "TRANSFER" && (
                <div className="space-y-1.5 sm:space-y-2">
                    <Label
                        htmlFor="destinationAccountId"
                        className="dark:text-gray-200 text-sm"
                    >
                        Cuenta Destino
                    </Label>
                    <Select
                        value={formData.destinationAccountId || ""}
                        onValueChange={(value) =>
                            setFormData({
                                ...formData,
                                destinationAccountId: value,
                            })
                        }
                    >
                        <SelectTrigger className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base h-11">
                            <SelectValue placeholder="Selecciona cuenta destino">
                                {formData.destinationAccountId &&
                                accounts.length > 0
                                    ? (() => {
                                          const account = accounts.find(
                                              (a) =>
                                                  a.id ===
                                                  formData.destinationAccountId,
                                          );
                                          return account
                                              ? `${account.name} (${ACCOUNT_TYPE_LABELS[account.type]})`
                                              : "Selecciona cuenta destino";
                                      })()
                                    : null}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800 dark:border-blue-900/50">
                            {availableDestinationAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.name} (
                                    {ACCOUNT_TYPE_LABELS[account.type]})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.destinationAccountId && (
                        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                            {errors.destinationAccountId}
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
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0"
                    className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base"
                />
                {errors.amount && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {errors.amount}
                    </p>
                )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="date" className="dark:text-gray-200 text-sm">
                    Fecha
                </Label>
                <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                    }
                    className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base"
                />
                {errors.date && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {errors.date}
                    </p>
                )}
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
                    placeholder="Ej: Supermercado, Gasolina, etc."
                    className="dark:bg-slate-800 dark:border-blue-900/50 dark:text-gray-100 text-base"
                />
            </div>

            {errors.submit && (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                    {errors.submit}
                </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-2 sm:pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 h-11 text-base"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-11 text-base"
                >
                    {loading
                        ? "Guardando..."
                        : transaction
                          ? "Actualizar"
                          : "Crear"}
                </Button>
            </div>
        </form>
    );
}
