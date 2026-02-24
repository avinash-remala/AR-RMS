import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import OtpPage from "./pages/OtpPage";
import OrderPage from "./pages/OrderPage";
import ConfirmPage from "./pages/ConfirmPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/verify" element={<OtpPage />} />
                <Route path="/order" element={<OrderPage />} />
                <Route path="/confirm" element={<ConfirmPage />} />
            </Routes>
        </BrowserRouter>
    );
}
