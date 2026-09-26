import { useCallback, useEffect, useState } from "react";
import { Edit2, RefreshCw, Trash2 } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { AdminButton, AdminEmpty, AdminError, AdminField, AdminLoading, AdminModal, AdminSelect, Panel, StatusPill, shortDate } from "./AdminCommon";
export default function AdminCustomers() {
    const [items, setItems] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [editing, setEditing] = useState(null), [form, setForm] = useState({ name: "", email: "", role: "user" }), [saving, setSaving] = useState(false);
    const load = useCallback(async () => { setLoading(true); setError(""); try {
        const d = await api("/admin/users?limit=100");
        setItems(d.users || []);
    }
    catch (e) {
        setError(apiMessage(e, "Unable to load customers"));
    }
    finally {
        setLoading(false);
    } }, []);
    useEffect(() => { void load(); }, [load]);
    const edit = (u) => { setEditing(u); setForm({ name: u.name || "", email: u.email || "", role: u.role || "user" }); };
    const save = async () => { if (!editing)
        return; setSaving(true); try {
        await api(`/admin/user/${editing._id}`, { method: "PUT", body: form });
        setEditing(null);
        await load();
    }
    catch (e) {
        window.alert(apiMessage(e, "User could not be updated"));
    }
    finally {
        setSaving(false);
    } };
    const del = async (u) => { if (!window.confirm(`Delete ${u.email}? This cannot be undone.`))
        return; try {
        await api(`/admin/user/${u._id}`, { method: "DELETE" });
        await load();
    }
    catch (e) {
        window.alert(apiMessage(e, "User could not be deleted"));
    } };
    if (loading)
        return <AdminLoading label="Loading customers…"/>;
    if (error)
        return <AdminError message={error} retry={() => void load()}/>;
    return <><Panel title="Customers" subtitle={`${items.length} users loaded`} actions={<AdminButton tone="ghost" onClick={() => void load()}><RefreshCw size={15}/>Refresh</AdminButton>}>{items.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-3">Customer</th><th className="pb-3">Role</th><th className="pb-3">Email</th><th className="pb-3">Verified</th><th className="pb-3">Created</th><th className="pb-3 text-right">Actions</th></tr></thead><tbody>{items.map(u => <tr key={u._id} className="border-t border-gray-100"><td className="py-3 font-semibold">{u.name}</td><td><StatusPill tone={u.role === "admin" ? "info" : "neutral"}>{u.role}</StatusPill></td><td>{u.email}</td><td><StatusPill tone={u.isEmailVerified ? "success" : "warning"}>{u.isEmailVerified ? "Verified" : "Pending"}</StatusPill></td><td>{shortDate(u.createdAt)}</td><td><div className="flex justify-end gap-2"><AdminButton tone="ghost" onClick={() => edit(u)}><Edit2 size={14}/>Edit</AdminButton><AdminButton tone="danger" onClick={() => void del(u)}><Trash2 size={14}/></AdminButton></div></td></tr>)}</tbody></table></div> : <AdminEmpty />}</Panel>{editing && <AdminModal title="Edit customer" onClose={() => setEditing(null)}><div className="space-y-4"><AdminField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/><AdminField label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/><AdminSelect label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}><option value="user">User</option><option value="admin">Admin</option></AdminSelect><p className="text-xs text-gray-500">Changing email makes the account unverified and sends a new verification email. Backend blocks deleting your currently logged-in admin account.</p><div className="flex justify-end gap-2"><AdminButton tone="ghost" onClick={() => setEditing(null)}>Cancel</AdminButton><AdminButton loading={saving} onClick={() => void save()}>Save user</AdminButton></div></div></AdminModal>}</>;
}
