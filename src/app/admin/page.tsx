'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { API_BASE_URL } from '@/lib/config';
import { useModal } from '@/context/ModalContext';
import { signOutAction } from '@/actions/auth';

const ADMIN_AUDIT_CACHE_KEY = 'findit_admin_audit_logs';
const CACHE_MAX_AGE_MS = 30 * 1000;
const ADMIN_PASSCODE = 'admin_12345';

interface AuditLogEntry {
    id: number;
    user_id: number | null;
    action: string;
    item_id: number | null;
    details: string | null;
    ip_address: string | null;
    created_at: string;
    user_name: string | null;
    email: string | null;
    matric_number: string | null;
    role: string | null;
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
    total_reports: number;
    total_claims: number;
    last_login_at: string | null;
}

interface StuckHandoverEntry {
    conversation_id: number;
    item_id: number;
    item_title: string;
    item_status: string;
    finder_id: number;
    finder_name: string | null;
    finder_email: string;
    claimer_id: number;
    claimer_name: string | null;
    claimer_email: string;
    finder_code_created_at: string | null;
    claimer_code_created_at: string | null;
}

interface CompletedHandoverEntry {
    claim_id: number;
    item_id: number;
    item_title: string;
    finder_name: string | null;
    finder_email: string;
    claimer_name: string | null;
    claimer_email: string;
    recovered_at: string;
}

interface ApiItem {
    id: number;
    title: string;
    reporter_name?: string | null;
    created_at?: string | null;
}

interface TrackingTimelineEntry {
    id: number;
    title: string;
    reported_at: string;
    status: string;
    claimed_at: string | null;
    reporter_name: string;
}

interface TrackingStats {
    reports: { date: string, count: number }[];
    claims: { date: string, count: number }[];
}

function formatTimeAgo(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const diffMs = Date.now() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString();
    } catch {
        return dateStr;
    }
}

function getActivityLabel(log: AuditLogEntry): string {
    let name = log.user_name || `User #${log.user_id ?? '?'}`;

    // Add identifier context
    if (log.role === 'student' && log.matric_number) {
        name += ` (${log.matric_number})`;
    } else if (log.email) {
        name += ` (${log.email})`;
    }

    if (log.action === 'LOGIN') return `${name} logged in`;
    if (log.action === 'ITEM_REPORTED' && log.details) {
        const match = log.details.match(/Reported:\s*(.+)/);
        return `${name} reported "${match ? match[1].trim() : log.details}"`;
    }
    if (log.action === 'CLAIM_INITIATED' && log.details) {
        const match = log.details.match(/Claimed:\s*(.+)/);
        return `${name} claimed "${match ? match[1].trim() : log.details}"`;
    }
    return `${name} — ${log.action.replace(/_/g, ' ').toLowerCase()}`;
}

function getRoleBadge(role: string) {
    const map: Record<string, string> = {
        student: 'bg-blue-100 text-blue-700',
        staff: 'bg-purple-100 text-purple-700',
        visitor: 'bg-slate-100 text-slate-600',
        admin: 'bg-amber-100 text-amber-700',
    };
    return map[role?.toLowerCase()] ?? 'bg-slate-100 text-slate-600';
}

// ── Passcode Lock Screen ────────────────────────────────────────
function PasscodeLock({ onUnlock }: { onUnlock: () => void }) {
    const router = useRouter();
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);

        try {
            const res = await fetch(`${API_BASE_URL}/admin/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode }),
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('access_token', data.access_token);
                onUnlock();
            } else {
                setError(true);
                setShake(true);
                setPasscode('');
                setTimeout(() => setShake(false), 600);
            }
        } catch (err) {
            console.error('Admin auth error:', err);
            setError(true);
            setShake(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-dvh bg-gradient-to-br from-[#001f5c] via-[#003898] to-[#0057d4] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo / Icon */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20 p-2">
                        <Image src="/logo.svg" alt="Findit Logo" width={56} height={56} className="object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Findit Admin</h1>
                    <p className="text-white/60 mt-1 text-sm">Restricted access — authorised personnel only</p>
                </div>
                {/* Card */}
                <form
                    onSubmit={handleSubmit}
                    className={`bg-white rounded-2xl p-6 shadow-2xl ${shake ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`}
                    style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
                >
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Passcode</label>
                    <input
                        type="password"
                        placeholder="Enter admin passcode"
                        value={passcode}
                        onChange={(e) => { setPasscode(e.target.value); setError(false); }}
                        className={`w-full h-12 px-4 rounded-xl border-2 text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none transition-all ${error ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-[#003898]'
                            }`}
                        autoFocus
                    />
                    {error && (
                        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                            Incorrect passcode. Try again.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-5 w-full h-12 bg-[#003898] hover:bg-[#002266] active:scale-95 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : 'Unlock Dashboard'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="mt-3 w-full h-10 text-white/40 hover:text-white/70 text-sm font-medium transition-colors"
                    >
                        ← Exit Admin Mode
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── Main Admin Dashboard ─────────────────────────────────────────
export default function AdminPage() {
    const router = useRouter();
    const { showAlert, showConfirm, showPrompt } = useModal();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [items, setItems] = useState<ApiItem[]>([]);
    const [handovers, setHandovers] = useState<{ stuck: StuckHandoverEntry[], completed: CompletedHandoverEntry[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<{ suspend?: number; delete?: number; normalize?: boolean; wipe?: boolean }>({});
    const [activeTab, setActiveTab] = useState<'activity' | 'users' | 'items' | 'handovers' | 'tracking' | 'advanced'>('activity');
    const [trackingStats, setTrackingStats] = useState<TrackingStats | null>(null);
    const [trackingTimeline, setTrackingTimeline] = useState<TrackingTimelineEntry[]>([]);

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('access_token');
    }, []);

    const loadAuditLogs = useCallback(async (revalidate = true) => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/audit-logs?limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setAuditLogs(data);
            if (revalidate) {
                try { localStorage.setItem(ADMIN_AUDIT_CACHE_KEY, JSON.stringify({ data, at: Date.now() })); } catch { /* ignore */ }
            }
        } catch { /* ignore */ }
    }, [getToken]);

    const loadUsers = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res?.ok) return;
        setUsers(await res.json());
    }, [getToken]);

    const loadItems = useCallback(async () => {
        const res = await fetch(`${API_BASE_URL}/items`);
        if (!res.ok) return;
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
    }, []);

    const loadHandovers = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/admin/handovers`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        setHandovers(await res.json());
    }, [getToken]);

    const loadTrackingData = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const [statsRes, timelineRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/tracking/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/admin/tracking/timeline`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (statsRes.ok) setTrackingStats(await statsRes.json());
            if (timelineRes.ok) setTrackingTimeline(await timelineRes.json());
        } catch (err) { console.error('Error loading tracking data:', err); }
    }, [getToken]);

    useEffect(() => {
        if (!isUnlocked) return;
        let mounted = true;
        async function init() {
            setError('');
            const token = getToken();
            if (!token) {
                // If we are here and unlocked, but no token, something went wrong with the auth flow
                setIsUnlocked(false);
                setLoading(false);
                return;
            }
            // Try stale cache
            try {
                const raw = localStorage.getItem(ADMIN_AUDIT_CACHE_KEY);
                if (raw) {
                    const { data, at } = JSON.parse(raw);
                    if (Array.isArray(data) && Date.now() - at < CACHE_MAX_AGE_MS * 2) setAuditLogs(data);
                }
            } catch { /* ignore */ }

            const meRes = await fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (!meRes.ok || meRes.status === 401) {
                // Clear the stale token and bounce to login
                localStorage.removeItem('access_token');
                window.location.reload();
                return;
            }
            const me = await meRes.json();
            const isAdmin = me.is_admin || me.role === 'admin';

            if (!isAdmin) {
                // Not an admin, bounce them out
                localStorage.removeItem('access_token');
                window.location.reload();
                return;
            }
            if (!mounted) return;
            setLoading(false);
            loadAuditLogs(true);
            loadUsers();
            loadItems();
            loadHandovers();
            loadTrackingData();
        }
        init();
        return () => { mounted = false; };
    }, [isUnlocked, getToken, loadAuditLogs, loadUsers, loadItems, loadHandovers]);

    // Smart SWR-like polling mechanism based on active tab
    useEffect(() => {
        if (!isUnlocked) return;
        // Poll every 15s instead of 30s to feel "Real-time"
        const interval = setInterval(() => {
            loadAuditLogs(true);
            if (activeTab === 'users') loadUsers();
            if (activeTab === 'handovers') loadHandovers();
            if (activeTab === 'tracking') loadTrackingData();
        }, 15000);
        return () => clearInterval(interval);
    }, [isUnlocked, activeTab, loadAuditLogs, loadUsers, loadHandovers, loadTrackingData]);

    const handleSuspend = async (user: AdminUser) => {
        const token = getToken(); if (!token) return;
        setActionLoading(p => ({ ...p, suspend: user.id }));
        try {
            const res = await fetch(`${API_BASE_URL}/admin/users/${user.id}/suspend`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) await loadUsers();
        } finally { setActionLoading(p => ({ ...p, suspend: undefined })); }
    };

    const handleDeleteItem = async (itemId: number, title: string) => {
        const confirmed = await showConfirm({
            title: 'Delete Item',
            message: `Are you sure you want to delete "${title}"? This action cannot be undone and will remove all associated claims and messages.`,
            confirmText: 'Delete Item'
        });
        if (!confirmed) return;

        const token = getToken(); if (!token) return;
        setActionLoading(prev => ({ ...prev, delete: itemId }));
        try {
            const res = await fetch(`${API_BASE_URL}/admin/items/${itemId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                loadItems();
                showAlert({ title: 'Item Deleted', message: `Successfully deleted "${title}".`, type: 'success' });
            } else {
                showAlert({ title: 'Error', message: 'Failed to delete item.', type: 'danger' });
            }
        } catch (err) { showAlert({ title: 'Error', message: 'Network error.', type: 'danger' }); }
        finally { setActionLoading(prev => ({ ...prev, delete: undefined })); }
    };

    const handleNormalize = async () => {
        const confirmed = await showConfirm({
            title: 'Normalize Locations',
            message: 'Are you absolutely sure you want to normalize all item locations globally? This will prefix non-standard locations with "Other - ".',
        });
        if (!confirmed) return;

        const token = getToken(); if (!token) return;
        setActionLoading(prev => ({ ...prev, normalize: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/admin/normalize-locations`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                showAlert({ title: 'Success', message: 'Locations normalized successfully.', type: 'success' });
                loadItems();
            } else {
                showAlert({ title: 'Error', message: 'Failed to normalize locations.', type: 'danger' });
            }
        } catch (err) { showAlert({ title: 'Error', message: 'Network error.', type: 'danger' }); }
        finally { setActionLoading(prev => ({ ...prev, normalize: false })); }
    };

    const handleWipeItems = async () => {
        const confirmed = await showConfirm({
            title: 'SYSTEM WIPE',
            message: '⚠️ DANGER: Are you absolutely sure you want to PERFORM A FULL RESET? This will wipe ALL items, users, claims, and audit logs. Associated Cloudinary images will be destroyed. This CANNOT be undone.',
            confirmText: 'PERFORM FULL RESET'
        });
        if (!confirmed) return;

        const phrase = await showPrompt({
            title: 'Identity Verification',
            message: 'Type "DELETE EVERYTHING" to confirm this destructive action:',
            confirmText: 'WIPE EVERYTHING'
        });

        if (phrase !== "DELETE EVERYTHING") {
            if (phrase !== null) showAlert({ title: 'Wipe Cancelled', message: 'Verification phrase did not match.', type: 'info' });
            return;
        }

        const token = getToken(); if (!token) return;
        setActionLoading(prev => ({ ...prev, wipe: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/admin/wipe-items`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                await showAlert({ title: 'System Reset', message: `Database wiped clean. ${data.message || ''}`, type: 'success' });
                window.location.reload();
            } else {
                showAlert({ title: 'Error', message: 'Failed to wipe items. Check backend logs.', type: 'danger' });
            }
        } catch (err) { showAlert({ title: 'Error', message: 'Network error during wipe.', type: 'danger' }); }
        finally { setActionLoading(prev => ({ ...prev, wipe: false })); }
    };

    if (!isUnlocked) return <PasscodeLock onUnlock={() => setIsUnlocked(true)} />;

    if (loading) {
        return (
            <div className="min-h-dvh bg-[#f4f6fb] flex items-center justify-center">
                <p className="text-slate-500">Loading admin panel...</p>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-[#f4f6fb]">
            {/* Top Bar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                            <Image src="/logo.svg" alt="Findit" width={28} height={28} className="object-contain" />
                        </div>
                        <h1 className="font-bold text-slate-800 text-lg">Findit Admin</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 hidden sm:block">Admin Panel</span>
                        <button
                            onClick={async () => {
                                await signOutAction();
                                localStorage.removeItem('access_token');
                                window.location.reload();
                            }}
                            className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Users', value: loading ? '—' : users.length, icon: '👤', color: 'bg-blue-50 text-blue-600' },
                        { label: 'Total Items', value: loading ? '—' : items.length, icon: '📦', color: 'bg-emerald-50 text-emerald-600' },
                        { label: 'Activity Logs', value: loading ? '—' : auditLogs.length, icon: '📋', color: 'bg-violet-50 text-violet-600' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-100 overflow-x-auto custom-scrollbar">
                        {(['activity', 'users', 'items', 'handovers', 'tracking', 'advanced'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 min-w-[120px] py-3 text-sm font-medium transition-colors capitalize ${activeTab === tab
                                    ? tab === 'advanced' ? 'text-red-700 border-b-2 border-red-700 bg-red-50/50' : 'text-[#003898] border-b-2 border-[#003898] bg-blue-50/50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {tab === 'activity' && '⚡ Activity'}
                                {tab === 'users' && '👥 Users'}
                                {tab === 'items' && '📦 Items'}
                                {tab === 'handovers' && '🤝 Handovers'}
                                {tab === 'tracking' && '📊 Tracking'}
                                {tab === 'advanced' && '⚙️ Advanced'}
                            </button>
                        ))}
                    </div>

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <div>
                            {loading && auditLogs.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-sm">Loading activity…</div>
                            ) : auditLogs.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-sm">No activity yet.</div>
                            ) : (
                                <ul className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                                    {auditLogs.map(log => (
                                        <li key={log.id} className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors">
                                            <p className="text-sm text-slate-700 flex-1">{getActivityLabel(log)}</p>
                                            <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">{formatTimeAgo(log.created_at)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="max-h-[480px] overflow-y-auto">
                            {loading && users.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-sm">Loading users…</div>
                            ) : users.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-sm">No users found.</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Role / Matric</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Claims / Reports</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Last Access</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {users.map(user => {
                                            const isSuspicious = user.total_claims > 2 && user.total_reports === 0;
                                            return (
                                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div>
                                                                <p className="font-medium text-slate-800 truncate max-w-[150px]">{user.full_name || '—'}</p>
                                                                <p className="text-xs text-slate-500 truncate max-w-[150px]">{user.email}</p>
                                                            </div>
                                                            {isSuspicious && (
                                                                <span className="shrink-0 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Suspicious</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 hidden md:table-cell">
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleBadge(user.role)}`}>
                                                                {user.role}
                                                            </span>
                                                            <span className="text-slate-500 text-xs">{user.matric_number || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-semibold ${isSuspicious ? 'text-red-600' : 'text-slate-700'}`}>
                                                            {user.total_claims} / {user.total_reports}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell whitespace-nowrap">
                                                        {user.last_login_at ? formatTimeAgo(user.last_login_at) : 'Never'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => handleSuspend(user)}
                                                            disabled={actionLoading.suspend === user.id}
                                                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${user.is_suspended
                                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                }`}
                                                        >
                                                            {actionLoading.suspend === user.id ? '…' : user.is_suspended ? 'Unsuspend' : 'Suspend'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Items Tab */}
                    {activeTab === 'items' && (
                        <div className="max-h-[480px] overflow-y-auto">
                            {loading && items.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-sm">Loading items…</div>
                            ) : items.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-sm">No items found.</div>
                            ) : (
                                <ul className="divide-y divide-slate-50">
                                    {items.map(item => (
                                        <li key={item.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-800 truncate">{item.title}</p>
                                                <p className="text-xs text-slate-500">{item.reporter_name || '—'} · ID {item.id}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteItem(item.id, item.title)}
                                                disabled={actionLoading.delete === item.id}
                                                className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium disabled:opacity-50 transition-colors"
                                            >
                                                {actionLoading.delete === item.id ? '…' : 'Delete'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Handovers Tab */}
                    {activeTab === 'handovers' && (
                        <div className="max-h-[700px] overflow-y-auto p-4 space-y-6 bg-slate-50/50">
                            {loading && !handovers ? (
                                <div className="text-center text-slate-400 text-sm p-6">Loading handovers…</div>
                            ) : !handovers ? (
                                <div className="text-center text-slate-400 text-sm p-6">Failed to load handovers.</div>
                            ) : (
                                <>
                                    {/* Stuck Claims */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                            Stuck Claims (Over 24h)
                                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{handovers.stuck.length}</span>
                                        </h3>
                                        {handovers.stuck.length === 0 ? (
                                            <div className="bg-white rounded-xl p-4 text-center border border-slate-100 shadow-sm text-sm text-slate-500">No stuck claims.</div>
                                        ) : (
                                            <div className="grid gap-3">
                                                {handovers.stuck.map(stuck => (
                                                    <div key={stuck.conversation_id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-slate-800 text-sm">{stuck.item_title} <span className="text-slate-400 font-normal">#{stuck.item_id}</span></p>
                                                            <p className="text-xs text-slate-500">Status: <span className="font-medium text-amber-600">{stuck.item_status}</span></p>
                                                            <div className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                <div>
                                                                    <span className="text-slate-400 border-b border-slate-200 mb-1 pb-1 inline-block">Finder</span><br />
                                                                    {stuck.finder_name || '—'} <br />
                                                                    <span className="text-[10px] text-slate-400">{stuck.finder_email}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-400 border-b border-slate-200 mb-1 pb-1 inline-block">Claimer</span><br />
                                                                    {stuck.claimer_name || '—'} <br />
                                                                    <span className="text-[10px] text-slate-400">{stuck.claimer_email}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg border border-red-100">
                                                            <p className="font-bold mb-1">Last Code Activity</p>
                                                            <p>{stuck.finder_code_created_at ? `Finder: ${formatTimeAgo(stuck.finder_code_created_at)}` : 'Finder: None'}</p>
                                                            <p>{stuck.claimer_code_created_at ? `Claimer: ${formatTimeAgo(stuck.claimer_code_created_at)}` : 'Claimer: None'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Completed Handovers */}
                                    <div className="mt-8">
                                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Recently Completed
                                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{handovers.completed.length}</span>
                                        </h3>
                                        {handovers.completed.length === 0 ? (
                                            <div className="bg-white rounded-xl p-4 text-center border border-slate-100 shadow-sm text-sm text-slate-500">No completed handovers.</div>
                                        ) : (
                                            <ul className="divide-y divide-slate-50 border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
                                                {handovers.completed.map(comp => (
                                                    <li key={comp.claim_id} className="p-4 flex flex-col sm:flex-row justify-between gap-3 text-sm hover:bg-slate-50 transition-colors">
                                                        <div>
                                                            <p className="font-medium text-slate-800 mb-1">{comp.item_title} <span className="text-xs text-slate-400 font-normal ml-1">Claim #{comp.claim_id}</span></p>
                                                            <p className="text-xs text-slate-500">Found by <span className="text-slate-700">{comp.finder_name || comp.finder_email}</span> → Claimed by <span className="text-slate-700">{comp.claimer_name || comp.claimer_email}</span></p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-md font-medium">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                Recovered
                                                            </span>
                                                            <p className="text-[10px] text-slate-400 mt-1">{formatTimeAgo(comp.recovered_at)}</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Tracking Tab */}
                    {activeTab === 'tracking' && (
                        <div className="p-6">
                            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                                    <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Reports Overview (Last 30 Days)</h3>
                                    <div className="flex items-end gap-1 h-20">
                                        {trackingStats?.reports.slice(0, 14).reverse().map((s, i) => (
                                            <div
                                                key={i}
                                                className="bg-blue-500 rounded-t-lg flex-1 min-w-[8px]"
                                                style={{ height: `${Math.min(100, (s.count / 10) * 100)}%` }}
                                                title={`${s.date}: ${s.count} reports`}
                                            ></div>
                                        ))}
                                    </div>
                                    <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                                        <span>14 days ago</span>
                                        <span>Today</span>
                                    </div>
                                </div>
                                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Claims Overview (Last 30 Days)</h3>
                                    <div className="flex items-end gap-1 h-20">
                                        {trackingStats?.claims.slice(0, 14).reverse().map((s, i) => (
                                            <div
                                                key={i}
                                                className="bg-emerald-500 rounded-t-lg flex-1 min-w-[8px]"
                                                style={{ height: `${Math.min(100, (s.count / 10) * 100)}%` }}
                                                title={`${s.date}: ${s.count} claims`}
                                            ></div>
                                        ))}
                                    </div>
                                    <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                                        <span>14 days ago</span>
                                        <span>Today</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {Object.entries(
                                    trackingTimeline.reduce((acc, entry) => {
                                        const date = new Date(entry.reported_at).toLocaleDateString();
                                        if (!acc[date]) acc[date] = [];
                                        acc[date].push(entry);
                                        return acc;
                                    }, {} as Record<string, TrackingTimelineEntry[]>)
                                ).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([date, entries]) => (
                                    <div key={date} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        {/* Dot */}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                        </div>
                                        {/* Content */}
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-slate-100 shadow-sm relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <time className="text-xs font-bold text-slate-400">{date}</time>
                                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{entries.length} items</span>
                                            </div>
                                            <div className="space-y-4">
                                                {entries.map(item => (
                                                    <div key={item.id} className="border-l-2 border-slate-100 pl-3 py-1">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">{item.title}</p>
                                                                <p className="text-[10px] text-slate-400">Reported by {item.reporter_name}</p>
                                                            </div>
                                                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${item.status === 'Recovered' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            <div className="flex items-center gap-1.5 text-[10px] bg-slate-50 px-2 py-1 rounded-md">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                                <span className="text-slate-500">Reported:</span>
                                                                <span className="font-medium text-slate-700">{new Date(item.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            {item.claimed_at && (
                                                                <div className="flex items-center gap-1.5 text-[10px] bg-emerald-50 px-2 py-1 rounded-md">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    <span className="text-emerald-500">Claimed:</span>
                                                                    <span className="font-medium text-emerald-700">{new Date(item.claimed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Advanced Tab */}
                    {activeTab === 'advanced' && (
                        <div className="p-6 space-y-6 bg-slate-50/50 max-h-[700px] overflow-y-auto">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-800">System Normalization</h3>
                                    <p className="text-xs text-slate-500 mt-1">Maintenance tasks for keeping database integrity</p>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="font-semibold text-slate-800 text-sm">Normalize Item Locations</h4>
                                            <p className="text-xs text-slate-500 mt-1 max-w-sm">Standardize all custom location strings currently populated in the Items table by migrating them to the latest valid format rules.</p>
                                        </div>
                                        <button
                                            onClick={handleNormalize}
                                            disabled={actionLoading.normalize}
                                            className="shrink-0 w-full sm:w-auto text-sm px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium disabled:opacity-50 transition-colors"
                                        >
                                            {actionLoading.normalize ? 'Processing…' : 'Execute Normalization'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-red-600 shadow-md ring-1 ring-red-600/10 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                <div className="px-6 py-4 border-b border-red-100 bg-red-50/30">
                                    <h3 className="font-bold text-red-700 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                                        Nuclear Options
                                    </h3>
                                    <p className="text-xs text-red-500/80 mt-1">Actions in this category will permanently destroy data.</p>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">Wipe Entire Database (Items)</h4>
                                            <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                                                Permanently destroys ALL <span className="font-medium text-slate-700">Items, Claims, Messages, and Conversations.</span> Also calls the Cloudinary API to permanently delete all associated images. User accounts and audit logs will remain intact.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleWipeItems}
                                            disabled={actionLoading.wipe}
                                            className="shrink-0 w-full sm:w-auto text-sm px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            {actionLoading.wipe ? 'Wiping DB…' : 'Wipe Database'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-slate-400 pb-4">FindIt Admin Panel — All actions are logged.</p>
            </main>
        </div>
    );
}
