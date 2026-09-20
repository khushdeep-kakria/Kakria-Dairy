/**
 * Client-safe image optimization utility for Cloudinary and static assets.
 * Does not import any Node.js dependencies.
 */
export function getOptimizedImageUrl(url?: string, width: number = 600): string {
  if (!url) return '/images/products/ghee-cow.jpg';
  if (!url.includes('res.cloudinary.com')) return url;

  if (url.includes('/upload/')) {
    const parts = url.split('/upload/');
    return `${parts[0]}/upload/f_auto,q_auto,w_${width},c_limit/${parts[1]}`;
  }

  return url;
}