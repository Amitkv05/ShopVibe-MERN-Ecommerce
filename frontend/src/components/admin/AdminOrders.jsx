import { useCallback, useEffect, useState } from "react";
import { Eye, RefreshCw, Trash2 } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { AdminButton, AdminEmpty, AdminError, AdminField, AdminLoading, AdminModal, AdminSelect, Panel, StatusPill, money, shortDate } from "./AdminCommon";
const tone = (s) => s === "Delivered" ? "success" : s === "Cancelled" ? "danger" : s === "Shipped" ? "info" : "warning";
export default function AdminOrders() {
    const [orders, setOrders] = useState([]), [status, setStatus] = useState(""), [loading, setLoading] = useState(true), [error, setError] = useState(""), [selected, setSelected] = useState(null), [note, setNote] = useState(""), [busy, setBusy] = useState(false);
    const load = useCallback(async () => { setLoading(true); setError(""); try {
        const q = status ? `?limit=100&status=${encodeURIComponent(status)}` : "?limit=100";
        const d = await api(`/admin/orders${q}`);
        setOrders(d.orders || []);
    }
    catch (e) {
        setError(apiMessage(e, "Unable to load orders"));
    }
    finally {
        setLoading(false);
    } }, [status]);
    useEffect(() => { void load(); }, [load]);
    const open = async (id) => { try {
        const d = await api(`/admin/order/${id}`);
        setSelected(d.order);
        setNote("");
    }
    catch (e) {
        window.alert(apiMessage(e, "Unable to load order"));
    } };
    const update = async (next) => { if (!selected)
        return; setBusy(true); try {
        await api(`/admin/order/${selected._id}`, { method: "PUT", body: next === "Cancelled" ? { status: next, reason: note } : { status: next, note } });
        setSelected(null);
        await load();
    }
    catch (e) {
        window.alert(apiMessage(e, "Order could not be updated"));
    }
    finally {
        setBusy(false);
    } };
    const del = async (o) => { if (!window.confirm(`Delete order ${o._id}? Only Delivered/Cancelled orders are accepted by the backend.`))
        return; try {
        await api(`/admin/order/${o._id}`, { method: "DELETE" });
        await load();
    }
    catch (e) {
        window.alert(apiMessage(e, "Order could not be deleted"));
    } };
    if (loading)
        return <AdminLoading label="Loading orders…"/>;
    if (error)
        return <AdminError message={error} retry={() => void load()}/>;
    return <><Panel title="Orders" subtitle={`${orders.length} orders loaded`} actions={<><AdminSelect label="Status" value={status} onChange={e => setStatus(e.target.value)} className="py-2"><option value="">All</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></AdminSelect><AdminButton tone="ghost" onClick={() => void load()}><RefreshCw size={15}/>Refresh</AdminButton></>}>
 {orders.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Date</th><th className="pb-3">Total</th><th className="pb-3">Status</th><th className="pb-3 text-right">Actions</th></tr></thead><tbody>{orders.map(o => <tr key={o._id} className="border-t border-gray-100"><td className="py-3 font-mono text-xs">…{String(o._id).slice(-8)}</td><td><p className="font-medium">{o.user?.name || "User"}</p><p className="text-xs text-gray-500">{o.user?.email || ""}</p></td><td>{shortDate(o.createdAt)}</td><td>{money(o.totalPrice, o.currency || "INR")}</td><td><StatusPill tone={tone(o.orderStatus)}>{o.orderStatus}</StatusPill></td><td><div className="flex justify-end gap-2"><AdminButton tone="ghost" onClick={() => void open(o._id)}><Eye size={14}/>View</AdminButton>{["Delivered", "Cancelled"].includes(o.orderStatus) && <AdminButton tone="danger" onClick={() => void del(o)}><Trash2 size={14}/></AdminButton>}</div></td></tr>)}</tbody></table></div> : <AdminEmpty />}</Panel>
 {selected && <AdminModal title={`Order …${String(selected._id).slice(-8)}`} onClose={() => setSelected(null)} wide><div className="grid gap-5 lg:grid-cols-2"><div><h3 className="font-semibold mb-3">Items</h3><div className="space-y-2">{(selected.orderItems || []).map((i, idx) => <div key={`${i.product}-${idx}`} className="flex gap-3 rounded-xl border p-3"><img src={i.image || "https://placehold.co/64x64?text=P"} className="h-14 w-14 rounded-lg object-cover" alt=""/><div className="flex-1"><p className="font-semibold">{i.name}</p><p className="text-xs text-gray-500">Qty {i.quantity}{i.variantSku ? ` · ${i.variantSku}` : ""}</p></div><span className="font-semibold">{money(Number(i.price) * Number(i.quantity), selected.currency || "INR")}</span></div>)}</div><div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm"><div className="flex justify-between"><span>Items</span><span>{money(selected.itemsPrice, selected.currency || "INR")}</span></div><div className="flex justify-between"><span>Discount</span><span>-{money(selected.discountPrice, selected.currency || "INR")}</span></div><div className="mt-2 flex justify-between font-bold"><span>Total</span><span>{money(selected.totalPrice, selected.currency || "INR")}</span></div></div></div><div className="space-y-4"><div className="rounded-xl border p-4"><p className="text-xs text-gray-500">Customer</p><p className="font-semibold">{selected.user?.name || "User"}</p><p className="text-sm text-gray-500">{selected.user?.email || ""}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-gray-500">Shipping</p><p className="font-semibold">{selected.shippingInfo?.fullName}</p><p className="text-sm text-gray-600">{selected.shippingInfo?.address}, {selected.shippingInfo?.city}, {selected.shippingInfo?.state} {selected.shippingInfo?.pinCode}</p><p className="text-sm text-gray-500">{selected.shippingInfo?.phoneNo}</p></div><div className="rounded-xl border p-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">Status</span><StatusPill tone={tone(selected.orderStatus)}>{selected.orderStatus}</StatusPill></div><p className="mt-2 text-sm text-gray-500">{selected.paymentMethod} · {selected.paymentInfo?.status || "pending"}</p></div>{selected.orderStatus === "Processing" && <><AdminField label="Status note / cancellation reason" value={note} onChange={e => setNote(e.target.value)}/><div className="flex gap-2"><AdminButton loading={busy} onClick={() => void update("Shipped")}>Mark shipped</AdminButton><AdminButton tone="danger" loading={busy} onClick={() => void update("Cancelled")}>Cancel order</AdminButton></div></>}{selected.orderStatus === "Shipped" && <><AdminField label="Delivery note" value={note} onChange={e => setNote(e.target.value)}/><AdminButton tone="success" loading={busy} onClick={() => void update("Delivered")}>Mark delivered</AdminButton></>}</div></div></AdminModal>}
 </>;
}
