export type Customer = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    countryCode?: string;
    address?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
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

export async function getAllCustomers(): Promise<Customer[]> {
    return http<Customer[]>("/v1/customers");
}

export async function searchCustomers(query: string): Promise<Customer[]> {
    return http<Customer[]>(`/v1/customers/search?q=${encodeURIComponent(query)}`);
}

export async function getCustomerById(id: string): Promise<Customer> {
    return http<Customer>(`/v1/customers/${id}`);
}
