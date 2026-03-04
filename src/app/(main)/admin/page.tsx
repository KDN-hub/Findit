'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

const ADMIN_AUDIT_CACHE_KEY = 'findit_admin_audit_logs';
const CACHE_MAX_AGE_MS = 30 * 1000;

interface AuditLogEntry {
  id: number;
  user_id: number | null;
  action: string;
  item_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
  user_name: string | null;
}

interface AdminUser {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  matric_number: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string | null;
}

interface ApiItem {
  id: number;
  title: string;
  reporter_name?: string | null;
  created_at?: string | null;
}

function formatTimeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function getActivityLabel(log: AuditLogEntry): string {
  const name = log.user_name || `User ${log.user_id ?? '?'}`;
  if (log.action === 'LOGIN') return `${name} logged in`;
  if (log.action === 'ITEM_REPORTED' && log.details) {
    const match = log.details.match(/Reported:\s*(.+)/);
    return `${name} reported "${match ? match[1].trim() : log.details}"`;
  }
  if (log.action === 'CLAIM_INITIATED' && log.details) {
    const match = log.details.match(/Claimed:\s*(.+)/);
    return `${name} claimed "${match ? match[1].trim() : log.details}"`;
  }
  return `${name} – ${log.action}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<{ suspend?: number; delete?: number }>({});

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }, []);

  const fetchWithAuth = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = getToken();
      if (!token) return null;
      const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) return null;
      return res;
    },
    [getToken]
  );

  const loadAuditLogs = useCallback(
    async (revalidate = true) => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/audit-logs?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setAuditLogs(data);
        if (typeof window !== 'undefined' && revalidate) {
          try {
            localStorage.setItem(ADMIN_AUDIT_CACHE_KEY, JSON.stringify({ data, at: Date.now() }));
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    },
    [getToken]
  );

  const loadUsers = useCallback(async () => {
    const res = await fetchWithAuth('/admin/users');
    if (!res?.ok) return;
    const data = await res.json();
    setUsers(data);
  }, [fetchWithAuth]);

  const loadItems = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/items`);
    if (!res.ok) return;
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const token = getToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      // Stale-while-revalidate: show cached audit logs immediately
      try {
        const raw = localStorage.getItem(ADMIN_AUDIT_CACHE_KEY);
        if (raw) {
          const { data, at } = JSON.parse(raw);
          if (Array.isArray(data) && at && Date.now() - at < CACHE_MAX_AGE_MS * 2) {
            setAuditLogs(data);
          }
        }
      } catch {
        // ignore
      }

      const meRes = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) {
        router.replace('/login');
        return;
      }
      const me = await meRes.json();
      if (!me.is_admin) {
        setError('Unauthorized. Admin access required.');
        router.replace('/dashboard?error=unauthorized');
        return;
      }

      if (!mounted) return;
      setLoading(false);

      loadAuditLogs(true);
      loadUsers();
      loadItems();
    }

    init();
    return () => {
      mounted = false;
    };
  }, [getToken, router, loadAuditLogs, loadUsers, loadItems]);

  // Stale-while-revalidate: revalidate audit logs in background every 30s
  useEffect(() => {
    const interval = setInterval(() => loadAuditLogs(true), 30000);
    return () => clearInterval(interval);
  }, [loadAuditLogs]);

  const handleSuspend = async (user: AdminUser) => {
    const token = getToken();
    if (!token) return;
    setActionLoading((prev) => ({ ...prev, suspend: user.id }));
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${user.id}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await loadUsers();
    } finally {
      setActionLoading((prev) => ({ ...prev, suspend: undefined }));
    }
  };

  const handleDeleteItem = async (itemId: number, title: string) => {
    if (!confirm(`Delete item "${title}"? This cannot be undone.`)) return;
    const token = getToken();
    if (!token) return;
    setActionLoading((prev) => ({ ...prev, delete: itemId }));
    try {
      const res = await fetch(`${API_BASE_URL}/admin/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        await loadAuditLogs(true);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, delete: undefined }));
    }
  };

  if (error) {
    return (
      <div className="min-h-dvh bg-[var(--color-background)] flex items-center justify-center px-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--color-background)] dark:bg-[var(--color-background)] pb-24 px-4 pt-24">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <Link
            href="/settings"
            className="w-10 h-10 rounded-full bg-[#F1F5F9] dark:bg-slate-700 flex items-center justify-center text-[#003898] dark:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-[#003898] dark:text-white">Admin Dashboard</h1>
          <div className="w-10" />
        </header>

        {/* Live Activity Feed */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            Live Activity Feed
          </h2>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden">
            {loading && auditLogs.length === 0 ? (
              <div className="p-4 text-slate-500 dark:text-slate-400 text-sm">Loading…</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-4 text-slate-500 dark:text-slate-400 text-sm">No activity yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
                {auditLogs.map((log) => (
                  <li key={log.id} className="px-4 py-3 text-sm">
                    <p className="text-slate-800 dark:text-slate-100">{getActivityLabel(log)}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      {formatTimeAgo(log.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* User Table */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            Users
          </h2>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden">
            {loading && users.length === 0 ? (
              <div className="p-4 text-slate-500 dark:text-slate-400 text-sm">Loading…</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-slate-500 dark:text-slate-400 text-sm">No users.</div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Email</th>
                      <th className="px-4 py-2 font-medium">Role</th>
                      <th className="px-4 py-2 font-medium">Matric</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{u.full_name || '—'}</td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{u.email}</td>
                        <td className="px-4 py-2 capitalize">{u.role}</td>
                        <td className="px-4 py-2">{u.matric_number || '—'}</td>
                        <td className="px-4 py-2">
                          {u.is_suspended ? (
                            <span className="text-red-600 dark:text-red-400">Suspended</span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleSuspend(u)}
                            disabled={actionLoading.suspend === u.id}
                            className="text-xs px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 disabled:opacity-50"
                          >
                            {actionLoading.suspend === u.id ? '…' : u.is_suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions: Delete items */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            Recent Items (Delete spam)
          </h2>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden">
            {loading && items.length === 0 ? (
              <div className="p-4 text-slate-500 dark:text-slate-400 text-sm">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-slate-500 dark:text-slate-400 text-sm">No items.</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700 max-h-64 overflow-y-auto">
                {items.slice(0, 20).map((item) => (
                  <li key={item.id} className="px-4 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.reporter_name || '—'} · ID {item.id}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      disabled={actionLoading.delete === item.id}
                      className="shrink-0 text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50 disabled:opacity-50"
                    >
                      {actionLoading.delete === item.id ? '…' : 'Delete'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
