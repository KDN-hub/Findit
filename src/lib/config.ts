/** API base URL. Set NEXT_PUBLIC_API_URL in .env.local (local) or Vercel env (production). */
function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

export const API_BASE_URL = getApiBaseUrl();
