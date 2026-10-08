import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  contentMode: "image",
  title: "",
  subtitle: "",
  badge: "",
  ctaText: "",
  ctaPath: "",
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
    contentMode: hasBannerText(banner) ? "content" : "image",
    title: banner.title || "",
    subtitle: banner.subtitle || "",
    badge: banner.badge || "",
    ctaText: banner.ctaText || "",
    ctaPath: banner.ctaPath || "",
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

function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function hasBannerText(banner) {
  return [banner?.badge, banner?.title, banner?.subtitle, banner?.ctaText].some(
    (value) => String(value ?? "").trim().length > 0,
  );
}

export default function AdminBanners() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyBanner);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const stats = useMemo(() => {
    const active = items.filter((item) => item.active !== false).length;
    const imageOnly = items.filter((item) => !hasBannerText(item)).length;

    return {
      total: items.length,
      active,
      imageOnly,
    };
  }, [items]);

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

  const closeEditor = () => {
    if (saving || uploading) return;
    setEditing(null);
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
    if (!image?.url || uploading) return;

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
    if (saving || uploading) return;

    setSaving(true);

    try {
      const imageOnly = form.contentMode === "image";
      const body = {
        // Empty strings are intentional for image-only banners.
        // They also let Edit switch an existing content banner back to image-only.
        title: imageOnly ? "" : String(form.title ?? "").trim(),
        subtitle: imageOnly ? "" : String(form.subtitle ?? "").trim(),
        badge: imageOnly ? "" : String(form.badge ?? "").trim(),
        ctaText: imageOnly ? "" : String(form.ctaText ?? "").trim(),
        ctaPath: imageOnly ? "" : String(form.ctaPath ?? "").trim(),
        image: form.image,
        overlayOpacity: imageOnly
          ? 0
          : clamp(form.overlayOpacity, 0, 0.9, 0.3),
        textX: clamp(form.textX, 10, 90, 30),
        textY: clamp(form.textY, 10, 90, 50),
        textAlign: form.textAlign || "left",
        sortOrder: Math.max(0, Number(form.sortOrder || 0)),
        active: form.active,
      };

      if (!body.image?.url) {
        throw new Error("Upload a banner image before saving");
      }

      if (!imageOnly && !hasBannerText(body)) {
        throw new Error(
          "Add at least one text field, or choose Image only banner.",
        );
      }

      if (editing?.new) {
        await api("/admin/banners", {
          method: "POST",
          body,
        });
      } else {
        await api(`/admin/banners/${editing._id}`, {
          method: "PUT",
          body,
        });
      }

      setEditing(null);
      await load();
    } catch (err) {
      window.alert(
        apiMessage(err, err?.message || "Banner could not be saved"),
      );
    } finally {
      setSaving(false);
    }
  };

  const del = async (banner) => {
    const label = banner.title || "Image-only banner";

    if (!window.confirm(`Delete banner “${label}”?`)) return;

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
        subtitle="Manage homepage hero banners, display order, content and CTA settings."
        actions={
          <div className="sv-admbanners-001">
            <AdminButton tone="ghost" onClick={() => void load()}>
              <RefreshCw size={15} />
              Refresh
            </AdminButton>

            <AdminButton onClick={openNew}>
              <Plus size={15} />
              Add banner
            </AdminButton>
          </div>
        }
      >
        <div className="sv-admbanners-002">
          <StatCard label="Total banners" value={stats.total} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Image only" value={stats.imageOnly} />
        </div>

        <div className="sv-admbanners-003">
          <span className="sv-admbanners-004">Flexible banners:</span> badge, title,
          subtitle and button are optional. You can keep only the image if you
          want a clean image-only banner.
        </div>

        {items.length ? (
          <div className="sv-admbanners-005">
            {items.map((banner) => (
              <article
                key={banner._id}
                className="admin-hover-group sv-admbanners-006"
              >
                <div className="sv-admbanners-007">
                  <BannerPreview banner={banner} compact />

                  <div className="sv-admbanners-008">
                    <StatusPill
                      tone={banner.active === false ? "neutral" : "success"}
                    >
                      {banner.active === false ? "Inactive" : "Active"}
                    </StatusPill>
                  </div>
                </div>

                <div className="sv-admbanners-009">
                  <div className="sv-admbanners-010">
                    <div className="sv-admbanners-011">
                      <h3 className="sv-admbanners-012">
                        {banner.title || "Image-only banner"}
                      </h3>

                      <p className="sv-admbanners-013">
                        {banner.subtitle ||
                          "No optional text content added to this banner."}
                      </p>
                    </div>
                  </div>

                  <div className="sv-admbanners-014">
                    <MetaPill>Order {banner.sortOrder ?? 0}</MetaPill>
                    <MetaPill>
                      {banner.ctaText ? `CTA: ${banner.ctaText}` : "No CTA"}
                    </MetaPill>
                    {banner.ctaPath ? (
                      <MetaPill>{banner.ctaPath}</MetaPill>
                    ) : null}
                  </div>

                  <div className="sv-admbanners-015">
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
              </article>
            ))}
          </div>
        ) : (
          <div className="sv-admbanners-016">
            <AdminEmpty message="No banners yet. Add the first homepage banner." />
          </div>
        )}
      </Panel>

      {editing && (
        <AdminModal
          title={editing.new ? "Create banner" : "Edit banner"}
          onClose={closeEditor}
          wide
        >
          <div className="sv-admbanners-017">
            <p className="sv-admbanners-018">Choose how this banner should work</p>
            <p className="sv-admbanners-019">
              You can save a clean image-only banner, or add title, subtitle, badge
              and CTA content over the image. The same choice is available while editing.
            </p>
          </div>

          <div className="sv-admbanners-075">
            <button
              type="button"
              className={`sv-admbanners-076 ${
                form.contentMode === "image"
                  ? "sv-admbanners-077"
                  : "sv-admbanners-078"
              }`}
              onClick={() =>
                setForm((current) => ({ ...current, contentMode: "image" }))
              }
            >
              <span className="sv-admbanners-079">
                <span className="sv-admbanners-080">01</span>
                <span className="sv-admbanners-083">IMAGE ONLY</span>
              </span>
              <strong className="sv-admbanners-081">Only banner image</strong>
              <span className="sv-admbanners-082">
                No title, subtitle, badge or button. The uploaded image is shown as-is.
              </span>
            </button>

            <button
              type="button"
              className={`sv-admbanners-076 ${
                form.contentMode === "content"
                  ? "sv-admbanners-077"
                  : "sv-admbanners-078"
              }`}
              onClick={() =>
                setForm((current) => ({ ...current, contentMode: "content" }))
              }
            >
              <span className="sv-admbanners-079">
                <span className="sv-admbanners-080">02</span>
                <span className="sv-admbanners-083">IMAGE + CONTENT</span>
              </span>
              <strong className="sv-admbanners-081">Banner with content</strong>
              <span className="sv-admbanners-082">
                Add any combination of badge, title, subtitle and CTA button.
              </span>
            </button>
          </div>

          <div className="sv-admbanners-020">
            <div className="sv-admbanners-021">
              <section className="sv-admbanners-022">
                <BannerEditor form={form} setForm={setForm} />
              </section>

              {form.contentMode === "content" ? (
              <section className="sv-admbanners-022">
                <SectionHeader
                  title="Optional banner content"
                  description="Add only the content you want to display over the banner image."
                  optional
                />

                <div className="sv-admbanners-023">
                  <AdminField
                    label="Badge text (optional)"
                    placeholder="Example: New Collection"
                    value={form.badge}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        badge: event.target.value,
                      }))
                    }
                  />

                  <AdminField
                    label="Title (optional)"
                    placeholder="Example: Summer Sale"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />

                  <AdminField
                    label="Button text (optional)"
                    placeholder="Example: Shop now"
                    value={form.ctaText}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        ctaText: event.target.value,
                      }))
                    }
                  />

                  <AdminField
                    label="Button destination (optional)"
                    placeholder="/shop, /categories, /wishlist"
                    value={form.ctaPath}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        ctaPath: event.target.value,
                      }))
                    }
                  />
                </div>

                <AdminTextArea
                  label="Subtitle (optional)"
                  rows={3}
                  className="sv-admbanners-024"
                  placeholder="Short supporting text for this banner"
                  value={form.subtitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subtitle: event.target.value,
                    }))
                  }
                />

                <p className="sv-admbanners-025">
                  Tip: if Button text is empty, no CTA button will be shown even
                  if a destination is entered.
                </p>
              </section>

              ) : (
                <section className="sv-admbanners-022 sv-admbanners-084">
                  <SectionHeader
                    title="Image-only banner"
                    description="No text or CTA will be displayed on the customer homepage."
                  />
                  <p>
                    Upload the banner image, choose its display order and active status,
                    then save. If this is an existing content banner, saving in this mode
                    removes its title, subtitle, badge and CTA.
                  </p>
                </section>
              )}

              <section className="sv-admbanners-022">
                <SectionHeader
                  title="Display settings"
                  description="Control text alignment, overlay darkness, order and visibility."
                />

                <div className="sv-admbanners-026">
                  {form.contentMode === "content" ? (
                    <>
                      <AdminSelect
                        label="Text alignment"
                        value={form.textAlign}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            textAlign: event.target.value,
                          }))
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
                    </>
                  ) : null}

                  <AdminField
                    label="Display order"
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="sv-admbanners-027">
                  <label className="sv-admbanners-028">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          active: event.target.checked,
                        }))
                      }
                      className="sv-admbanners-029"
                    />
                    Active banner
                  </label>

                  <span className="sv-admbanners-030">
                    {form.contentMode === "content"
                      ? `Text position: ${Math.round(Number(form.textX || 0))}% / ${Math.round(Number(form.textY || 0))}%`
                      : "Image-only mode · no overlay content"}
                  </span>
                </div>
              </section>
            </div>

            <aside className="sv-admbanners-031">
              <SectionHeader
                title="Banner image"
                description="Required · recommended size around 1600 × 650 px."
              />

              <div className="sv-admbanners-032">
                {form.image?.url ? (
                  <img
                    src={form.image.url}
                    alt="Banner upload preview"
                    className="sv-admbanners-033"
                  />
                ) : (
                  <div className="sv-admbanners-034">
                    <ImagePlus size={24} />
                    <span className="sv-admbanners-035">
                      No image uploaded
                    </span>
                    <span className="sv-admbanners-036">
                      Upload an image to save this banner
                    </span>
                  </div>
                )}
              </div>

              <div className="sv-admbanners-014">
                <label
                  className={`sv-admbanners-037 ${
                    uploading
                      ? "sv-admbanners-038"
                      : "sv-admbanners-039"
                  }`}
                >
                  <ImagePlus size={15} />
                  {uploading
                    ? "Uploading…"
                    : form.image?.url
                      ? "Replace image"
                      : "Upload image"}

                  <input
                    type="file"
                    accept="image/*"
                    className="sv-admbanners-040"
                    disabled={uploading}
                    onChange={(event) => {
                      void uploadImage(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>

                {form.image?.url && (
                  <AdminButton
                    tone="danger"
                    onClick={() => void removeImage()}
                    disabled={uploading}
                  >
                    <X size={14} />
                    Remove
                  </AdminButton>
                )}
              </div>

              <div className="sv-admbanners-041">
                {form.contentMode === "image"
                  ? "Image-only mode: only this image will appear on the homepage."
                  : "Content mode: use the live editor on the left to preview and position overlay text."}
              </div>
            </aside>
          </div>

          <div className="sv-admbanners-042">
            <AdminButton tone="ghost" onClick={closeEditor}>
              Cancel
            </AdminButton>

            <AdminButton
              loading={saving}
              disabled={uploading}
              onClick={() => void save()}
            >
              {editing.new
                ? form.contentMode === "image"
                  ? "Create image-only banner"
                  : "Create banner with content"
                : form.contentMode === "image"
                  ? "Save as image-only"
                  : "Save banner content"}
            </AdminButton>
          </div>
        </AdminModal>
      )}
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="sv-admbanners-043">
      <p className="sv-admbanners-044">
        {label}
      </p>
      <p className="sv-admbanners-045">
        {value}
      </p>
    </div>
  );
}

function MetaPill({ children }) {
  return (
    <span className="sv-admbanners-046">
      {children}
    </span>
  );
}

function SectionHeader({ title, description, optional = false }) {
  return (
    <div className="sv-admbanners-047">
      <div>
        <p className="sv-admbanners-048">
          {title}
        </p>
        {description ? (
          <p className="sv-admbanners-049">
            {description}
          </p>
        ) : null}
      </div>

      {optional ? (
        <span className="sv-admbanners-050">
          Optional
        </span>
      ) : null}
    </div>
  );
}

function BannerEditor({ form, setForm }) {
  const previewRef = useRef(null);
  const hasText = form.contentMode === "content" && hasBannerText(form);

  const updatePosition = (event) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.min(
      90,
      Math.max(10, ((event.clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.min(
      90,
      Math.max(10, ((event.clientY - rect.top) / rect.height) * 100),
    );

    setForm((current) => ({
      ...current,
      textX: x.toFixed(1),
      textY: y.toFixed(1),
    }));
  };

  return (
    <div>
      <div className="sv-admbanners-051">
        <div>
          <p className="sv-admbanners-048">
            Live banner editor
          </p>
          <p className="sv-admbanners-052">
            {form.contentMode === "content"
              ? "Drag the text block anywhere inside the preview."
              : "Image-only preview with no text or CTA overlay."}
          </p>
        </div>

        <span className="sv-admbanners-053">
          <Grip size={14} />
          {form.contentMode === "content" ? "Drag text" : "Image only"}
        </span>
      </div>

      <div
        ref={previewRef}
        className="sv-admbanners-054"
        onPointerDown={(event) => {
          if (form.contentMode !== "content") return;
          event.currentTarget.setPointerCapture(event.pointerId);
          updatePosition(event);
        }}
        onPointerMove={(event) => {
          if (
            form.contentMode === "content" &&
            event.currentTarget.hasPointerCapture(event.pointerId)
          ) {
            updatePosition(event);
          }
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
      >
        {form.image?.url ? (
          <img
            src={form.image.url}
            alt="Live banner preview"
            className="sv-admbanners-055"
            draggable={false}
          />
        ) : (
          <div className="sv-admbanners-056">
            <span className="sv-admbanners-057">
              Upload image to preview
            </span>
          </div>
        )}

        <div
          className="sv-admbanners-058"
          style={{
            opacity:
              form.contentMode === "content"
                ? clamp(form.overlayOpacity, 0, 0.9, 0.3)
                : 0,
          }}
        />

        <div
          className="sv-admbanners-059"
          style={{
            left: `${clamp(form.textX, 10, 90, 30)}%`,
            top: `${clamp(form.textY, 10, 90, 50)}%`,
            textAlign: form.textAlign,
            display: form.contentMode === "content" ? undefined : "none",
          }}
        >
          {form.badge && (
            <span className="sv-admbanners-060">
              {form.badge}
            </span>
          )}

          {form.title && (
            <h3 className="sv-admbanners-061">
              {form.title}
            </h3>
          )}

          {form.subtitle && (
            <p className="sv-admbanners-062">
              {form.subtitle}
            </p>
          )}

          {form.ctaText && (
            <span className="sv-admbanners-063">
              {form.ctaText}
            </span>
          )}

          {!hasText && (
            <span className="sv-admbanners-064">
              Image-only preview
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function BannerPreview({ banner, compact = false }) {
  const x = clamp(banner.textX, 10, 90, 30);
  const y = clamp(banner.textY, 10, 90, 50);
  const hasText = hasBannerText(banner);

  return (
    <div
      className={`sv-admbanners-065 ${
        compact ? "sv-admbanners-066" : "sv-admbanners-067"
      }`}
    >
      {banner.image?.url ? (
        <img
          src={banner.image.url}
          alt={banner.title || "Banner"}
          className="sv-admbanners-068"
        />
      ) : (
        <div className="sv-admbanners-056">
          <div className="sv-admbanners-069">
            <ImagePlus size={20} />
            Image unavailable
          </div>
        </div>
      )}

      <div
        className="sv-admbanners-058"
        style={{ opacity: clamp(banner.overlayOpacity, 0, 0.9, 0.3) }}
      />

      {hasText ? (
        <div
          className="sv-admbanners-070"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            textAlign: banner.textAlign || "left",
          }}
        >
          {banner.badge ? (
            <span className="sv-admbanners-071">
              {banner.badge}
            </span>
          ) : null}

          {banner.title ? (
            <p className="sv-admbanners-072">
              {banner.title}
            </p>
          ) : null}

          {banner.subtitle ? (
            <p className="sv-admbanners-073">
              {banner.subtitle}
            </p>
          ) : null}

          {banner.ctaText ? (
            <span className="sv-admbanners-074">
              {banner.ctaText}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
