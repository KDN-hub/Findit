export const CATEGORIES = [
  'Electronics',
  'ID Cards',
  'Books',
  'Clothing',
  'Accessories',
  'Keys',
  'Documents',
  'Other',
] as const;

export function formatTimeAgo(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
