export type MealType = "Veg" | "NonVeg" | "Dessert" | "Appetizer";

export type MenuItem = {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    isAvailable: boolean;
    imageUrl?: string;
    createdAt: string;
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

    // Handle 204 No Content
    if (res.status === 204) {
        return {} as T;
    }

    return res.json() as Promise<T>;
}

export async function listMenuItems(): Promise<MenuItem[]> {
    return http<MenuItem[]>("/v1/menu-items");
}

export async function createMenuItem(input: {
    name: string;
    description?: string;
    category: string;
    price: number;
    isAvailable: boolean;
    imageUrl?: string;
}): Promise<MenuItem> {
    return http<MenuItem>("/v1/menu-items", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function updateMenuItem(id: string, input: {
    name: string;
    description?: string;
    category: string;
    price: number;
    isAvailable: boolean;
    imageUrl?: string;
}): Promise<void> {
    await http<void>(`/v1/menu-items/${id}`, {
        method: "PUT",
        body: JSON.stringify({ 
            id, 
            name: input.name,
            description: input.description || "",
            category: input.category,
            price: input.price,
            isAvailable: input.isAvailable,
            imageUrl: input.imageUrl
        }),
    });
}

export async function toggleAvailability(id: string, isAvailable: boolean): Promise<void> {
    await http<void>(`/v1/menu-items/${id}/availability`, {
        method: "PATCH",
        body: JSON.stringify(isAvailable),
    });
}

export async function deleteMenuItem(id: string): Promise<void> {
    await http<void>(`/v1/menu-items/${id}`, {
        method: "DELETE",
    });
}
