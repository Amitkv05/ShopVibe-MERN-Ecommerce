import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Edit2,
  ImagePlus,
  Plus,
  RefreshCw,
  Search,
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
  money,
} from "./AdminCommon";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  categoryRef: "",
  subcategory: "",
  subcategoryRef: "",
  brand: "",
  sku: "",
  stock: "0",
  lowStockThreshold: "5",
  active: true,
  productType: "simple",
  sizeOptions: "",
  colorOptions: "",
  defaultVariantStock: "0",
  variants: [],
  images: [],
};

function parseOptions(value = "") {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

function skuPart(value = "") {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeBaseSku(form) {
  const fromSku = skuPart(form.sku);
  if (fromSku) return fromSku;

  const fromName = skuPart(form.name);
  return fromName ? fromName.slice(0, 12) : "PRODUCT";
}

function variantKey(size = "", color = "") {
  return `${size.trim().toLowerCase()}::${color.trim().toLowerCase()}`;
}

function getVariantSize(variant) {
  return String(variant?.attributes?.size || "");
}

function getVariantColor(variant) {
  return String(variant?.attributes?.color || "");
}

function formFromProduct(product) {
  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => ({
        ...variant,
        sku: variant.sku || "",
        stock: String(variant.stock ?? 0),
        active: variant.active !== false,
        attributes: {
          ...(variant.attributes || {}),
          size: getVariantSize(variant),
          color: getVariantColor(variant),
        },
      }))
    : [];

  const sizes = [
    ...new Set(variants.map(getVariantSize).filter(Boolean)),
  ];

  const colors = [
    ...new Set(variants.map(getVariantColor).filter(Boolean)),
  ];

  return {
    name: product.name || "",
    description: product.description || "",
    price: String(product.price ?? ""),
    category: product.category || "",
    categoryRef: String(product.categoryRef?._id || product.categoryRef || ""),
    subcategory: product.subcategory || "",
    subcategoryRef: String(product.subcategoryRef?._id || product.subcategoryRef || ""),
    brand: product.brand || "",
    sku: product.sku || "",
    stock: String(product.stock ?? 0),
    lowStockThreshold: String(product.lowStockThreshold ?? 5),
    active: product.active !== false,
    productType: variants.length ? "variant" : "simple",
    sizeOptions: sizes.join(", "),
    colorOptions: colors.join(", "),
    defaultVariantStock: String(variants[0]?.stock ?? 0),
    variants,
    images: (product.images || []).map((image) => ({
      public_id: image.public_id,
      url: image.url,
    })),
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [productData, categoryData, subcategoryData] = await Promise.all([
        api("/admin/products?limit=50"),
        api("/admin/categories"),
        api("/admin/subcategories"),
      ]);

      setProducts(productData.products || []);
      setCategories(categoryData.categories || []);
      setSubcategories(subcategoryData.subcategories || []);
    } catch (err) {
      setError(apiMessage(err, "Unable to load products"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return products.filter((product) =>
      `${product.name} ${product.brand || ""} ${product.category || ""} ${product.subcategory || ""} ${
        product.sku || ""
      }`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [products, query]);

  const availableSubcategories = useMemo(() => {
    if (!form.categoryRef) return [];
    return subcategories.filter((subcategory) =>
      String(subcategory.categoryRef?._id || subcategory.categoryRef || "") === form.categoryRef
    );
  }, [subcategories, form.categoryRef]);

  const openNew = () => {
    setEditing({ new: true });
    setForm(emptyForm);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm(formFromProduct(product));
  };

  const uploadFiles = async (files) => {
    if (!files?.length) return;

    setUploading(true);

    try {
      const formData = new FormData();

      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const data = await api("/admin/media/images", {
        method: "POST",
        body: formData,
      });

      setForm((current) => ({
        ...current,
        images: [...current.images, ...(data.images || [])],
      }));
    } catch (err) {
      window.alert(apiMessage(err, "Image upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index) => {
    const image = form.images[index];

    const existedBefore =
      !editing?.new &&
      (editing?.images || []).some(
        (oldImage) =>
          oldImage?.public_id &&
          oldImage.public_id === image?.public_id
      );

    if (image?.public_id && !existedBefore) {
      try {
        await api("/admin/media/image", {
          method: "DELETE",
          body: { public_id: image.public_id },
        });
      } catch (err) {
        window.alert(apiMessage(err, "Could not delete image"));
        return;
      }
    }

    setForm((current) => ({
      ...current,
      images: current.images.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const setProductType = (productType) => {
    setForm((current) => ({
      ...current,
      productType,
    }));
  };

  const generateVariants = () => {
    const sizes = parseOptions(form.sizeOptions);
    const colors = parseOptions(form.colorOptions);

    if (!sizes.length && !colors.length) {
      window.alert("Add at least one Size or Color option before generating variants.");
      return;
    }

    const sizeValues = sizes.length ? sizes : [""];
    const colorValues = colors.length ? colors : [""];
    const baseSku = makeBaseSku(form);

    const existingByKey = new Map(
      form.variants.map((variant) => [
        variantKey(getVariantSize(variant), getVariantColor(variant)),
        variant,
      ])
    );

    const nextVariants = [];

    sizeValues.forEach((size) => {
      colorValues.forEach((color) => {
        const key = variantKey(size, color);
        const existing = existingByKey.get(key);

        if (existing) {
          nextVariants.push(existing);
          return;
        }

        const parts = [
          baseSku,
          color ? skuPart(color) : "",
          size ? skuPart(size) : "",
        ].filter(Boolean);

        nextVariants.push({
          sku: parts.join("-"),
          attributes: {
            ...(size ? { size } : {}),
            ...(color ? { color } : {}),
          },
          stock: String(form.defaultVariantStock || 0),
          active: true,
        });
      });
    });

    setForm((current) => ({
      ...current,
      variants: nextVariants,
    }));
  };

  const addBlankVariant = () => {
    const baseSku = makeBaseSku(form);

    setForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          sku: `${baseSku}-${current.variants.length + 1}`,
          attributes: {
            size: "",
            color: "",
          },
          stock: String(form.defaultVariantStock || 0),
          active: true,
        },
      ],
    }));
  };

  const updateVariant = (index, changes) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              ...changes,
            }
          : variant
      ),
    }));
  };

  const updateVariantAttribute = (index, attribute, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              attributes: {
                ...(variant.attributes || {}),
                [attribute]: value,
              },
            }
          : variant
      ),
    }));
  };

  const removeVariant = (index) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter(
        (_, variantIndex) => variantIndex !== index
      ),
    }));
  };

  const save = async () => {
    setSaving(true);

    try {
      const variants =
        form.productType === "variant"
          ? form.variants.map((variant) => ({
              ...variant,
              sku: String(variant.sku || "").trim(),
              stock: Number(variant.stock || 0),
              active: variant.active !== false,
              attributes: Object.fromEntries(
                Object.entries(variant.attributes || {}).filter(
                  ([, value]) => String(value || "").trim()
                )
              ),
            }))
          : [];

      if (form.productType === "variant") {
        if (!variants.length) {
          throw new Error(
            "Generate or add at least one variant before saving this product."
          );
        }

        const missingSku = variants.some((variant) => !variant.sku);

        if (missingSku) {
          throw new Error("Every variant must have a SKU.");
        }

        const skuList = variants.map((variant) =>
          variant.sku.toLowerCase()
        );

        if (new Set(skuList).size !== skuList.length) {
          throw new Error("Variant SKUs must be unique inside the product.");
        }

        const invalidStock = variants.some(
          (variant) =>
            !Number.isFinite(variant.stock) || Number(variant.stock) < 0
        );

        if (invalidStock) {
          throw new Error("Variant stock must be 0 or greater.");
        }
      }

      const selectedCategory = categories.find(
        (category) => String(category._id) === form.categoryRef
      );

      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: selectedCategory?.name || form.category.trim(),
        subcategory: form.subcategory.trim(),
        subcategoryRef: form.subcategoryRef || null,
        brand: form.brand.trim() || undefined,
        sku: form.sku.trim() || undefined,
        stock: Number(form.stock || 0),
        lowStockThreshold: Number(form.lowStockThreshold || 5),
        variants,
        images: form.images,
        active: form.active,
      };

      if (form.categoryRef) {
        body.categoryRef = form.categoryRef;
      }

      if (editing?.new) {
        await api("/admin/products", {
          method: "POST",
          body,
        });
      } else {
        await api(`/admin/products/${editing._id}`, {
          method: "PUT",
          body,
        });
      }

      setEditing(null);
      await load();
    } catch (err) {
      window.alert(apiMessage(err, err?.message || "Product could not be saved"));
    } finally {
      setSaving(false);
    }
  };

  const del = async (product) => {
    if (
      !window.confirm(
        `Delete ${product.name}? Product images will also be cleaned from Cloudinary.`
      )
    ) {
      return;
    }

    try {
      await api(`/admin/products/${product._id}`, {
        method: "DELETE",
      });

      await load();
    } catch (err) {
      window.alert(apiMessage(err, "Product could not be deleted"));
    }
  };

  if (loading) {
    return <AdminLoading label="Loading products…" />;
  }

  if (error) {
    return <AdminError message={error} retry={() => void load()} />;
  }

  return (
    <>
      <Panel
        title="Products"
        subtitle={`${products.length} products loaded`}
        actions={
          <>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                className="rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            <AdminButton tone="ghost" onClick={() => void load()}>
              <RefreshCw size={15} />
              Refresh
            </AdminButton>

            <AdminButton onClick={openNew}>
              <Plus size={15} />
              Add product
            </AdminButton>
          </>
        }
      >
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Stock</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((product) => {
                  const variantStock = (product.variants || []).reduce(
                    (sum, variant) => sum + Number(variant.stock || 0),
                    0
                  );

                  return (
                    <tr
                      key={product._id}
                      className="border-t border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product.images?.[0]?.url ||
                              "https://placehold.co/80x80?text=P"
                            }
                            alt=""
                            className="h-12 w-12 rounded-xl bg-gray-100 object-cover dark:bg-gray-800"
                          />

                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {product.brand || "No brand"} ·{" "}
                              {product.sku || "No base SKU"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{product.category}</p>
                        {product.subcategory && <p className="text-xs text-gray-500 dark:text-gray-400">{product.subcategory}</p>}
                      </td>
                      <td>{money(product.price)}</td>

                      <td>
                        {product.variants?.length
                          ? `${variantStock} units`
                          : product.stock}
                      </td>

                      <td>
                        <StatusPill
                          tone={product.variants?.length ? "info" : "neutral"}
                        >
                          {product.variants?.length
                            ? `${product.variants.length} variants`
                            : "Simple"}
                        </StatusPill>
                      </td>

                      <td>
                        <StatusPill
                          tone={
                            product.active === false ? "neutral" : "success"
                          }
                        >
                          {product.active === false ? "Inactive" : "Active"}
                        </StatusPill>
                      </td>

                      <td>
                        <div className="flex justify-end gap-2">
                          <AdminButton
                            tone="ghost"
                            onClick={() => openEdit(product)}
                          >
                            <Edit2 size={14} />
                          </AdminButton>

                          <AdminButton
                            tone="danger"
                            onClick={() => void del(product)}
                          >
                            <Trash2 size={14} />
                          </AdminButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmpty message="No matching products." />
        )}
      </Panel>

      {editing && (
        <AdminModal
          title={editing.new ? "Create product" : "Edit product"}
          onClose={() => setEditing(null)}
          wide
        >
          <div className="grid gap-4 md:grid-cols-2">
            <AdminField
              label="Name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />

            <AdminField
              label="Brand"
              value={form.brand}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  brand: event.target.value,
                }))
              }
            />

            <AdminField
              label="Price"
              type="number"
              min="0"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
            />

            <AdminSelect
              label="Category"
              value={form.categoryRef}
              onChange={(event) => {
                const category = categories.find(
                  (item) => String(item._id) === event.target.value
                );

                setForm((current) => ({
                  ...current,
                  categoryRef: event.target.value,
                  category: category?.name || current.category,
                  subcategoryRef: "",
                  subcategory: "",
                }));
              }}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </AdminSelect>

            <AdminSelect
              label="Subcategory"
              value={form.subcategoryRef}
              disabled={!form.categoryRef}
              onChange={(event) => {
                const subcategory = subcategories.find(
                  (item) => String(item._id) === event.target.value
                );
                setForm((current) => ({
                  ...current,
                  subcategoryRef: event.target.value,
                  subcategory: subcategory?.name || "",
                }));
              }}
            >
              <option value="">{form.categoryRef ? "No subcategory / Select subcategory" : "Select category first"}</option>
              {availableSubcategories.map((subcategory) => (
                <option key={subcategory._id} value={subcategory._id}>
                  {subcategory.name}
                </option>
              ))}
            </AdminSelect>

            <AdminField
              label="Low-stock threshold"
              type="number"
              min="0"
              value={form.lowStockThreshold}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lowStockThreshold: event.target.value,
                }))
              }
            />

            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
              Active product
            </label>
          </div>

          <AdminTextArea
            label="Description"
            rows={5}
            className="mt-4"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />

          <div className="mt-5 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Product Type
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Choose a simple product or create inventory variants without
              writing JSON.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  form.productType === "simple"
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="productType"
                    value="simple"
                    checked={form.productType === "simple"}
                    onChange={() => setProductType("simple")}
                    className="mt-1"
                  />

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Simple Product
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      One SKU and one stock quantity.
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  form.productType === "variant"
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="productType"
                    value="variant"
                    checked={form.productType === "variant"}
                    onChange={() => setProductType("variant")}
                    className="mt-1"
                  />

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Product with Variants
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Use Size, Color, or manually managed combinations.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {form.productType === "simple" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AdminField
                label="SKU"
                value={form.sku}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sku: event.target.value,
                  }))
                }
              />

              <AdminField
                label="Stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stock: event.target.value,
                  }))
                }
              />
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Variant Builder
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter Size and/or Color values separated by commas, then
                    generate combinations.
                  </p>
                </div>

                <AdminButton tone="ghost" onClick={addBlankVariant}>
                  <Plus size={14} />
                  Add variant manually
                </AdminButton>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <AdminField
                  label="Base SKU / SKU prefix"
                  placeholder="Example: TS"
                  value={form.sku}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sku: event.target.value,
                    }))
                  }
                />

                <AdminField
                  label="Default stock per variant"
                  type="number"
                  min="0"
                  value={form.defaultVariantStock}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      defaultVariantStock: event.target.value,
                    }))
                  }
                  placeholder="Example: 10"
                />

                <AdminField
                  label="Sizes"
                  placeholder="S, M, L, XL"
                  value={form.sizeOptions}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sizeOptions: event.target.value,
                    }))
                  }
                />

                <AdminField
                  label="Colors"
                  placeholder="Black, White, Blue"
                  value={form.colorOptions}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      colorOptions: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="mt-4">
                <AdminButton onClick={generateVariants}>
                  Generate Variants
                </AdminButton>
              </div>

              <div className="mt-5 space-y-3">
                {form.variants.length ? (
                  form.variants.map((variant, index) => {
                    const size = getVariantSize(variant);
                    const color = getVariantColor(variant);
                    const label =
                      [size, color].filter(Boolean).join(" / ") ||
                      `Variant ${index + 1}`;

                    return (
                      <div
                        key={`${variant.sku || "variant"}-${index}`}
                        className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Variant {index + 1}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            aria-label={`Remove ${label}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          <AdminField
                            label="Size"
                            value={size}
                            onChange={(event) =>
                              updateVariantAttribute(
                                index,
                                "size",
                                event.target.value
                              )
                            }
                          />

                          <AdminField
                            label="Color"
                            value={color}
                            onChange={(event) =>
                              updateVariantAttribute(
                                index,
                                "color",
                                event.target.value
                              )
                            }
                          />

                          <AdminField
                            label="SKU"
                            value={variant.sku || ""}
                            onChange={(event) =>
                              updateVariant(index, {
                                sku: event.target.value,
                              })
                            }
                          />

                          <AdminField
                            label="Stock"
                            type="number"
                            min="0"
                            value={String(variant.stock ?? 0)}
                            onChange={(event) =>
                              updateVariant(index, {
                                stock: event.target.value,
                              })
                            }
                          />
                        </div>

                        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={variant.active !== false}
                            onChange={(event) =>
                              updateVariant(index, {
                                active: event.target.checked,
                              })
                            }
                          />
                          Active variant
                        </label>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    No variants yet. Add Size/Color options and click
                    <strong> Generate Variants</strong>, or add one manually.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Images
              </p>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                <ImagePlus size={15} />
                {uploading ? "Uploading…" : "Upload images"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => void uploadFiles(event.target.files)}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              {form.images.map((image, index) => (
                <div
                  key={`${image.public_id || image.url}-${index}`}
                  className="relative"
                >
                  <img
                    src={image.url}
                    alt=""
                    className="h-24 w-24 rounded-xl border object-cover dark:border-gray-700"
                  />

                  <button
                    type="button"
                    onClick={() => void removeImage(index)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {!form.images.length && (
                <p className="text-sm text-gray-400">No images attached.</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <AdminButton tone="ghost" onClick={() => setEditing(null)}>
              Cancel
            </AdminButton>

            <AdminButton loading={saving} onClick={() => void save()}>
              {editing.new ? "Create product" : "Save changes"}
            </AdminButton>
          </div>
        </AdminModal>
      )}
    </>
  );
}
