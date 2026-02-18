import { useEffect, useMemo, useState } from "react";

type Employee = {
    id: string;
    name: string;
    role?: string;
    phone?: string;
};

type HoursStatus = "DUE" | "PAID";

type HoursRow = {
    id: string;
    employeeId: string;
    weekOf: string; // YYYY-MM-DD
    hours: number;
    rate: number;
    total: number; // hours * rate
    status: HoursStatus;
    notes?: string;
};

function money(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

function calcTotal(hours: number, rate: number) {
    const h = Number(hours);
    const r = Number(rate);
    if (Number.isNaN(h) || Number.isNaN(r)) return 0;
    return Math.round(h * r * 100) / 100;
}

/** TEMP mock (replace with API later) */
const MOCK_EMPLOYEES: Employee[] = [
    { id: "e_1001", name: "Arjun", role: "Kitchen", phone: "xxx-xxx-1010" },
    { id: "e_1002", name: "Meera", role: "Delivery", phone: "xxx-xxx-2020" },
    { id: "e_1003", name: "Rohit", role: "Helper", phone: "xxx-xxx-3030" },
];

const MOCK_HOURS: HoursRow[] = [
    { id: "h_1", employeeId: "e_1001", weekOf: "2026-02-10", hours: 15, rate: 15, total: 225, status: "DUE" },
    { id: "h_2", employeeId: "e_1001", weekOf: "2026-02-03", hours: 10, rate: 15, total: 150, status: "PAID" },
    { id: "h_3", employeeId: "e_1003", weekOf: "2026-02-10", hours: 5, rate: 13.1, total: 65.5, status: "DUE" },
];

type HoursForm = {
    weekOf: string;
    hours: string; // keep string for inputs
    rate: string; // keep string for inputs
    status: HoursStatus;
    notes: string;
};

const emptyHoursForm: HoursForm = {
    weekOf: "",
    hours: "",
    rate: "",
    status: "DUE",
    notes: "",
};

export default function Employees() {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [query, setQuery] = useState("");

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const selectedEmployee = useMemo(
        () => employees.find((e) => e.id === selectedEmployeeId) ?? null,
        [employees, selectedEmployeeId]
    );

    // For this demo, keep all hours in state (later: fetch by employee)
    const [allHours, setAllHours] = useState<HoursRow[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);

    // Add/Edit
    const [addForm, setAddForm] = useState<HoursForm>(emptyHoursForm);
    const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
    const editingRow = useMemo(
        () => (editingHoursId ? allHours.find((h) => h.id === editingHoursId) ?? null : null),
        [allHours, editingHoursId]
    );
    const [editForm, setEditForm] = useState<HoursForm>(emptyHoursForm);

    async function fetchEmployees() {
        setLoading(true);
        try {
            await new Promise((r) => setTimeout(r, 120));
            setEmployees(MOCK_EMPLOYEES);
            setAllHours(MOCK_HOURS);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEmployees();
    }, []);

    // when opening employee panel, reset add form default week to current week (optional)
    useEffect(() => {
        if (!selectedEmployeeId) return;
        setAddForm((s) => ({ ...s, weekOf: s.weekOf || new Date().toISOString().slice(0, 10) }));
        setEditingHoursId(null);
    }, [selectedEmployeeId]);

    // when edit row changes, populate form
    useEffect(() => {
        if (!editingRow) return;
        setEditForm({
            weekOf: editingRow.weekOf,
            hours: String(editingRow.hours),
            rate: String(editingRow.rate),
            status: editingRow.status,
            notes: editingRow.notes ?? "",
        });
    }, [editingRow]);

    const filteredEmployees = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return employees;
        return employees.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
    }, [employees, query]);

    function employeeDue(employeeId: string) {
        return allHours
            .filter((h) => h.employeeId === employeeId && h.status === "DUE")
            .reduce((s, h) => s + h.total, 0);
    }

    const totalDue = filteredEmployees.reduce((s, e) => s + employeeDue(e.id), 0);

    const selectedHours = useMemo(() => {
        if (!selectedEmployeeId) return [];
        return allHours
            .filter((h) => h.employeeId === selectedEmployeeId)
            .sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1));
    }, [allHours, selectedEmployeeId]);

    function validateHoursForm(f: HoursForm): string | null {
        if (!f.weekOf) return "Week Of is required.";
        const h = Number(f.hours);
        const r = Number(f.rate);
        if (Number.isNaN(h) || h <= 0) return "Hours must be a number > 0.";
        if (Number.isNaN(r) || r <= 0) return "Rate must be a number > 0.";
        return null;
    }

    // CREATE
    async function onAddHours() {
        if (!selectedEmployeeId) return;
        const msg = validateHoursForm(addForm);
        if (msg) return alert(msg);

        setBusyId("add");
        try {
            const hours = Number(addForm.hours);
            const rate = Number(addForm.rate);

            const newRow: HoursRow = {
                id: `h_${Math.random().toString(16).slice(2, 8)}`,
                employeeId: selectedEmployeeId,
                weekOf: addForm.weekOf,
                hours,
                rate,
                total: calcTotal(hours, rate),
                status: addForm.status,
                notes: addForm.notes.trim() || undefined,
            };

            // TODO later: POST /api/v1/employees/{id}/hours
            await new Promise((r) => setTimeout(r, 180));
            setAllHours((prev) => [newRow, ...prev]);

            setAddForm({ ...emptyHoursForm, weekOf: addForm.weekOf, status: "DUE" });
        } finally {
            setBusyId(null);
        }
    }

    // UPDATE
    async function onSaveEdit() {
        if (!editingRow) return;
        const msg = validateHoursForm(editForm);
        if (msg) return alert(msg);

        setBusyId(editingRow.id);
        try {
            const hours = Number(editForm.hours);
            const rate = Number(editForm.rate);

            // TODO later: PATCH /api/v1/hours/{hoursId}
            await new Promise((r) => setTimeout(r, 180));

            setAllHours((prev) =>
                prev.map((h) =>
                    h.id === editingRow.id
                        ? {
                            ...h,
                            weekOf: editForm.weekOf,
                            hours,
                            rate,
                            total: calcTotal(hours, rate),
                            status: editForm.status,
                            notes: editForm.notes.trim() || undefined,
                        }
                        : h
                )
            );

            setEditingHoursId(null);
        } finally {
            setBusyId(null);
        }
    }

    // DELETE
    async function onDeleteHours(row: HoursRow) {
        const ok = window.confirm(`Delete hours for week ${row.weekOf}?`);
        if (!ok) return;

        setBusyId(row.id);
        try {
            // TODO later: DELETE /api/v1/hours/{hoursId}
            await new Promise((r) => setTimeout(r, 160));
            setAllHours((prev) => prev.filter((h) => h.id !== row.id));
            if (editingHoursId === row.id) setEditingHoursId(null);
        } finally {
            setBusyId(null);
        }
    }

    // MARK PAID
    async function onMarkPaid(row: HoursRow) {
        if (row.status === "PAID") return;

        setBusyId(row.id);
        try {
            // TODO later: PATCH /api/v1/hours/{hoursId}/status  body: {status:"PAID"}
            await new Promise((r) => setTimeout(r, 180));
            setAllHours((prev) => prev.map((h) => (h.id === row.id ? { ...h, status: "PAID" } : h)));
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="av-grid" style={{ gap: "var(--space-3)" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>Employees</h2>
                    <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: 6 }}>
                        Track weekly hours and payouts.
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                        className="av-input"
                        style={{ width: 260 }}
                        placeholder="Search employee..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className="av-btn" onClick={fetchEmployees} disabled={loading}>
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                    <button className="av-btn-primary" onClick={() => alert("Add Employee (next)")}>
                        + Add Employee
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="av-grid cards">
                <div className="av-card av-metric av-metric-primary">
                    <div className="av-metric-label">Employees</div>
                    <div className="av-metric-value">{loading ? "—" : filteredEmployees.length}</div>
                    <div className="av-metric-sub">Total employees</div>
                </div>

                <div className="av-card av-metric av-metric-accent">
                    <div className="av-metric-label">Total Due</div>
                    <div className="av-metric-value">{loading ? "—" : money(totalDue)}</div>
                    <div className="av-metric-sub">Due across all employees</div>
                </div>
            </div>

            {/* Employees Table */}
            <div className="av-card">
                <div style={{ fontWeight: 900, marginBottom: 12 }}>Employee List</div>

                <div style={{ overflowX: "auto" }}>
                    <table className="av-table">
                        <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            <th>Phone</th>
                            <th>Due</th>
                            <th style={{ width: 240 }}>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} style={{ color: "var(--muted)" }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ color: "var(--muted)" }}>
                                    No employees found.
                                </td>
                            </tr>
                        ) : (
                            filteredEmployees.map((e) => (
                                <tr key={e.id} className={selectedEmployeeId === e.id ? "av-row-selected" : ""}>
                                    <td>
                                        <div style={{ fontWeight: 900 }}>{e.name}</div>
                                        <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>{e.id}</div>
                                    </td>
                                    <td style={{ color: "var(--muted)" }}>{e.role ?? "—"}</td>
                                    <td style={{ color: "var(--muted)" }}>{e.phone ?? "—"}</td>
                                    <td style={{ fontWeight: 900 }}>{money(employeeDue(e.id))}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            <button className="av-btn av-btn-edit" onClick={() => setSelectedEmployeeId(e.id)}>
                                                View Hours
                                            </button>
                                            <button className="av-btn av-btn-warning" onClick={() => alert("Pay screen (next)")}>
                                                Pay
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hours Panel */}
            {selectedEmployee ? (
                <div className="av-card" style={{ borderColor: "rgba(242,193,78,0.35)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontWeight: 900 }}>Weekly Hours — {selectedEmployee.name}</div>
                            <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                                {selectedEmployee.id} • Due: <b>{money(employeeDue(selectedEmployee.id))}</b>
                            </div>
                        </div>
                        <button className="av-btn" onClick={() => setSelectedEmployeeId(null)}>
                            Close
                        </button>
                    </div>

                    {/* Add Hours */}
                    <div className="av-card" style={{ marginTop: 14, background: "var(--panel-soft)" }}>
                        <div style={{ fontWeight: 900, marginBottom: 10 }}>Add Weekly Hours</div>

                        <div className="av-formGrid">
                            <div className="av-field av-col-3">
                                <label className="av-label">Week Of</label>
                                <input
                                    className="av-input"
                                    type="date"
                                    value={addForm.weekOf}
                                    onChange={(e) => setAddForm((s) => ({ ...s, weekOf: e.target.value }))}
                                />
                            </div>

                            <div className="av-field av-col-3">
                                <label className="av-label">Hours</label>
                                <input
                                    className="av-input"
                                    inputMode="decimal"
                                    placeholder="e.g., 12"
                                    value={addForm.hours}
                                    onChange={(e) => setAddForm((s) => ({ ...s, hours: e.target.value }))}
                                />
                            </div>

                            <div className="av-field av-col-3">
                                <label className="av-label">Rate</label>
                                <input
                                    className="av-input"
                                    inputMode="decimal"
                                    placeholder="e.g., 15"
                                    value={addForm.rate}
                                    onChange={(e) => setAddForm((s) => ({ ...s, rate: e.target.value }))}
                                />
                            </div>

                            <div className="av-field av-col-3">
                                <label className="av-label">Status</label>
                                <select
                                    className="av-select"
                                    value={addForm.status}
                                    onChange={(e) => setAddForm((s) => ({ ...s, status: e.target.value as HoursStatus }))}
                                >
                                    <option value="DUE">DUE</option>
                                    <option value="PAID">PAID</option>
                                </select>
                            </div>

                            <div className="av-field av-col-12">
                                <label className="av-label">Notes (optional)</label>
                                <input
                                    className="av-input"
                                    placeholder="Anything to note..."
                                    value={addForm.notes}
                                    onChange={(e) => setAddForm((s) => ({ ...s, notes: e.target.value }))}
                                />
                            </div>

                            <div className="av-actions av-col-12">
                                <button className="av-btn-primary" onClick={onAddHours} disabled={busyId === "add"}>
                                    {busyId === "add" ? "Saving..." : "Add Hours"}
                                </button>

                                <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                                    Total: <b>{money(calcTotal(Number(addForm.hours), Number(addForm.rate)))}</b>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hours Table */}
                    <div style={{ overflowX: "auto", marginTop: 14 }}>
                        <table className="av-table">
                            <thead>
                            <tr>
                                <th>Week Of</th>
                                <th>Hours</th>
                                <th>Rate</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th style={{ width: 320 }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {selectedHours.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ color: "var(--muted)" }}>
                                        No hours records yet.
                                    </td>
                                </tr>
                            ) : (
                                selectedHours.map((h) => (
                                    <tr key={h.id}>
                                        <td style={{ fontWeight: 800 }}>{h.weekOf}</td>
                                        <td>{h.hours}</td>
                                        <td>{money(h.rate)}</td>
                                        <td style={{ fontWeight: 900 }}>{money(h.total)}</td>
                                        <td>
                                            <span className="av-badge av-badge-muted">{h.status}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                                <button className="av-btn av-btn-edit" onClick={() => setEditingHoursId(h.id)}>
                                                    Edit
                                                </button>

                                                <button
                                                    className="av-btn av-btn-warning"
                                                    disabled={h.status === "PAID" || busyId === h.id}
                                                    onClick={() => onMarkPaid(h)}
                                                >
                                                    {busyId === h.id ? "Updating..." : h.status === "PAID" ? "Paid" : "Mark Paid"}
                                                </button>

                                                <button
                                                    className="av-btn av-btn-danger"
                                                    disabled={busyId === h.id}
                                                    onClick={() => onDeleteHours(h)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Edit Panel */}
                    {editingRow ? (
                        <div className="av-card" style={{ marginTop: 14, borderColor: "rgba(37,99,235,0.25)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <div>
                                    <div style={{ fontWeight: 900 }}>Edit Hours</div>
                                    <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                                        {editingRow.weekOf} • {editingRow.id}
                                    </div>
                                </div>
                                <button className="av-btn" onClick={() => setEditingHoursId(null)}>
                                    Close
                                </button>
                            </div>

                            <div className="av-formGrid" style={{ marginTop: 12 }}>
                                <div className="av-field av-col-3">
                                    <label className="av-label">Week Of</label>
                                    <input
                                        className="av-input"
                                        type="date"
                                        value={editForm.weekOf}
                                        onChange={(e) => setEditForm((s) => ({ ...s, weekOf: e.target.value }))}
                                    />
                                </div>

                                <div className="av-field av-col-3">
                                    <label className="av-label">Hours</label>
                                    <input
                                        className="av-input"
                                        inputMode="decimal"
                                        value={editForm.hours}
                                        onChange={(e) => setEditForm((s) => ({ ...s, hours: e.target.value }))}
                                    />
                                </div>

                                <div className="av-field av-col-3">
                                    <label className="av-label">Rate</label>
                                    <input
                                        className="av-input"
                                        inputMode="decimal"
                                        value={editForm.rate}
                                        onChange={(e) => setEditForm((s) => ({ ...s, rate: e.target.value }))}
                                    />
                                </div>

                                <div className="av-field av-col-3">
                                    <label className="av-label">Status</label>
                                    <select
                                        className="av-select"
                                        value={editForm.status}
                                        onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value as HoursStatus }))}
                                    >
                                        <option value="DUE">DUE</option>
                                        <option value="PAID">PAID</option>
                                    </select>
                                </div>

                                <div className="av-field av-col-12">
                                    <label className="av-label">Notes</label>
                                    <input
                                        className="av-input"
                                        value={editForm.notes}
                                        onChange={(e) => setEditForm((s) => ({ ...s, notes: e.target.value }))}
                                    />
                                </div>

                                <div className="av-actions av-col-12">
                                    <button className="av-btn-primary" onClick={onSaveEdit} disabled={busyId === editingRow.id}>
                                        {busyId === editingRow.id ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button className="av-btn" onClick={() => setEditingHoursId(null)}>
                                        Cancel
                                    </button>

                                    <div style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                                        Total: <b>{money(calcTotal(Number(editForm.hours), Number(editForm.rate)))}</b>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div style={{ marginTop: 10, color: "var(--muted)", fontSize: "var(--text-sm)" }}>
                        Hours CRUD is local for now. Later connect to backend endpoints (POST/PATCH/DELETE).
                    </div>
                </div>
            ) : null}
        </div>
    );
}
