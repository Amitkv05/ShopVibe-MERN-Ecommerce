import Banner from "../models/bannerModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import { deleteCloudinaryImage } from "../services/cloudinaryService.js";

function publicIdOf(value) {
  return String(value?.public_id || "").trim();
}

export const listBanners = handleAsyncError(async (req, res) => {
  const banners = await Banner.find({ active: { $ne: false } }).sort({ sortOrder: 1, createdAt: -1 });
  res.json({ success: true, banners });
});

export const listAdminBanners = handleAsyncError(async (req, res) => {
  const banners = await Banner.find({}).sort({ sortOrder: 1, createdAt: -1 });
  res.json({ success: true, banners });
});

export const createBanner = handleAsyncError(async (req, res) => {
  const banner = await Banner.create(req.body);
  res.status(201).json({ success: true, banner });
});

export const updateBanner = handleAsyncError(async (req, res, next) => {
  const existing = await Banner.findById(req.params.id);
  if (!existing) return next(new HandleError("Banner not found", 404));

  const oldPublicId = publicIdOf(existing.image);
  const nextPublicId = publicIdOf(req.body.image);

  Object.assign(existing, req.body);
  await existing.save();

  if (oldPublicId && oldPublicId !== nextPublicId) {
    await deleteCloudinaryImage(oldPublicId).catch(() => undefined);
  }

  res.json({ success: true, banner: existing });
});

export const deleteBanner = handleAsyncError(async (req, res, next) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return next(new HandleError("Banner not found", 404));

  const publicId = publicIdOf(banner.image);
  if (publicId) await deleteCloudinaryImage(publicId).catch(() => undefined);

  res.json({ success: true, message: "Banner deleted" });
});
