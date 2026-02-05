import { TransactionService } from "../services/transactionService.js";

export const getAllTransactions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { accountId, type, startDate, endDate, limit, offset } =
            req.query;

        const result = await TransactionService.getTransactions(userId, {
            accountId,
            type,
            startDate,
            endDate,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getTransactionById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const transaction = await TransactionService.getTransactionById(
            id,
            userId,
        );

        res.json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        next(error);
    }
};

export const createTransaction = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const transactionData = req.body;

        const transaction = await TransactionService.createTransaction(
            userId,
            transactionData,
        );

        res.status(201).json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        next(error);
    }
};

export const updateTransaction = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const updateData = req.body;

        const transaction = await TransactionService.updateTransaction(
            id,
            userId,
            updateData,
        );

        res.json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteTransaction = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const result = await TransactionService.deleteTransaction(id, userId);

        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};
