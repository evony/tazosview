import type { ImageLoader } from 'next/image';

const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  // ★ Cloudinary: inject f_auto + q_auto + width + c_limit
  // Sebelum: .../upload/v123/cms/backgrounds/photo.jpg  (2-5MB raw)
  // Sesudah: .../upload/f_auto,q_auto:eco,w_1920,c_limit/v123/cms/backgrounds/photo.jpg (50-200KB)
  // Cap width at 1920px — prevents loading 3840px+ images on high-DPI displays
  // c_limit = only resize if original is larger than specified width (never upscale)
  const optimizedWidth = Math.min(width, 1920);

  if (src.includes('res.cloudinary.com')) {
    // Check if URL already has transformations (e.g., from getOptimizedCloudinaryUrl)
    // Avoid double-injecting transformations
    if (src.includes('/image/upload/f_auto') || src.includes('/image/upload/q_auto')) {
      return src;
    }
    return src.replace(
      '/image/upload/',
      `/image/upload/f_auto,q_auto:eco,w_${optimizedWidth},c_limit/`
    );
  }

  // ★ YouTube thumbnails — YouTube CDN already optimizes, return as-is
  if (src.includes('img.youtube.com')) {
    return src;
  }

  // ★ Local images (/logo1.webp, dll) — add width query param for cache busting
  // This satisfies Next.js loader width requirement while keeping local images simple
  if (src.startsWith('/')) {
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${optimizedWidth}`;
  }

  // ★ Fallback: return as-is for any other external URLs
  return src;
};

export default cloudinaryLoader;
