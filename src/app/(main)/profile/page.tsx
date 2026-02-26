'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/config';
import { signOutAction } from '@/actions/auth';
import { ItemImage } from '@/components/ItemImage';

const PROFILE_CACHE_KEY = 'findit_profile_cache';

interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  auth_provider: string;
  is_verified?: boolean;
}

interface ReportedItem {
  id: number;
  title: string;
  location: string | null;
  category: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
}

interface ClaimedItem {
  id: number;
  item_id: number;
  title: string;
  location: string | null;
  category: string | null;
  status: string;
  finder_name: string;
  photo_url: string | null;
  claimed_at: string;
  conversation_id: number;
}

type TabType = 'reported' | 'claims';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

function getStatusColor(status: string) {
  const s = status.toLowerCase();
  switch (s) {
    case 'active':
    case 'found':
      return 'bg-blue-100 text-blue-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'approved':
    case 'recovered':
      return 'bg-green-100 text-green-700';
    case 'claimed':
    case 'completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    case 'lost':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function ProfilePage() {
  const router = useRouter();

  // ── ALL useState HOOKS ──
  const [activeTab, setActiveTab] = useState<TabType>('reported');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ reported: 0, claims: 0, reunited: 0 });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Data state
  const [reportedItems, setReportedItems] = useState<ReportedItem[]>([]);
  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>([]);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [reportedLoaded, setReportedLoaded] = useState(false);
  const [claimsLoaded, setClaimsLoaded] = useState(false);

  // ── Stale-while-revalidate: show cache first, then fetch ──
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const mergeCache = (partial: Record<string, unknown>) => {
      try {
        const raw = localStorage.getItem(PROFILE_CACHE_KEY);
        const prev = raw ? JSON.parse(raw) : {};
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ ...prev, ...partial }));
      } catch {
        // ignore
      }
    };

    // 1. Restore from cache immediately
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as {
          user?: UserProfile;
          stats?: { reported: number; claims: number; reunited: number };
          reportedItems?: ReportedItem[];
          claimedItems?: ClaimedItem[];
        };
        if (cached.user) setUser(cached.user);
        if (cached.stats) setStats(cached.stats);
        if (Array.isArray(cached.reportedItems)) setReportedItems(cached.reportedItems);
        if (Array.isArray(cached.claimedItems)) setClaimedItems(cached.claimedItems);
        setLoading(false);
        setStatsLoaded(!!cached.stats);
        setReportedLoaded(true);
        setClaimsLoaded(true);
      }
    } catch {
      // ignore
    }

    const headers = { Authorization: `Bearer ${token}` };
    const showOffline = () => toast('Offline Mode — showing cached data', { id: 'offline-profile', icon: '📶', duration: 3000 });

    // 2. Fetch user
    fetch(`${API_BASE_URL}/users/me`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          mergeCache({ user: data });
        }
        setLoading(false);
      })
      .catch(async () => {
        await signOutAction();
        localStorage.removeItem('access_token');
        router.replace('/login');
      });

    // 3. Fetch stats
    fetch(`${API_BASE_URL}/users/me/stats`, { headers })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          const s = { reported: data.reported || 0, claims: data.claims || 0, reunited: data.reunited || 0 };
          setStats(s);
          mergeCache({ stats: s });
        }
      })
      .catch(showOffline)
      .finally(() => setStatsLoaded(true));

    // 4. Fetch reported items
    fetch(`${API_BASE_URL}/users/me/items`, { headers })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        setReportedItems(data);
        mergeCache({ reportedItems: data });
      })
      .catch(showOffline)
      .finally(() => setReportedLoaded(true));

    // 5. Fetch claims
    fetch(`${API_BASE_URL}/users/me/claims`, { headers })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        setClaimedItems(data);
        mergeCache({ claimedItems: data });
      })
      .catch(showOffline)
      .finally(() => setClaimsLoaded(true));
  }, [router]);

  // ── HELPER FUNCTIONS ──
  const handleLogout = async () => {
    await signOutAction();
    localStorage.removeItem('access_token');
    router.replace('/login');
  };

  // ── CONDITIONAL RETURNS (after all hooks) ──
  if (loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#003898]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  // ── DERIVED VALUES (safe after hooks, before JSX) ──
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const displayInitial = displayName.charAt(0).toUpperCase();

  // ── MAIN RETURN (JSX) ──
  return (
    <div className="min-h-dvh bg-white pb-24">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-2">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Log Out?</h2>
              <p className="text-sm text-slate-500">Are you sure you want to log out?</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-4 pt-24 pb-6 safe-area-top bg-gradient-to-b from-[#003898] to-[#0052CC]">
        <div className="flex items-center justify-between mb-6 pt-2">
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-10 h-10 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden">
            {user?.avatar_url ? (
              <Image src={user.avatar_url} alt={displayName} width={80} height={80} className="object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">
                {displayInitial}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{displayName}</h2>
            <p className="text-white/70 text-sm">{displayEmail}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
                {user?.auth_provider === 'google' ? 'Google Account' : 'Email Account'}
              </span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white capitalize">
                {user?.role || 'student'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-around">
          {!statsLoaded ? (
            <>
              <div className="text-center animate-pulse">
                <div className="h-8 w-10 bg-slate-200 rounded mx-auto mb-1" />
                <div className="h-3 w-14 bg-slate-100 rounded mx-auto" />
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="text-center animate-pulse">
                <div className="h-8 w-10 bg-slate-200 rounded mx-auto mb-1" />
                <div className="h-3 w-12 bg-slate-100 rounded mx-auto" />
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="text-center animate-pulse">
                <div className="h-8 w-10 bg-slate-200 rounded mx-auto mb-1" />
                <div className="h-3 w-14 bg-slate-100 rounded mx-auto" />
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#003898]">{stats.reported}</p>
                <p className="text-xs text-slate-500">Reported</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-[#003898]">{stats.claims}</p>
                <p className="text-xs text-slate-500">Claims</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-[#003898]">{stats.reunited}</p>
                <p className="text-xs text-slate-500">Reunited</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6">
        <div className="flex bg-[#F1F5F9] rounded-xl p-1">
          <button
            onClick={() => setActiveTab('reported')}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'reported'
              ? 'bg-white text-[#003898] shadow-sm'
              : 'text-slate-500'
              }`}
          >
            My Reported Items
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'claims'
              ? 'bg-white text-[#003898] shadow-sm'
              : 'text-slate-500'
              }`}
          >
            My Claims
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        {activeTab === 'reported' ? (
          <div className="space-y-3">
            {!reportedLoaded ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-2xl animate-pulse">
                    <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-16 bg-slate-200 rounded" />
                      <div className="h-4 w-3/4 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    </div>
                    <div className="h-3 w-12 bg-slate-200 rounded shrink-0" />
                  </div>
                ))}
              </>
            ) : reportedItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">No reported items</h3>
                <p className="text-sm text-slate-500 mb-4">Items you report will appear here</p>
                <Link href="/report" className="text-[#003898] font-medium text-sm">
                  Report an item →
                </Link>
              </div>
            ) : (
              reportedItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  {/* Image */}
                  <div className="w-16 h-16 bg-[#E8ECF4] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <ItemImage src={item.image_url} alt={item.title} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                    ) : (
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#003898] truncate">{item.title}</h3>
                    <p className="text-xs text-slate-500">{item.location}</p>
                  </div>

                  {/* Time */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">{formatTimeAgo(item.created_at)}</p>
                    <svg className="w-4 h-4 text-slate-400 ml-auto mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {!claimsLoaded ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-2xl animate-pulse">
                    <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-16 bg-slate-200 rounded" />
                      <div className="h-4 w-3/4 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    </div>
                    <div className="h-3 w-12 bg-slate-200 rounded shrink-0" />
                  </div>
                ))}
              </>
            ) : claimedItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">No claims yet</h3>
                <p className="text-sm text-slate-500 mb-4">Items you claim will appear here</p>
                <Link href="/items" className="text-[#003898] font-medium text-sm">
                  Browse items →
                </Link>
              </div>
            ) : (
              claimedItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/messages/${item.conversation_id || item.item_id}`} // robust fallback
                  className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  {/* Image */}
                  <div className="w-16 h-16 bg-[#E8ECF4] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {item.photo_url ? (
                      <ItemImage src={item.photo_url} alt={item.title} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                    ) : (
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    <h3 className="font-semibold text-[#003898] truncate mt-1">{item.title}</h3>
                    <p className="text-xs text-slate-500">Found by {item.finder_name}</p>
                  </div>

                  {/* Time & Arrow */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">{formatTimeAgo(item.claimed_at)}</p>
                    <svg className="w-4 h-4 text-slate-400 ml-auto mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Log Out Button */}
      <div className="px-4 mt-6">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3.5 bg-red-50 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  );
}
