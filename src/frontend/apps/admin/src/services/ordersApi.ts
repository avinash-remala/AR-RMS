export type MealType = "VEG" | "NON_VEG" | "SPECIAL";
export type OrderStatus = "Pending" | "Confirmed" | "Preparing" | "Ready" | "Delivered" | "Cancelled";

export type OrderItemDto = {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    price: number;
};

export type OrderExtraDto = {
    extraItemId: string;
    extraItemName: string;
    quantity: number;
    price: number;
};

export type OrderRow = {
    id: string;
    orderNumber: string;
    daySerialNumber: number;
    customerId: string;
    customerFullName: string;
    customerPhone?: string;
    buildingNumber: string;
    comments?: string;
    mealType: MealType;
    riceType?: string;
    status: OrderStatus;
    totalAmount: number;
    orderDate: string;
    items: OrderItemDto[];
    extras: OrderExtraDto[];
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

    return res.json() as Promise<T>;
}

export async function listTodayOrders(building: "ALL" | "3400" | "2900") {
    const qs = building !== "ALL" ? `?building=${building}` : "";
    return http<OrderRow[]>(`/v1/orders/today${qs}`);
}

export async function listOrdersRange(params: {
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
    building: "ALL" | "3400" | "2900";
}) {
    const b = params.building !== "ALL" ? `&building=${params.building}` : "";
    return http<OrderRow[]>(
        `/v1/orders?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}${b}`
    );
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
    return http<OrderRow>(`/v1/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}
