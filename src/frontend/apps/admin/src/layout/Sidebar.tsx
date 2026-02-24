import { NavLink } from "react-router-dom";

export default function Sidebar() {
    return (
        <aside className="av-sidebar">
            <div className="av-brand">
                <div className="av-logo">AV</div>
                <div>
                    <div style={{ fontWeight: 900 }}>Admin</div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>Amrutha Vilas</div>
                </div>
            </div>

            <nav className="av-nav">
                <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
                    Dashboard
                </NavLink>

                <NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : "")}>
                    Orders
                </NavLink>

                <NavLink to="/summary" className={({ isActive }) => (isActive ? "active" : "")}>
                    Summary
                </NavLink>

                <NavLink to="/lunch-boxes" className={({ isActive }) => (isActive ? "active" : "")}>
                    Lunch Boxes
                </NavLink>

                <NavLink to="/menu-items" className={({ isActive }) => (isActive ? "active" : "")}>
                    Custom Items
                </NavLink>

                <NavLink to="/meal-passes" className={({ isActive }) => (isActive ? "active" : "")}>
                    Meal Passes
                </NavLink>

                <NavLink to="/pdf-generator" className={({ isActive }) => (isActive ? "active" : "")}>
                    PDF Generator
                </NavLink>

                {/* ✅ Add these */}
                <NavLink to="/vendors" className={({ isActive }) => (isActive ? "active" : "")}>
                    Vendors
                </NavLink>

                <NavLink to="/employees" className={({ isActive }) => (isActive ? "active" : "")}>
                    Employees
                </NavLink>
            </nav>
        </aside>
    );
}
