import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

export async function uploadToCloudinary(
  bufferOrBase64: Buffer | string,
  folder: string = 'kakria_products'
): Promise<string> {
  const uniqueId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: uniqueId,
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload to Cloudinary failed.'));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    if (Buffer.isBuffer(bufferOrBase64)) {
      uploadStream.end(bufferOrBase64);
    } else {
      const buffer = Buffer.from(
        bufferOrBase64.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );
      uploadStream.end(buffer);
    }
  });
}

export async function deleteFromCloudinary(urlOrPublicId?: string): Promise<void> {
  if (!isCloudinaryConfigured || !urlOrPublicId) return;
  try {
    let publicId = urlOrPublicId;
    if (urlOrPublicId.includes('res.cloudinary.com')) {
      const parts = urlOrPublicId.split('/upload/');
      if (parts[1]) {
        // Strip transformations and versioning, e.g. "v1234/kakria_products/abc.jpg"
        const withoutVersion = parts[1].replace(/^(?:[a-zA-Z0-9_,]+(?:\/[a-zA-Z0-9_,]+)*\/)?(?:v\d+\/)?/, '');
        publicId = withoutVersion.replace(/\.[^/.]+$/, '');
      }
    }
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('[Cloudinary Delete] Ignored cleanup error:', err);
  }
}

export function getOptimizedImageUrl(url?: string, width: number = 600): string {
  if (!url) return '/images/products/ghee-cow.jpg';
  if (!url.includes('res.cloudinary.com')) return url;

  if (url.includes('/upload/')) {
    const parts = url.split('/upload/');
    return `${parts[0]}/upload/f_auto,q_auto,w_${width},c_limit/${parts[1]}`;
  }

  return url;
}
