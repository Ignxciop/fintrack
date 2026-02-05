import api from "../lib/api";

export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type TransactionType =
    | "INCOME"
    | "EXPENSE"
    | "ADJUSTMENT_POSITIVE"
    | "ADJUSTMENT_NEGATIVE"
    | "TRANSFER";

export interface Recurring {
    id: string;
    userId: string;
    accountId: string;
    type: TransactionType;
    amount: string;
    categoryId: string | null;
    description: string | null;
    frequency: RecurringFrequency;
    interval: number;
    startDate: string;
    endDate: string | null;
    lastExecutedAt: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    account?: {
        id: string;
        name: string;
        type: string;
    };
    category?: {
        id: string;
        name: string;
    } | null;
}

export interface CreateRecurringData {
    accountId: string;
    type: TransactionType;
    amount: string;
    categoryId?: string;
    description?: string;
    frequency: RecurringFrequency;
    interval: number;
    startDate: string;
    endDate?: string;
}

export interface UpdateRecurringData {
    accountId?: string;
    type?: TransactionType;
    amount?: string;
    categoryId?: string | null;
    description?: string | null;
    frequency?: RecurringFrequency;
    interval?: number;
    startDate?: string;
    endDate?: string | null;
}

const recurringService = {
    async getRecurrings(): Promise<Recurring[]> {
        const response = await api.get("/recurrings");
        return response.data.data;
    },

    async getRecurringById(id: string): Promise<Recurring> {
        const response = await api.get(`/recurrings/${id}`);
        return response.data.data;
    },

    async createRecurring(data: CreateRecurringData): Promise<Recurring> {
        const response = await api.post("/recurrings", data);
        return response.data.data;
    },

    async updateRecurring(
        id: string,
        data: UpdateRecurringData,
    ): Promise<Recurring> {
        const response = await api.put(`/recurrings/${id}`, data);
        return response.data.data;
    },

    async toggleActive(id: string): Promise<Recurring> {
        const response = await api.patch(`/recurrings/${id}/toggle`);
        return response.data.data;
    },

    async deleteRecurring(id: string): Promise<void> {
        await api.delete(`/recurrings/${id}`);
    },
};

export default recurringService;
