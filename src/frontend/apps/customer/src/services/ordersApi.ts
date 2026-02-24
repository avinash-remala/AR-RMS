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
        let message = text;
        try {
            const json = JSON.parse(text) as { message?: string };
            if (json.message) message = json.message;
        } catch {
            // keep raw text
        }
        throw new Error(message || `Request failed: ${res.status}`);
    }

    return res.json() as Promise<T>;
}

export type Customer = {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    isActive: boolean;
};

export type CreateOrderRequest = {
    customerId: string;
    buildingNumber: string;
    comments?: string;
    items: { menuItemId: string; quantity: number }[];
    extras: { extraItemId: string; quantity: number }[];
};

export type OrderResult = {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    orderDate: string;
};

export type PastOrderItem = {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    price: number;
};

export type PastOrder = {
    id: string;
    orderNumber: string;
    orderDate: string;
    items: PastOrderItem[];
};

export async function searchCustomerByPhone(phone: string): Promise<Customer[]> {
    // Backend stores phone as 10 digits (strips +1), so search with digits only
    const digits = phone.replace(/^\+1/, "");
    return http<Customer[]>(`/v1/customers/search?q=${encodeURIComponent(digits)}`);
}

export async function createCustomer(firstName: string, lastName: string, phone: string): Promise<Customer> {
    return http<Customer>("/v1/customers", {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, phone }),
    });
}

export async function getLastCustomerOrder(customerId: string): Promise<PastOrder | null> {
    try {
        return await http<PastOrder>(`/v1/orders/customer/${encodeURIComponent(customerId)}/last`);
    } catch {
        return null;
    }
}

export async function placeOrder(order: CreateOrderRequest): Promise<OrderResult> {
    return http<OrderResult>("/v1/orders", {
        method: "POST",
        body: JSON.stringify(order),
    });
}
