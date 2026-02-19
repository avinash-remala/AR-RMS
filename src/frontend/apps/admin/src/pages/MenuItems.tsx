import { useEffect, useMemo, useState } from "react";
import type { MealType, MenuItem } from "../services/menuApi";
import { createMenuItem, deleteMenuItem, listMenuItems, updateMenuItem } from "../services/menuApi";

type FormState = {
    name: string;
    mealType: MealType;
    price: string; // keep string for inputs
    active: boolean;
};

const emptyForm: FormState = {
    name: "",
    mealType: "Veg",
    price: "",
    active: true,
};

function money(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function MenuItems() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const editingItem = useMemo(() => items.find((x) => x.id === editingId) ?? null, [items, editingId]);
    const [editForm, setEditForm] = useState<FormState>(emptyForm);

    async function refresh() {
        setLoading(true);
        try {
            const data = await listMenuItems();
            setItems(data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    useEffect(() => {
        if (!editingItem) return;
        setEditForm({
            name: editingItem.name,
            mealType: editingItem.mealType,
            price: String(editingItem.price),
            active: editingItem.active,
        });
    }, [editingItem]);

    function validate(f: FormState): string | null {
        if (!f.name.trim()) return "Name is required.";
        const p = Number(f.price);
        if (!f.price.trim() || Number.isNaN(p) || p <= 0) return "Price must be a number greater than 0.";
        return null;
    }

    async function onCreate() {
        setError(null);
        const msg = validate(form);
        if (msg) return setError(msg);

        setSaving(true);
        try {
            await createMenuItem({
                name: form.name.trim(),
                mealType: form.mealType,
                price: Number(form.price),
                active: form.active,
            });
            setForm(emptyForm);
            await refresh();
        } catch (e: any) {
            setError(e?.message ?? "Failed to create item");
        } finally {
            setSaving(false);
        }
    }

    async function onSaveEdit() {
        if (!editingId) return;
        setError(null);
        const msg = validate(editForm);
        if (msg) return setError(msg);

        setSaving(true);
        try {
            await updateMenuItem(editingId, {
                name: editForm.name.trim(),
                mealType: editForm.mealType,
                price: Number(editForm.price),
                active: editForm.active,
            });
            setEditingId(null);
            await refresh();
        } catch (e: any) {
            setError(e?.message ?? "Failed to update item");
        } finally {
            setSaving(false);
        }
    }

    async function onToggleActive(item: MenuItem) {
        setError(null);
        try {
            await updateMenuItem(item.id, { active: !item.active });
            await refresh();
        } catch (e: any) {
            setError(e?.message ?? "Failed to update active status");
        }
    }

    async function onDelete(item: MenuItem) {
        const ok = window.confirm(`Delete "${item.name}"?`);
        if (!ok) return;

        setError(null);
        setSaving(true);
        try {
            await deleteMenuItem(item.id);
            if (editingId === item.id) setEditingId(null);
            await refresh();
        } catch (e: any) {
            setError(e?.message ?? "Failed to delete item");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            <div>
                <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>Lunch Boxes</h2>
                <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                    Admin can add/update/delete lunch boxes and manage price + active status.
                </div>
            </div>

            {error ? (
                <div className="av-card" style={{ borderColor: "rgba(220,38,38,0.35)" }}>
                    <b style={{ display: "block", marginBottom: 6 }}>Error</b>
                    <div style={{ color: "var(--muted)" }}>{error}</div>
                </div>
            ) : null}

            {/* Add Lunch Box */}
            <div className="av-card">
                <div style={{ fontWeight: 900, marginBottom: 12 }}>Add Lunch Box</div>

                <div className="av-formGrid">
                    <div className="av-field av-col-6">
                        <label className="av-label">Name</label>
                        <input
                            className="av-input"
                            value={form.name}
                            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                            placeholder="e.g., Veg Lunch Box"
                        />
                    </div>

                    <div className="av-field av-col-3">
                        <label className="av-label">Meal Type</label>
                        <select
                            className="av-select"
                            value={form.mealType}
                            onChange={(e) => setForm((s) => ({ ...s, mealType: e.target.value as MealType }))}
                        >
                            <option value="VEG">VEG</option>
                            <option value="NON_VEG">NON_VEG</option>
                            <option value="SPECIAL">SPECIAL</option>
                        </select>
                    </div>

                    <div className="av-field av-col-3">
                        <label className="av-label">Price</label>
                        <input
                            className="av-input"
                            value={form.price}
                            onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                            placeholder="e.g., 12.99"
                            inputMode="decimal"
                        />
                    </div>

                    <div className="av-inline av-col-6">
                        <input
                            type="checkbox"
                            checked={form.active}
                            onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
                        />
                        <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>Active</span>
                    </div>

                    <div className="av-actions av-col-6">
                        <button className="av-btn-primary" onClick={onCreate} disabled={saving}>
                            {saving ? "Saving..." : "Add Item"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Current Lunch Boxes */}
            <div className="av-card">
                <div style={{ fontWeight: 900, marginBottom: 12 }}>Current Lunch Boxes</div>

                {loading ? (
                    <div style={{ color: "var(--muted)" }}>Loading...</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="av-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Price</th>
                                <th>Active</th>
                                <th style={{ width: 260 }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ color: "var(--muted)" }}>
                                        No items yet.
                                    </td>
                                </tr>
                            ) : (
                                items.map((it) => (
                                    <tr key={it.id}>
                                        <td>
                                            <div style={{ fontWeight: 800 }}>{it.name}</div>
                                            <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>{it.id}</div>
                                        </td>
                                        <td>{it.mealType}</td>
                                        <td>{money(it.price)}</td>
                                        <td>{it.active ? "Yes" : "No"}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                <button
                                                    className="av-btn av-btn-edit"
                                                    onClick={() => setEditingId(it.id)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="av-btn av-btn-warning"
                                                    onClick={() => onToggleActive(it)}
                                                >
                                                    {it.active ? "Disable" : "Enable"}
                                                </button>

                                                <button
                                                    className="av-btn av-btn-danger"
                                                    onClick={() => onDelete(it)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>

                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Panel */}
            {editingItem ? (
                <div className="av-card" style={{ borderColor: "rgba(242,193,78,0.35)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontWeight: 900 }}>Edit Lunch Box</div>
                            <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>{editingItem.id}</div>
                        </div>

                        <button className="av-btn" onClick={() => setEditingId(null)}>
                            Close
                        </button>
                    </div>

                    <div className="av-formGrid" style={{ marginTop: 12 }}>
                        <div className="av-field av-col-6">
                            <label className="av-label">Name</label>
                            <input
                                className="av-input"
                                value={editForm.name}
                                onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                            />
                        </div>

                        <div className="av-field av-col-3">
                            <label className="av-label">Meal Type</label>
                            <select
                                className="av-select"
                                value={editForm.mealType}
                                onChange={(e) => setEditForm((s) => ({ ...s, mealType: e.target.value as MealType }))}
                            >
                                <option value="VEG">VEG</option>
                                <option value="NON_VEG">NON_VEG</option>
                                <option value="SPECIAL">SPECIAL</option>
                            </select>
                        </div>

                        <div className="av-field av-col-3">
                            <label className="av-label">Price</label>
                            <input
                                className="av-input"
                                value={editForm.price}
                                onChange={(e) => setEditForm((s) => ({ ...s, price: e.target.value }))}
                                inputMode="decimal"
                            />
                        </div>

                        <div className="av-inline av-col-6">
                            <input
                                type="checkbox"
                                checked={editForm.active}
                                onChange={(e) => setEditForm((s) => ({ ...s, active: e.target.checked }))}
                            />
                            <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>Active</span>
                        </div>

                        <div className="av-actions av-col-6">
                            <button className="av-btn-primary" onClick={onSaveEdit} disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                            <button className="av-btn" onClick={() => setEditingId(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
