import { useEffect, useState } from "react";
import type { PricingItem } from "../services/pricingApi";
import { getAllPricing, bulkUpdatePricing, togglePricingActive } from "../services/pricingApi";

type PriceForm = {
    [boxType: string]: string;
};

function money(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function getBoxConfig(boxType: string) {
    const configs: Record<string, { color: string; icon: string }> = {
        veg_comfort:    { color: "rgba(34, 197, 94, 0.08)",  icon: "🥕" },
        nonveg_comfort: { color: "rgba(249, 115, 22, 0.08)", icon: "🍗" },
        veg_special:    { color: "rgba(99, 102, 241, 0.08)", icon: "🎉" },
        nonveg_special: { color: "rgba(239, 68, 68, 0.08)",  icon: "🌶️" },
    };
    return configs[boxType] || { color: "rgba(156, 163, 175, 0.08)", icon: "📦" };
}

export default function LunchBoxes() {
    const [items, setItems] = useState<PricingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [form, setForm] = useState<PriceForm>({});

    async function refresh() {
        setLoading(true);
        try {
            const data = await getAllPricing();
            setItems(data);
            const initialForm: PriceForm = {};
            data.forEach(item => {
                initialForm[item.boxType] = item.price.toFixed(2);
            });
            setForm(initialForm);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load lunch boxes");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { refresh(); }, []);

    function validate(): string | null {
        for (const [boxType, priceStr] of Object.entries(form)) {
            const price = Number(priceStr);
            if (!priceStr.trim() || isNaN(price) || price < 0) {
                return `Invalid price for ${boxType}`;
            }
        }
        return null;
    }

    async function onSave() {
        setError(null);
        setSuccess(null);
        const msg = validate();
        if (msg) { setError(msg); return; }
        setSaving(true);
        try {
            const updates = Object.entries(form).map(([boxType, priceStr]) => ({
                boxType,
                price: Number(priceStr),
            }));
            await bulkUpdatePricing(updates);
            setSuccess("Prices updated successfully!");
            await refresh();
            setTimeout(() => setSuccess(null), 3000);
        } catch (e: any) {
            setError(e?.message ?? "Failed to update prices");
        } finally {
            setSaving(false);
        }
    }

    async function onToggleActive(item: PricingItem) {
        const newValue = !item.isActive;
        // Optimistic update
        setItems(prev => prev.map(it => it.boxType === item.boxType ? { ...it, isActive: newValue } : it));
        try {
            await togglePricingActive(item.boxType, newValue);
        } catch (e: any) {
            // Rollback on failure
            setItems(prev => prev.map(it => it.boxType === item.boxType ? { ...it, isActive: item.isActive } : it));
            setError(e?.message ?? "Failed to update availability");
        }
    }

    if (loading) {
        return (
            <div className="av-grid" style={{ gap: "var(--space-3)" }}>
                <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>Lunch Boxes</h2>
                <div className="av-card">
                    <div style={{ color: "var(--muted)" }}>Loading lunch boxes...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            <div>
                <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>🍱 Lunch Boxes</h2>
                <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                    Manage pricing and availability for all lunch box types.
                </div>
            </div>

            {error ? (
                <div className="av-card" style={{ borderColor: "rgba(220,38,38,0.35)", backgroundColor: "rgba(220,38,38,0.05)" }}>
                    <b style={{ display: "block", marginBottom: 6, color: "rgb(220,38,38)" }}>Error</b>
                    <div style={{ color: "rgb(153,27,27)" }}>{error}</div>
                </div>
            ) : null}

            {success ? (
                <div className="av-card" style={{ borderColor: "rgba(34,197,94,0.35)", backgroundColor: "rgba(34,197,94,0.05)" }}>
                    <b style={{ display: "block", marginBottom: 6, color: "rgb(22,163,74)" }}>Success</b>
                    <div style={{ color: "rgb(21,128,61)" }}>{success}</div>
                </div>
            ) : null}

            {/* Configure Prices + Availability */}
            <div className="av-card" style={{ backgroundColor: "rgba(34,197,94,0.03)" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>Configure Prices & Availability</div>

                <div className="av-formGrid">
                    {items.map(item => {
                        const config = getBoxConfig(item.boxType);
                        return (
                            <div key={item.boxType} className="av-col-6">
                                <div
                                    className="av-card"
                                    style={{
                                        backgroundColor: config.color,
                                        border: `2px solid ${item.isActive ? "rgba(156,163,175,0.2)" : "rgba(220,38,38,0.25)"}`,
                                        opacity: item.isActive ? 1 : 0.75,
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: "1.25rem" }}>{config.icon}</span>
                                        <span style={{ flex: 1 }}>{item.displayName}</span>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 500, fontSize: "var(--text-sm)" }}>
                                            <input
                                                type="checkbox"
                                                checked={item.isActive}
                                                onChange={() => onToggleActive(item)}
                                                style={{ cursor: "pointer" }}
                                            />
                                            <span style={{ color: item.isActive ? "rgb(22,163,74)" : "rgb(153,27,27)" }}>
                                                {item.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </label>
                                    </div>
                                    {item.description ? (
                                        <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginBottom: 12 }}>
                                            {item.description}
                                        </div>
                                    ) : null}
                                    <div>
                                        <label className="av-label">Price ($)</label>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>$</span>
                                            <input
                                                className="av-input"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={form[item.boxType] || ""}
                                                onChange={(e) => setForm(f => ({ ...f, [item.boxType]: e.target.value }))}
                                                placeholder="9.99"
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(156,163,175,0.2)" }}>
                    <button
                        className="av-btn-primary"
                        onClick={onSave}
                        disabled={saving}
                        style={{ minWidth: 180 }}
                    >
                        {saving ? "💾 Saving..." : "💾 Save All Prices"}
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="av-card">
                <div style={{ fontWeight: 900, marginBottom: 12 }}>📊 Current Pricing Summary</div>
                <div className="av-formGrid">
                    {items.map(item => {
                        const config = getBoxConfig(item.boxType);
                        return (
                            <div key={item.boxType} className="av-col-3">
                                <div className="av-card" style={{ backgroundColor: "rgba(243,244,246,0.5)", opacity: item.isActive ? 1 : 0.5 }}>
                                    <div style={{
                                        fontSize: "var(--text-sm)",
                                        fontWeight: 600,
                                        color: "var(--muted)",
                                        marginBottom: 6,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}>
                                        <span>{config.icon}</span>
                                        <span>{item.displayName.replace(" Box", "").replace(" (Friday)", "")}</span>
                                    </div>
                                    <div style={{
                                        fontSize: "1.875rem",
                                        fontWeight: 800,
                                        color: item.boxType.includes("special") ? "rgb(220,38,38)" : "rgb(249,115,22)",
                                    }}>
                                        {money(item.price)}
                                    </div>
                                    <div style={{ fontSize: "var(--text-sm)", marginTop: 4, color: item.isActive ? "rgb(22,163,74)" : "rgb(153,27,27)" }}>
                                        {item.isActive ? "● Active" : "○ Inactive"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
