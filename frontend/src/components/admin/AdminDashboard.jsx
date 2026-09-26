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
    return <div className="space-y-5">
    <div className="flex justify-end"><AdminButton tone="ghost" onClick={() => void load()}><RefreshCw size={15}/>Refresh</AdminButton></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">{label}</span><div className="rounded-xl bg-violet-50 p-2 text-violet-600"><Icon size={18}/></div></div><p className="mt-3 text-2xl font-bold text-gray-900">{value}</p></div>)}</div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Order status" subtitle="Current analytics range">
        <div className="space-y-3">{(data?.orderStats || []).map((row) => <div key={row._id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3"><div><p className="font-semibold text-gray-800">{row._id}</p><p className="text-xs text-gray-500">{row.count} orders</p></div><p className="font-bold text-gray-900">{money(row.revenue)}</p></div>)}{!(data?.orderStats || []).length && <p className="text-sm text-gray-500">No orders in this range.</p>}</div>
      </Panel>
      <Panel title="Top products" subtitle="By quantity sold">
        <div className="space-y-3">{(data?.topProducts || []).map((row) => <div key={row._id || row.name} className="flex items-center justify-between rounded-xl border border-gray-100 p-3"><div><p className="font-semibold text-gray-800">{row.name}</p><p className="text-xs text-gray-500">{row.quantity} sold</p></div><p className="font-semibold">{money(row.revenue)}</p></div>)}{!(data?.topProducts || []).length && <p className="text-sm text-gray-500">No product sales yet.</p>}</div>
      </Panel>
    </div>
    <Panel title="System health" subtitle="Read-only backend diagnostics">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Database</p><div className="mt-2"><StatusPill tone={system?.database?.connected ? "success" : "danger"}>{system?.database?.connected ? "Connected" : "Disconnected"}</StatusPill></div><p className="mt-2 text-xs text-gray-500">{system?.database?.name || "—"} · {system?.database?.pingMs ?? "—"} ms</p></div>
        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Runtime</p><p className="mt-2 font-semibold">{system?.runtime?.node || "—"}</p><p className="text-xs text-gray-500">Uptime {Math.floor(Number(system?.runtime?.uptimeSeconds || 0) / 60)} min</p></div>
        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Memory</p><p className="mt-2 font-semibold">{system?.runtime?.memoryMb?.heapUsed ?? "—"} MB heap</p><p className="text-xs text-gray-500">RSS {system?.runtime?.memoryMb?.rss ?? "—"} MB</p></div>
        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Features</p><div className="mt-2 flex flex-wrap gap-1.5">{Object.entries(system?.features || {}).map(([k, v]) => <StatusPill key={k} tone={v ? "success" : "neutral"}>{k}</StatusPill>)}</div></div>
      </div>
    </Panel>
  </div>;
}
