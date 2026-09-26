import { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { AdminButton, AdminEmpty, AdminError, AdminField, AdminLoading, AdminModal, AdminSelect, AdminTextArea, Panel, StatusPill, money, shortDate } from "./AdminCommon";
const isoLocal = (v) => v ? new Date(v).toISOString().slice(0, 16) : "";
const blank = { code: "", description: "", type: "percent", value: "", minOrderAmount: "0", maxDiscountAmount: "", usageLimit: "", perUserLimit: "1", startsAt: new Date().toISOString().slice(0, 16), expiresAt: "", active: true };
export default function AdminCoupons() {
    const [items, setItems] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [editing, setEditing] = useState(null), [form, setForm] = useState(blank), [saving, setSaving] = useState(false);
    const load = useCallback(async () => { setLoading(true); setError(""); try {
        const d = await api("/admin/coupons");
        setItems(d.coupons || []);
    }
    catch (e) {
        setError(apiMessage(e, "Unable to load coupons"));
    }
    finally {
        setLoading(false);
    } }, []);
    useEffect(() => { void load(); }, [load]);
    const openNew = () => { setEditing({ new: true }); setForm(blank); };
    const openEdit = (c) => { setEditing(c); setForm({ code: c.code || "", description: c.description || "", type: c.type || "percent", value: String(c.value ?? ""), minOrderAmount: String(c.minOrderAmount ?? 0), maxDiscountAmount: c.maxDiscountAmount == null ? "" : String(c.maxDiscountAmount), usageLimit: c.usageLimit == null ? "" : String(c.usageLimit), perUserLimit: String(c.perUserLimit ?? 1), startsAt: isoLocal(c.startsAt), expiresAt: isoLocal(c.expiresAt), active: c.active !== false }); };
    const save = async () => { setSaving(true); try {
        const body = { code: form.code.trim().toUpperCase(), description: form.description.trim(), type: form.type, value: Number(form.value), minOrderAmount: Number(form.minOrderAmount || 0), perUserLimit: Number(form.perUserLimit || 1), startsAt: new Date(form.startsAt || Date.now()).toISOString(), expiresAt: new Date(form.expiresAt).toISOString(), active: form.active };
        if (form.maxDiscountAmount)
            body.maxDiscountAmount = Number(form.maxDiscountAmount);
        if (form.usageLimit)
            body.usageLimit = Number(form.usageLimit);
        if (editing.new)
            await api("/admin/coupons", { method: "POST", body });
        else
            await api(`/admin/coupons/${editing._id}`, { method: "PUT", body });
        setEditing(null);
        await load();
    }
    catch (e) {
        window.alert(apiMessage(e, "Coupon could not be saved"));
    }
    finally {
        setSaving(false);
    } };
    const del = async (c) => { if (!window.confirm(`Delete coupon ${c.code}?`))
        return; try {
        await api(`/admin/coupons/${c._id}`, { method: "DELETE" });
        await load();
    }
    catch (e) {
        window.alert(apiMessage(e, "Coupon could not be deleted"));
    } };
    if (loading)
        return <AdminLoading label="Loading coupons…"/>;
    if (error)
        return <AdminError message={error} retry={() => void load()}/>;
    return <><Panel title="Coupons" subtitle={`${items.length} coupons`} actions={<><AdminButton tone="ghost" onClick={() => void load()}><RefreshCw size={15}/>Refresh</AdminButton><AdminButton onClick={openNew}><Plus size={15}/>Add coupon</AdminButton></>}>
 {items.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-3">Code</th><th className="pb-3">Discount</th><th className="pb-3">Usage</th><th className="pb-3">Expiry</th><th className="pb-3">Status</th><th className="pb-3 text-right">Actions</th></tr></thead><tbody>{items.map(c => <tr key={c._id} className="border-t border-gray-100"><td className="py-3"><p className="font-bold">{c.code}</p><p className="text-xs text-gray-500">{c.description || "—"}</p></td><td>{c.type === "percent" ? `${c.value}%` : money(c.value)}{c.maxDiscountAmount ? ` (max ${money(c.maxDiscountAmount)})` : ""}</td><td>{c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ""}<p className="text-xs text-gray-500">{c.perUserLimit || 1}/user</p></td><td>{shortDate(c.expiresAt)}</td><td><StatusPill tone={c.active === false ? "neutral" : new Date(c.expiresAt) < new Date() ? "danger" : "success"}>{c.active === false ? "Inactive" : new Date(c.expiresAt) < new Date() ? "Expired" : "Active"}</StatusPill></td><td><div className="flex justify-end gap-2"><AdminButton tone="ghost" onClick={() => openEdit(c)}><Edit2 size={14}/></AdminButton><AdminButton tone="danger" onClick={() => void del(c)}><Trash2 size={14}/></AdminButton></div></td></tr>)}</tbody></table></div> : <AdminEmpty />}</Panel>
 {editing && <AdminModal title={editing.new ? "Create coupon" : "Edit coupon"} onClose={() => setEditing(null)}><div className="grid gap-4 sm:grid-cols-2"><AdminField label="Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}/><AdminSelect label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="percent">Percent</option><option value="fixed">Fixed</option></AdminSelect><AdminField label="Value" type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}/><AdminField label="Minimum order" type="number" min="0" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}/><AdminField label="Max discount (optional)" type="number" min="0" value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}/><AdminField label="Global usage limit (optional)" type="number" min="1" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}/><AdminField label="Per-user limit" type="number" min="1" value={form.perUserLimit} onChange={e => setForm(f => ({ ...f, perUserLimit: e.target.value }))}/><AdminField label="Starts at" type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}/><AdminField label="Expires at" type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}/><label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}/>Active</label></div><AdminTextArea label="Description" rows={3} className="mt-4" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/><div className="mt-5 flex justify-end gap-2"><AdminButton tone="ghost" onClick={() => setEditing(null)}>Cancel</AdminButton><AdminButton loading={saving} onClick={() => void save()} disabled={!form.code || !form.value || !form.expiresAt}>Save coupon</AdminButton></div></AdminModal>}
 </>;
}
