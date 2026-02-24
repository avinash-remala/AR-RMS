import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "../services/authApi";

export default function LoginPage() {
    const [digits, setDigits] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    function buildPhone(raw: string) {
        // Strip everything except digits, then prepend +1
        const stripped = raw.replace(/\D/g, "");
        return `+1${stripped}`;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (digits.replace(/\D/g, "").length < 10) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }

        const phone = buildPhone(digits);
        setLoading(true);
        try {
            await sendOtp(phone);
            sessionStorage.setItem("customerPhone", phone);
            navigate("/verify");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="cp-page">
            <div className="cp-card">
                <div className="cp-brand">
                    <img src="/av-logo.png" alt="Amrutha Vilas" className="cp-logo" />
                    <h1 className="cp-title">Food Ordering System</h1>
                    <p className="cp-subtitle">Enter your phone number to place an order</p>
                </div>

                <form onSubmit={onSubmit} className="cp-form">
                    <div className="cp-field">
                        <label className="cp-label" htmlFor="phone">Phone Number</label>
                        <div className="cp-phone-row">
                            <span className="cp-phone-prefix">+1</span>
                            <input
                                id="phone"
                                className="cp-input cp-input-phone"
                                type="tel"
                                placeholder="98765 43210"
                                value={digits}
                                onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                autoFocus
                                autoComplete="tel-national"
                                maxLength={10}
                            />
                        </div>
                    </div>

                    {error && <div className="cp-error">{error}</div>}

                    <button className="cp-btn-primary" type="submit" disabled={loading}>
                        {loading ? "Sending OTP…" : "Send OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
}
