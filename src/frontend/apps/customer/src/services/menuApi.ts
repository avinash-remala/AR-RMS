const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5002/api";

async function http<T>(path: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(opts?.headers ?? {}),
        },
        ...opts,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
    }

    return res.json() as Promise<T>;
}

export type MenuItem = {
    id: string;
    name: string;
    description: string;
    category: string; // "Veg" | "NonVeg" | "Dessert" | "Appetizer"
    price: number;
    isAvailable: boolean;
    imageUrl?: string;
};

export async function getAvailableMenuItems(): Promise<MenuItem[]> {
    return http<MenuItem[]>("/v1/menu-items?availableOnly=true");
}
