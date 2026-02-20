const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function generateOrderStickers(date: string): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/v1/pdf/generate-stickers?date=${date}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to generate PDF: ${res.status}`);
    }

    return res.blob();
}

export function downloadPdf(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
