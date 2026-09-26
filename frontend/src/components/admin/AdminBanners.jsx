import { useCallback, useEffect, useRef, useState } from "react";
import {
  Edit2,
  Grip,
  ImagePlus,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import {
  AdminButton,
  AdminEmpty,
  AdminError,
  AdminField,
  AdminLoading,
  AdminModal,
  AdminSelect,
  AdminTextArea,
  Panel,
  StatusPill,
} from "./AdminCommon";

const emptyImage = { public_id: "", url: "" };
const emptyBanner = {
  title: "",
  subtitle: "",
  badge: "",
  ctaText: "Shop Now",
  ctaPath: "/shop",
  image: emptyImage,
  overlayOpacity: "0.30",
  textX: "30",
  textY: "50",
  textAlign: "left",
  sortOrder: "0",
  active: true,
};

function formFromBanner(banner) {
  return {
    title: banner.title || "",
    subtitle: banner.subtitle || "",
    badge: banner.badge || "",
    ctaText: banner.ctaText || "Shop Now",
    ctaPath: banner.ctaPath || "/shop",
    image: {
      public_id: banner.image?.public_id || "",
      url: banner.image?.url || "",
    },
    overlayOpacity: String(banner.overlayOpacity ?? 0.3),
    textX: String(banner.textX ?? 30),
    textY: String(banner.textY ?? 50),
    textAlign: banner.textAlign || "left",
    sortOrder: String(banner.sortOrder ?? 0),
    active: banner.active !== false,
  };
}

export default function AdminBanners() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyBanner);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api("/admin/banners");
      setItems(data.banners || []);
    } catch (err) {
      setError(apiMessage(err, "Unable to load banners"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setEditing({ new: true });
    setForm({ ...emptyBanner, image: { ...emptyImage } });
  };

  const openEdit = (banner) => {
    setEditing(banner);
    setForm(formFromBanner(banner));
  };

  const uploadImage = async (files) => {
    const file = files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("images", file);

      const data = await api("/admin/media/images", {
        method: "POST",
        body: formData,
      });

      const image = data.images?.[0];
      if (!image) throw new Error("Image upload did not return a file");

      const previous = form.image;
      const original = editing?.image;

      setForm((current) => ({
        ...current,
        image: {
          public_id: image.public_id || "",
          url: image.url || "",
        },
      }));

      if (
        previous?.public_id &&
        previous.public_id !== original?.public_id &&
        previous.public_id !== image.public_id
      ) {
        await api("/admin/media/image", {
          method: "DELETE",
          body: { public_id: previous.public_id },
        }).catch(() => undefined);
      }
    } catch (err) {
      window.alert(apiMessage(err, "Banner image upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    const image = form.image;
    if (!image?.url) return;

    const original = editing?.image;
    if (image.public_id && image.public_id !== original?.public_id) {
      try {
        await api("/admin/media/image", {
          method: "DELETE",
          body: { public_id: image.public_id },
        });
      } catch (err) {
        window.alert(apiMessage(err, "Could not delete uploaded image"));
        return;
      }
    }

    setForm((current) => ({
      ...current,
      image: { ...emptyImage },
    }));
  };

  const save = async () => {
    setSaving(true);

    try {
      const body = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        badge: form.badge.trim(),
        ctaText: form.ctaText.trim() || "Shop Now",
        ctaPath: form.ctaPath.trim() || "/shop",
        image: form.image,
        overlayOpacity: Number(form.overlayOpacity || 0),
        textX: Number(form.textX || 0),
        textY: Number(form.textY || 0),
        textAlign: form.textAlign,
        sortOrder: Number(form.sortOrder || 0),
        active: form.active,
      };

      if (!body.title) throw new Error("Banner title is required");
      if (!body.image?.url) throw new Error("Upload a banner image before saving");

      if (editing.new) {
        await api("/admin/banners", { method: "POST", body });
      } else {
        await api(`/admin/banners/${editing._id}`, {
          method: "PUT",
          body,
        });
      }

      setEditing(null);
      await load();
    } catch (err) {
      window.alert(apiMessage(err, err?.message || "Banner could not be saved"));
    } finally {
      setSaving(false);
    }
  };

  const del = async (banner) => {
    if (!window.confirm(`Delete banner “${banner.title}”?`)) return;

    try {
      await api(`/admin/banners/${banner._id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      window.alert(apiMessage(err, "Banner could not be deleted"));
    }
  };

  if (loading) return <AdminLoading label="Loading banners…" />;
  if (error) return <AdminError message={error} retry={() => void load()} />;

  return (
    <>
      <Panel
        title="Banners"
        subtitle="Upload homepage banners, customize their text, and drag the text to the desired position."
        actions={
          <>
            <AdminButton tone="ghost" onClick={() => void load()}>
              <RefreshCw size={15} />
              Refresh
            </AdminButton>
            <AdminButton onClick={openNew}>
              <Plus size={15} />
              Add banner
            </AdminButton>
          </>
        }
      >
        {items.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((banner) => (
              <div
                key={banner._id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <BannerPreview banner={banner} compact />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {banner.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Order {banner.sortOrder ?? 0} · {banner.ctaPath || "/shop"}
                      </p>
                    </div>
                    <StatusPill tone={banner.active === false ? "neutral" : "success"}>
                      {banner.active === false ? "Inactive" : "Active"}
                    </StatusPill>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <AdminButton tone="ghost" onClick={() => openEdit(banner)}>
                      <Edit2 size={14} />
                      Edit
                    </AdminButton>
                    <AdminButton tone="danger" onClick={() => void del(banner)}>
                      <Trash2 size={14} />
                      Delete
                    </AdminButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmpty message="No banners yet. Add the first homepage banner." />
        )}
      </Panel>

      {editing && (
        <AdminModal
          title={editing.new ? "Create banner" : "Edit banner"}
          onClose={() => setEditing(null)}
          wide
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <BannerEditor form={form} setForm={setForm} />

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <AdminField
                  label="Badge text"
                  placeholder="Example: New Collection"
                  value={form.badge}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, badge: event.target.value }))
                  }
                />

                <AdminField
                  label="Button text"
                  value={form.ctaText}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, ctaText: event.target.value }))
                  }
                />

                <AdminField
                  label="Title"
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />

                <AdminField
                  label="Button destination"
                  placeholder="/shop, /new-arrivals, /categories"
                  value={form.ctaPath}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, ctaPath: event.target.value }))
                  }
                />
              </div>

              <AdminTextArea
                label="Subtitle"
                rows={3}
                className="mt-4"
                value={form.subtitle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subtitle: event.target.value }))
                }
              />

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <AdminSelect
                  label="Text alignment"
                  value={form.textAlign}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, textAlign: event.target.value }))
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </AdminSelect>

                <AdminField
                  label="Overlay darkness"
                  type="number"
                  min="0"
                  max="0.9"
                  step="0.05"
                  value={form.overlayOpacity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      overlayOpacity: event.target.value,
                    }))
                  }
                />

                <AdminField
                  label="Display order"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                />
              </div>

              <div className="mt-4 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, active: event.target.checked }))
                    }
                  />
                  Active banner
                </label>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Text position: {Math.round(Number(form.textX || 0))}% / {Math.round(Number(form.textY || 0))}%
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Banner image
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Recommended wide image, for example 1600 × 650 px.
              </p>

              <div className="mt-4 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                {form.image?.url ? (
                  <img
                    src={form.image.url}
                    alt="Banner upload preview"
                    className="aspect-[16/7] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/7] items-center justify-center text-sm text-gray-400">
                    No image uploaded
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                  <ImagePlus size={15} />
                  {uploading ? "Uploading…" : form.image?.url ? "Replace image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => void uploadImage(event.target.files)}
                  />
                </label>

                {form.image?.url && (
                  <AdminButton tone="danger" onClick={() => void removeImage()}>
                    <X size={14} />
                    Remove
                  </AdminButton>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <AdminButton tone="ghost" onClick={() => setEditing(null)}>
              Cancel
            </AdminButton>
            <AdminButton loading={saving} onClick={() => void save()}>
              {editing.new ? "Create banner" : "Save changes"}
            </AdminButton>
          </div>
        </AdminModal>
      )}
    </>
  );
}

function BannerEditor({ form, setForm }) {
  const previewRef = useRef(null);

  const updatePosition = (event) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.min(80, Math.max(20, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(90, Math.max(10, ((event.clientY - rect.top) / rect.height) * 100));

    setForm((current) => ({
      ...current,
      textX: x.toFixed(1),
      textY: y.toFixed(1),
    }));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Live banner editor
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Drag the text block anywhere inside the preview.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-300">
          <Grip size={14} /> Drag text
        </span>
      </div>

      <div
        ref={previewRef}
        className="relative aspect-[16/7] touch-none overflow-hidden rounded-2xl bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800"
        style={
          form.image?.url
            ? {
                backgroundImage: `url(${form.image.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updatePosition(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            updatePosition(event);
          }
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
      >
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: Number(form.overlayOpacity || 0) }}
        />

        <div
          className="absolute w-[min(78%,620px)] -translate-x-1/2 -translate-y-1/2 cursor-move select-none text-white"
          style={{
            left: `${Number(form.textX || 0)}%`,
            top: `${Number(form.textY || 0)}%`,
            textAlign: form.textAlign,
          }}
        >
          {form.badge && (
            <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {form.badge}
            </span>
          )}
          <h3 className="mt-2 text-xl font-black sm:text-3xl">
            {form.title || "Your banner title"}
          </h3>
          <p className="mt-2 line-clamp-2 text-xs text-white/85 sm:text-sm">
            {form.subtitle || "Banner subtitle will appear here."}
          </p>
          <span className="mt-3 inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-900">
            {form.ctaText || "Shop Now"}
          </span>
        </div>
      </div>
    </div>
  );
}

function BannerPreview({ banner, compact = false }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 ${
        compact ? "aspect-[16/7]" : "min-h-[320px]"
      }`}
      style={
        banner.image?.url
          ? {
              backgroundImage: `url(${banner.image.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: Number(banner.overlayOpacity ?? 0.3) }}
      />
      <div
        className="absolute w-[75%] -translate-x-1/2 -translate-y-1/2 text-white"
        style={{
          left: `${Number(banner.textX ?? 30)}%`,
          top: `${Number(banner.textY ?? 50)}%`,
          textAlign: banner.textAlign || "left",
        }}
      >
        {banner.badge && <p className="text-[10px] font-semibold">{banner.badge}</p>}
        <p className="mt-1 line-clamp-1 text-sm font-bold sm:text-lg">{banner.title}</p>
      </div>
    </div>
  );
}
