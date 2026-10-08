import { useCallback, useEffect, useState } from "react";
import { Box, IndianRupee, Package, RefreshCw, ShoppingCart, Users } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { AdminButton, AdminError, AdminLoading, Panel, StatusPill, money } from "./AdminCommon";
export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [system, setSystem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [a, s] = await Promise.all([api("/admin/analytics"), api("/admin/system")]);
            setData(a);
            setSystem(s);
        }
        catch (e) {
            setError(apiMessage(e, "Unable to load admin dashboard"));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { void load(); }, [load]);
    if (loading)
        return <AdminLoading label="Loading dashboard…"/>;
    if (error)
        return <AdminError message={error} retry={() => void load()}/>;
    const summary = data?.summary || {};
    const cards = [
        ["Revenue", money(summary.totalRevenue), IndianRupee], ["Orders", summary.totalOrders ?? 0, ShoppingCart],
        ["Customers", summary.users ?? 0, Users], ["Products", summary.products ?? 0, Package],
        ["Low stock", summary.lowStockProducts ?? 0, Box],
    ];
    return <div className="sv-admdashboard-001">
    <div className="sv-admdashboard-002"><AdminButton tone="ghost" onClick={() => void load()}><RefreshCw size={15}/>Refresh</AdminButton></div>
    <div className="sv-admdashboard-003">{cards.map(([label, value, Icon]) => <div key={label} className="sv-admdashboard-004"><div className="sv-admdashboard-005"><span className="sv-admdashboard-006">{label}</span><div className="sv-admdashboard-007"><Icon size={18}/></div></div><p className="sv-admdashboard-008">{value}</p></div>)}</div>
    <div className="sv-admdashboard-009">
      <Panel title="Order status" subtitle="Current analytics range">
        <div className="sv-admdashboard-010">{(data?.orderStats || []).map((row) => <div key={row._id} className="sv-admdashboard-011"><div><p className="sv-admdashboard-012">{row._id}</p><p className="sv-admdashboard-013">{row.count} orders</p></div><p className="sv-admdashboard-014">{money(row.revenue)}</p></div>)}{!(data?.orderStats || []).length && <p className="sv-admdashboard-006">No orders in this range.</p>}</div>
      </Panel>
      <Panel title="Top products" subtitle="By quantity sold">
        <div className="sv-admdashboard-010">{(data?.topProducts || []).map((row) => <div key={row._id || row.name} className="sv-admdashboard-015"><div><p className="sv-admdashboard-012">{row.name}</p><p className="sv-admdashboard-013">{row.quantity} sold</p></div><p className="sv-admdashboard-016">{money(row.revenue)}</p></div>)}{!(data?.topProducts || []).length && <p className="sv-admdashboard-006">No product sales yet.</p>}</div>
      </Panel>
    </div>
    <Panel title="System health" subtitle="Read-only backend diagnostics">
      <div className="sv-admdashboard-017">
        <div className="sv-admdashboard-018"><p className="sv-admdashboard-013">Database</p><div className="sv-admdashboard-019"><StatusPill tone={system?.database?.connected ? "success" : "danger"}>{system?.database?.connected ? "Connected" : "Disconnected"}</StatusPill></div><p className="sv-admdashboard-020">{system?.database?.name || "—"} · {system?.database?.pingMs ?? "—"} ms</p></div>
        <div className="sv-admdashboard-018"><p className="sv-admdashboard-013">Runtime</p><p className="sv-admdashboard-021">{system?.runtime?.node || "—"}</p><p className="sv-admdashboard-013">Uptime {Math.floor(Number(system?.runtime?.uptimeSeconds || 0) / 60)} min</p></div>
        <div className="sv-admdashboard-018"><p className="sv-admdashboard-013">Memory</p><p className="sv-admdashboard-021">{system?.runtime?.memoryMb?.heapUsed ?? "—"} MB heap</p><p className="sv-admdashboard-013">RSS {system?.runtime?.memoryMb?.rss ?? "—"} MB</p></div>
        <div className="sv-admdashboard-018"><p className="sv-admdashboard-013">Features</p><div className="sv-admdashboard-022">{Object.entries(system?.features || {}).map(([k, v]) => <StatusPill key={k} tone={v ? "success" : "neutral"}>{k}</StatusPill>)}</div></div>
      </div>
    </Panel>
  </div>;
}
