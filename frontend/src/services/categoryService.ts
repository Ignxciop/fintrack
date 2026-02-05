import api from "../lib/api";

export interface Category {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

const categoryService = {
    async getCategories(): Promise<Category[]> {
        const response = await api.get("/categories");
        return response.data.data;
    },

    async createCategory(name: string): Promise<Category> {
        const response = await api.post("/categories", { name });
        return response.data.data;
    },

    async deleteCategory(id: string): Promise<void> {
        await api.delete(`/categories/${id}`);
    },
};

export default categoryService;
