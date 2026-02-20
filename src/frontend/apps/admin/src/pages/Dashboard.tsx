import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardMetrics, getDashboardStatistics, type DashboardStatistics } from "../services/dashboardApi";

function money(n: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(n || 0);
}

/** Smooth count-up animation (works for ints + currency) */
function useCountUp(target: number, durationMs = 650) {
    const [display, setDisplay] = useState(target);
    const fromRef = useRef(target);

    useEffect(() => {
        const from = fromRef.current;
        const to = target;
        fromRef.current = target;

        const start = performance.now();
        let raf = 0;

        const step = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - t, 3);

            const val = from + (to - from) * eased;
            setDisplay(val);

            if (t < 1) raf = requestAnimationFrame(step);
        };

        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [target, durationMs]);

    return display;
}

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    const [metrics, setMetrics] = useState({
        ordersToday: 0,
        revenueToday: 0,
        pendingInvoices: 0,
        employeesDue: 0,
    });

    const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);

    // pulse keys (increment to re-trigger CSS animation)
    const [pulseKey, setPulseKey] = useState({
        orders: 0,
        revenue: 0,
        invoices: 0,
        employees: 0,
    });

    const prevRef = useRef(metrics);

    // animated display values
    const ordersAnim = useCountUp(metrics.ordersToday, 650);
    const revenueAnim = useCountUp(metrics.revenueToday, 750);
    const invoicesAnim = useCountUp(metrics.pendingInvoices, 650);
    const employeesAnim = useCountUp(metrics.employeesDue, 750);

    async function load() {
        setLoading(true);
        setStatsLoading(true);
        try {
            const data = await getDashboardMetrics();

            const prev = prevRef.current;

            // update pulse keys only when value changes
            setPulseKey((k) => ({
                orders: k.orders + (data.ordersToday !== prev.ordersToday ? 1 : 0),
                revenue: k.revenue + (data.revenueToday !== prev.revenueToday ? 1 : 0),
                invoices: k.invoices + (data.pendingInvoices !== prev.pendingInvoices ? 1 : 0),
                employees: k.employees + (data.employeesDue !== prev.employeesDue ? 1 : 0),
            }));

            setMetrics(data);
            prevRef.current = data;
        } catch {
            // keep placeholders
        } finally {
            setLoading(false);
        }

        // Load enhanced statistics
        try {
            const stats = await getDashboardStatistics();
            setStatistics(stats);
        } catch {
            // keep null if error
        } finally {
            setStatsLoading(false);
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
                    <div
                        key={pulseKey.orders}
                        className={`av-metric-value ${loading ? "" : "av-pulse"}`}
                    >
                        {loading ? "—" : Math.round(ordersAnim)}
                    </div>
                    <div className="av-metric-sub">Total orders placed today</div>
                </div>

                <div className="av-card av-metric av-metric-accent">
                    <div className="av-metric-label">Revenue Today</div>
                    <div
                        key={pulseKey.revenue}
                        className={`av-metric-value ${loading ? "" : "av-pulse"}`}
                    >
                        {loading ? "—" : money(revenueAnim)}
                    </div>
                    <div className="av-metric-sub">Total revenue for today</div>
                </div>

                <div className="av-card av-metric av-metric-warn">
                    <div className="av-metric-label">Pending Invoices</div>
                    <div
                        key={pulseKey.invoices}
                        className={`av-metric-value ${loading ? "" : "av-pulse"}`}
                    >
                        {loading ? "—" : Math.round(invoicesAnim)}
                    </div>
                    <div className="av-metric-sub">Vendor invoices awaiting approval</div>
                </div>

                <div className="av-card av-metric av-metric-ok">
                    <div className="av-metric-label">Employees Due</div>
                    <div
                        key={pulseKey.employees}
                        className={`av-metric-value ${loading ? "" : "av-pulse"}`}
                    >
                        {loading ? "—" : money(employeesAnim)}
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
                        <div className="av-quick-title">Custom Items</div>
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

            {/* Enhanced Statistics Section */}
            {!statsLoading && statistics && (
                <>
                    {/* Order & Revenue Comparisons */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                        <div className="av-card">
                            <div style={{ fontWeight: 900, marginBottom: 12 }}>📦 Order Trends</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>Today</span>
                                    <span style={{ fontWeight: 600 }}>{statistics.orders.todayCount} orders ({statistics.orders.totalBoxesToday} boxes)</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>Yesterday</span>
                                    <span>{statistics.orders.yesterdayCount} orders</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>This Week</span>
                                    <span>{statistics.orders.thisWeekCount} orders</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>This Month</span>
                                    <span>{statistics.orders.thisMonthCount} orders</span>
                                </div>
                                {statistics.orders.percentageChangeFromYesterday !== 0 && (
                                    <div style={{ 
                                        marginTop: 8, 
                                        padding: 8, 
                                        backgroundColor: statistics.orders.percentageChangeFromYesterday > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", 
                                        borderRadius: 4, 
                                        textAlign: "center",
                                        fontSize: "var(--text-sm)",
                                        fontWeight: 600,
                                        color: statistics.orders.percentageChangeFromYesterday > 0 ? "rgb(21,128,61)" : "rgb(185,28,28)"
                                    }}>
                                        {statistics.orders.percentageChangeFromYesterday > 0 ? "↑" : "↓"} {Math.abs(statistics.orders.percentageChangeFromYesterday)}% vs yesterday
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="av-card">
                            <div style={{ fontWeight: 900, marginBottom: 12 }}>💰 Revenue Trends</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>Today</span>
                                    <span style={{ fontWeight: 600 }}>{money(statistics.revenue.today)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>Yesterday</span>
                                    <span>{money(statistics.revenue.yesterday)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>This Week</span>
                                    <span>{money(statistics.revenue.thisWeek)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>This Month</span>
                                    <span>{money(statistics.revenue.thisMonth)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                                    <span style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>All Time</span>
                                    <span style={{ fontWeight: 700 }}>{money(statistics.revenue.allTime)}</span>
                                </div>
                                {statistics.revenue.percentageChangeFromYesterday !== 0 && (
                                    <div style={{ 
                                        marginTop: 8, 
                                        padding: 8, 
                                        backgroundColor: statistics.revenue.percentageChangeFromYesterday > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", 
                                        borderRadius: 4, 
                                        textAlign: "center",
                                        fontSize: "var(--text-sm)",
                                        fontWeight: 600,
                                        color: statistics.revenue.percentageChangeFromYesterday > 0 ? "rgb(21,128,61)" : "rgb(185,28,28)"
                                    }}>
                                        {statistics.revenue.percentageChangeFromYesterday > 0 ? "↑" : "↓"} {Math.abs(statistics.revenue.percentageChangeFromYesterday)}% vs yesterday
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Top Selling Items */}
                    {statistics.topSellingItems.length > 0 && (
                        <div className="av-card">
                            <div style={{ fontWeight: 900, marginBottom: 14 }}>🏆 Top Selling Items (This Month)</div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                                            <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 700 }}>Item</th>
                                            <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>Quantity</th>
                                            <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>Orders</th>
                                            <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statistics.topSellingItems.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                                                <td style={{ padding: "12px 8px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <span style={{ 
                                                            backgroundColor: idx === 0 ? "gold" : idx === 1 ? "silver" : idx === 2 ? "#cd7f32" : "var(--border)",
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: "50%",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "var(--text-xs)",
                                                            fontWeight: 700
                                                        }}>
                                                            {idx + 1}
                                                        </span>
                                                        <span style={{ fontWeight: 600 }}>{item.menuItemName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600 }}>{item.totalQuantity}</td>
                                                <td style={{ padding: "12px 8px", textAlign: "right" }}>{item.orderCount}</td>
                                                <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600 }}>{money(item.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Recent Orders */}
                    {statistics.recentOrders.length > 0 && (
                        <div className="av-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                <div style={{ fontWeight: 900 }}>📋 Recent Orders</div>
                                <Link to="/orders" className="av-btn" style={{ fontSize: "var(--text-sm)", padding: "6px 12px" }}>
                                    View All
                                </Link>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                                            <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 700 }}>Order #</th>
                                            <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 700 }}>Customer</th>
                                            <th style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700 }}>Status</th>
                                            <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>Items</th>
                                            <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>Amount</th>
                                            <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statistics.recentOrders.map((order) => (
                                            <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{order.orderNumber}</td>
                                                <td style={{ padding: "12px 8px" }}>{order.customerName}</td>
                                                <td style={{ padding: "12px 8px", textAlign: "center" }}>
                                                    <span style={{ 
                                                        padding: "4px 8px", 
                                                        borderRadius: 4, 
                                                        fontSize: "var(--text-xs)",
                                                        fontWeight: 600,
                                                        backgroundColor: order.status === "Pending" ? "rgba(234,179,8,0.1)" : 
                                                                       order.status === "Completed" ? "rgba(34,197,94,0.1)" : 
                                                                       order.status === "Cancelled" ? "rgba(239,68,68,0.1)" : "var(--border)",
                                                        color: order.status === "Pending" ? "rgb(161,98,7)" : 
                                                               order.status === "Completed" ? "rgb(21,128,61)" : 
                                                               order.status === "Cancelled" ? "rgb(185,28,28)" : "var(--text)"
                                                    }}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px 8px", textAlign: "right" }}>{order.itemCount}</td>
                                                <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600 }}>{money(order.totalAmount)}</td>
                                                <td style={{ padding: "12px 8px", textAlign: "right", color: "var(--muted)" }}>{order.timeAgo}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
