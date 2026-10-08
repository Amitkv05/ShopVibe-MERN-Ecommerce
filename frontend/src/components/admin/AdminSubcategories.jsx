import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, ImagePlus, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
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

const emptyAsset = { public_id: "", url: "" };
const blank = {
  name: "",
  slug: "",
  description: "",
  categoryRef: "",
  image: emptyAsset,
  sortOrder: "0",
  active: true,
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeAsset = (value) => ({
  public_id: value?.public_id || "",
  url: value?.url || "",
});

export default function AdminSubcategories() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [subcategoryData, categoryData] = await Promise.all([
        api("/admin/subcategories"),
        api("/admin/categories"),
      ]);
      setItems(subcategoryData.subcategories || []);
      setCategories(categoryData.categories || []);
    } catch (err) {
      setError(apiMessage(err, "Unable to load subcategories"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const categoryId = String(item.categoryRef?._id || item.categoryRef || "");
      const matchesCategory = !categoryFilter || categoryId === categoryFilter;
      const haystack = `${item.name || ""} ${item.slug || ""} ${item.categoryName || item.categoryRef?.name || ""}`.toLowerCase();
      return matchesCategory && (!needle || haystack.includes(needle));
    });
  }, [items, query, categoryFilter]);

  const openNew = () => {
    setEditing({ new: true });
    setForm({ ...blank, image: { ...emptyAsset } });
  };

  const openEdit = (subcategory) => {
    setEditing(subcategory);
    setForm({
      name: subcategory.name || "",
      slug: subcategory.slug || "",
      description: subcategory.description || "",
      categoryRef: String(subcategory.categoryRef?._id || subcategory.categoryRef || ""),
      image: normalizeAsset(subcategory.image),
      sortOrder: String(subcategory.sortOrder ?? 0),
      active: subcategory.active !== false,
    });
  };

  const uploadImage = async (files) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("images", file);
      const data = await api("/admin/media/images", { method: "POST", body: formData });
      const uploaded = data.images?.[0];
      if (!uploaded) throw new Error("Image upload did not return a file");

      const previous = form.image;
      const original = editing?.image;
      setForm((current) => ({ ...current, image: normalizeAsset(uploaded) }));

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
      window.alert(apiMessage(err, "Subcategory image upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    const image = form.image;
    if (!image?.url) return;
    const original = editing?.image;
    const unsaved = image.public_id && image.public_id !== original?.public_id;
    if (unsaved) {
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
    setForm((current) => ({ ...current, image: { ...emptyAsset } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        description: form.description.trim(),
        categoryRef: form.categoryRef,
        image: normalizeAsset(form.image),
        sortOrder: Number(form.sortOrder || 0),
        active: form.active,
      };

      if (!body.categoryRef) throw new Error("Select a parent category.");

      if (editing.new) {
        await api("/admin/subcategories", { method: "POST", body });
      } else {
        await api(`/admin/subcategories/${editing._id}`, { method: "PUT", body });
      }

      setEditing(null);
      await load();
    } catch (err) {
      window.alert(apiMessage(err, err?.message || "Subcategory could not be saved"));
    } finally {
      setSaving(false);
    }
  };

  const del = async (subcategory) => {
    if (!window.confirm(`Delete ${subcategory.name}? Products using it must be moved or the subcategory deactivated first.`)) return;
    try {
      await api(`/admin/subcategories/${subcategory._id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      window.alert(apiMessage(err, "Subcategory could not be deleted"));
    }
  };

  if (loading) return <AdminLoading label="Loading subcategories…" />;
  if (error) return <AdminError message={error} retry={() => void load()} />;

  return (
    <>
      <Panel
        title="Subcategories"
        subtitle={`${items.length} subcategories across ${categories.length} categories`}
        actions={
          <>
            <div className="sv-admsubcategories-001">
              <Search size={15} className="sv-admsubcategories-002" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search subcategories"
                className="sv-admsubcategories-003"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="sv-admsubcategories-004"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
            <AdminButton tone="ghost" onClick={() => void load()}><RefreshCw size={15} />Refresh</AdminButton>
            <AdminButton onClick={openNew}><Plus size={15} />Add subcategory</AdminButton>
          </>
        }
      >
        {filtered.length ? (
          <div className="sv-admsubcategories-005">
            <table className="sv-admsubcategories-006">
              <thead>
                <tr className="sv-admsubcategories-007">
                  <th className="sv-admsubcategories-008">Subcategory</th>
                  <th className="sv-admsubcategories-008">Parent category</th>
                  <th className="sv-admsubcategories-008">Order</th>
                  <th className="sv-admsubcategories-008">Status</th>
                  <th className="sv-admsubcategories-009">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((subcategory) => (
                  <tr key={subcategory._id} className="sv-admsubcategories-010">
                    <td className="sv-admsubcategories-011">
                      <div className="sv-admsubcategories-012">
                        <div className="sv-admsubcategories-013">
                          {subcategory.image?.url ? (
                            <img src={subcategory.image.url} alt="" className="sv-admsubcategories-014" />
                          ) : (
                            <div className="sv-admsubcategories-015">🛍️</div>
                          )}
                        </div>
                        <div>
                          <p className="sv-admsubcategories-016">{subcategory.name}</p>
                          <p className="sv-admsubcategories-017">/{subcategory.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td>{subcategory.categoryName || subcategory.categoryRef?.name || "—"}</td>
                    <td>{subcategory.sortOrder ?? 0}</td>
                    <td><StatusPill tone={subcategory.active === false ? "neutral" : "success"}>{subcategory.active === false ? "Inactive" : "Active"}</StatusPill></td>
                    <td>
                      <div className="sv-admsubcategories-018">
                        <AdminButton tone="ghost" onClick={() => openEdit(subcategory)}><Edit2 size={14} /></AdminButton>
                        <AdminButton tone="danger" onClick={() => void del(subcategory)}><Trash2 size={14} /></AdminButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmpty message="No matching subcategories." />
        )}
      </Panel>

      {editing && (
        <AdminModal title={editing.new ? "Create subcategory" : "Edit subcategory"} onClose={() => setEditing(null)}>
          <div className="sv-admsubcategories-019">
            <AdminSelect
              label="Parent Category"
              required
              value={form.categoryRef}
              onChange={(event) => setForm((current) => ({ ...current, categoryRef: event.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </AdminSelect>

            <AdminField
              label="Subcategory Name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: editing.new ? slugify(event.target.value) : current.slug }))}
            />

            <AdminField
              label="Slug"
              required
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
            />

            <AdminTextArea
              label="Description"
              rows={4}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />

            <AdminField
              label="Display Order"
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
            />

            <div className="sv-admsubcategories-020">
              <div className="sv-admsubcategories-021">
                <div>
                  <p className="sv-admsubcategories-022">Subcategory Image</p>
                  <p className="sv-admsubcategories-023">Shown in the customer category browser.</p>
                </div>
                {form.image?.url && (
                  <button type="button" onClick={() => void removeImage()} className="sv-admsubcategories-024"><X size={16} /></button>
                )}
              </div>
              <div className="sv-admsubcategories-025">
                {form.image?.url ? <img src={form.image.url} alt="" className="sv-admsubcategories-014" /> : <div className="sv-admsubcategories-026">No image</div>}
              </div>
              <label className="sv-admsubcategories-027">
                <ImagePlus size={15} />
                {uploading ? "Uploading…" : form.image?.url ? "Replace" : "Upload"}
                <input type="file" accept="image/*" className="sv-admsubcategories-028" disabled={uploading} onChange={(event) => void uploadImage(event.target.files)} />
              </label>
            </div>

            <label className="sv-admsubcategories-029">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
              Active
            </label>

            <div className="sv-admsubcategories-018">
              <AdminButton tone="ghost" onClick={() => setEditing(null)}>Cancel</AdminButton>
              <AdminButton loading={saving} onClick={() => void save()}>Save subcategory</AdminButton>
            </div>
          </div>
        </AdminModal>
      )}
    </>
  );
}
