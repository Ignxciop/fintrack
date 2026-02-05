import api from "../lib/api";

export interface Transaction {
    id: string;
    accountId: string;
    type: "INCOME" | "EXPENSE" | "ADJUSTMENT";
    amount: string;
    categoryId?: string;
    description?: string;
    date: string;
    createdAt: string;
    updatedAt: string;
    account?: {
        id: string;
        name: string;
        type: string;
        currency: string;
    };
}

export interface CreateTransactionData {
    accountId: string;
    type: "INCOME" | "EXPENSE" | "ADJUSTMENT";
    amount: number;
    categoryId?: string;
    description?: string;
    date: string;
}

export interface UpdateTransactionData {
    type?: "INCOME" | "EXPENSE" | "ADJUSTMENT";
    amount?: number;
    categoryId?: string;
    description?: string;
    date?: string;
}

export interface TransactionFilters {
    accountId?: string;
    type?: "INCOME" | "EXPENSE" | "ADJUSTMENT";
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

const transactionService = {
    async getTransactions(filters: TransactionFilters = {}): Promise<{
        transactions: Transaction[];
        total: number;
        limit: number;
        offset: number;
    }> {
        const response = await api.get("/transactions", { params: filters });
        return response.data.data;
    },

    async getTransactionById(id: string): Promise<Transaction> {
        const response = await api.get(`/transactions/${id}`);
        return response.data.data;
    },

    async createTransaction(data: CreateTransactionData): Promise<Transaction> {
        const response = await api.post("/transactions", data);
        return response.data.data;
    },

    async updateTransaction(
        id: string,
        data: UpdateTransactionData,
    ): Promise<Transaction> {
        const response = await api.put(`/transactions/${id}`, data);
        return response.data.data;
    },

    async deleteTransaction(id: string): Promise<void> {
        await api.delete(`/transactions/${id}`);
    },
};

export default transactionService;
