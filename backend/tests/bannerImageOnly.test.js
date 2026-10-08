import test from "node:test";
import assert from "node:assert/strict";
import { bannerSchema } from "../validators/schemas.js";

test("banner create schema accepts image-only banner with empty title and CTA", () => {
  const result = bannerSchema.safeParse({
    title: "",
    subtitle: "",
    badge: "",
    ctaText: "",
    ctaPath: "",
    image: { public_id: "demo/banner", url: "https://example.com/banner.jpg" },
    overlayOpacity: 0,
    sortOrder: 0,
    active: true,
  });

  assert.equal(result.success, true);
});

test("banner create schema still accepts banner with title and CTA", () => {
  const result = bannerSchema.safeParse({
    title: "Summer Sale",
    subtitle: "Up to 40% off",
    badge: "Limited time",
    ctaText: "Shop now",
    ctaPath: "/shop",
    image: { public_id: "demo/banner", url: "https://example.com/banner.jpg" },
  });

  assert.equal(result.success, true);
});

test("banner update schema allows clearing existing content for image-only mode", () => {
  const result = bannerSchema.partial().safeParse({
    title: "",
    subtitle: "",
    badge: "",
    ctaText: "",
    ctaPath: "",
    overlayOpacity: 0,
  });

  assert.equal(result.success, true);
});
