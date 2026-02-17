export default function Dashboard() {
    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>
                Dashboard
            </h2>

            <div className="av-grid cards">
                <div className="av-card">
                    <div style={{ color: "var(--muted)" }}>Orders Today</div>
                    <div style={{ fontSize: "var(--text-xl)", fontWeight: 800 }}>
                        0
                    </div>
                </div>

                <div className="av-card">
                    <div style={{ color: "var(--muted)" }}>Revenue Today</div>
                    <div style={{ fontSize: "var(--text-xl)", fontWeight: 800 }}>
                        $0
                    </div>
                </div>

                <div className="av-card">
                    <div style={{ color: "var(--muted)" }}>Pending Invoices</div>
                    <div style={{ fontSize: "var(--text-xl)", fontWeight: 800 }}>
                        0
                    </div>
                </div>

                <div className="av-card">
                    <div style={{ color: "var(--muted)" }}>Employees Due</div>
                    <div style={{ fontSize: "var(--text-xl)", fontWeight: 800 }}>
                        $0
                    </div>
                </div>
            </div>
        </div>
    );
}
