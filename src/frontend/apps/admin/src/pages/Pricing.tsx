import { useEffect, useState } from "react";
import type { PricingItem } from "../services/pricingApi";
import { getAllPricing, bulkUpdatePricing } from "../services/pricingApi";

type PriceForm = {
    [boxType: string]: string; // Keep as string for input control
};

function money(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Pricing() {
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
            
            // Initialize form with current prices
            const initialForm: PriceForm = {};
            data.forEach(item => {
                initialForm[item.boxType] = item.price.toFixed(2);
            });
            setForm(initialForm);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load pricing");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

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
        if (msg) {
            setError(msg);
            return;
        }

        setSaving(true);
        try {
            const updates = Object.entries(form).map(([boxType, priceStr]) => ({
                boxType,
                price: Number(priceStr)
            }));

            await bulkUpdatePricing(updates);
            setSuccess("Pricing updated successfully!");
            await refresh();
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (e: any) {
            setError(e?.message ?? "Failed to update pricing");
        } finally {
            setSaving(false);
        }
    }

    function getBoxConfig(boxType: string) {
        const configs: Record<string, { color: string; icon: string }> = {
            veg_comfort: { color: "rgba(249, 115, 22, 0.1)", icon: "🥕" },
            nonveg_comfort: { color: "rgba(249, 115, 22, 0.1)", icon: "🍗" },
            veg_special: { color: "rgba(239, 68, 68, 0.1)", icon: "🎉" },
            nonveg_special: { color: "rgba(239, 68, 68, 0.1)", icon: "🎉" },
        };
        return configs[boxType] || { color: "rgba(156, 163, 175, 0.1)", icon: "📦" };
    }

    if (loading) {
        return (
            <div className="av-grid" style={{ gap: "var(--space-3)" }}>
                <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>Pricing Management</h2>
                <div className="av-card">
                    <div style={{ color: "var(--muted)" }}>Loading pricing data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            <div>
                <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>💰 Pricing Management</h2>
                <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                    Manage pricing for all lunch box types. Prices are displayed on the customer-facing order page.
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

            {/* Pricing Configuration */}
            <div className="av-card" style={{ backgroundColor: "rgba(34,197,94,0.03)" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>Configure Prices</div>

                <div className="av-formGrid">
                    {items.map(item => {
                        const config = getBoxConfig(item.boxType);
                        return (
                            <div key={item.boxType} className="av-col-6">
                                <div 
                                    className="av-card" 
                                    style={{ 
                                        backgroundColor: config.color,
                                        border: "2px solid rgba(156,163,175,0.2)"
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: "1.25rem" }}>{config.icon}</span>
                                        <span>{item.displayName}</span>
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

            {/* Current Pricing Summary */}
            <div className="av-card">
                <div style={{ fontWeight: 900, marginBottom: 12 }}>📊 Current Pricing Summary</div>
                
                <div className="av-formGrid">
                    {items.map(item => {
                        const config = getBoxConfig(item.boxType);
                        return (
                            <div key={item.boxType} className="av-col-3">
                                <div className="av-card" style={{ backgroundColor: "rgba(243,244,246,0.5)" }}>
                                    <div style={{ 
                                        fontSize: "var(--text-sm)", 
                                        fontWeight: 600, 
                                        color: "var(--muted)", 
                                        marginBottom: 6,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6
                                    }}>
                                        <span>{config.icon}</span>
                                        <span>{item.displayName.replace(" Box", "").replace(" (Friday)", "")}</span>
                                    </div>
                                    <div style={{ 
                                        fontSize: "1.875rem", 
                                        fontWeight: 800,
                                        color: item.boxType.includes("special") ? "rgb(220,38,38)" : "rgb(249,115,22)"
                                    }}>
                                        {money(item.price)}
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
