'use client';

import { API_BASE_URL } from '@/lib/config';

const DASHBOARD_CACHE_KEY = 'findit_dashboard_cache';

export interface ApiItem {
  id: number;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  location: string | null;
  keywords: string | null;
  date_found: string | null;
  image_url: string | null;
  reporter_name: string | null;
  created_at: string | null;
}

export interface DashboardItemsData {
  todaysItems: ApiItem[];
  previousItems: ApiItem[];
}

let cache: {
  data: DashboardItemsData | null;
  promise: Promise<DashboardItemsData> | null;
} = { data: null, promise: null };

function processItems(data: ApiItem[]): DashboardItemsData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysItems: ApiItem[] = [];
  const older: ApiItem[] = [];
  for (const item of data) {
    const itemDate = new Date(item.created_at || '');
    itemDate.setHours(0, 0, 0, 0);
    if (itemDate.getTime() === today.getTime()) todaysItems.push(item);
    else older.push(item);
  }
  return { todaysItems, previousItems: older.slice(0, 5) };
}

function loadItems(): Promise<DashboardItemsData> {
  return fetch(`${API_BASE_URL}/items`)
    .then((res) => (res.ok ? res.json() : []))
    .then((data: ApiItem[]) => {
      const result = processItems(data);
      try {
        const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
        const prev = raw ? JSON.parse(raw) : {};
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
          ...prev,
          todaysItems: result.todaysItems,
          previousItems: result.previousItems,
        }));
      } catch {
        // ignore
      }
      return result;
    })
    .catch(() => {
      const empty: DashboardItemsData = { todaysItems: [], previousItems: [] };
      return empty;
    });
}

/**
 * Returns dashboard items. If cached (memory or localStorage), returns immediately.
 * Otherwise throws the fetch promise so Suspense shows the fallback until data streams in.
 */
export function getDashboardItems(): DashboardItemsData {
  if (cache.data) return cache.data;

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DASHBOARD_CACHE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as { todaysItems?: ApiItem[]; previousItems?: ApiItem[] };
      if (Array.isArray(parsed.todaysItems) && Array.isArray(parsed.previousItems)) {
        cache.data = { todaysItems: parsed.todaysItems, previousItems: parsed.previousItems };
        if (!cache.promise) cache.promise = loadItems().then((d) => { cache.data = d; return d; });
        return cache.data;
      }
    }
  } catch {
    // ignore
  }

  if (!cache.promise) cache.promise = loadItems().then((d) => { cache.data = d; return d; });
  throw cache.promise;
}
