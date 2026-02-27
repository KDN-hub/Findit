/**
 * Pending report queue for offline submission.
 * Stored in localStorage (key: findit_pending_reports). Each entry is serializable form data + optional image as base64.
 */

export interface PendingReportEntry {
  title: string;
  description: string;
  status: string;
  category: string;
  location: string;
  keywords?: string;
  date_found?: string;
  contact_preference?: string;
  imageBase64?: string;
  imageFilename?: string;
  createdAt: number;
}

const STORAGE_KEY = 'findit_pending_reports';

export function getPendingReports(): PendingReportEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addPendingReport(entry: Omit<PendingReportEntry, 'createdAt'>): void {
  const list = getPendingReports();
  list.push({ ...entry, createdAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function removePendingReport(index: number): void {
  const list = getPendingReports();
  list.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function removePendingReportByCreatedAt(createdAt: number): void {
  const list = getPendingReports().filter((e) => e.createdAt !== createdAt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function buildFormData(entry: PendingReportEntry, token: string): { body: FormData; headers: Record<string, string> } {
  const body = new FormData();
  body.append('title', entry.title);
  body.append('description', entry.description);
  body.append('status', entry.status);
  body.append('category', entry.category);
  body.append('location', entry.location);
  if (entry.keywords) body.append('keywords', entry.keywords);
  if (entry.date_found) body.append('date_found', entry.date_found);
  if (entry.contact_preference) body.append('contact_preference', entry.contact_preference);
  if (entry.imageBase64 && entry.imageFilename) {
    const blob = base64ToBlob(entry.imageBase64);
    body.append('image', blob, entry.imageFilename);
  }
  return {
    body,
    headers: { Authorization: `Bearer ${token}` },
  };
}

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].replace('data:', '') || 'image/jpeg';
  const raw = atob(parts[1] || '');
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: contentType });
}
