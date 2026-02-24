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

export async function sendOtp(phoneNumber: string): Promise<{ message: string }> {
    return http<{ message: string }>("/v1/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
    });
}

export async function verifyOtp(phoneNumber: string, otp: string): Promise<{ message: string }> {
    return http<{ message: string }>("/v1/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phoneNumber, otp }),
    });
}
