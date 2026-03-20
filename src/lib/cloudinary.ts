import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  base64DataUri: string,
  folder = "vipani/businesses"
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(base64DataUri, {
    folder,
    resource_type: "image",
    transformation: [{ width: 800, quality: "auto" }],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
