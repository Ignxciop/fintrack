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
import accountService, {
    type Account,
    type CreateAccountData,
    type UpdateAccountData,
} from "../services/accountService";
import logger from "../lib/logger";

interface AccountFormProps {
    account?: Account | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AccountForm({
    account,
    onSuccess,
    onCancel,
}: AccountFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        type: "DEBIT" as "CASH" | "DEBIT" | "CREDIT" | "SAVINGS",
        initialBalance: "",
        currency: "CLP",
        creditLimit: "",
        billingDay: "",
        paymentDueDay: "",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (account) {
            setFormData({
                name: account.name,
                type: account.type,
                initialBalance: account.initialBalance,
                currency: account.currency,
                creditLimit: account.creditLimit || "",
                billingDay: account.billingDay?.toString() || "",
                paymentDueDay: account.paymentDueDay?.toString() || "",
            });
        }
    }, [account]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "El nombre es requerido";
        }

        if (!account && !formData.initialBalance) {
            newErrors.initialBalance = "El saldo inicial es requerido";
        }

        if (!account) {
            const balance = parseFloat(formData.initialBalance);
            if (isNaN(balance)) {
                newErrors.initialBalance = "Debe ser un número válido";
            }
        }

        if (formData.type === "CREDIT") {
            if (!formData.creditLimit) {
                newErrors.creditLimit =
                    "El límite de crédito es requerido para tarjetas de crédito";
            } else {
                const limit = parseFloat(formData.creditLimit);
                if (isNaN(limit) || limit <= 0) {
                    newErrors.creditLimit = "Debe ser un número mayor a 0";
                }
            }

            if (formData.billingDay) {
                const day = parseInt(formData.billingDay);
                if (isNaN(day) || day < 1 || day > 31) {
                    newErrors.billingDay = "Debe estar entre 1 y 31";
                }
            }

            if (formData.paymentDueDay) {
                const day = parseInt(formData.paymentDueDay);
                if (isNaN(day) || day < 1 || day > 31) {
                    newErrors.paymentDueDay = "Debe estar entre 1 y 31";
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            setLoading(true);

            if (account) {
                const updateData: UpdateAccountData = {
                    name: formData.name,
                };

                if (formData.type === "CREDIT") {
                    if (formData.creditLimit) {
                        updateData.creditLimit = parseFloat(
                            formData.creditLimit,
                        );
                    }
                    if (formData.billingDay) {
                        updateData.billingDay = parseInt(formData.billingDay);
                    }
                    if (formData.paymentDueDay) {
                        updateData.paymentDueDay = parseInt(
                            formData.paymentDueDay,
                        );
                    }
                }

                await accountService.updateAccount(account.id, updateData);
            } else {
                const createData: CreateAccountData = {
                    name: formData.name,
                    type: formData.type,
                    initialBalance: parseFloat(formData.initialBalance),
                    currency: formData.currency,
                };

                if (formData.type === "CREDIT") {
                    if (formData.creditLimit) {
                        createData.creditLimit = parseFloat(
                            formData.creditLimit,
                        );
                    }
                    if (formData.billingDay) {
                        createData.billingDay = parseInt(formData.billingDay);
                    }
                    if (formData.paymentDueDay) {
                        createData.paymentDueDay = parseInt(
                            formData.paymentDueDay,
                        );
                    }
                }

                await accountService.createAccount(createData);
            }

            onSuccess();
        } catch (error: any) {
            logger.error("Error al guardar cuenta:", error);
            setErrors({
                submit:
                    error.response?.data?.error || "Error al guardar la cuenta",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="dark:text-gray-200 text-sm">
                    Nombre de la cuenta
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Cuenta Corriente Banco Chile"
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base"
                />
                {errors.name && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {errors.name}
                    </p>
                )}
            </div>

            {!account && (
                <>
                    <div className="space-y-1.5 sm:space-y-2">
                        <Label
                            htmlFor="type"
                            className="dark:text-gray-200 text-sm"
                        >
                            Tipo de cuenta
                        </Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: any) =>
                                setFormData({
                                    ...formData,
                                    type: value,
                                    creditLimit: "",
                                    billingDay: "",
                                    paymentDueDay: "",
                                })
                            }
                        >
                            <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                <SelectItem value="CASH">Efectivo</SelectItem>
                                <SelectItem value="DEBIT">Débito</SelectItem>
                                <SelectItem value="CREDIT">Crédito</SelectItem>
                                <SelectItem value="SAVINGS">Ahorro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <Label
                            htmlFor="initialBalance"
                            className="dark:text-gray-200 text-sm"
                        >
                            Saldo inicial
                        </Label>
                        <Input
                            id="initialBalance"
                            type="number"
                            step="0.01"
                            value={formData.initialBalance}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    initialBalance: e.target.value,
                                })
                            }
                            placeholder="0"
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base"
                        />
                        {errors.initialBalance && (
                            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                                {errors.initialBalance}
                            </p>
                        )}
                        {formData.type === "CREDIT" && (
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                En tarjetas de crédito, el saldo representa la
                                deuda actual
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <Label
                            htmlFor="currency"
                            className="dark:text-gray-200 text-sm"
                        >
                            Moneda
                        </Label>
                        <Select
                            value={formData.currency}
                            onValueChange={(value) =>
                                setFormData({ ...formData, currency: value })
                            }
                        >
                            <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                <SelectItem value="CLP">
                                    CLP (Peso Chileno)
                                </SelectItem>
                                <SelectItem value="USD">USD (Dólar)</SelectItem>
                                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}

            {formData.type === "CREDIT" && (
                <>
                    <div className="space-y-1.5 sm:space-y-2">
                        <Label
                            htmlFor="creditLimit"
                            className="dark:text-gray-200 text-sm"
                        >
                            Límite de crédito
                        </Label>
                        <Input
                            id="creditLimit"
                            type="number"
                            step="0.01"
                            value={formData.creditLimit}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    creditLimit: e.target.value,
                                })
                            }
                            placeholder="0"
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base"
                        />
                        {errors.creditLimit && (
                            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                                {errors.creditLimit}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5 sm:space-y-2">
                            <Label
                                htmlFor="billingDay"
                                className="dark:text-gray-200 text-sm"
                            >
                                Día de facturación
                            </Label>
                            <Input
                                id="billingDay"
                                type="number"
                                min="1"
                                max="31"
                                value={formData.billingDay}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        billingDay: e.target.value,
                                    })
                                }
                                placeholder="1-31"
                                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base"
                            />
                            {errors.billingDay && (
                                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                                    {errors.billingDay}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                            <Label
                                htmlFor="paymentDueDay"
                                className="dark:text-gray-200 text-sm"
                            >
                                Día de vencimiento
                            </Label>
                            <Input
                                id="paymentDueDay"
                                type="number"
                                min="1"
                                max="31"
                                value={formData.paymentDueDay}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        paymentDueDay: e.target.value,
                                    })
                                }
                                placeholder="1-31"
                                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 text-base"
                            />
                            {errors.paymentDueDay && (
                                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                                    {errors.paymentDueDay}
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}

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
                        : account
                          ? "Actualizar"
                          : "Crear"}
                </Button>
            </div>
        </form>
    );
}
