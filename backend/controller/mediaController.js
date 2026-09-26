import multer from "multer";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import { uploadImageBuffer, deleteCloudinaryImage } from "../services/cloudinaryService.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter(req, file, cb) {
    if (!file.mimetype?.startsWith("image/")) return cb(new HandleError("Only image uploads are allowed", 400));
    cb(null, true);
  },
});

export const uploadImages = handleAsyncError(async (req, res, next) => {
  if (!req.files?.length) return next(new HandleError("At least one image is required", 400));
  const images = await Promise.all(req.files.map((file) => uploadImageBuffer(file.buffer)));
  res.status(201).json({ success: true, images });
});

export const deleteImage = handleAsyncError(async (req, res, next) => {
  const publicId = String(req.body.public_id || "").trim();
  if (!publicId) return next(new HandleError("public_id is required", 400));
  await deleteCloudinaryImage(publicId);
  res.json({ success: true, message: "Image deleted" });
});
