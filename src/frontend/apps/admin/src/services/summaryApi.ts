export type OrderSummary = {
    totalBoxes: number;
    boxesByType: Record<string, number>;
    boxesByAddress: Record<string, number>;
    date?: string;
    formattedSummary: string;
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

export async function getOrderSummary(date?: string, all?: boolean): Promise<OrderSummary> {
    const params = new URLSearchParams();
    if (all) {
        params.append('all', 'true');
    } else if (date) {
        params.append('date', date);
    }
    const queryString = params.toString();
    return http<OrderSummary>(`/v1/orders/summary${queryString ? `?${queryString}` : ''}`);
}
