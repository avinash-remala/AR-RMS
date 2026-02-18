// apps/admin/src/services/dashboardApi.ts
export type DashboardMetrics = {
    ordersToday: number;
    revenueToday: number;
    pendingInvoices: number;
    employeesDue: number;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
    }

    return (await res.json()) as T;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    // Backend should implement this (you already had it in swagger):
    // GET /api/v1/admin/dashboard/metrics
    return http<DashboardMetrics>("/v1/admin/dashboard/metrics");
}
