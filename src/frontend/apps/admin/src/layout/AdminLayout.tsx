import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

export default function AdminLayout() {
    return (
        <div className="av-shell">
            <Sidebar />
            <div className="av-main">
                <Header />
                <main className="av-content">
                    <div className="av-container">
                        <Outlet />
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
}
