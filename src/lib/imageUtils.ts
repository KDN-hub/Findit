import { API_BASE_URL } from '@/lib/config';

/** Default placeholder when an item image fails to load (Babcock branding). */
export const ITEM_IMAGE_PLACEHOLDER = '/logo-dark.svg';

/** Cloudinary transformation: auto quality, auto format (WebP etc), max width 500 for faster load on slow networks. */
const CLOUDINARY_TRANSFORM = 'q_auto,f_auto,w_500';

/**
 * Returns the full image URL for item images.
 * Full URLs (e.g. Cloudinary https) are returned as-is (with Cloudinary transforms applied); relative paths get the backend base prepended.
 */
export function getItemImageSrc(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/image/upload/')) {
      return trimmed.replace('/image/upload/', `/image/upload/${CLOUDINARY_TRANSFORM}/`);
    }
    return trimmed;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
