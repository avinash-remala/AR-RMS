import { useEffect, useState } from "react";
import type { MealPass, CreateMealPassRequest } from "../services/mealPassApi";
import { getAllMealPasses, createMealPass, updateMealPass, deleteMealPass } from "../services/mealPassApi";
import { getAllCustomers, type Customer } from "../services/customerApi";

export default function MealPasses() {
    const [mealPasses, setMealPasses] = useState<MealPass[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [filterActive, setFilterActive] = useState<boolean | undefined>(true);

    const [formData, setFormData] = useState<CreateMealPassRequest>({
        customerId: "",
        totalMeals: 10,
    });

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const [passesData, customersData] = await Promise.all([
                getAllMealPasses(filterActive),
                getAllCustomers()
            ]);
            setMealPasses(passesData);
            setCustomers(customersData);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [filterActive]);

    async function handleCreateMealPass(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!formData.customerId) {
            setError("Please select a customer");
            return;
        }

        try {
            await createMealPass(formData);
            setSuccessMessage("Meal pass created successfully!");
            setFormData({ customerId: "", totalMeals: 10 });
            setShowAddForm(false);
            setTimeout(() => setSuccessMessage(null), 3000);
            await loadData();
        } catch (e: any) {
            setError(e?.message ?? "Failed to create meal pass");
        }
    }

    async function handleToggleActive(passId: string, currentStatus: boolean) {
        try {
            await updateMealPass(passId, { isActive: !currentStatus });
            setSuccessMessage(`Meal pass ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
            await loadData();
        } catch (e: any) {
            setError(e?.message ?? "Failed to update meal pass");
        }
    }

    async function handleDelete(passId: string) {
        if (!confirm("Are you sure you want to delete this meal pass? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteMealPass(passId);
            setSuccessMessage("Meal pass deleted successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            await loadData();
        } catch (e: any) {
            setError(e?.message ?? "Failed to delete meal pass");
        }
    }

    function getStatusColor(pass: MealPass): string {
        if (!pass.isActive) return "rgba(107,114,128,0.1)";
        if (pass.mealsRemaining === 0) return "rgba(239,68,68,0.1)";
        if (pass.mealsRemaining <= 2) return "rgba(251,146,60,0.1)";
        return "rgba(34,197,94,0.1)";
    }

    function getStatusBadge(pass: MealPass): { text: string; color: string } {
        if (!pass.isActive) return { text: "Inactive", color: "rgb(107,114,128)" };
        if (pass.mealsRemaining === 0) return { text: "Exhausted", color: "rgb(239,68,68)" };
        if (pass.mealsRemaining <= 2) return { text: "Low", color: "rgb(251,146,60)" };
        return { text: "Active", color: "rgb(34,197,94)" };
    }

    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>🎟️ Meal Passes</h2>
                    <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                        Manage 10-meal subscription passes for customers. Track usage and remaining meals.
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="av-btn av-btn-primary"
                >
                    {showAddForm ? "Cancel" : "+ New Meal Pass"}
                </button>
            </div>

            {error && (
                <div className="av-card" style={{ borderColor: "rgba(220,38,38,0.35)", backgroundColor: "rgba(220,38,38,0.05)" }}>
                    <b style={{ display: "block", marginBottom: 6, color: "rgb(220,38,38)" }}>Error</b>
                    <div style={{ color: "rgb(153,27,27)" }}>{error}</div>
                </div>
            )}

            {successMessage && (
                <div className="av-card" style={{ borderColor: "rgba(34,197,94,0.35)", backgroundColor: "rgba(34,197,94,0.05)" }}>
                    <div style={{ color: "rgb(21,128,61)" }}>{successMessage}</div>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="av-card" style={{ backgroundColor: "rgba(59,130,246,0.03)" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>🔍 Filter</div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setFilterActive(true)}
                        className="av-btn"
                        style={{
                            backgroundColor: filterActive === true ? "rgba(59,130,246,0.1)" : "transparent",
                            borderColor: filterActive === true ? "rgba(59,130,246,0.35)" : "var(--border)"
                        }}
                    >
                        Active Only
                    </button>
                    <button
                        onClick={() => setFilterActive(false)}
                        className="av-btn"
                        style={{
                            backgroundColor: filterActive === false ? "rgba(239,68,68,0.1)" : "transparent",
                            borderColor: filterActive === false ? "rgba(239,68,68,0.35)" : "var(--border)"
                        }}
                    >
                        Inactive Only
                    </button>
                    <button
                        onClick={() => setFilterActive(undefined)}
                        className="av-btn"
                        style={{
                            backgroundColor: filterActive === undefined ? "rgba(107,114,128,0.1)" : "transparent",
                            borderColor: filterActive === undefined ? "rgba(107,114,128,0.35)" : "var(--border)"
                        }}
                    >
                        Show All
                    </button>
                </div>
            </div>

            {/* Add New Form */}
            {showAddForm && (
                <form onSubmit={handleCreateMealPass} className="av-card">
                    <h3 style={{ margin: "0 0 16px 0" }}>Create New Meal Pass</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                                Customer *
                            </label>
                            <select
                                value={formData.customerId}
                                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                required
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: "1px solid var(--border)",
                                    borderRadius: 8,
                                    fontSize: "var(--text-sm)"
                                }}
                            >
                                <option value="">Select a customer</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.firstName} {customer.lastName} - {customer.phone}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                                Total Meals
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={formData.totalMeals}
                                onChange={(e) => setFormData({ ...formData, totalMeals: parseInt(e.target.value) })}
                                required
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: "1px solid var(--border)",
                                    borderRadius: 8,
                                    fontSize: "var(--text-sm)"
                                }}
                            />
                        </div>
                        <button type="submit" className="av-btn av-btn-primary">
                            Create Meal Pass
                        </button>
                    </div>
                </form>
            )}

            {/* Meal Passes List */}
            {loading ? (
                <div className="av-card">Loading meal passes...</div>
            ) : mealPasses.length === 0 ? (
                <div className="av-card" style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
                    <h3 style={{ margin: "0 0 8px 0" }}>No Meal Passes Found</h3>
                    <p style={{ color: "var(--muted)", margin: 0 }}>
                        {filterActive !== undefined
                            ? `No ${filterActive ? 'active' : 'inactive'} meal passes. Try changing the filter.`
                            : "Create your first meal pass to get started!"}
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 16 }}>
                    {mealPasses.map((pass) => {
                        const status = getStatusBadge(pass);
                        const usagePercent = (pass.mealsUsed / pass.totalMeals) * 100;

                        return (
                            <div
                                key={pass.id}
                                className="av-card"
                                style={{ backgroundColor: getStatusColor(pass) }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                            <h3 style={{ margin: 0 }}>{pass.customerName}</h3>
                                            <span
                                                style={{
                                                    fontSize: "var(--text-xs)",
                                                    padding: "4px 8px",
                                                    borderRadius: 12,
                                                    backgroundColor: `rgba(${status.color.match(/\d+/g)?.join(',')},0.1)`,
                                                    color: status.color,
                                                    fontWeight: 600
                                                }}
                                            >
                                                {status.text}
                                            </span>
                                        </div>
                                        <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginBottom: 12 }}>
                                            📱 {pass.customerPhone}
                                        </div>

                                        {/* Usage Progress Bar */}
                                        <div style={{ marginBottom: 12 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "var(--text-sm)" }}>
                                                <span>Usage: {pass.mealsUsed} / {pass.totalMeals} meals</span>
                                                <span style={{ fontWeight: 600, color: pass.mealsRemaining > 0 ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                                                    {pass.mealsRemaining} remaining
                                                </span>
                                            </div>
                                            <div style={{ height: 8, backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 4, overflow: "hidden" }}>
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        width: `${usagePercent}%`,
                                                        backgroundColor: pass.mealsRemaining > 2 ? "rgb(34,197,94)" : pass.mealsRemaining > 0 ? "rgb(251,146,60)" : "rgb(239,68,68)",
                                                        transition: "width 0.3s ease"
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>
                                            <div>Created: {new Date(pass.createdAt).toLocaleDateString()}</div>
                                            {pass.lastUsedAt && (
                                                <div>Last used: {new Date(pass.lastUsedAt).toLocaleDateString()}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                            onClick={() => handleToggleActive(pass.id, pass.isActive)}
                                            className="av-btn"
                                            title={pass.isActive ? "Deactivate" : "Activate"}
                                        >
                                            {pass.isActive ? "⏸️" : "▶️"}
                                        </button>
                                        <button
                                            onClick={()=> handleDelete(pass.id)}
                                            className="av-btn"
                                            style={{ borderColor: "rgba(239,68,68,0.35)", color: "rgb(239,68,68)" }}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
