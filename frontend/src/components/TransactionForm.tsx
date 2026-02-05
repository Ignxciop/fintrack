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
import transactionService, {
    type Transaction,
    type CreateTransactionData,
    type UpdateTransactionData,
} from "../services/transactionService";
import accountService, { type Account } from "../services/accountService";
import logger from "../lib/logger";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    CASH: "Efectivo",
    DEBIT: "Débito",
    CREDIT: "Crédito",
    SAVINGS: "Ahorros",
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
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(
        null,
    );
    const [formData, setFormData] = useState({
        accountId: "",
        type: "EXPENSE" as "INCOME" | "EXPENSE" | "ADJUSTMENT",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadAccounts();
    }, []);

    useEffect(() => {
        if (transaction) {
            setFormData({
                accountId: transaction.accountId,
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description || "",
                date: new Date(transaction.date).toISOString().split("T")[0],
            });
        } else {
            setFormData({
                accountId: "",
                type: "EXPENSE",
                amount: "",
                description: "",
                date: new Date().toISOString().split("T")[0],
            });
        }
    }, [transaction]);

    useEffect(() => {
        if (formData.accountId && accounts.length > 0) {
            const account = accounts.find((a) => a.id === formData.accountId);
            setSelectedAccount(account || null);
        } else {
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

    const getTypeLabel = (type: string) => {
        if (!selectedAccount) return type;

        if (selectedAccount.type === "CREDIT") {
            if (type === "EXPENSE") return "Compra / Gasto";
            if (type === "INCOME") return "Pago";
        }

        return type === "INCOME"
            ? "Ingreso"
            : type === "EXPENSE"
              ? "Gasto"
              : "Ajuste";
    };

    const getTypeDescription = () => {
        if (!selectedAccount || selectedAccount.type !== "CREDIT") return null;

        if (formData.type === "EXPENSE") {
            return "Registra una compra o gasto con la tarjeta (aumenta la deuda)";
        }
        if (formData.type === "INCOME") {
            return "Registra un pago a la tarjeta (reduce la deuda)";
        }
        return null;
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.accountId) {
            newErrors.accountId = "Debes seleccionar una cuenta";
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
                    type: formData.type,
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
                    type: formData.type,
                    amount: parseFloat(formData.amount),
                    description: formData.description || undefined,
                    date: formData.date,
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
                    key={`account-${transaction?.id || "new"}`}
                    value={formData.accountId}
                    defaultValue={formData.accountId}
                    onValueChange={(value) =>
                        setFormData({ ...formData, accountId: value })
                    }
                >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base h-11">
                        <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
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
                    key={`type-${transaction?.id || "new"}-${formData.accountId}`}
                    value={formData.type}
                    defaultValue={formData.type}
                    onValueChange={(value: any) =>
                        setFormData({ ...formData, type: value })
                    }
                    disabled={!formData.accountId}
                >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base h-11">
                        <SelectValue
                            placeholder={
                                !formData.accountId
                                    ? "Selecciona una cuenta primero"
                                    : undefined
                            }
                        />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="INCOME">
                            {getTypeLabel("INCOME")}
                        </SelectItem>
                        <SelectItem value="EXPENSE">
                            {getTypeLabel("EXPENSE")}
                        </SelectItem>
                        <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                    </SelectContent>
                </Select>
                {getTypeDescription() && (
                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                        {getTypeDescription()}
                    </p>
                )}
            </div>

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
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base"
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
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base"
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
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base"
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
