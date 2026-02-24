import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type OrderResult = {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    orderDate: string;
};

function money(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }) + " CST";
}

export default function ConfirmPage() {
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderResult | null>(null);

    useEffect(() => {
        const raw = sessionStorage.getItem("lastOrder");
        if (!raw) {
            navigate("/");
            return;
        }
        try {
            setOrder(JSON.parse(raw) as OrderResult);
        } catch {
            navigate("/");
        }
    }, [navigate]);

    function placeAnother() {
        sessionStorage.removeItem("lastOrder");
        navigate("/order");
    }

    if (!order) return null;

    return (
        <div className="cp-page">
            <div className="cp-card">
                <div className="cp-brand">
                    <div className="cp-logo cp-logo-success">✅</div>
                    <h1 className="cp-title">Order Placed!</h1>
                    <p className="cp-subtitle">Your order has been received successfully.</p>
                </div>

                <div className="cp-confirm-details">
                    <div className="cp-confirm-row">
                        <span className="cp-muted">Order Number</span>
                        <span className="cp-confirm-value">{order.orderNumber}</span>
                    </div>
                    <div className="cp-confirm-row">
                        <span className="cp-muted">Status</span>
                        <span className="cp-badge cp-badge-pending">Order Placed Successfully</span>
                    </div>
                    <div className="cp-confirm-row">
                        <span className="cp-muted">Total</span>
                        <span className="cp-confirm-value">{money(order.totalAmount)}</span>
                    </div>
                    <div className="cp-confirm-row">
                        <span className="cp-muted">Date</span>
                        <span>{formatDate(order.orderDate)}</span>
                    </div>
                </div>

                <div className="cp-confirm-note">
                    The restaurant will prepare your order shortly.
                </div>

                <button className="cp-btn-primary" onClick={placeAnother}>
                    Place Another Order
                </button>
            </div>
        </div>
    );
}
