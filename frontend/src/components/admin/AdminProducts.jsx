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
            <div className="sv-admproducts-001">
              <Search
                size={15}
                className="sv-admproducts-002"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                className="sv-admproducts-003"
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
          <div className="sv-admproducts-004">
            <table className="sv-admproducts-005">
              <thead>
                <tr className="sv-admproducts-006">
                  <th className="sv-admproducts-007">Product</th>
                  <th className="sv-admproducts-007">Category</th>
                  <th className="sv-admproducts-007">Price</th>
                  <th className="sv-admproducts-007">Stock</th>
                  <th className="sv-admproducts-007">Type</th>
                  <th className="sv-admproducts-007">Status</th>
                  <th className="sv-admproducts-008">Actions</th>
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
                      className="sv-admproducts-009"
                    >
                      <td className="sv-admproducts-010">
                        <div className="sv-admproducts-011">
                          <img
                            src={
                              product.images?.[0]?.url ||
                              "https://placehold.co/80x80?text=P"
                            }
                            alt=""
                            className="sv-admproducts-012"
                          />

                          <div>
                            <p className="sv-admproducts-013">
                              {product.name}
                            </p>
                            <p className="sv-admproducts-014">
                              {product.brand || "No brand"} ·{" "}
                              {product.sku || "No base SKU"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <p className="sv-admproducts-015">{product.category}</p>
                        {product.subcategory && <p className="sv-admproducts-014">{product.subcategory}</p>}
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
                        <div className="sv-admproducts-016">
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
          <div className="sv-admproducts-017">
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

            <label className="sv-admproducts-018">
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
            className="sv-admproducts-019"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />

          <div className="sv-admproducts-020">
            <p className="sv-admproducts-021">
              Product Type
            </p>
            <p className="sv-admproducts-022">
              Choose a simple product or create inventory variants without
              writing JSON.
            </p>

            <div className="sv-admproducts-023">
              <label
                className={`sv-admproducts-024 ${
                  form.productType === "simple"
                    ? "sv-admproducts-025"
                    : "sv-admproducts-026"
                }`}
              >
                <div className="sv-admproducts-027">
                  <input
                    type="radio"
                    name="productType"
                    value="simple"
                    checked={form.productType === "simple"}
                    onChange={() => setProductType("simple")}
                    className="sv-admproducts-028"
                  />

                  <div>
                    <p className="sv-admproducts-013">
                      Simple Product
                    </p>
                    <p className="sv-admproducts-022">
                      One SKU and one stock quantity.
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`sv-admproducts-024 ${
                  form.productType === "variant"
                    ? "sv-admproducts-025"
                    : "sv-admproducts-026"
                }`}
              >
                <div className="sv-admproducts-027">
                  <input
                    type="radio"
                    name="productType"
                    value="variant"
                    checked={form.productType === "variant"}
                    onChange={() => setProductType("variant")}
                    className="sv-admproducts-028"
                  />

                  <div>
                    <p className="sv-admproducts-013">
                      Product with Variants
                    </p>
                    <p className="sv-admproducts-022">
                      Use Size, Color, or manually managed combinations.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {form.productType === "simple" ? (
            <div className="sv-admproducts-029">
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
            <div className="sv-admproducts-030">
              <div className="sv-admproducts-031">
                <div>
                  <p className="sv-admproducts-021">
                    Variant Builder
                  </p>
                  <p className="sv-admproducts-022">
                    Enter Size and/or Color values separated by commas, then
                    generate combinations.
                  </p>
                </div>

                <AdminButton tone="ghost" onClick={addBlankVariant}>
                  <Plus size={14} />
                  Add variant manually
                </AdminButton>
              </div>

              <div className="sv-admproducts-029">
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

              <div className="sv-admproducts-019">
                <AdminButton onClick={generateVariants}>
                  Generate Variants
                </AdminButton>
              </div>

              <div className="sv-admproducts-032">
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
                        className="sv-admproducts-033"
                      >
                        <div className="sv-admproducts-034">
                          <div>
                            <p className="sv-admproducts-021">
                              {label}
                            </p>
                            <p className="sv-admproducts-014">
                              Variant {index + 1}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="sv-admproducts-035"
                            aria-label={`Remove ${label}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="sv-admproducts-036">
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

                        <label className="sv-admproducts-037">
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
                  <div className="sv-admproducts-038">
                    No variants yet. Add Size/Color options and click
                    <strong> Generate Variants</strong>, or add one manually.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="sv-admproducts-019">
            <div className="sv-admproducts-039">
              <p className="sv-admproducts-040">
                Images
              </p>

              <label className="sv-admproducts-041">
                <ImagePlus size={15} />
                {uploading ? "Uploading…" : "Upload images"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sv-admproducts-042"
                  onChange={(event) => void uploadFiles(event.target.files)}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="sv-admproducts-043">
              {form.images.map((image, index) => (
                <div
                  key={`${image.public_id || image.url}-${index}`}
                  className="sv-admproducts-001"
                >
                  <img
                    src={image.url}
                    alt=""
                    className="sv-admproducts-044"
                  />

                  <button
                    type="button"
                    onClick={() => void removeImage(index)}
                    className="sv-admproducts-045"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {!form.images.length && (
                <p className="sv-admproducts-046">No images attached.</p>
              )}
            </div>
          </div>

          <div className="sv-admproducts-047">
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
