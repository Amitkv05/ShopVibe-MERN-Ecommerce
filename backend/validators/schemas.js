import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const nonEmpty = (max = 250) => z.string().trim().min(1).max(max);

export const authSchemas = {
  register: z.object({ name: nonEmpty(50).min(2), email: z.email(), password: z.string().min(8).max(128) }),
  login: z.object({ email: z.email(), password: z.string().min(1).max(128) }),
};

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  fullName: nonEmpty(80),
  address: nonEmpty(250), city: nonEmpty(100), state: nonEmpty(100), country: nonEmpty(100),
  pinCode: nonEmpty(20), phoneNo: nonEmpty(20), isDefault: z.boolean().optional(),
});

const variantSchema = z.object({
  sku: nonEmpty(80),
  attributes: z.record(z.string(), z.string()).optional().default({}),
  price: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  active: z.boolean().optional(), image: z.string().trim().optional(),
});

export const productCreateSchema = z.object({
  name: nonEmpty(120),
  description: nonEmpty(5000),
  price: z.coerce.number().min(0),
  // Controller accepts either category/categoryRef and normalizes both fields.
  category: z.string().trim().max(100).optional(),
  categoryRef: objectId.optional(),
  subcategory: z.string().trim().max(120).optional(),
  subcategoryRef: z.union([objectId, z.null()]).optional(),
  brand: z.string().trim().max(80).optional(),
  sku: z.string().trim().max(80).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  variants: z.array(variantSchema).max(100).optional(),
  images: z.array(z.object({ public_id: z.string().optional(), url: z.url() })).max(20).optional(),
  popular: z.boolean().optional(),
  recommended: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const orderCreateSchema = z.object({
  shippingInfo: z.object({
    fullName: z.string().trim().max(80).optional(),
    address: nonEmpty(250), city: nonEmpty(100), state: nonEmpty(100), country: nonEmpty(100), pinCode: nonEmpty(20), phoneNo: nonEmpty(20),
  }),
  orderItems: z.array(z.object({ product: objectId, quantity: z.coerce.number().int().min(1).max(99), variantSku: z.string().trim().max(80).optional() })).min(1).max(100),
  paymentMethod: z.enum(["COD", "RAZORPAY"]),
  paymentInfo: z.object({
    razorpayOrderId: z.string().optional(), razorpayPaymentId: z.string().optional(), razorpaySignature: z.string().optional(),
    orderId: z.string().optional(), paymentId: z.string().optional(), signature: z.string().optional(),
  }).optional(),
  couponCode: z.string().trim().max(50).optional(),
});

const mediaAssetSchema = z.object({
  public_id: z.string().trim().max(300).optional().default(""),
  url: z.union([z.url(), z.literal("")]).optional().default(""),
});

export const categorySchema = z.object({
  name: nonEmpty(80),
  slug: nonEmpty(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case"),
  description: z.string().trim().max(1000).optional(),
  image: mediaAssetSchema.optional(),
  icon: mediaAssetSchema.optional(),
  banner: mediaAssetSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export const subcategorySchema = z.object({
  name: nonEmpty(100),
  slug: nonEmpty(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case"),
  categoryRef: objectId,
  description: z.string().trim().max(1000).optional(),
  image: mediaAssetSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export const bannerSchema = z.object({
  title: z.string().trim().max(140).optional(),
  subtitle: z.string().trim().max(300).optional(),
  badge: z.string().trim().max(80).optional(),
  ctaText: z.string().trim().max(60).optional(),
  ctaPath: z.string().trim().max(200).optional(),
  image: mediaAssetSchema.optional(),
  overlayOpacity: z.coerce.number().min(0).max(0.9).optional(),
  textX: z.coerce.number().min(0).max(100).optional(),
  textY: z.coerce.number().min(0).max(100).optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

const couponObjectSchema = z.object({
  code: nonEmpty(50),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxDiscountAmount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
  active: z.boolean().optional(),
});

function addCouponBusinessRuleIssues(value, ctx) {
  if (value.type === "percent" && value.value !== undefined && value.value > 100) {
    ctx.addIssue({
      code: "custom",
      message: "Percent coupon cannot exceed 100",
      path: ["value"],
    });
  }

  if (value.startsAt && value.expiresAt && value.expiresAt <= value.startsAt) {
    ctx.addIssue({
      code: "custom",
      message: "Coupon expiry must be after the start date",
      path: ["expiresAt"],
    });
  }
}

// Important for Zod v4: call .partial() on the plain object schema BEFORE
// adding refinements. Calling .partial() on an already-refined schema throws
// at module load time: ".partial() cannot be used on object schemas containing refinements".
export const couponSchema = couponObjectSchema.superRefine(addCouponBusinessRuleIssues);

export const couponUpdateSchema = couponObjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Provide at least one coupon field to update" })
  .superRefine(addCouponBusinessRuleIssues);
