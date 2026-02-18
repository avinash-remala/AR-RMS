import { useEffect, useMemo, useState } from "react";

type Vendor = {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    balance: number; // + means you owe vendor, - means vendor owes you (optional)
    updatedAt: string; // ISO
};

type InvoiceStatus = "PENDING" | "APPROVED" | "PAID";

type Invoice = {
    id: string;
    vendorId: string;
    invoiceNo: string;
    date: string; // YYYY-MM-DD
    amount: number;
    status: InvoiceStatus;
    notes?: string;
};

function money(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

/** TEMP mock (replace with API later) */
const MOCK_VENDORS: Vendor[] = [
    { id: "v_1001", name: "Fresh Veg Suppliers", phone: "xxx-xxx-1111", email: "fresh@vendor.com", balance: 245.5, updatedAt: new Date().toISOString() },
    { id: "v_1002", name: "Spice Wholesale", phone: "xxx-xxx-2222", email: "spice@vendor.com", balance: 0, updatedAt: new Date().toISOString() },
    { id: "v_1003", name: "Packaging Mart", phone: "xxx-xxx-3333", email: "pack@vendor.com", balance: 89.99, updatedAt: new Date().toISOString() },
];

const MOCK_INVOICES: Invoice[] = [
    { id: "i_9001", vendorId: "v_1001", invoiceNo: "FV-2026-11", date: "2026-02-16", amount: 120.5, status: "PENDING" },
    { id: "i_9002", vendorId: "v_1001", invoiceNo: "FV-2026-10", date: "2026-02-10", amount: 125.0, status: "APPROVED" },
    { id: "i_9003", vendorId: "v_1003", invoiceNo: "PK-7781", date: "2026-02-12", amount: 89.99, status: "PAID" },
];

export default function Vendors() {
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [query, setQuery] = useState("");

    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const selectedVendor = useMemo(
        () => vendors.find((v) => v.id === selectedVendorId) ?? null,
        [vendors, selectedVendorId]
    );

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoiceStatusUpdating, setInvoiceStatusUpdating] = useState<string | null>(null);

    async function fetchVendors() {
        setLoading(true);
        try {
            // TODO: replace later with backend call
            await new Promise((r) => setTimeout(r, 150));
            setVendors(MOCK_VENDORS);
        } finally {
            setLoading(false);
        }
    }

    async function fetchInvoices(vendorId: string) {
        // TODO: replace later with backend call
        await new Promise((r) => setTimeout(r, 120));
        setInvoices(MOCK_INVOICES.filter((x) => x.vendorId === vendorId));
    }

    useEffect(() => {
        fetchVendors();
    }, []);

    useEffect(() => {
        if (!selectedVendorId) return;
        fetchInvoices(selectedVendorId);
    }, [selectedVendorId]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return vendors;
        return vendors.filter((v) => v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q));
    }, [vendors, query]);

    const totalBalance = filtered.reduce((s, v) => s + v.balance, 0);

    async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
        setInvoiceStatusUpdating(invoiceId);
        try {
            // optimistic
            setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, status } : i)));
            // TODO later: PATCH /api/v1/invoices/{id}/status
            await new Promise((r) => setTimeout(r, 200));
        } finally {
            setInvoiceStatusUpdating(null);
        }
    }

    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>Vendors</h2>
                    <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                        Track vendor balances and invoices.
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                        className="av-input"
                        style={{ width: 260 }}
                        placeholder="Search vendor..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className="av-btn" onClick={fetchVendors} disabled={loading}>
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                    <button className="av-btn-primary" onClick={() => alert("Add Vendor (next)")}>
                        + Add Vendor
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="av-grid cards">
                <div className="av-card av-metric av-metric-primary">
                    <div className="av-metric-label">Vendors</div>
                    <div className="av-metric-value">{loading ? "—" : filtered.length}</div>
                    <div className="av-metric-sub">Total vendors</div>
                </div>

                <div className="av-card av-metric av-metric-accent">
                    <div className="av-metric-label">Total Balance</div>
                    <div className="av-metric-value">{loading ? "—" : money(totalBalance)}</div>
                    <div className="av-metric-sub">Amount due across vendors</div>
                </div>
            </div>

            {/* Vendors Table */}
            <div className="av-card">
                <div style={{ fontWeight: 900, marginBottom: 12 }}>Vendor List</div>

                <div style={{ overflowX: "auto" }}>
                    <table className="av-table">
                        <thead>
                        <tr>
                            <th>Vendor</th>
                            <th>Contact</th>
                            <th>Balance</th>
                            <th style={{ width: 220 }}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} style={{ color: "var(--muted)" }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ color: "var(--muted)" }}>
                                    No vendors found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((v) => (
                                <tr key={v.id} className={selectedVendorId === v.id ? "av-row-selected" : ""}>
                                    <td>
                                        <div style={{ fontWeight: 900 }}>{v.name}</div>
                                        <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>{v.id}</div>
                                    </td>
                                    <td style={{ color: "var(--muted)" }}>
                                        <div>{v.phone ?? "—"}</div>
                                        <div style={{ fontSize: "var(--text-sm)" }}>{v.email ?? "—"}</div>
                                    </td>
                                    <td style={{ fontWeight: 900 }}>{money(v.balance)}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            <button className="av-btn av-btn-edit" onClick={() => setSelectedVendorId(v.id)}>
                                                View Invoices
                                            </button>
                                            <button className="av-btn av-btn-warning" onClick={() => alert("Record Payment (next)")}>
                                                Record Payment
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoices Panel */}
            {selectedVendor ? (
                <div className="av-card" style={{ borderColor: "rgba(242,193,78,0.35)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontWeight: 900 }}>Invoices — {selectedVendor.name}</div>
                            <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>{selectedVendor.id}</div>
                        </div>
                        <button className="av-btn" onClick={() => setSelectedVendorId(null)}>
                            Close
                        </button>
                    </div>

                    <div style={{ overflowX: "auto", marginTop: 12 }}>
                        <table className="av-table">
                            <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th style={{ width: 220 }}>Update</th>
                            </tr>
                            </thead>
                            <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ color: "var(--muted)" }}>
                                        No invoices for this vendor.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((i) => (
                                    <tr key={i.id}>
                                        <td style={{ fontWeight: 800 }}>{i.invoiceNo}</td>
                                        <td>{i.date}</td>
                                        <td style={{ fontWeight: 900 }}>{money(i.amount)}</td>
                                        <td>
                                            <span className="av-badge av-badge-muted">{i.status}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                                <select
                                                    className="av-select"
                                                    value={i.status}
                                                    onChange={(e) => updateInvoiceStatus(i.id, e.target.value as InvoiceStatus)}
                                                    disabled={invoiceStatusUpdating === i.id}
                                                    style={{ minWidth: 140 }}
                                                >
                                                    <option value="PENDING">PENDING</option>
                                                    <option value="APPROVED">APPROVED</option>
                                                    <option value="PAID">PAID</option>
                                                </select>

                                                <button className="av-btn av-btn-edit" onClick={() => alert(`View invoice ${i.invoiceNo} (next)`)}>
                                                    View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: 10, color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                        Invoice updates are local for now. Later connect to backend PATCH endpoints.
                    </div>
                </div>
            ) : null}
        </div>
    );
}
