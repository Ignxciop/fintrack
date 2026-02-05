import { prisma } from "../config/prisma.js";

export class AccountService {
    static async createAccount(userId, accountData) {
        const {
            name,
            type,
            initialBalance,
            currency,
            creditLimit,
            billingDay,
            paymentDueDay,
        } = accountData;

        this.validateAccountData(type, {
            creditLimit,
            billingDay,
            paymentDueDay,
        });

        const account = await prisma.account.create({
            data: {
                name,
                type,
                initialBalance,
                currentBalance: initialBalance,
                currency: currency || "CLP",
                creditLimit: type === "CREDIT" ? creditLimit : null,
                billingDay: type === "CREDIT" ? billingDay : null,
                paymentDueDay: type === "CREDIT" ? paymentDueDay : null,
                userId,
            },
        });

        return account;
    }

    static async getUserAccounts(userId, includeInactive = false) {
        const where = { userId };
        if (!includeInactive) {
            where.isActive = true;
        }

        return await prisma.account.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
    }

    static async getAccountById(accountId, userId) {
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId },
        });

        if (!account) {
            const error = new Error("Cuenta no encontrada");
            error.statusCode = 404;
            throw error;
        }

        return account;
    }

    static async updateAccount(accountId, userId, updateData) {
        const account = await this.getAccountById(accountId, userId);

        const { name, creditLimit, billingDay, paymentDueDay } = updateData;

        if (
            creditLimit !== undefined ||
            billingDay !== undefined ||
            paymentDueDay !== undefined
        ) {
            this.validateAccountData(account.type, {
                creditLimit,
                billingDay,
                paymentDueDay,
            });
        }

        const dataToUpdate = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (creditLimit !== undefined) {
            dataToUpdate.creditLimit =
                account.type === "CREDIT" ? creditLimit : null;
        }
        if (billingDay !== undefined) {
            dataToUpdate.billingDay =
                account.type === "CREDIT" ? billingDay : null;
        }
        if (paymentDueDay !== undefined) {
            dataToUpdate.paymentDueDay =
                account.type === "CREDIT" ? paymentDueDay : null;
        }

        return await prisma.account.update({
            where: { id: accountId },
            data: dataToUpdate,
        });
    }

    static async deleteAccount(accountId, userId) {
        const account = await this.getAccountById(accountId, userId);

        return await prisma.account.update({
            where: { id: accountId },
            data: { isActive: false },
        });
    }

    static async getAccountSummary(userId) {
        const accounts = await this.getUserAccounts(userId);

        const summary = {
            total: accounts.length,
            byType: {
                CASH: 0,
                DEBIT: 0,
                CREDIT: 0,
                SAVINGS: 0,
            },
            totalBalance: 0,
            totalDebt: 0,
        };

        accounts.forEach((account) => {
            summary.byType[account.type]++;

            if (account.type === "CREDIT") {
                summary.totalDebt += Number(account.currentBalance);
            } else {
                summary.totalBalance += Number(account.currentBalance);
            }
        });

        return summary;
    }

    static validateAccountData(type, data) {
        if (type === "CREDIT") {
            if (!data.creditLimit || data.creditLimit <= 0) {
                const error = new Error(
                    "Las cuentas de crédito requieren un límite de crédito válido",
                );
                error.statusCode = 400;
                throw error;
            }

            if (
                data.billingDay &&
                (data.billingDay < 1 || data.billingDay > 31)
            ) {
                const error = new Error(
                    "El día de facturación debe estar entre 1 y 31",
                );
                error.statusCode = 400;
                throw error;
            }

            if (
                data.paymentDueDay &&
                (data.paymentDueDay < 1 || data.paymentDueDay > 31)
            ) {
                const error = new Error(
                    "El día de pago debe estar entre 1 y 31",
                );
                error.statusCode = 400;
                throw error;
            }
        } else {
            if (data.creditLimit !== undefined && data.creditLimit !== null) {
                const error = new Error(
                    `Las cuentas de tipo ${type} no pueden tener límite de crédito`,
                );
                error.statusCode = 400;
                throw error;
            }
        }
    }
}
