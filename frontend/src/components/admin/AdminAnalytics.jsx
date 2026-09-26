import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { AdminButton, AdminError, AdminField, AdminLoading, Panel, money } from "./AdminCommon";
const dateInput = (d) => d.toISOString().slice(0, 10);
export default function AdminAnalytics() {
    const [from, setFrom] = useState(() => dateInput(new Date(Date.now() - 30 * 86400000))), [to, setTo] = useState(() => dateInput(new Date())), [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
    const load = useCallback(async () => { setLoading(true); setError(""); try {
        const d = await api(`/admin/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(`${to}T23:59:59.999`)}`);
        setData(d);
    }
    catch (e) {
        setError(apiMessage(e, "Unable to load analytics"));
    }
    finally {
        setLoading(false);
    } }, [from, to]);
    useEffect(() => { void load(); }, [load]);
    const maxRevenue = useMemo(() => Math.max(1, ...(data?.dailyRevenue || []).map((x) => Number(x.revenue || 0))), [data]);
    if (loading)
        return <AdminLoading label="Loading analytics…"/>;
    return <div className="space-y-5"><Panel title="Analytics" subtitle="Revenue, orders, top products and daily trend" actions={<><AdminField label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} className="py-2"/><AdminField label="To" type="date" value={to} onChange={e => setTo(e.target.value)} className="py-2"/><AdminButton tone="ghost" onClick={() => void load()}><RefreshCw size={15}/>Refresh</AdminButton></>}>{error ? <AdminError message={error}/> : <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["Revenue", money(data?.summary?.totalRevenue)], ["Orders", data?.summary?.totalOrders ?? 0], ["Users", data?.summary?.users ?? 0], ["Products", data?.summary?.products ?? 0], ["Low stock", data?.summary?.lowStockProducts ?? 0]].map(([k, v]) => <div key={String(k)} className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">{k}</p><p className="mt-2 text-xl font-bold">{v}</p></div>)}</div><div className="mt-6"><h3 className="mb-3 font-semibold">Daily revenue</h3><div className="space-y-2">{(data?.dailyRevenue || []).map((x) => <div key={x._id} className="grid grid-cols-[92px_1fr_auto] items-center gap-3 text-xs"><span className="text-gray-500">{x._id}</span><div className="h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(2, Number(x.revenue || 0) / maxRevenue * 100)}%` }}/></div><span className="font-semibold">{money(x.revenue)}</span></div>)}{!(data?.dailyRevenue || []).length && <p className="text-sm text-gray-500">No revenue in this period.</p>}</div></div></>}</Panel><Panel title="Top products"><div className="grid gap-3 md:grid-cols-2">{(data?.topProducts || []).map((x) => <div key={x._id || x.name} className="rounded-xl border p-4"><p className="font-semibold">{x.name}</p><div className="mt-2 flex justify-between text-sm text-gray-600"><span>{x.quantity} sold</span><span>{money(x.revenue)}</span></div></div>)}</div></Panel></div>;
}
