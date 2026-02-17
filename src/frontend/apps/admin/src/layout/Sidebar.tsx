import { NavLink } from "react-router-dom";

export default function Sidebar() {
    return (
        <aside className="av-sidebar">
            <div className="av-brand">
                <img
                    src="/av-logo.png"
                    alt="Amrutha Vilas"
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        objectFit: "contain"
                    }}
                />

                <div>
                    <div style={{ fontWeight: 800 }}>Admin</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        Amrutha Vilas
                    </div>
                </div>
            </div>

            <nav className="av-nav">
                <NavLink to="/" end>
                    Dashboard
                </NavLink>

                <NavLink to="/orders">
                    Orders
                </NavLink>

                <NavLink to="/menu-items">
                    Lunch Boxes
                </NavLink>
            </nav>
        </aside>
    );
}
