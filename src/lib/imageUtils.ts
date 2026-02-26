import { API_BASE_URL } from '@/lib/config';

/** Default placeholder when an item image fails to load (Babcock branding). */
export const ITEM_IMAGE_PLACEHOLDER = '/logo-dark.svg';

/**
 * Returns the full image URL for item images.
 * If the URL is relative (doesn't start with 'http'), prepends the backend API base URL.
 */
export function getItemImageSrc(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
