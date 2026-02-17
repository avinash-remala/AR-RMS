import { useEffect, useMemo, useState } from "react";
import type { MealType, OrderRow, OrderStatus } from "../services/ordersApi";
import { listOrdersRange, listTodayOrders, updateOrderStatus as patchOrderStatus } from "../services/ordersApi";

const STATUS_OPTIONS: OrderStatus[] = ["PLACED", "PREPARING", "READY", "DELIVERED", "CANCELLED"];

function money(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function toISODate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function mealBadgeClass(m: MealType) {
    if (m === "VEG") return "av-badge av-badge-veg";
    if (m === "NON_VEG") return "av-badge av-badge-nonveg";
    return "av-badge av-badge-special";
}

function statusBadgeClass(s: OrderStatus) {
    if (s === "DELIVERED") return "av-badge av-badge-ok";
    if (s === "READY") return "av-badge av-badge-ready";
    if (s === "PREPARING") return "av-badge av-badge-warn";
    if (s === "CANCELLED") return "av-badge av-badge-danger";
    return "av-badge av-badge-muted"; // PLACED
}

function rowClassForStatus(s: OrderStatus) {
    // Must match your CSS: .av-row-placed, .av-row-preparing, etc.
    return `av-row-${s.toLowerCase()}`;
}

export default function Orders() {
    const [loading, setLoading] = useState(true);
    const [showPast, setShowPast] = useState(false);

    const today = useMemo(() => new Date(), []);
    const [fromDate, setFromDate] = useState<string>(toISODate(today));
    const [toDate, setToDate] = useState<string>(toISODate(today));

    const [building, setBuilding] = useState<"ALL" | "3400" | "2900">("ALL");
    const [orders, setOrders] = useState<OrderRow[]>([]);

    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function fetchOrders() {
        setLoading(true);
        setError(null);

        try {
            const data = showPast
                ? await listOrdersRange({ from: fromDate, to: toDate, building })
                : await listTodayOrders(building);

            setOrders(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load orders");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPast, building]);

    async function onApplyPast() {
        if (fromDate > toDate) {
            alert("From date cannot be after To date.");
            return;
        }
        await fetchOrders();
    }

    function onResetPast() {
        const t = new Date();
        setFromDate(toISODate(t));
        setToDate(toISODate(t));
    }

    async function onUpdateStatus(orderId: string, status: OrderStatus) {
        setUpdatingId(orderId);
        setError(null);

        // Optimistic UI
        const prev = orders;
        setOrders((p) => p.map((o) => (o.id === orderId ? { ...o, status } : o)));

        try {
            await patchOrderStatus(orderId, status);
        } catch (e: any) {
            // rollback on failure
            setOrders(prev);
            setError(e?.message ?? "Failed to update status");
        } finally {
            setUpdatingId(null);
            setOpenDropdownId(null);
        }
    }

    // Close dropdown if click outside
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            if (!target.closest(".av-dropdown")) setOpenDropdownId(null);
        }
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    const title = showPast ? "Past Orders" : "Today’s Orders";
    const totalOrders = orders.length;
    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);

    // Make table area feel “full height” when few rows (no hardcoding rows)
    const minTableHeight = "clamp(280px, 45vh, 520px)";

    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>{title}</h2>
                    <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                        {showPast ? "Select date range to view historical orders." : "Showing orders placed today."}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>Building</label>
                    <select className="av-select-header" value={building} onChange={(e) => setBuilding(e.target.value as any)}>
                        <option value="ALL">All</option>
                        <option value="3400">3400</option>
                        <option value="2900">2900</option>
                    </select>

                    {!showPast ? (
                        <button className="av-btn-outline-gold" onClick={() => setShowPast(true)}>
                            View Past Orders
                        </button>
                    ) : (
                        <button className="av-btn-outline-gold" onClick={() => setShowPast(false)}>
                            Back to Today
                        </button>
                    )}
                </div>
            </div>

            {error ? (
                <div className="av-summary-card" style={{ borderColor: "rgba(220,38,38,0.35)" }}>
                    <b style={{ display: "block", marginBottom: 6 }}>Error</b>
                    <div style={{ color: "var(--muted)" }}>{error}</div>
                </div>
            ) : null}

            {/* Past Orders Date Range */}
            {showPast ? (
                <div className="av-card">
                    <div className="av-formGrid">
                        <div className="av-field av-col-3">
                            <label className="av-label">From</label>
                            <input className="av-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                        </div>

                        <div className="av-field av-col-3">
                            <label className="av-label">To</label>
                            <input className="av-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                        </div>

                        <div className="av-actions av-col-6">
                            <button className="av-btn-primary" onClick={onApplyPast} disabled={loading}>
                                {loading ? "Loading..." : "Apply"}
                            </button>
                            <button className="av-btn" onClick={onResetPast}>
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Summary */}
            <div className="av-grid cards">
                <div className="av-summary-card">
                    <div className="av-summary-label">Orders</div>
                    <div className="av-summary-value">{totalOrders}</div>
                </div>
                <div className="av-summary-card">
                    <div className="av-summary-label">Revenue</div>
                    <div className="av-summary-value">{money(revenue)}</div>
                </div>
            </div>

            {/* Orders table */}
            <div className="av-card">
                <div style={{ overflowX: "auto", minHeight: minTableHeight }}>
                    <table className="av-table">
                        <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>User</th>
                            <th>Building</th>
                            <th>Meal Type</th>
                            <th>Status</th>
                            <th style={{ width: 320 }}>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ color: "var(--muted)" }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ color: "var(--muted)" }}>
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            orders.map((o) => (
                                <tr key={o.id} className={rowClassForStatus(o.status)}>
                                    <td>{o.id}</td>

                                    <td>
                                        <div style={{ fontWeight: 800 }}>{o.userName}</div>
                                        {o.phone ? (
                                            <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>{o.phone}</div>
                                        ) : null}
                                    </td>

                                    <td>{o.building}</td>

                                    <td>
                                        <span className={mealBadgeClass(o.mealType)}>{o.mealType}</span>
                                    </td>

                                    <td>
                                        <span className={statusBadgeClass(o.status)}>{o.status}</span>
                                    </td>

                                    <td>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                            <button className="av-btn av-btn-edit" onClick={() => alert(`Order Details: ${o.id} (next step)`)}>
                                                View
                                            </button>

                                            <div className="av-dropdown">
                                                <button
                                                    className="av-btn av-btn-warning"
                                                    disabled={updatingId === o.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId((cur) => (cur === o.id ? null : o.id));
                                                    }}
                                                >
                                                    {updatingId === o.id ? "Updating..." : "Update Status ▾"}
                                                </button>

                                                <div className={`av-dropdown-menu ${openDropdownId === o.id ? "is-open" : ""}`}>
                                                    {STATUS_OPTIONS.map((s) => (
                                                        <button
                                                            type="button"
                                                            key={s}
                                                            className="av-dropdown-item"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onUpdateStatus(o.id, s);
                                                            }}
                                                        >
                                                            {s}
                                                            {s === o.status ? " ✓" : ""}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: 10, color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                    Status updates are sent to backend: PATCH /api/v1/orders/{`{id}`}/status
                </div>
            </div>
        </div>
    );
}
