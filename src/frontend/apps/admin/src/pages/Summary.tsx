import { useEffect, useState } from "react";
import type { OrderSummary } from "../services/summaryApi";
import { getOrderSummary } from "../services/summaryApi";

function getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function Summary() {
    const [summary, setSummary] = useState<OrderSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<string>(getTodayDate());
    const [useFilter, setUseFilter] = useState(false);
    const [copied, setCopied] = useState(false);

    async function refresh(date?: string, all?: boolean) {
        setLoading(true);
        setError(null);
        try {
            const data = await getOrderSummary(date, all);
            setSummary(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load summary");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh(); // Load today's orders by default
    }, []);

    function onFilter() {
        setUseFilter(true);
        refresh(dateFilter);
    }

    function onShowAll() {
        setUseFilter(false);
        setDateFilter(getTodayDate());
        refresh(undefined, true);
    }

    async function onCopyToClipboard() {
        if (!summary) return;

        try {
            await navigator.clipboard.writeText(summary.formattedSummary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            setError("Failed to copy to clipboard");
        }
    }

    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            <div>
                <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>📊 Order Summary</h2>
                <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                    View daily order summaries organized by box type and building. Copy-paste friendly for sharing via WhatsApp or SMS.
                </div>
            </div>

            {error ? (
                <div className="av-card" style={{ borderColor: "rgba(220,38,38,0.35)", backgroundColor: "rgba(220,38,38,0.05)" }}>
                    <b style={{ display: "block", marginBottom: 6, color: "rgb(220,38,38)" }}>Error</b>
                    <div style={{ color: "rgb(153,27,27)" }}>{error}</div>
                </div>
            ) : null}

            {/* Date Filter */}
            <div className="av-card" style={{ backgroundColor: "rgba(59,130,246,0.03)" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>🔍 Filter Summary by Date</div>
                
                <div className="av-formGrid">
                    <div className="av-field av-col-6">
                        <label className="av-label">Select Date</label>
                        <input
                            type="date"
                            className="av-input"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    
                    <div className="av-col-6" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                        <button className="av-btn-primary" onClick={onFilter}>
                            Filter
                        </button>
                        <button className="av-btn" onClick={onShowAll}>
                            Show All
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="av-card">
                    <div style={{ color: "var(--muted)" }}>Loading summary...</div>
                </div>
            ) : summary ? (
                <>
                    {/* Copy-Paste Summary */}
                    <div className="av-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ fontWeight: 900 }}>📋 Copy-Paste Summary</div>
                            {useFilter && summary.date ? (
                                <div style={{ 
                                    fontSize: "var(--text-sm)", 
                                    color: "var(--muted)",
                                    padding: "4px 12px",
                                    backgroundColor: "rgba(59,130,246,0.1)",
                                    borderRadius: "4px",
                                    fontWeight: 600
                                }}>
                                    Date: {summary.date}
                                </div>
                            ) : (
                                <div style={{ 
                                    fontSize: "var(--text-sm)", 
                                    color: "var(--muted)",
                                    padding: "4px 12px",
                                    backgroundColor: "rgba(156,163,175,0.1)",
                                    borderRadius: "4px",
                                    fontWeight: 600
                                }}>
                                    All Orders
                                </div>
                            )}
                        </div>

                        <div style={{ 
                            backgroundColor: "rgba(243,244,246,0.8)", 
                            padding: 16, 
                            borderRadius: 8,
                            border: "2px solid rgba(156,163,175,0.2)",
                            marginBottom: 12
                        }}>
                            <pre style={{ 
                                margin: 0, 
                                fontSize: "var(--text-sm)", 
                                fontFamily: "monospace",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                color: "#374151"
                            }}>
                                {summary.formattedSummary}
                            </pre>
                        </div>

                        <button
                            className="av-btn-primary"
                            onClick={onCopyToClipboard}
                            style={{ 
                                backgroundColor: copied ? "rgb(34,197,94)" : undefined,
                                color: "white"
                            }}
                        >
                            {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
                        </button>
                    </div>

                    {/* Visual Summary Cards */}
                    <div className="av-card" style={{ backgroundColor: "rgba(243,244,246,0.3)" }}>
                        <div style={{ fontWeight: 900, marginBottom: 12 }}>📈 Quick Stats</div>

                        <div className="av-formGrid">
                            <div className="av-col-4">
                                <div className="av-card" style={{ 
                                    backgroundColor: "white",
                                    borderLeft: "4px solid rgb(59,130,246)"
                                }}>
                                    <div style={{ 
                                        fontSize: "var(--text-sm)", 
                                        fontWeight: 600, 
                                        color: "var(--muted)", 
                                        marginBottom: 6 
                                    }}>
                                        Total Boxes
                                    </div>
                                    <div style={{ 
                                        fontSize: "2.25rem", 
                                        fontWeight: 800,
                                        color: "rgb(59,130,246)"
                                    }}>
                                        {summary.totalBoxes}
                                    </div>
                                </div>
                            </div>

                            <div className="av-col-4">
                                <div className="av-card" style={{ 
                                    backgroundColor: "white",
                                    borderLeft: "4px solid rgb(34,197,94)"
                                }}>
                                    <div style={{ 
                                        fontSize: "var(--text-sm)", 
                                        fontWeight: 600, 
                                        color: "var(--muted)", 
                                        marginBottom: 6 
                                    }}>
                                        Box Types
                                    </div>
                                    <div style={{ 
                                        fontSize: "2.25rem", 
                                        fontWeight: 800,
                                        color: "rgb(34,197,94)"
                                    }}>
                                        {Object.keys(summary.boxesByType).length}
                                    </div>
                                </div>
                            </div>

                            <div className="av-col-4">
                                <div className="av-card" style={{ 
                                    backgroundColor: "white",
                                    borderLeft: "4px solid rgb(168,85,247)"
                                }}>
                                    <div style={{ 
                                        fontSize: "var(--text-sm)", 
                                        fontWeight: 600, 
                                        color: "var(--muted)", 
                                        marginBottom: 6 
                                    }}>
                                        Buildings
                                    </div>
                                    <div style={{ 
                                        fontSize: "2.25rem", 
                                        fontWeight: 800,
                                        color: "rgb(168,85,247)"
                                    }}>
                                        {Object.keys(summary.boxesByAddress).length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Boxes by Type Table */}
                    <div className="av-card">
                        <div style={{ fontWeight: 900, marginBottom: 12 }}>📦 Boxes by Type</div>
                        <div style={{ overflowX: "auto" }}>
                            <table className="av-table">
                                <thead>
                                    <tr>
                                        <th>Box Type</th>
                                        <th style={{ textAlign: "right" }}>Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary.boxesByType).map(([type, count]) => (
                                        <tr key={type}>
                                            <td>{type || "(Unnamed)"}</td>
                                            <td style={{ textAlign: "right", fontWeight: 700 }}>{count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Boxes by Building Table */}
                    <div className="av-card">
                        <div style={{ fontWeight: 900, marginBottom: 12 }}>🏢 Boxes by Building</div>
                        <div style={{ overflowX: "auto" }}>
                            <table className="av-table">
                                <thead>
                                    <tr>
                                        <th>Building</th>
                                        <th style={{ textAlign: "right" }}>Total Boxes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary.boxesByAddress).map(([address, count]) => (
                                        <tr key={address}>
                                            <td>{address}</td>
                                            <td style={{ textAlign: "right", fontWeight: 700 }}>{count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
