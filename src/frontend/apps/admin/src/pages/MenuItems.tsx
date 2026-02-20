import { useEffect, useMemo, useState } from "react";
import type { MenuItem } from "../services/menuApi";
import { createMenuItem, deleteMenuItem, listMenuItems, updateMenuItem } from "../services/menuApi";

type FormState = {
    name: string;
    category: string;
    price: string; // keep string for inputs
    isAvailable: boolean;
};

const emptyForm: FormState = {
    name: "",
    category: "Veg",
    price: "",
    isAvailable: true,
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
            category: editingItem.category,
            price: String(editingItem.price),
            isAvailable: editingItem.isAvailable,
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
                category: form.category,
                price: Number(form.price),
                isAvailable: form.isAvailable,
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
                category: editForm.category,
                price: Number(editForm.price),
                isAvailable: editForm.isAvailable,
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
        setSaving(true);
        try {
            // Send all required fields with correct names for backend
            await updateMenuItem(item.id, {
                name: item.name,
                description: item.description || "",
                category: item.category,
                price: item.price,
                isAvailable: !item.isAvailable,
                imageUrl: item.imageUrl
            });
            await refresh();
        } catch (e: any) {
            setError(e?.message ?? "Failed to update active status");
        } finally {
            setSaving(false);
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
                <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>Custom Items</h2>
                <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                    Admin can add/update/delete custom items and manage price + active status.
                </div>
            </div>

            {error ? (
                <div className="av-card" style={{ borderColor: "rgba(220,38,38,0.35)" }}>
                    <b style={{ display: "block", marginBottom: 6 }}>Error</b>
                    <div style={{ color: "var(--muted)" }}>{error}</div>
                </div>
            ) : null}

            {/* Add Custom Item */}
            <div className="av-card">
                <div style={{ fontWeight: 900, marginBottom: 12 }}>Add Custom Item</div>

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
                        <label className="av-label">Category</label>
                        <select
                            className="av-select"
                            value={form.category}
                            onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                        >
                            <option value="Veg">Veg</option>
                            <option value="NonVeg">NonVeg</option>
                            <option value="Dessert">Dessert</option>
                            <option value="Appetizer">Appetizer</option>
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
                            checked={form.isAvailable}
                            onChange={(e) => setForm((s) => ({ ...s, isAvailable: e.target.checked }))}
                        />
                        <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>Available</span>
                    </div>

                    <div className="av-actions av-col-6">
                        <button className="av-btn-primary" onClick={onCreate} disabled={saving}>
                            {saving ? "Saving..." : "Add Item"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Current Custom Items */}
            <div className="av-card">
                <div style={{ fontWeight: 900, marginBottom: 12 }}>Current Custom Items</div>

                {loading ? (
                    <div style={{ color: "var(--muted)" }}>Loading...</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="av-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Available</th>
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
                                items.map((it) => {
                                    const isEditing = editingId === it.id;
                                    
                                    if (isEditing) {
                                        return (
                                            <tr key={it.id} style={{ backgroundColor: "rgba(242,193,78,0.1)" }}>
                                                <td>
                                                    <input
                                                        className="av-input"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                                                        style={{ width: "100%" }}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        className="av-select"
                                                        value={editForm.category}
                                                        onChange={(e) => setEditForm((s) => ({ ...s, category: e.target.value }))}
                                                        style={{ width: "100%" }}
                                                    >
                                                        <option value="Veg">Veg</option>
                                                        <option value="NonVeg">NonVeg</option>
                                                        <option value="Dessert">Dessert</option>
                                                        <option value="Appetizer">Appetizer</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        className="av-input"
                                                        value={editForm.price}
                                                        onChange={(e) => setEditForm((s) => ({ ...s, price: e.target.value }))}
                                                        inputMode="decimal"
                                                        style={{ width: "100%" }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.isAvailable}
                                                        onChange={(e) => setEditForm((s) => ({ ...s, isAvailable: e.target.checked }))}
                                                    />
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                        <button
                                                            className="av-btn-primary"
                                                            onClick={onSaveEdit}
                                                            disabled={saving}
                                                        >
                                                            {saving ? "Saving..." : "Save"}
                                                        </button>
                                                        <button
                                                            className="av-btn"
                                                            onClick={() => setEditingId(null)}
                                                            disabled={saving}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                    
                                    return (
                                        <tr key={it.id}>
                                            <td>
                                                <div style={{ fontWeight: 800 }}>{it.name}</div>
                                            </td>
                                            <td>{it.category}</td>
                                            <td>{money(it.price)}</td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={it.isAvailable}
                                                    onChange={() => onToggleActive(it)}
                                                    disabled={saving}
                                                    style={{ cursor: "pointer" }}
                                                />
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                    <button
                                                        className="av-btn av-btn-edit"
                                                        onClick={() => setEditingId(it.id)}
                                                    >
                                                        Edit
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
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
