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
    return <Panel title="Media" subtitle="Cloudinary upload/delete workspace. The backend does not expose a global Cloudinary listing endpoint, so this page shows images uploaded during this browser session." actions={<label className="sv-admmedia-001"><ImagePlus size={15}/>{busy ? "Uploading…" : "Upload images"}<input type="file" accept="image/*" multiple className="sv-admmedia-002" disabled={busy} onChange={e => void upload(e.target.files)}/></label>}>
 {images.length ? <div className="sv-admmedia-003">{images.map(img => <div key={img.public_id} className="sv-admmedia-004"><img src={img.url} alt="Uploaded media" className="sv-admmedia-005"/><div className="sv-admmedia-006"><p className="sv-admmedia-007" title={img.public_id}>{img.public_id}</p><AdminButton tone="danger" className="sv-admmedia-008" onClick={() => void del(img)}><Trash2 size={14}/>Delete</AdminButton></div></div>)}</div> : <AdminEmpty message="No images uploaded in this session yet."/>}
 </Panel>;
}
