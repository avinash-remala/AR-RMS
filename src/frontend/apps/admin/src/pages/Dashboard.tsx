import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardMetrics } from "../services/dashboardApi";

function money(n: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(n || 0);
}

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        ordersToday: 0,
        revenueToday: 0,
        pendingInvoices: 0,
        employeesDue: 0,
    });

    async function load() {
        setLoading(true);
        try {
            const data = await getDashboardMetrics();
            setMetrics(data);
        } catch {
            // keep placeholders
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ margin: 0 }}>Dashboard</h2>
                    <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                        Quick overview of orders, revenue, invoices, and employee payouts.
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <button className="av-btn" onClick={load}>
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                    <Link to="/orders" className="av-btn av-btn-warning">
                        Go to Orders
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="av-grid cards">
                <div className="av-card av-metric av-metric-primary">
                    <div className="av-metric-label">Orders Today</div>
                    <div className="av-metric-value">
                        {loading ? "—" : metrics.ordersToday}
                    </div>
                    <div className="av-metric-sub">Total orders placed today</div>
                </div>

                <div className="av-card av-metric av-metric-accent">
                    <div className="av-metric-label">Revenue Today</div>
                    <div className="av-metric-value">
                        {loading ? "—" : money(metrics.revenueToday)}
                    </div>
                    <div className="av-metric-sub">Total revenue for today</div>
                </div>

                <div className="av-card av-metric av-metric-warn">
                    <div className="av-metric-label">Pending Invoices</div>
                    <div className="av-metric-value">
                        {loading ? "—" : metrics.pendingInvoices}
                    </div>
                    <div className="av-metric-sub">Vendor invoices awaiting approval</div>
                </div>

                <div className="av-card av-metric av-metric-ok">
                    <div className="av-metric-label">Employees Due</div>
                    <div className="av-metric-value">
                        {loading ? "—" : money(metrics.employeesDue)}
                    </div>
                    <div className="av-metric-sub">Amount due to employees</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="av-card">
                <div style={{ fontWeight: 900, marginBottom: 14 }}>Quick Actions</div>

                <div className="av-quick-grid">
                    <Link to="/orders" className="av-quick-card">
                        <div className="av-quick-title">Manage Orders</div>
                        <div className="av-quick-sub">View today + update status</div>
                    </Link>

                    <Link to="/menu-items" className="av-quick-card">
                        <div className="av-quick-title">Lunch Boxes</div>
                        <div className="av-quick-sub">Add / edit menu items & prices</div>
                    </Link>

                    <Link to="/vendors" className="av-quick-card">
                        <div className="av-quick-title">Vendors</div>
                        <div className="av-quick-sub">Invoices, balances, approvals</div>
                    </Link>

                    <Link to="/employees" className="av-quick-card">
                        <div className="av-quick-title">Employees</div>
                        <div className="av-quick-sub">Hours, payments, due amounts</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
