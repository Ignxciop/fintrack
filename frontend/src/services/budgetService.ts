import api from "../lib/api";

export type BudgetPeriod = "WEEKLY" | "MONTHLY" | "YEARLY";
export type BudgetStatus = "ok" | "warning" | "exceeded";

export interface Budget {
    id: string;
    userId: string;
    name: string;
    amount: string;
    period: BudgetPeriod;
    categoryId: string | null;
    accountId: string | null;
    startDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    category?: {
        id: string;
        name: string;
    } | null;
    account?: {
        id: string;
        name: string;
        type: string;
    } | null;
    // Estos campos se agregan cuando se obtiene con estado
    spent?: number;
    percentage?: number;
    status?: BudgetStatus;
}

export interface CreateBudgetData {
    name: string;
    amount: string;
    period: BudgetPeriod;
    categoryId?: string;
    accountId?: string;
    startDate: string;
}

export interface UpdateBudgetData {
    name?: string;
    amount?: string;
    period?: BudgetPeriod;
    categoryId?: string;
    accountId?: string;
    startDate?: string;
}

export interface BudgetStatusDetail {
    budget: Budget;
    spent: number;
    percentage: number;
    status: BudgetStatus;
    period: {
        start: string;
        end: string;
    };
    transactions: Array<{
        id: string;
        amount: string;
        date: string;
        description: string;
        category?: {
            id: string;
            name: string;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        };
    }>;
}

/**
 * Obtiene todos los presupuestos del usuario con su estado
 */
async function getBudgets(): Promise<Budget[]> {
    const response = await api.get("/budgets");
    return response.data;
}

/**
 * Obtiene un presupuesto por ID
 */
async function getBudgetById(id: string): Promise<Budget> {
    const response = await api.get(`/budgets/${id}`);
    return response.data;
}

/**
 * Obtiene el estado detallado de un presupuesto con sus transacciones
 */
async function getBudgetStatus(id: string): Promise<BudgetStatusDetail> {
    const response = await api.get(`/budgets/${id}/status`);
    return response.data;
}

/**
 * Crea un nuevo presupuesto
 */
async function createBudget(data: CreateBudgetData): Promise<Budget> {
    const response = await api.post("/budgets", data);
    return response.data;
}

/**
 * Actualiza un presupuesto existente
 */
async function updateBudget(
    id: string,
    data: UpdateBudgetData,
): Promise<Budget> {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data;
}

/**
 * Activa o desactiva un presupuesto
 */
async function toggleActive(id: string): Promise<Budget> {
    const response = await api.patch(`/budgets/${id}/toggle`);
    return response.data;
}

/**
 * Elimina un presupuesto
 */
async function deleteBudget(id: string): Promise<void> {
    await api.delete(`/budgets/${id}`);
}

export default {
    getBudgets,
    getBudgetById,
    getBudgetStatus,
    createBudget,
    updateBudget,
    toggleActive,
    deleteBudget,
};
