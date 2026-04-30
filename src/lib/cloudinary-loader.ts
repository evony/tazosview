import type { ImageLoader } from 'next/image';

const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  // ★ Cloudinary: inject f_auto + q_auto + width
  // Sebelum: .../upload/v123/cms/backgrounds/photo.jpg  (2-5MB raw)
  // Sesudah: .../upload/f_auto,q_auto:eco,w_1920/v123/cms/backgrounds/photo.jpg (50-200KB)
  if (src.includes('res.cloudinary.com')) {
    return src.replace(
      '/image/upload/',
      `/image/upload/f_auto,q_auto:eco,w_${width}/`
    );
  }

  // ★ Local images (/logo1.webp, dll) & YouTube: return as-is
  // Logo kecil gak perlu optimization, YouTube CDN sudah optimize sendiri
  return src;
};

export default cloudinaryLoader;
