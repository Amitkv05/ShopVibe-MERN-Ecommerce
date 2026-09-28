import { useCallback, useEffect, useState } from "react";
import { Edit2, ImagePlus, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import {
  AdminButton,
  AdminEmpty,
  AdminError,
  AdminField,
  AdminLoading,
  AdminModal,
  AdminTextArea,
  Panel,
  StatusPill,
} from "./AdminCommon";

const emptyAsset = { public_id: "", url: "" };
const blank = {
  name: "",
  slug: "",
  description: "",
  image: emptyAsset,
  icon: emptyAsset,
  banner: emptyAsset,
  sortOrder: "0",
  active: true,
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeAsset = (value) => ({
  public_id: value?.public_id || "",
  url: value?.url || "",
});

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api("/admin/categories");
      setItems(data.categories || []);
    } catch (err) {
      setError(apiMessage(err, "Unable to load categories"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setEditing({ new: true });
    setForm({ ...blank, image: { ...emptyAsset }, icon: { ...emptyAsset }, banner: { ...emptyAsset } });
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      image: normalizeAsset(category.image),
      icon: normalizeAsset(category.icon),
      banner: normalizeAsset(category.banner),
      sortOrder: String(category.sortOrder ?? 0),
      active: category.active !== false,
    });
  };

  const uploadAsset = async (field, files) => {
    const file = files?.[0];
    if (!file) return;

    setUploading(field);

    try {
      const formData = new FormData();
      formData.append("images", file);

      const data = await api("/admin/media/images", {
        method: "POST",
        body: formData,
      });

      const uploaded = data.images?.[0];
      if (!uploaded) throw new Error("Image upload did not return a file");

      const previous = form[field];
      const original = editing?.[field];

      setForm((current) => ({
        ...current,
        [field]: normalizeAsset(uploaded),
      }));

      if (
        previous?.public_id &&
        previous.public_id !== original?.public_id &&
        previous.public_id !== uploaded.public_id
      ) {
        await api("/admin/media/image", {
          method: "DELETE",
          body: { public_id: previous.public_id },
        }).catch(() => undefined);
      }
    } catch (err) {
      window.alert(apiMessage(err, `${field === "icon" ? "Icon" : "Image"} upload failed`));
    } finally {
      setUploading("");
    }
  };

  const removeAsset = async (field) => {
    const asset = form[field];
    if (!asset?.url) return;

    const original = editing?.[field];
    const isUnsavedUpload =
      asset.public_id && asset.public_id !== original?.public_id;

    if (isUnsavedUpload) {
      try {
        await api("/admin/media/image", {
          method: "DELETE",
          body: { public_id: asset.public_id },
        });
      } catch (err) {
        window.alert(apiMessage(err, "Could not delete uploaded image"));
        return;
      }
    }

    setForm((current) => ({
      ...current,
      [field]: { ...emptyAsset },
    }));
  };

  const save = async () => {
    setSaving(true);

    try {
      const body = {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        description: form.description.trim(),
        image: normalizeAsset(form.image),
        icon: normalizeAsset(form.icon),
        banner: normalizeAsset(form.banner),
        sortOrder: Number(form.sortOrder || 0),
        active: form.active,
      };

      if (editing.new) {
        await api("/admin/categories", { method: "POST", body });
      } else {
        await api(`/admin/categories/${editing._id}`, {
          method: "PUT",
          body,
        });
      }

      setEditing(null);
      await load();
    } catch (err) {
      window.alert(apiMessage(err, "Category could not be saved"));
    } finally {
      setSaving(false);
    }
  };

  const del = async (category) => {
    if (
      !window.confirm(
        `Delete category ${category.name}? If products use it, the backend will require deactivation instead.`
      )
    ) {
      return;
    }

    try {
      await api(`/admin/categories/${category._id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      window.alert(apiMessage(err, "Category could not be deleted"));
    }
  };

  if (loading) return <AdminLoading label="Loading categories…" />;
  if (error) return <AdminError message={error} retry={() => void load()} />;

  return (
    <>
      <Panel
        title="Categories"
        subtitle={`${items.length} categories`}
        actions={
          <>
            <AdminButton tone="ghost" onClick={() => void load()}>
              <RefreshCw size={15} />
              Refresh
            </AdminButton>
            <AdminButton onClick={openNew}>
              <Plus size={15} />
              Add category
            </AdminButton>
          </>
        }
      >
        {items.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((category) => (
              <div
                key={category._id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="relative h-36 bg-gray-100 dark:bg-gray-800">
                  {category.image?.url ? (
                    <img
                      src={category.image.url}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      No category image
                    </div>
                  )}

                  {category.icon?.url && (
                    <div className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow dark:border-gray-800 dark:bg-gray-900">
                      <img
                        src={category.icon.url}
                        alt={`${category.name} icon`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        /{category.slug}
                      </p>
                    </div>
                    <StatusPill
                      tone={category.active === false ? "neutral" : "success"}
                    >
                      {category.active === false ? "Inactive" : "Active"}
                    </StatusPill>
                  </div>

                  <p className="mt-3 min-h-10 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                    {category.description || "No description"}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <AdminButton tone="ghost" onClick={() => openEdit(category)}>
                      <Edit2 size={14} />
                      Edit
                    </AdminButton>
                    <AdminButton tone="danger" onClick={() => void del(category)}>
                      <Trash2 size={14} />
                      Delete
                    </AdminButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmpty />
        )}
      </Panel>

      {editing && (
        <AdminModal
          title={editing.new ? "Create category" : "Edit category"}
          onClose={() => setEditing(null)}
        >
          <div className="space-y-4">
            <AdminField
              label="Name"
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: editing.new
                    ? slugify(event.target.value)
                    : current.slug,
                }))
              }
            />

            <AdminField
              label="Slug"
              required
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  slug: slugify(event.target.value),
                }))
              }
            />

            <AdminTextArea
              label="Description"
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <CategoryAssetField
                label="Category Image"
                help="Used on category cards and category browsing."
                asset={form.image}
                busy={uploading === "image"}
                onUpload={(files) => void uploadAsset("image", files)}
                onRemove={() => void removeAsset("image")}
              />

              <CategoryAssetField
                label="Category Icon"
                help="Small square icon shown beside the category name."
                asset={form.icon}
                busy={uploading === "icon"}
                onUpload={(files) => void uploadAsset("icon", files)}
                onRemove={() => void removeAsset("icon")}
                compact
              />
              <CategoryAssetField
                label="Category Banner"
                help="Optional hero image shown when customers browse this category."
                asset={form.banner}
                busy={uploading === "banner"}
                onUpload={(files) => void uploadAsset("banner", files)}
                onRemove={() => void removeAsset("banner")}
              />
              <AdminField
                label="Display Order"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
              />
              Active
            </label>

            <div className="flex justify-end gap-2">
              <AdminButton tone="ghost" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              <AdminButton loading={saving} onClick={() => void save()}>
                Save category
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}
    </>
  );
}

function CategoryAssetField({
  label,
  help,
  asset,
  busy,
  onUpload,
  onRemove,
  compact = false,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {label}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{help}</p>
        </div>

        {asset?.url && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            aria-label={`Remove ${label}`}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div
        className={`mt-3 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 ${
          compact ? "h-24 w-24" : "h-32 w-full"
        }`}
      >
        {asset?.url ? (
          <img
            src={asset.url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>

      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
        <ImagePlus size={15} />
        {busy ? "Uploading…" : asset?.url ? "Replace" : "Upload"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={(event) => onUpload(event.target.files)}
        />
      </label>
    </div>
  );
}
