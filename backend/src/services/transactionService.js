import { prisma } from "../config/prisma.js";
import { Prisma } from "@prisma/client";

export class TransactionService {
    static async createTransaction(userId, transactionData) {
        const { accountId, type, amount, categoryId, description, date } =
            transactionData;

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

        const balanceChange = this.calculateBalanceChange(
            account.type,
            type,
            amount,
        );
        const newBalance = Number(account.currentBalance) + balanceChange;

        if (
            account.type !== "CREDIT" &&
            newBalance < 0 &&
            type !== "ADJUSTMENT"
        ) {
            const error = new Error(
                "Saldo insuficiente para realizar esta operación",
            );
            error.statusCode = 400;
            throw error;
        }

        const transaction = await prisma.transaction.create({
            data: {
                accountId,
                type,
                amount: new Prisma.Decimal(amount),
                categoryId,
                description,
                date: new Date(date),
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

        if (accountType === "CREDIT") {
            if (transactionType === "EXPENSE") return numAmount;
            if (transactionType === "INCOME") return -numAmount;
            return 0;
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

        return { message: "Movimiento eliminado correctamente" };
    }
}
