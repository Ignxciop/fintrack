import api from "../lib/api";

export interface Account {
    id: string;
    name: string;
    type: "CASH" | "DEBIT" | "CREDIT" | "SAVINGS";
    initialBalance: string;
    currentBalance: string;
    currency: string;
    creditLimit?: string;
    billingDay?: number;
    paymentDueDay?: number;
    isActive: boolean;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface AccountSummary {
    totalBalance: string;
    totalDebt: string;
    byType: {
        CASH?: string;
        DEBIT?: string;
        CREDIT?: string;
        SAVINGS?: string;
    };
}

export interface CreateAccountData {
    name: string;
    type: "CASH" | "DEBIT" | "CREDIT" | "SAVINGS";
    initialBalance: number;
    currency?: string;
    creditLimit?: number;
    billingDay?: number;
    paymentDueDay?: number;
}

export interface UpdateAccountData {
    name?: string;
    creditLimit?: number;
    billingDay?: number;
    paymentDueDay?: number;
    isActive?: boolean;
}

const accountService = {
    async getAccounts(includeInactive = false): Promise<Account[]> {
        const response = await api.get("/accounts", {
            params: { includeInactive },
        });
        return response.data.data;
    },

    async getAccountById(id: string): Promise<Account> {
        const response = await api.get(`/accounts/${id}`);
        return response.data.data;
    },

    async getAccountSummary(): Promise<AccountSummary> {
        const response = await api.get("/accounts/summary");
        return response.data.data;
    },

    async createAccount(data: CreateAccountData): Promise<Account> {
        const response = await api.post("/accounts", data);
        return response.data.data;
    },

    async updateAccount(id: string, data: UpdateAccountData): Promise<Account> {
        const response = await api.put(`/accounts/${id}`, data);
        return response.data.data;
    },

    async deleteAccount(id: string): Promise<void> {
        await api.delete(`/accounts/${id}`);
    },
};

export default accountService;
