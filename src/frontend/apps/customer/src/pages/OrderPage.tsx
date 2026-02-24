import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAvailableMenuItems, type MenuItem } from "../services/menuApi";
import { getActivePricing, type PricingItem } from "../services/pricingApi";
import { placeOrder, getLastCustomerOrder, getCustomerMealPass, type PastOrder, type PastOrderItem, type MealPassInfo } from "../services/ordersApi";

type RiceChoice = "Pulav Rice" | "White Rice";

type BoxOption = {
    pricingItem: PricingItem;
    menuItem: MenuItem | undefined;
    riceType?: RiceChoice;
    key: string;
};

function money(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const RICE_OPTIONS: RiceChoice[] = ["Pulav Rice", "White Rice"];

export default function OrderPage() {
    const navigate = useNavigate();
    const customerId = sessionStorage.getItem("customerId");
    const customerName = sessionStorage.getItem("customerName");

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [pricing, setPricing] = useState<PricingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [pastOrder, setPastOrder] = useState<PastOrder | null>(null);
    const [showPastOrderModal, setShowPastOrderModal] = useState(false);

    // Composite key (boxType:riceType or boxType) → quantity
    const [selectedBoxQtys, setSelectedBoxQtys] = useState<Map<string, number>>(new Map());
    const [extraQuantities, setExtraQuantities] = useState<Map<string, number>>(new Map());
    const [addressOption, setAddressOption] = useState("");
    const [customAddress, setCustomAddress] = useState("");
    const [comments, setComments] = useState("");
    const [mealPass, setMealPass] = useState<MealPassInfo | null>(null);
    const [useMealPass, setUseMealPass] = useState(false);

    useEffect(() => {
        if (!customerId) { navigate("/"); return; }
        loadData();
    }, [customerId, navigate]);

    useEffect(() => {
        if (!showModal) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowModal(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showModal]);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const [items, prices, last, pass] = await Promise.all([
                getAvailableMenuItems(),
                getActivePricing(),
                getLastCustomerOrder(customerId!),
                getCustomerMealPass(customerId!),
            ]);
            setMenuItems(items);
            setPricing(prices);
            setPastOrder(last);
            setMealPass(pass);
            if (last) setShowPastOrderModal(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load menu.");
        } finally {
            setLoading(false);
        }
    }

    const isFriday = new Date().toLocaleDateString("en-US", { timeZone: "America/Chicago", weekday: "long" }) === "Friday";

    function normalizeName(s: string) {
        return s.replace(/-/g, " ").replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
    }

    function buildBaseOption(p: PricingItem): BoxOption {
        const normalized = normalizeName(p.displayName);
        return { pricingItem: p, menuItem: menuItems.find(m => normalizeName(m.name) === normalized), key: p.boxType };
    }

    // Two cards for display
    const baseComfortBoxes: BoxOption[] = pricing
        .filter(p => p.boxType.includes("comfort") && p.isActive)
        .map(buildBaseOption);

    // Expanded variants (one per rice type) used for summary + submission lookup
    const comfortVariants: BoxOption[] = pricing
        .filter(p => p.boxType.includes("comfort") && p.isActive)
        .flatMap(p => RICE_OPTIONS.map(rt => ({ ...buildBaseOption(p), riceType: rt, key: `${p.boxType}:${rt}` })));

    const specialBoxes: BoxOption[] = isFriday
        ? pricing.filter(p => p.boxType.includes("special") && p.isActive).map(buildBaseOption)
        : [];

    const allBoxOptions = [...comfortVariants, ...specialBoxes];

    const EXCLUDED_BOX_TYPES = ["veg_comfort", "veg_special", "nonveg_comfort", "nonveg_special"];

    const boxMenuItemIds = new Set(
        pricing
            .filter(p => EXCLUDED_BOX_TYPES.includes(p.boxType))
            .map(p => buildBaseOption(p).menuItem?.id)
            .filter((id): id is string => id !== undefined)
    );

    const extraItems: MenuItem[] = menuItems.filter(m => !boxMenuItemIds.has(m.id));
    const showExtrasButton = extraItems.length > 0 || pastOrder !== null;

    const selectedBoxEntries = allBoxOptions.filter(o => (selectedBoxQtys.get(o.key) ?? 0) > 0);
    const selectedExtras = extraItems.filter(e => (extraQuantities.get(e.id) ?? 0) > 0);

    const boxTotal = selectedBoxEntries.reduce((sum, o) => sum + o.pricingItem.price * (selectedBoxQtys.get(o.key) ?? 0), 0);
    const extraTotal = selectedExtras.reduce((sum, e) => sum + e.price * (extraQuantities.get(e.id) ?? 0), 0);
    const totalAmount = boxTotal + extraTotal;

    // Meal pass
    const comfortBoxCount = comfortVariants
        .filter(o => selectedBoxQtys.has(o.key))
        .reduce((sum, o) => sum + (selectedBoxQtys.get(o.key) ?? 0), 0);
    const comfortBoxTotal = comfortVariants
        .filter(o => selectedBoxQtys.has(o.key))
        .reduce((sum, o) => sum + o.pricingItem.price * (selectedBoxQtys.get(o.key) ?? 0), 0);
    const canUseMealPass = mealPass !== null && comfortBoxCount > 0 && mealPass.mealsRemaining >= comfortBoxCount;
    const discount = useMealPass && canUseMealPass ? comfortBoxTotal : 0;
    const finalTotal = Math.max(0, totalAmount - discount);

    // Auto-deselect meal pass if comfort boxes are removed
    useEffect(() => {
        if (comfortBoxCount === 0) setUseMealPass(false);
    }, [comfortBoxCount]);

    function updateKey(key: string, delta: number) {
        setSelectedBoxQtys(prev => {
            const next = new Map(prev);
            const updated = Math.max(0, (next.get(key) ?? 0) + delta);
            if (updated === 0) next.delete(key);
            else next.set(key, updated);
            return next;
        });
    }

    function toggleBox(key: string) {
        setSelectedBoxQtys(prev => {
            const next = new Map(prev);
            if (next.has(key)) next.delete(key);
            else next.set(key, 1);
            return next;
        });
    }

    function toggleExtra(id: string) {
        setExtraQuantities(prev => {
            const next = new Map(prev);
            if (next.has(id)) next.delete(id);
            else next.set(id, 1);
            return next;
        });
    }

    function updateExtraQty(id: string, delta: number) {
        setExtraQuantities(prev => {
            const next = new Map(prev);
            const updated = Math.max(0, (next.get(id) ?? 0) + delta);
            if (updated === 0) next.delete(id);
            else next.set(id, updated);
            return next;
        });
    }

    // Parse rice breakdown from order comments, e.g.:
    // "Rice - Veg Comfort Box (Pulav Rice): x2, Non-Veg Comfort Box (White Rice): x3."
    function parseRiceBreakdown(comments?: string): { name: string; rice: string; qty: number }[] {
        if (!comments) return [];
        const match = comments.match(/Rice - ([^.]+)\./);
        if (!match) return [];
        return match[1].split(", ").flatMap(part => {
            const m = part.match(/^(.+?) \((.+?)\): x(\d+)$/);
            if (!m) return [];
            return [{ name: m[1].trim(), rice: m[2].trim(), qty: parseInt(m[3]) }];
        });
    }

    function addPastRiceItem(item: PastOrderItem, rice: string, qty: number) {
        const normalized = normalizeName(item.menuItemName);
        const boxOpt = allBoxOptions.find(o =>
            normalizeName(o.pricingItem.displayName) === normalized && o.riceType === rice
        );
        if (boxOpt) {
            setSelectedBoxQtys(prev => {
                const next = new Map(prev);
                next.set(boxOpt.key, (next.get(boxOpt.key) ?? 0) + qty);
                return next;
            });
        }
    }

    function addPastItem(item: PastOrderItem) {
        const boxOpt = allBoxOptions.find(o => o.menuItem?.id === item.menuItemId);
        if (boxOpt) {
            setSelectedBoxQtys(prev => {
                const next = new Map(prev);
                next.set(boxOpt.key, (next.get(boxOpt.key) ?? 0) + item.quantity);
                return next;
            });
        } else {
            setExtraQuantities(prev => {
                const next = new Map(prev);
                next.set(item.menuItemId, (next.get(item.menuItemId) ?? 0) + item.quantity);
                return next;
            });
        }
    }

    function addAllPastItems() {
        if (!pastOrder) return;
        const riceBreakdown = parseRiceBreakdown(pastOrder.comments);
        pastOrder.items.forEach(item => {
            if (item.menuItemName?.toLowerCase().includes("comfort box") && riceBreakdown.length > 0) {
                const normalized = normalizeName(item.menuItemName);
                const riceForItem = riceBreakdown.filter(r => normalizeName(r.name) === normalized);
                if (riceForItem.length > 0) {
                    riceForItem.forEach(r => addPastRiceItem(item, r.rice, r.qty));
                    return;
                }
            }
            addPastItem(item);
        });
        setShowPastOrderModal(false);
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (selectedBoxQtys.size === 0 && selectedExtras.length === 0) { setError("Please select a lunch box or extra item."); return; }
        const finalAddress = addressOption === "Other" ? customAddress.trim() : addressOption;
        if (!finalAddress) { setError("Please select or enter your delivery address."); return; }
        if (addressOption === "Other" && !customAddress.trim()) { setError("Please enter your delivery address."); return; }

        // Validate all selected box options have a matching menu item in the DB
        const unmapped = selectedBoxEntries.filter(o => !o.menuItem);
        if (unmapped.length > 0) {
            const names = [...new Set(unmapped.map(o => o.pricingItem.displayName))].join(", ");
            setError(`"${names}" is currently unavailable. Please ask admin to activate it in Menu Items.`);
            return;
        }

        setSubmitting(true);
        try {
            const riceNotes = comfortVariants
                .filter(o => selectedBoxQtys.has(o.key))
                .map(o => `${o.pricingItem.displayName} (${o.riceType}): x${selectedBoxQtys.get(o.key)}`)
                .join(", ");
            const riceNote = riceNotes ? `Rice - ${riceNotes}.` : "";
            const finalComments = [riceNote, comments.trim()].filter(Boolean).join(" ") || undefined;

            // Merge same menuItemId across rice variants
            const itemMap = new Map<string, number>();
            for (const [key, qty] of selectedBoxQtys.entries()) {
                const opt = allBoxOptions.find(o => o.key === key);
                if (opt?.menuItem) itemMap.set(opt.menuItem.id, (itemMap.get(opt.menuItem.id) ?? 0) + qty);
            }
            for (const [id, qty] of extraQuantities.entries()) {
                itemMap.set(id, (itemMap.get(id) ?? 0) + qty);
            }

            const result = await placeOrder({
                customerId: customerId!,
                buildingNumber: finalAddress,
                comments: finalComments,
                mealPassId: useMealPass && mealPass ? mealPass.id : undefined,
                items: Array.from(itemMap.entries()).map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
                extras: [],
            });
            sessionStorage.setItem("lastOrder", JSON.stringify(result));
            navigate("/confirm");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    // Comfort box card: 2 cards, inline rice qty controls when selected
    function ComfortBoxCard({ opt }: { opt: BoxOption }) {
        const boxType = opt.pricingItem.boxType;
        const isVeg = boxType.startsWith("veg");
        const pulavKey = `${boxType}:Pulav Rice`;
        const whiteKey = `${boxType}:White Rice`;
        const pulavQty = selectedBoxQtys.get(pulavKey) ?? 0;
        const whiteQty = selectedBoxQtys.get(whiteKey) ?? 0;
        const totalQty = pulavQty + whiteQty;
        const isSelected = totalQty > 0;

        function handleCardClick() {
            if (!isSelected) {
                setSelectedBoxQtys(prev => { const next = new Map(prev); next.set(pulavKey, 1); return next; });
            } else {
                setSelectedBoxQtys(prev => { const next = new Map(prev); next.delete(pulavKey); next.delete(whiteKey); return next; });
            }
        }

        return (
            <div className={`cp-box-card${isSelected ? " cp-box-card--selected" : ""}`}>
                <button type="button" className="cp-box-header" onClick={handleCardClick}>
                    <span className="cp-box-icon">{isVeg ? "🥗" : "🍗"}</span>
                    <span className="cp-box-name">{opt.pricingItem.displayName}</span>
                    {opt.pricingItem.description && <span className="cp-box-desc">{opt.pricingItem.description}</span>}
                    <span className="cp-box-price">{money(opt.pricingItem.price)}</span>
                    <span className={`cp-badge ${isVeg ? "cp-badge-veg" : "cp-badge-nonveg"}`}>
                        {isVeg ? "Veg" : "Non-Veg"}
                    </span>
                    {isSelected
                        ? <span className="cp-box-check">✓ {totalQty} box{totalQty > 1 ? "es" : ""} · tap to remove</span>
                        : <span className="cp-box-add-hint">Tap to add</span>
                    }
                </button>

                {isSelected && (
                    <div className="cp-rice-controls">
                        {([["Pulav Rice", pulavKey, pulavQty], ["White Rice", whiteKey, whiteQty]] as [RiceChoice, string, number][]).map(([label, key, qty]) => (
                            <div key={key} className="cp-rice-row">
                                <span className="cp-rice-label">🍚 {label}</span>
                                <div className="cp-qty-stepper">
                                    <button type="button" className="cp-qty-btn" onClick={() => updateKey(key, -1)} disabled={qty === 0}>−</button>
                                    <span className="cp-qty-value">{qty}</span>
                                    <button type="button" className="cp-qty-btn" onClick={() => updateKey(key, 1)}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Special box card (no rice)
    function BoxCard({ opt }: { opt: BoxOption }) {
        const isVeg = opt.pricingItem.boxType.startsWith("veg");
        const isSelected = selectedBoxQtys.has(opt.key);
        return (
            <button
                type="button"
                className={`cp-box-card${isSelected ? " cp-box-card--selected" : ""}`}
                onClick={() => toggleBox(opt.key)}
            >
                <span className="cp-box-icon">{isVeg ? "🥗" : "🍗"}</span>
                <span className="cp-box-name">{opt.pricingItem.displayName}</span>
                {opt.pricingItem.description && <span className="cp-box-desc">{opt.pricingItem.description}</span>}
                <span className="cp-box-price">{money(opt.pricingItem.price)}</span>
                <span className={`cp-badge ${isVeg ? "cp-badge-veg" : "cp-badge-nonveg"}`}>
                    {isVeg ? "Veg Special" : "Non-Veg Special"}
                </span>
                {isSelected && <span className="cp-box-check">✓ Selected</span>}
            </button>
        );
    }

    if (loading) {
        return (
            <div className="cp-page">
                <div className="cp-card">
                    <div className="cp-muted" style={{ textAlign: "center", padding: "2rem 0" }}>Loading menu…</div>
                </div>
            </div>
        );
    }

    const hasSummary = selectedBoxQtys.size > 0 || selectedExtras.length > 0;

    return (
        <>
            <div className="cp-page cp-page-wide">
                <div className="cp-order-header">
                    <div>
                        <h1 className="cp-title" style={{ margin: 0 }}>Place Your Order</h1>
                        <p className="cp-subtitle" style={{ margin: "4px 0 0" }}>
                            Welcome, <strong>{customerName}</strong>
                        </p>
                    </div>
                    <button type="button" className="cp-link" onClick={() => { sessionStorage.clear(); navigate("/"); }}>
                        Sign out
                    </button>
                </div>

                <form onSubmit={onSubmit} className="cp-order-form">
                    <section className="cp-section">
                        <div className="cp-section-header">
                            <h2 className="cp-section-title">🍱 Choose Your Lunch Box</h2>
                            {showExtrasButton && (
                                <button type="button" className="cp-btn-secondary" onClick={() => setShowModal(true)}>
                                    + Extras
                                </button>
                            )}
                        </div>

                        {baseComfortBoxes.length === 0 ? (
                            <div className="cp-muted">No boxes available today.</div>
                        ) : (
                            <div className="cp-box-grid cp-box-grid--comfort">
                                {baseComfortBoxes.map(opt => (
                                    <ComfortBoxCard key={opt.key} opt={opt} />
                                ))}
                            </div>
                        )}

                        {isFriday && specialBoxes.length > 0 && (
                            <>
                                <div className="cp-friday-divider">⭐ Friday Specials</div>
                                <div className="cp-box-grid">
                                    {specialBoxes.map(opt => (
                                        <BoxCard key={opt.key} opt={opt} />
                                    ))}
                                </div>
                            </>
                        )}
                    </section>

                    <section className="cp-section">
                        <h2 className="cp-section-title">📍 Delivery Details</h2>
                        <div className="cp-field">
                            <span className="cp-label">Name</span>
                            <p className="cp-delivery-name"><strong>{customerName}</strong></p>
                        </div>
                        <div className="cp-field">
                            <label className="cp-label" htmlFor="address">Delivery Address *</label>
                            <select
                                id="address"
                                className="cp-input cp-select"
                                value={addressOption}
                                required
                                onChange={e => { setAddressOption(e.target.value); setCustomAddress(""); }}
                            >
                                <option value="">--Select--</option>
                                <option value="2900 Plano Pkwy">2900 Plano Pkwy</option>
                                <option value="3400 Plano Pkwy">3400 Plano Pkwy</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        {addressOption === "Other" && (
                            <div className="cp-field">
                                <label className="cp-label" htmlFor="customAddress">Custom Address *</label>
                                <input
                                    id="customAddress"
                                    className="cp-input"
                                    type="text"
                                    placeholder="Enter your delivery address"
                                    value={customAddress}
                                    onChange={e => setCustomAddress(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="cp-field">
                            <label className="cp-label" htmlFor="comments">
                                Special Instructions <span className="cp-muted">(optional)</span>
                            </label>
                            <textarea
                                id="comments"
                                className="cp-input cp-textarea"
                                placeholder="e.g. Less spice, extra rice…"
                                rows={2}
                                value={comments}
                                onChange={e => setComments(e.target.value)}
                            />
                        </div>
                    </section>

                    {hasSummary && (
                        <section className="cp-section cp-summary">
                            <h2 className="cp-section-title">🧾 Order Summary</h2>
                            {selectedBoxEntries.map(o => {
                                const qty = selectedBoxQtys.get(o.key) ?? 0;
                                return (
                                    <div key={o.key} className="cp-summary-row cp-summary-row--extra">
                                        <span className="cp-summary-item-name">
                                            {o.pricingItem.displayName}
                                            {o.riceType && <span className="cp-rice-tag">{o.riceType}</span>}
                                        </span>
                                        <div className="cp-qty-stepper">
                                            <button type="button" className="cp-qty-btn" onClick={() => updateKey(o.key, -1)} disabled={qty <= 1}>−</button>
                                            <span className="cp-qty-value">{qty}</span>
                                            <button type="button" className="cp-qty-btn" onClick={() => updateKey(o.key, 1)}>+</button>
                                        </div>
                                        <span className="cp-summary-item-price">{money(o.pricingItem.price * qty)}</span>
                                    </div>
                                );
                            })}
                            {selectedExtras.map(e => {
                                const qty = extraQuantities.get(e.id) ?? 0;
                                return (
                                    <div key={e.id} className="cp-summary-row cp-summary-row--extra">
                                        <span className="cp-summary-item-name">{e.name}</span>
                                        <div className="cp-qty-stepper">
                                            <button type="button" className="cp-qty-btn" onClick={() => updateExtraQty(e.id, -1)} disabled={qty <= 1}>−</button>
                                            <span className="cp-qty-value">{qty}</span>
                                            <button type="button" className="cp-qty-btn" onClick={() => updateExtraQty(e.id, 1)}>+</button>
                                        </div>
                                        <span className="cp-summary-item-price">+{money(e.price * qty)}</span>
                                    </div>
                                );
                            })}
                            {canUseMealPass && (
                                <div className="cp-meal-pass-row">
                                    <label className="cp-meal-pass-label">
                                        <input
                                            type="checkbox"
                                            checked={useMealPass}
                                            onChange={e => setUseMealPass(e.target.checked)}
                                        />
                                        <span>🎫 Apply Meal Pass</span>
                                        <span className="cp-muted" style={{ fontSize: "0.8rem" }}>
                                            {mealPass!.mealsRemaining} meals remaining · {comfortBoxCount} will be used
                                        </span>
                                    </label>
                                    {useMealPass && (
                                        <span className="cp-discount">−{money(discount)}</span>
                                    )}
                                </div>
                            )}
                            {mealPass && comfortBoxCount > 0 && !canUseMealPass && (
                                <div className="cp-meal-pass-warning">
                                    ⚠ Not enough meals on pass ({mealPass.mealsRemaining} remaining, {comfortBoxCount} needed)
                                </div>
                            )}
                            <div className="cp-summary-total">
                                <span>Total</span>
                                <span>{money(finalTotal)}</span>
                            </div>
                        </section>
                    )}

                    {error && <div className="cp-error">{error}</div>}

                    <button
                        className="cp-btn-primary cp-btn-large"
                        type="submit"
                        disabled={submitting || (selectedBoxQtys.size === 0 && selectedExtras.length === 0)}
                    >
                        {submitting ? "Placing Order…" : "Place Order"}
                    </button>
                </form>
            </div>

            {showModal && (
                <div className="cp-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="cp-modal" onClick={e => e.stopPropagation()}>
                        <div className="cp-modal-header">
                            <h2 className="cp-section-title" style={{ margin: 0 }}>Extras</h2>
                            <button type="button" className="cp-modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        {extraItems.length > 0 && (
                            <div className="cp-modal-section">
                                <div className="cp-modal-label">Available Items</div>
                                <div className="cp-extra-grid">
                                    {extraItems.map(item => {
                                        const isSelected = extraQuantities.has(item.id);
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className={`cp-extra-card${isSelected ? " cp-extra-card--selected" : ""}`}
                                                onClick={() => toggleExtra(item.id)}
                                            >
                                                <span className="cp-extra-name">{item.name}</span>
                                                <span className="cp-extra-price">+{money(item.price)}</span>
                                                {isSelected && <span className="cp-extra-check">✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <button type="button" className="cp-btn-primary" style={{ marginTop: "0.5rem" }} onClick={() => setShowModal(false)}>
                            Done
                        </button>
                    </div>
                </div>
            )}

            {showPastOrderModal && pastOrder && (
                <div className="cp-modal-overlay" onClick={() => setShowPastOrderModal(false)}>
                    <div className="cp-modal" onClick={e => e.stopPropagation()}>
                        <div className="cp-modal-header">
                            <h2 className="cp-section-title" style={{ margin: 0 }}>🕐 Your Previous Order</h2>
                            <button type="button" className="cp-modal-close" onClick={() => setShowPastOrderModal(false)}>✕</button>
                        </div>
                        <p className="cp-muted" style={{ margin: 0, fontSize: "0.875rem" }}>
                            Would you like to repeat items from your last order?
                        </p>
                        <div className="cp-past-order-items">
                            {(() => {
                                const riceBreakdown = parseRiceBreakdown(pastOrder.comments);
                                return pastOrder.items.flatMap(item => {
                                    if (item.menuItemName?.toLowerCase().includes("comfort box") && riceBreakdown.length > 0) {
                                        const normalized = normalizeName(item.menuItemName);
                                        const riceForItem = riceBreakdown.filter(r => normalizeName(r.name) === normalized);
                                        if (riceForItem.length > 0) {
                                            return riceForItem.map(r => (
                                                <div key={`${item.menuItemId}-${r.rice}`} className="cp-past-order-row">
                                                    <span className="cp-past-order-name">
                                                        {item.menuItemName}
                                                        <span className="cp-rice-tag" style={{ marginLeft: "0.4rem" }}>{r.rice}</span>
                                                    </span>
                                                    <span className="cp-past-order-qty">×{r.qty}</span>
                                                    <button type="button" className="cp-past-order-add" onClick={() => { addPastRiceItem(item, r.rice, r.qty); setShowPastOrderModal(false); }}>
                                                        + Add
                                                    </button>
                                                </div>
                                            ));
                                        }
                                    }
                                    return [(
                                        <div key={item.menuItemId} className="cp-past-order-row">
                                            <span className="cp-past-order-name">{item.menuItemName}</span>
                                            <span className="cp-past-order-qty">×{item.quantity}</span>
                                            <button type="button" className="cp-past-order-add" onClick={() => { addPastItem(item); setShowPastOrderModal(false); }}>
                                                + Add
                                            </button>
                                        </div>
                                    )];
                                });
                            })()}
                        </div>
                        <button type="button" className="cp-btn-primary" onClick={addAllPastItems}>
                            Add All to Order
                        </button>
                        <button type="button" className="cp-past-order-skip" style={{ alignSelf: "center" }} onClick={() => setShowPastOrderModal(false)}>
                            Skip, start fresh
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
