// apps/admin/src/services/dashboardApi.ts
export type DashboardMetrics = {
    ordersToday: number;
    revenueToday: number;
    pendingInvoices: number;
    employeesDue: number;
};

export type OrderStatistics = {
    todayCount: number;
    yesterdayCount: number;
    thisWeekCount: number;
    thisMonthCount: number;
    totalBoxesToday: number;
    percentageChangeFromYesterday: number;
};

export type RevenueStatistics = {
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
    percentageChangeFromYesterday: number;
};

export type TopSellingItem = {
    menuItemName: string;
    totalQuantity: number;
    orderCount: number;
    revenue: number;
};

export type RecentOrder = {
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    totalAmount: number;
    itemCount: number;
    orderDate: string;
    timeAgo: string;
};

export type DashboardStatistics = {
    orders: OrderStatistics;
    revenue: RevenueStatistics;
    topSellingItems: TopSellingItem[];
    recentOrders: RecentOrder[];
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

export async function getDashboardStatistics(): Promise<DashboardStatistics> {
    return http<DashboardStatistics>("/v1/dashboard/statistics");
}
