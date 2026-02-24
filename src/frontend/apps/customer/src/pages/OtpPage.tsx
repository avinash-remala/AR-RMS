import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp } from "../services/authApi";
import { searchCustomerByPhone, createCustomer } from "../services/ordersApi";

type Step = "otp" | "register";

export default function OtpPage() {
    const [step, setStep] = useState<Step>("otp");
    const [otp, setOtp] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();

    const phone = sessionStorage.getItem("customerPhone") ?? "";

    useEffect(() => {
        if (!phone) navigate("/");
    }, [phone, navigate]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown(c => c - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    function saveAndGo(id: string, name: string) {
        sessionStorage.setItem("customerId", id);
        sessionStorage.setItem("customerName", name);
        navigate("/order");
    }

    async function onVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (otp.trim().length < 4) {
            setError("Please enter the OTP sent to your phone.");
            return;
        }

        setLoading(true);
        try {
            await verifyOtp(phone, otp.trim());

            const customers = await searchCustomerByPhone(phone);
            if (customers.length > 0) {
                const c = customers[0];
                saveAndGo(c.id, `${c.firstName} ${c.lastName}`.trim());
            } else {
                // No account — collect name
                setStep("register");
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid or expired OTP.");
        } finally {
            setLoading(false);
        }
    }

    async function onRegister(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!firstName.trim() || !lastName.trim()) {
            setError("Please enter your first and last name.");
            return;
        }

        setLoading(true);
        try {
            const customer = await createCustomer(firstName.trim(), lastName.trim(), phone);
            saveAndGo(customer.id, `${customer.firstName} ${customer.lastName}`.trim());
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function onResend() {
        setError(null);
        setResending(true);
        try {
            await sendOtp(phone);
            setCooldown(60);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to resend OTP.");
        } finally {
            setResending(false);
        }
    }

    if (step === "register") {
        return (
            <div className="cp-page">
                <div className="cp-card">
                    <div className="cp-brand">
                        <div className="cp-logo">👤</div>
                        <h1 className="cp-title">Create Account</h1>
                        <p className="cp-subtitle">
                            First time here! Enter your name to get started.
                        </p>
                    </div>

                    <form onSubmit={onRegister} className="cp-form">
                        <div className="cp-field">
                            <label className="cp-label" htmlFor="firstName">First Name *</label>
                            <input
                                id="firstName"
                                className="cp-input"
                                type="text"
                                placeholder="Ravi"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                autoFocus
                                autoComplete="given-name"
                            />
                        </div>
                        <div className="cp-field">
                            <label className="cp-label" htmlFor="lastName">Last Name *</label>
                            <input
                                id="lastName"
                                className="cp-input"
                                type="text"
                                placeholder="Kumar"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                autoComplete="family-name"
                            />
                        </div>

                        {error && <div className="cp-error">{error}</div>}

                        <button className="cp-btn-primary" type="submit" disabled={loading}>
                            {loading ? "Creating account…" : "Continue to Order"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="cp-page">
            <div className="cp-card">
                <div className="cp-brand">
                    <div className="cp-logo">🔑</div>
                    <h1 className="cp-title">Enter OTP</h1>
                    <p className="cp-subtitle">
                        A 6-digit code was sent to <strong>{phone}</strong>
                    </p>
                </div>

                <form onSubmit={onVerifyOtp} className="cp-form">
                    <div className="cp-field">
                        <label className="cp-label" htmlFor="otp">OTP Code</label>
                        <input
                            id="otp"
                            className="cp-input cp-input-otp"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="------"
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                            autoFocus
                            autoComplete="one-time-code"
                        />
                    </div>

                    {error && <div className="cp-error">{error}</div>}

                    <button className="cp-btn-primary" type="submit" disabled={loading}>
                        {loading ? "Verifying…" : "Verify OTP"}
                    </button>

                    <div className="cp-resend">
                        {cooldown > 0 ? (
                            <span className="cp-muted">Resend in {cooldown}s</span>
                        ) : (
                            <button
                                type="button"
                                className="cp-link"
                                onClick={onResend}
                                disabled={resending}
                            >
                                {resending ? "Sending…" : "Resend OTP"}
                            </button>
                        )}
                    </div>

                    <button type="button" className="cp-link" onClick={() => navigate("/")}>
                        ← Change phone number
                    </button>
                </form>
            </div>
        </div>
    );
}
