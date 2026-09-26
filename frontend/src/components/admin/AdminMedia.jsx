import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { AdminButton, AdminEmpty, Panel } from "./AdminCommon";
export default function AdminMedia() {
    const [images, setImages] = useState([]), [busy, setBusy] = useState(false);
    const upload = async (files) => { if (!files?.length)
        return; setBusy(true); try {
        const fd = new FormData();
        Array.from(files).forEach(f => fd.append("images", f));
        const d = await api("/admin/media/images", { method: "POST", body: fd });
        setImages(x => [...(d.images || []), ...x]);
    }
    catch (e) {
        window.alert(apiMessage(e, "Upload failed"));
    }
    finally {
        setBusy(false);
    } };
    const del = async (img) => { if (!window.confirm("Delete this Cloudinary image?"))
        return; try {
        await api("/admin/media/image", { method: "DELETE", body: { public_id: img.public_id } });
        setImages(x => x.filter(i => i.public_id !== img.public_id));
    }
    catch (e) {
        window.alert(apiMessage(e, "Image could not be deleted"));
    } };
    return <Panel title="Media" subtitle="Cloudinary upload/delete workspace. The backend does not expose a global Cloudinary listing endpoint, so this page shows images uploaded during this browser session." actions={<label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700"><ImagePlus size={15}/>{busy ? "Uploading…" : "Upload images"}<input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={e => void upload(e.target.files)}/></label>}>
 {images.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{images.map(img => <div key={img.public_id} className="overflow-hidden rounded-2xl border border-gray-100"><img src={img.url} alt="Uploaded media" className="aspect-square w-full object-cover bg-gray-100"/><div className="p-3"><p className="truncate text-xs text-gray-500" title={img.public_id}>{img.public_id}</p><AdminButton tone="danger" className="mt-2 w-full" onClick={() => void del(img)}><Trash2 size={14}/>Delete</AdminButton></div></div>)}</div> : <AdminEmpty message="No images uploaded in this session yet."/>}
 </Panel>;
}
