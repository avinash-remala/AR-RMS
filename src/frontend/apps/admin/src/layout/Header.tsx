export default function Header() {
    return (
        <header className="av-header">
            <div style={{ fontWeight: 800, fontSize: "var(--text-lg)" }}>
                Amrutha Vilas — Admin
            </div>

            <div style={{ display: "flex", gap: 10 }}>
        <span
            style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid var(--border)"
            }}
        >
          Admin
        </span>
            </div>
        </header>
    );
}
