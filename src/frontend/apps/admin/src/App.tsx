import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import MenuItems from "./pages/MenuItems"; // ✅ Add this

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AdminLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/menu-items" element={<MenuItems />} /> {/* ✅ Add this */}
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
