export type PricingItem = {
    id: string;
    boxType: string;
    displayName: string;
    price: number;
    isActive: boolean;
    description?: string;
    createdAt: string;
};

export type UpdatePricingRequest = {
    boxType: string;
    price: number;
};

export type BulkUpdatePricingRequest = {
    pricings: UpdatePricingRequest[];
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

export async function getAllPricing(): Promise<PricingItem[]> {
    return http<PricingItem[]>("/v1/pricing");
}

export async function getActivePricing(): Promise<PricingItem[]> {
    return http<PricingItem[]>("/v1/pricing/active");
}

export async function updatePricing(boxType: string, price: number): Promise<PricingItem> {
    return http<PricingItem>(`/v1/pricing/${boxType}`, {
        method: "PUT",
        body: JSON.stringify({ boxType, price }),
    });
}

export async function bulkUpdatePricing(pricings: UpdatePricingRequest[]): Promise<PricingItem[]> {
    return http<PricingItem[]>("/v1/pricing", {
        method: "PUT",
        body: JSON.stringify({ pricings }),
    });
}

export async function togglePricingActive(boxType: string, isActive: boolean): Promise<void> {
    await http<void>(`/v1/pricing/${boxType}/active`, {
        method: "PATCH",
        body: JSON.stringify(isActive),
    });
}
