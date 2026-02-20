import { useState } from "react";
import { generateOrderStickers, downloadPdf } from "../services/pdfApi";
import { getOrdersByDateRange, type Order } from "../services/ordersApi";

function getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function PdfGenerator() {
    const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [previewed, setPreviewed] = useState(false);

    async function handlePreviewOrders() {
        setLoading(true);
        setError(null);
        setPreviewed(false);
        try {
            const ordersData = await getOrdersByDateRange(selectedDate, selectedDate);
            setOrders(ordersData);
            setPreviewed(true);
            if (ordersData.length === 0) {
                setError(`No orders found for ${selectedDate}`);
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to load orders");
        } finally {
            setLoading(false);
        }
    }

    async function handleGeneratePdf() {
        setGenerating(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const blob = await generateOrderStickers(selectedDate);
            const filename = `order-stickers-${selectedDate}.pdf`;
            downloadPdf(blob, filename);
            setSuccessMessage(`✅ PDF generated and downloaded: ${filename}`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (e: any) {
            setError(e?.message ?? "Failed to generate PDF");
        } finally {
            setGenerating(false);
        }
    }

    function handleReset() {
        setSelectedDate(getTodayDate());
        setOrders([]);
        setPreviewed(false);
        setError(null);
        setSuccessMessage(null);
    }

    const totalBoxes = orders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum: number, item) => itemSum + item.quantity, 0);
    }, 0);

    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            <div>
                <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>📄 PDF Sticker Generator</h2>
                <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                    Generate printable order stickers for meal box deliveries. Each sticker includes customer name, building, item details, and order information.
                </div>
            </div>

            {error && (
                <div className="av-card" style={{ borderColor: "rgba(220,38,38,0.35)", backgroundColor: "rgba(220,38,38,0.05)" }}>
                    <b style={{ display: "block", marginBottom: 6, color: "rgb(220,38,38)" }}>Error</b>
                    <div style={{ color: "rgb(153,27,27)" }}>{error}</div>
                </div>
            )}

            {successMessage && (
                <div className="av-card" style={{ borderColor: "rgba(34,197,94,0.35)", backgroundColor: "rgba(34,197,94,0.05)" }}>
                    <div style={{ color: "rgb(21,128,61)", fontWeight: 600 }}>{successMessage}</div>
                </div>
            )}

            {/* Date Selection */}
            <div className="av-card" style={{ backgroundColor: "rgba(147,51,234,0.03)" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>📅 Select Date</div>
                <div style={{ display: "flex", gap: 12, alignItems: "end" }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: 6, fontSize: "var(--text-sm)", fontWeight: 600 }}>
                            Order Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                fontSize: "var(--text-sm)"
                            }}
                        />
                    </div>
                    <button
                        onClick={handlePreviewOrders}
                        disabled={loading}
                        className="av-btn av-btn-primary"
                    >
                        {loading ? "Loading..." : "Preview Orders"}
                    </button>
                    {previewed && (
                        <button
                            onClick={handleReset}
                            className="av-btn"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Orders Preview */}
            {previewed && orders.length > 0 && (
                <>
                    <div className="av-card" style={{ backgroundColor: "rgba(59,130,246,0.03)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <div>
                                <h3 style={{ margin: 0 }}>📦 Orders Summary</h3>
                                <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                                    {orders.length} order{orders.length !== 1 ? 's' : ''} • {totalBoxes} sticker{totalBoxes !== 1 ? 's' : ''} will be generated
                                </p>
                            </div>
                            <button
                                onClick={handleGeneratePdf}
                                disabled={generating}
                                className="av-btn av-btn-primary"
                                style={{ minWidth: 150 }}
                            >
                                {generating ? "Generating..." : "📄 Generate PDF"}
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 16 }}>
                            <div style={{ padding: 12, backgroundColor: "rgba(59,130,246,0.1)", borderRadius: 8 }}>
                                <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginBottom: 4 }}>Total Orders</div>
                                <div style={{ fontSize: "var(--text-xl)", fontWeight: 900, color: "rgb(37,99,235)" }}>{orders.length}</div>
                            </div>
                            <div style={{ padding: 12, backgroundColor: "rgba(147,51,234,0.1)", borderRadius: 8 }}>
                                <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginBottom: 4 }}>Total Stickers</div>
                                <div style={{ fontSize: "var(--text-xl)", fontWeight: 900, color: "rgb(126,34,206)" }}>{totalBoxes}</div>
                            </div>
                            <div style={{ padding: 12, backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 8 }}>
                                <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginBottom: 4 }}>Selected Date</div>
                                <div style={{ fontSize: "var(--text-lg)", fontWeight: 900, color: "rgb(21,128,61)" }}>
                                    {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="av-card">
                        <h3 style={{ margin: "0 0 16px 0" }}>Order Details</h3>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid var(--border)" }}>
                                        <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 700 }}>Order #</th>
                                        <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 700 }}>Customer</th>
                                        <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 700 }}>Building</th>
                                        <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: 700 }}>Items</th>
                                        <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>Stickers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                            <td style={{ padding: "12px 8px" }}>{order.orderNumber}</td>
                                            <td style={{ padding: "12px 8px" }}>
                                                <div style={{ fontWeight: 600 }}>{order.customerFullName || 'N/A'}</div>
                                                <div style={{ color: "var(--muted)", fontSize: "var(--text-xs)" }}>{order.customerPhone || 'N/A'}</div>
                                            </td>
                                            <td style={{ padding: "12px 8px" }}>{order.buildingNumber || 'N/A'}</td>
                                            <td style={{ padding: "12px 8px" }}>
                                                {order.items.map((item: { menuItemName: string; quantity: number }, itemIdx: number) => (
                                                    <div key={itemIdx} style={{ marginBottom: 4 }}>
                                                        • {item.menuItemName} (x{item.quantity})
                                                    </div>
                                                ))}
                                            </td>
                                            <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>
                                                {order.items.reduce((sum: number, item) => sum + item.quantity, 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {previewed && orders.length === 0 && !loading && (
                <div className="av-card" style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                    <h3 style={{ margin: "0 0 8px 0" }}>No Orders Found</h3>
                    <p style={{ color: "var(--muted)", margin: 0 }}>
                        There are no orders for {new Date(selectedDate).toLocaleDateString()}. Try selecting a different date.
                    </p>
                </div>
            )}
        </div>
    );
}
