import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Vendors from "./pages/vendors.tsx"
import MenuItems from "./pages/MenuItems";
import Employees from "./pages/employees.tsx"

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AdminLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/menu-items" element={<MenuItems />} />
                    <Route path="/vendors" element={<Vendors />} />
                    <Route path="/employees" element={<Employees />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
