import { prisma } from "../config/prisma.js";
import { Prisma } from "@prisma/client";

export class TransactionService {
    static async createTransaction(userId, transactionData) {
        const {
            accountId,
            type,
            amount,
            categoryId,
            description,
            date,
            destinationAccountId,
        } = transactionData;

        const account = await prisma.account.findFirst({
            where: { id: accountId, userId, isActive: true },
        });

        if (!account) {
            const error = new Error("Cuenta no encontrada o inactiva");
            error.statusCode = 404;
            throw error;
        }

        if (amount <= 0) {
            const error = new Error("El monto debe ser mayor a 0");
            error.statusCode = 400;
            throw error;
        }

        // Validar cuenta destino para transferencias
        if (type === "TRANSFER") {
            if (!destinationAccountId) {
                const error = new Error(
                    "Cuenta destino requerida para transferencias",
                );
                error.statusCode = 400;
                throw error;
            }

            const destinationAccount = await prisma.account.findFirst({
                where: { id: destinationAccountId, userId, isActive: true },
            });

            if (!destinationAccount) {
                const error = new Error(
                    "Cuenta destino no encontrada o inactiva",
                );
                error.statusCode = 404;
                throw error;
            }

            if (accountId === destinationAccountId) {
                const error = new Error(
                    "No puedes transferir a la misma cuenta",
                );
                error.statusCode = 400;
                throw error;
            }
        }

        const balanceChange = this.calculateBalanceChange(
            account.type,
            type,
            amount,
        );
        const newBalance = Number(account.currentBalance) + balanceChange;

        if (
            account.type !== "CREDIT" &&
            newBalance < 0 &&
            !type.startsWith("ADJUSTMENT")
        ) {
            const error = new Error(
                "Saldo insuficiente para realizar esta operación",
            );
            error.statusCode = 400;
            throw error;
        }

        // Para transferencias, crear transacción y actualizar ambas cuentas
        if (type === "TRANSFER") {
            const transaction = await prisma.$transaction(async (tx) => {
                const newTransaction = await tx.transaction.create({
                    data: {
                        accountId,
                        type,
                        amount: new Prisma.Decimal(amount),
                        categoryId,
                        description,
                        date: new Date(date),
                        destinationAccountId,
                    },
                });

                // Restar de cuenta origen
                await tx.account.update({
                    where: { id: accountId },
                    data: { currentBalance: new Prisma.Decimal(newBalance) },
                });

                // Sumar a cuenta destino
                await tx.account.update({
                    where: { id: destinationAccountId },
                    data: {
                        currentBalance: {
                            increment: new Prisma.Decimal(amount),
                        },
                    },
                });

                return newTransaction;
            });

            return transaction;
        }

        // Para otros tipos de transacciones
        const transaction = await prisma.transaction.create({
            data: {
                accountId,
                type,
                amount: new Prisma.Decimal(amount),
                categoryId,
                description,
                date: new Date(date),
                destinationAccountId,
            },
        });

        await prisma.account.update({
            where: { id: accountId },
            data: { currentBalance: new Prisma.Decimal(newBalance) },
        });

        return transaction;
    }

    static calculateBalanceChange(accountType, transactionType, amount) {
        const numAmount = Number(amount);

        // Para transferencias, siempre se resta de la cuenta origen
        if (transactionType === "TRANSFER") {
            return -numAmount;
        }

        // Para tarjetas de crédito
        if (accountType === "CREDIT") {
            // Ajuste positivo: reduce la deuda (aumenta límite disponible)
            if (transactionType === "ADJUSTMENT_POSITIVE") return -numAmount;
            // Ajuste negativo: aumenta la deuda (reduce límite disponible)
            if (transactionType === "ADJUSTMENT_NEGATIVE") return numAmount;
            // Gasto: aumenta la deuda
            if (transactionType === "EXPENSE") return numAmount;
            // Pago: reduce la deuda
            if (transactionType === "INCOME") return -numAmount;
            return 0;
        }

        // Para cuentas normales (CASH, DEBIT, SAVINGS)
        // Ajuste positivo: suma al saldo
        if (transactionType === "ADJUSTMENT_POSITIVE") {
            return numAmount;
        }
        // Ajuste negativo: resta del saldo
        if (transactionType === "ADJUSTMENT_NEGATIVE") {
            return -numAmount;
        }
        if (transactionType === "INCOME") return numAmount;
        if (transactionType === "EXPENSE") return -numAmount;
        return 0;
    }

    static async getTransactions(
        userId,
        { accountId, type, startDate, endDate, limit = 50, offset = 0 },
    ) {
        const where = {
            account: { userId },
        };

        if (accountId) where.accountId = accountId;
        if (type) where.type = type;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    account: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            currency: true,
                        },
                    },
                },
                orderBy: { date: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.transaction.count({ where }),
        ]);

        return { transactions, total, limit, offset };
    }

    static async getTransactionById(transactionId, userId) {
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: transactionId,
                account: { userId },
            },
            include: {
                account: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        currency: true,
                    },
                },
            },
        });

        if (!transaction) {
            const error = new Error("Movimiento no encontrado");
            error.statusCode = 404;
            throw error;
        }

        return transaction;
    }

    static async updateTransaction(transactionId, userId, updateData) {
        const existingTransaction = await this.getTransactionById(
            transactionId,
            userId,
        );

        // No permitir cambiar tipo de transferencia a otro tipo o viceversa
        if (updateData.type && updateData.type !== existingTransaction.type) {
            if (
                existingTransaction.type === "TRANSFER" ||
                updateData.type === "TRANSFER"
            ) {
                const error = new Error(
                    "No se puede cambiar el tipo de una transferencia",
                );
                error.statusCode = 400;
                throw error;
            }
        }

        const oldBalanceChange = this.calculateBalanceChange(
            existingTransaction.account.type,
            existingTransaction.type,
            existingTransaction.amount,
        );

        const newType = updateData.type || existingTransaction.type;
        const newAmount = updateData.amount || existingTransaction.amount;

        const newBalanceChange = this.calculateBalanceChange(
            existingTransaction.account.type,
            newType,
            newAmount,
        );

        const balanceDelta = newBalanceChange - oldBalanceChange;

        // Si es transferencia, actualizar ambas cuentas
        if (existingTransaction.type === "TRANSFER") {
            const amountDelta =
                Number(newAmount) - Number(existingTransaction.amount);

            const [updatedTransaction] = await prisma.$transaction([
                prisma.transaction.update({
                    where: { id: transactionId },
                    data: {
                        amount: newAmount
                            ? new Prisma.Decimal(newAmount)
                            : undefined,
                        description: updateData.description,
                        date: updateData.date
                            ? new Date(updateData.date)
                            : undefined,
                    },
                }),
                // Actualizar cuenta origen
                prisma.account.update({
                    where: { id: existingTransaction.accountId },
                    data: {
                        currentBalance: {
                            decrement: new Prisma.Decimal(amountDelta),
                        },
                    },
                }),
                // Actualizar cuenta destino
                prisma.account.update({
                    where: { id: existingTransaction.destinationAccountId },
                    data: {
                        currentBalance: {
                            increment: new Prisma.Decimal(amountDelta),
                        },
                    },
                }),
            ]);

            return updatedTransaction;
        }

        // Para otros tipos de transacciones
        const [updatedTransaction] = await prisma.$transaction([
            prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    type: newType,
                    amount: newAmount
                        ? new Prisma.Decimal(newAmount)
                        : undefined,
                    categoryId: updateData.categoryId,
                    description: updateData.description,
                    date: updateData.date
                        ? new Date(updateData.date)
                        : undefined,
                },
            }),
            prisma.account.update({
                where: { id: existingTransaction.accountId },
                data: {
                    currentBalance: {
                        increment: new Prisma.Decimal(balanceDelta),
                    },
                },
            }),
        ]);

        return updatedTransaction;
    }

    static async deleteTransaction(transactionId, userId) {
        const transaction = await this.getTransactionById(
            transactionId,
            userId,
        );

        const balanceChange = this.calculateBalanceChange(
            transaction.account.type,
            transaction.type,
            transaction.amount,
        );

        // Si es transferencia, revertir en ambas cuentas
        if (
            transaction.type === "TRANSFER" &&
            transaction.destinationAccountId
        ) {
            await prisma.$transaction([
                prisma.transaction.delete({
                    where: { id: transactionId },
                }),
                // Revertir en cuenta origen (sumar porque se había restado)
                prisma.account.update({
                    where: { id: transaction.accountId },
                    data: {
                        currentBalance: {
                            increment: new Prisma.Decimal(-balanceChange),
                        },
                    },
                }),
                // Revertir en cuenta destino (restar porque se había sumado)
                prisma.account.update({
                    where: { id: transaction.destinationAccountId },
                    data: {
                        currentBalance: {
                            decrement: new Prisma.Decimal(transaction.amount),
                        },
                    },
                }),
            ]);
        } else {
            // Para otros tipos de transacciones
            await prisma.$transaction([
                prisma.transaction.delete({
                    where: { id: transactionId },
                }),
                prisma.account.update({
                    where: { id: transaction.accountId },
                    data: {
                        currentBalance: {
                            increment: new Prisma.Decimal(-balanceChange),
                        },
                    },
                }),
            ]);
        }

        return { message: "Movimiento eliminado correctamente" };
    }
}
