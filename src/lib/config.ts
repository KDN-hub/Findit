/** API base URL. Uses same host as page when in browser (works for mobile/network access). */
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
}

export const API_BASE_URL = getApiBaseUrl();
