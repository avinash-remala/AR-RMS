export type MealPass = {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    totalMeals: number;
    mealsUsed: number;
    mealsRemaining: number;
    isActive: boolean;
    lastUsedAt?: string;
    createdAt: string;
    updatedAt?: string;
};

export type CreateMealPassRequest = {
    customerId: string;
    totalMeals: number;
};

export type UpdateMealPassRequest = {
    totalMeals?: number;
    mealsUsed?: number;
    isActive?: boolean;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function http<T>(path: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(opts?.headers || {}),
        },
        ...opts,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
    }

    return res.json() as Promise<T>;
}

export async function getAllMealPasses(isActive?: boolean): Promise<MealPass[]> {
    const params = isActive !== undefined ? `?isActive=${isActive}` : "";
    return http<MealPass[]>(`/v1/meal-passes${params}`);
}

export async function getMealPassById(id: string): Promise<MealPass> {
    return http<MealPass>(`/v1/meal-passes/${id}`);
}

export async function createMealPass(data: CreateMealPassRequest): Promise<MealPass> {
    return http<MealPass>("/v1/meal-passes", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateMealPass(id: string, data: UpdateMealPassRequest): Promise<MealPass> {
    return http<MealPass>(`/v1/meal-passes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteMealPass(id: string): Promise<void> {
    await fetch(`${BASE_URL}/v1/meal-passes/${id}`, {
        method: "DELETE",
    });
}

export async function useMeal(id: string, mealsToUse: number = 1): Promise<MealPass> {
    return http<MealPass>(`/v1/meal-passes/${id}/use`, {
        method: "POST",
        body: JSON.stringify(mealsToUse),
    });
}
