import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
import accountService, { type Account } from "../services/accountService";
import AccountForm from "../components/AccountForm";
import logger from "../lib/logger";

const ACCOUNT_TYPE_LABELS = {
    CASH: "Efectivo",
    DEBIT: "Débito",
    CREDIT: "Crédito",
    SAVINGS: "Ahorro",
};

const ACCOUNT_TYPE_COLORS = {
    CASH: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    DEBIT: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    CREDIT: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
    SAVINGS:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
};

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(
        null,
    );
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const data = await accountService.getAccounts(false);
            setAccounts(data);
        } catch (error) {
            logger.error("Error al cargar cuentas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const handleCreateSuccess = () => {
        setIsDialogOpen(false);
        setSelectedAccount(null);
        loadAccounts();
    };

    const handleEdit = (account: Account) => {
        setSelectedAccount(account);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setAccountToDelete(id);
    };

    const confirmDelete = async () => {
        if (!accountToDelete) return;

        try {
            await accountService.deleteAccount(accountToDelete);
            loadAccounts();
        } catch (error) {
            logger.error("Error al eliminar cuenta:", error);
        } finally {
            setAccountToDelete(null);
        }
    };

    const formatCurrency = (amount: string, currency: string) => {
        const value = parseFloat(amount);
        return `${currency} ${value.toLocaleString("es-CL", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Cuentas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Administra tus cuentas bancarias y tarjetas
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setSelectedAccount(null);
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Cuenta
                </Button>
            </div>

            {accounts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            No tienes cuentas registradas
                        </p>
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            variant="outline"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Crear primera cuenta
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => (
                        <Card
                            key={account.id}
                            className="hover:shadow-lg transition-shadow dark:bg-slate-900/50 dark:border-blue-900/30"
                        >
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="dark:text-gray-100">
                                            {account.name}
                                        </CardTitle>
                                        <Badge
                                            className={
                                                ACCOUNT_TYPE_COLORS[
                                                    account.type
                                                ]
                                            }
                                        >
                                            {ACCOUNT_TYPE_LABELS[account.type]}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Saldo{" "}
                                        {account.type === "CREDIT"
                                            ? "adeudado"
                                            : "actual"}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(
                                            account.currentBalance,
                                            account.currency,
                                        )}
                                    </p>
                                </div>

                                {account.type === "CREDIT" &&
                                    account.creditLimit && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Límite de crédito
                                            </p>
                                            <p className="text-lg text-gray-700 dark:text-gray-300">
                                                {formatCurrency(
                                                    account.creditLimit,
                                                    account.currency,
                                                )}
                                            </p>
                                        </div>
                                    )}

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(account)}
                                        className="flex-1"
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(account.id)}
                                        className="flex-1 text-red-600 hover:text-red-700 dark:text-red-400"
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
                <DialogContent className="dark:bg-slate-900 dark:border-blue-900/30">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">
                            {selectedAccount ? "Editar Cuenta" : "Nueva Cuenta"}
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {selectedAccount
                                ? "Actualiza la información de tu cuenta"
                                : "Agrega una nueva cuenta para comenzar a trackear tus finanzas"}
                        </DialogDescription>
                    </DialogHeader>
                    <AccountForm
                        account={selectedAccount}
                        onSuccess={handleCreateSuccess}
                        onCancel={() => {
                            setIsDialogOpen(false);
                            setSelectedAccount(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!accountToDelete}
                onOpenChange={() => setAccountToDelete(null)}
            >
                <AlertDialogContent className="dark:bg-slate-900 dark:border-blue-900/30">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-gray-100">
                            ¿Estás seguro?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-400">
                            Esta acción no se puede deshacer. Se eliminará la
                            cuenta permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-slate-800 dark:border-blue-900/30 dark:text-gray-100">
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
