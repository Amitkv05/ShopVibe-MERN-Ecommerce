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
    return <><Panel title="Orders" subtitle={`${orders.length} orders loaded`} actions={<><AdminSelect label="Status" value={status} onChange={e => setStatus(e.target.value)} className="sv-admorders-001"><option value="">All</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></AdminSelect><AdminButton tone="ghost" onClick={() => void load()}><RefreshCw size={15}/>Refresh</AdminButton></>}>
 {orders.length ? <div className="sv-admorders-002"><table className="sv-admorders-003"><thead><tr className="sv-admorders-004"><th className="sv-admorders-005">Order</th><th className="sv-admorders-005">Customer</th><th className="sv-admorders-005">Date</th><th className="sv-admorders-005">Total</th><th className="sv-admorders-005">Status</th><th className="sv-admorders-006">Actions</th></tr></thead><tbody>{orders.map(o => <tr key={o._id} className="sv-admorders-007"><td className="sv-admorders-008">…{String(o._id).slice(-8)}</td><td><p className="sv-admorders-009">{o.user?.name || "User"}</p><p className="sv-admorders-010">{o.user?.email || ""}</p></td><td>{shortDate(o.createdAt)}</td><td>{money(o.totalPrice, o.currency || "INR")}</td><td><StatusPill tone={tone(o.orderStatus)}>{o.orderStatus}</StatusPill></td><td><div className="sv-admorders-011"><AdminButton tone="ghost" onClick={() => void open(o._id)}><Eye size={14}/>View</AdminButton>{["Delivered", "Cancelled"].includes(o.orderStatus) && <AdminButton tone="danger" onClick={() => void del(o)}><Trash2 size={14}/></AdminButton>}</div></td></tr>)}</tbody></table></div> : <AdminEmpty />}</Panel>
 {selected && <AdminModal title={`Order …${String(selected._id).slice(-8)}`} onClose={() => setSelected(null)} wide><div className="sv-admorders-012"><div><h3 className="sv-admorders-013">Items</h3><div className="sv-admorders-014">{(selected.orderItems || []).map((i, idx) => <div key={`${i.product}-${idx}`} className="sv-admorders-015"><img src={i.image || "https://placehold.co/64x64?text=P"} className="sv-admorders-016" alt=""/><div className="sv-admorders-017"><p className="sv-admorders-018">{i.name}</p><p className="sv-admorders-010">Qty {i.quantity}{i.variantSku ? ` · ${i.variantSku}` : ""}</p></div><span className="sv-admorders-018">{money(Number(i.price) * Number(i.quantity), selected.currency || "INR")}</span></div>)}</div><div className="sv-admorders-019"><div className="sv-admorders-020"><span>Items</span><span>{money(selected.itemsPrice, selected.currency || "INR")}</span></div><div className="sv-admorders-020"><span>Discount</span><span>-{money(selected.discountPrice, selected.currency || "INR")}</span></div><div className="sv-admorders-021"><span>Total</span><span>{money(selected.totalPrice, selected.currency || "INR")}</span></div></div></div><div className="sv-admorders-022"><div className="sv-admorders-023"><p className="sv-admorders-010">Customer</p><p className="sv-admorders-018">{selected.user?.name || "User"}</p><p className="sv-admorders-024">{selected.user?.email || ""}</p></div><div className="sv-admorders-023"><p className="sv-admorders-010">Shipping</p><p className="sv-admorders-018">{selected.shippingInfo?.fullName}</p><p className="sv-admorders-025">{selected.shippingInfo?.address}, {selected.shippingInfo?.city}, {selected.shippingInfo?.state} {selected.shippingInfo?.pinCode}</p><p className="sv-admorders-024">{selected.shippingInfo?.phoneNo}</p></div><div className="sv-admorders-023"><div className="sv-admorders-026"><span className="sv-admorders-027">Status</span><StatusPill tone={tone(selected.orderStatus)}>{selected.orderStatus}</StatusPill></div><p className="sv-admorders-028">{selected.paymentMethod} · {selected.paymentInfo?.status || "pending"}</p></div>{selected.orderStatus === "Processing" && <><AdminField label="Status note / cancellation reason" value={note} onChange={e => setNote(e.target.value)}/><div className="sv-admorders-029"><AdminButton loading={busy} onClick={() => void update("Shipped")}>Mark shipped</AdminButton><AdminButton tone="danger" loading={busy} onClick={() => void update("Cancelled")}>Cancel order</AdminButton></div></>}{selected.orderStatus === "Shipped" && <><AdminField label="Delivery note" value={note} onChange={e => setNote(e.target.value)}/><AdminButton tone="success" loading={busy} onClick={() => void update("Delivered")}>Mark delivered</AdminButton></>}</div></div></AdminModal>}
 </>;
}
