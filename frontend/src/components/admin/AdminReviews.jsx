import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Star, Trash2 } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { AdminButton, AdminEmpty, AdminError, AdminLoading, AdminSelect, Panel, shortDate } from "./AdminCommon";
export default function AdminReviews() {
    const [products, setProducts] = useState([]), [productId, setProductId] = useState(""), [reviews, setReviews] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
    const loadProducts = useCallback(async () => { setLoading(true); setError(""); try {
        const d = await api("/admin/products?limit=50");
        const p = d.products || [];
        setProducts(p);
        if (p.length && !productId)
            setProductId(p[0]._id);
    }
    catch (e) {
        setError(apiMessage(e, "Unable to load products"));
    }
    finally {
        setLoading(false);
    } }, [productId]);
    useEffect(() => { void loadProducts(); }, [loadProducts]);
    const loadReviews = useCallback(async () => { if (!productId) {
        setReviews([]);
        return;
    } try {
        const d = await api(`/reviews?id=${encodeURIComponent(productId)}`);
        setReviews(d.reviews || []);
    }
    catch (e) {
        setError(apiMessage(e, "Unable to load reviews"));
    } }, [productId]);
    useEffect(() => { void loadReviews(); }, [loadReviews]);
    const del = async (r) => { if (!window.confirm("Delete this review?"))
        return; try {
        await api(`/reviews?productId=${encodeURIComponent(productId)}&id=${encodeURIComponent(r._id)}`, { method: "DELETE" });
        await loadReviews();
    }
    catch (e) {
        window.alert(apiMessage(e, "Review could not be deleted"));
    } };
    if (loading)
        return <AdminLoading label="Loading review moderation…"/>;
    if (error)
        return <AdminError message={error} retry={() => void loadProducts()}/>;
    return <Panel title="Review moderation" subtitle="Select a product and moderate its reviews" actions={<><AdminSelect label="Product" value={productId} onChange={e => setProductId(e.target.value)}>{products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</AdminSelect><AdminButton tone="ghost" onClick={() => void loadReviews()}><RefreshCw size={15}/>Refresh</AdminButton></>}>
 {reviews.length ? <div className="space-y-3">{reviews.map(r => <div key={r._id} className="rounded-2xl border border-gray-100 p-4"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><p className="font-semibold text-gray-900">{r.name || "User"}</p><span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Star size={13} fill="currentColor"/>{r.rating}</span></div><p className="mt-2 text-sm text-gray-700">{r.comment}</p><p className="mt-2 text-xs text-gray-400">{shortDate(r.createdAt)}</p></div><AdminButton tone="danger" onClick={() => void del(r)}><Trash2 size={14}/>Delete</AdminButton></div></div>)}</div> : <AdminEmpty message="No reviews for this product."/>}
 </Panel>;
}
