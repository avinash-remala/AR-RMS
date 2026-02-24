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

export type PricingItem = {
    id: string;
    boxType: string; // "veg_comfort" | "nonveg_comfort" | "veg_special" | "nonveg_special"
    displayName: string;
    price: number;
    isActive: boolean;
    description?: string;
};

export async function getActivePricing(): Promise<PricingItem[]> {
    return http<PricingItem[]>("/v1/pricing/active");
}
