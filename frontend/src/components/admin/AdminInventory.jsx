import { useCallback, useEffect, useState } from "react";
import { History, RefreshCw, SlidersHorizontal } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { AdminButton, AdminEmpty, AdminError, AdminField, AdminLoading, AdminModal, AdminSelect, Panel, StatusPill, shortDate } from "./AdminCommon";
export default function AdminInventory() {
    const [low, setLow] = useState([]), [products, setProducts] = useState([]), [logs, setLogs] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
    const [adjust, setAdjust] = useState(null), [delta, setDelta] = useState(""), [sku, setSku] = useState(""), [reason, setReason] = useState("Admin stock adjustment"), [saving, setSaving] = useState(false);
    const load = useCallback(async () => { setLoading(true); setError(""); try {
        const [l, p, h] = await Promise.all([api("/admin/inventory/low-stock"), api("/admin/products?limit=50"), api("/admin/inventory/history?limit=50")]);
        setLow(l.products || []);
        setProducts(p.products || []);
        setLogs(h.logs || []);
    }
    catch (e) {
        setError(apiMessage(e, "Unable to load inventory"));
    }
    finally {
        setLoading(false);
    } }, []);
    useEffect(() => { void load(); }, [load]);
    const save = async () => { if (!adjust)
        return; setSaving(true); try {
        await api(`/admin/inventory/${adjust._id}`, { method: "PATCH", body: { variantSku: sku || undefined, delta: Number(delta), reason } });
        setAdjust(null);
        setDelta("");
        setSku("");
        await load();
    }
    catch (e) {
        window.alert(apiMessage(e, "Inventory could not be adjusted"));
    }
    finally {
        setSaving(false);
    } };
    if (loading)
        return <AdminLoading label="Loading inventory…"/>;
    if (error)
        return <AdminError message={error} retry={() => void load()}/>;
    return <div className="sv-adminventory-001"><Panel title="Low-stock products" subtitle="Products or variants at/below their threshold" actions={<><AdminButton tone="ghost" onClick={() => void load()}><RefreshCw size={15}/>Refresh</AdminButton><AdminButton onClick={() => setAdjust(products[0] || null)} disabled={!products.length}><SlidersHorizontal size={15}/>Adjust stock</AdminButton></>}>
  {low.length ? <div className="sv-adminventory-002">{low.map(p => <div key={p._id} className="sv-adminventory-003"><div className="sv-adminventory-004"><div><p className="sv-adminventory-005">{p.name}</p><p className="sv-adminventory-006">SKU {p.sku || "—"} · threshold {p.lowStockThreshold}</p></div><StatusPill tone="warning">Low stock</StatusPill></div><div className="sv-adminventory-007"><span className="sv-adminventory-008">Base: {p.stock}</span>{(p.lowVariants || []).map((v) => <span key={v.sku} className="sv-adminventory-008">{v.sku}: {v.stock}</span>)}</div><AdminButton tone="ghost" className="sv-adminventory-009" onClick={() => { setAdjust(p); setSku(""); }}>Adjust</AdminButton></div>)}</div> : <AdminEmpty message="No low-stock products."/>}
 </Panel>
 <Panel title="Inventory history" subtitle="Latest 50 stock movements" actions={<History size={17} className="sv-adminventory-010"/>}>{logs.length ? <div className="sv-adminventory-011"><table className="sv-adminventory-012"><thead><tr className="sv-adminventory-013"><th className="sv-adminventory-014">When</th><th className="sv-adminventory-014">Product</th><th className="sv-adminventory-014">SKU</th><th className="sv-adminventory-014">Delta</th><th className="sv-adminventory-014">Stock</th><th className="sv-adminventory-014">Reason</th></tr></thead><tbody>{logs.map(l => <tr key={l._id} className="sv-adminventory-015"><td className="sv-adminventory-016">{shortDate(l.createdAt)}</td><td>{l.product?.name || "Deleted product"}</td><td>{l.variantSku || "Base"}</td><td className={Number(l.delta) >= 0 ? "sv-adminventory-017" : "sv-adminventory-018"}>{Number(l.delta) >= 0 ? "+" : ""}{l.delta}</td><td>{l.previousStock ?? "—"} → {l.newStock ?? "—"}</td><td>{l.reason}</td></tr>)}</tbody></table></div> : <AdminEmpty />}</Panel>
 {adjust && <AdminModal title="Adjust inventory" onClose={() => setAdjust(null)}><div className="sv-adminventory-019"><AdminSelect label="Product" value={adjust._id} onChange={e => { const p = products.find(x => x._id === e.target.value); setAdjust(p); setSku(""); }}>{products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</AdminSelect>{adjust.variants?.length > 0 && <AdminSelect label="Variant (optional — blank adjusts base stock)" value={sku} onChange={e => setSku(e.target.value)}><option value="">Base stock</option>{adjust.variants.map((v) => <option key={v.sku} value={v.sku}>{v.sku} — {v.stock}</option>)}</AdminSelect>}<AdminField label="Delta" type="number" value={delta} onChange={e => setDelta(e.target.value)} placeholder="e.g. 10 or -3"/><AdminField label="Reason" value={reason} onChange={e => setReason(e.target.value)}/><p className="sv-adminventory-006">The backend prevents stock from going negative and writes an inventory audit record.</p><div className="sv-adminventory-020"><AdminButton tone="ghost" onClick={() => setAdjust(null)}>Cancel</AdminButton><AdminButton loading={saving} onClick={() => void save()} disabled={!delta || !reason.trim()}>Apply adjustment</AdminButton></div></div></AdminModal>}
 </div>;
}
