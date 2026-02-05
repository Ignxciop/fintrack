import { AccountService } from "../services/accountService.js";

export const getAllAccounts = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const includeInactive = req.query.includeInactive === "true";

        const accounts = await AccountService.getUserAccounts(
            userId,
            includeInactive,
        );

        res.json({
            success: true,
            data: accounts,
        });
    } catch (error) {
        next(error);
    }
};

export const getAccountSummary = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const summary = await AccountService.getAccountSummary(userId);

        res.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        next(error);
    }
};

export const getAccountById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const account = await AccountService.getAccountById(id, userId);

        res.json({
            success: true,
            data: account,
        });
    } catch (error) {
        next(error);
    }
};

export const createAccount = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const accountData = req.body;

        const account = await AccountService.createAccount(userId, accountData);

        res.status(201).json({
            success: true,
            message: "Cuenta creada exitosamente",
            data: account,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAccount = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const updateData = req.body;

        const account = await AccountService.updateAccount(
            id,
            userId,
            updateData,
        );

        res.json({
            success: true,
            message: "Cuenta actualizada exitosamente",
            data: account,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const account = await AccountService.deleteAccount(id, userId);

        res.json({
            success: true,
            message: "Cuenta desactivada exitosamente",
            data: account,
        });
    } catch (error) {
        next(error);
    }
};
