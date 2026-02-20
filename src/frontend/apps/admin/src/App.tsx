import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Vendors from "./pages/vendors.tsx"
import MenuItems from "./pages/MenuItems";
import Employees from "./pages/employees.tsx"
import Pricing from "./pages/Pricing";
import Summary from "./pages/Summary";
import MealPasses from "./pages/MealPasses";
import PdfGenerator from "./pages/PdfGenerator";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AdminLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/summary" element={<Summary />} />
                    <Route path="/menu-items" element={<MenuItems />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/meal-passes" element={<MealPasses />} />
                    <Route path="/pdf-generator" element={<PdfGenerator />} />
                    <Route path="/vendors" element={<Vendors />} />
                    <Route path="/employees" element={<Employees />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
