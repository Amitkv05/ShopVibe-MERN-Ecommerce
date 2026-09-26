import { v2 as cloudinary } from "cloudinary";
import HandleError from "../utils/handleError.js";

function configure() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new HandleError("Cloudinary is not configured on the server", 503);
  }
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
}

export async function uploadImageBuffer(buffer, folder = process.env.CLOUDINARY_FOLDER || "mern-ecommerce") {
  configure();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
      if (error) return reject(error);
      resolve({ public_id: result.public_id, url: result.secure_url });
    });
    stream.end(buffer);
  });
}

export async function deleteCloudinaryImage(publicId) {
  if (!publicId) return;
  configure();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
