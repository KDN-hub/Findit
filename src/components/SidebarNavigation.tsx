'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';
import { signOutAction } from '@/actions/auth';

interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

export function SidebarNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    // Load from cache first for fast display
    try {
      const cached = localStorage.getItem('findit_dashboard_cache');
      if (cached) {
        const data = JSON.parse(cached);
        if (data.user) {
          setUser(data.user);
          setLoading(false);
        }
      }
    } catch (e) {
      // ignore
    }

    fetch(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUser(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await signOutAction();
    localStorage.removeItem('access_token');
    router.replace('/login');
  };

  const navItems = [
    {
      label: 'Home / Dashboard',
      href: '/dashboard',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-all">
          <path
            d="M4 10.5V19C4 19.5523 4.44772 20 5 20H9V14H15V20H19C19.5523 20 20 19.5523 20 19V10.5L12 4L4 10.5Z"
            stroke={active ? '#003898' : '#64748b'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? 'rgba(0, 56, 152, 0.15)' : 'none'}
          />
        </svg>
      )
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-all">
          <rect
            x="3"
            y="5"
            width="18"
            height="12"
            rx="3"
            stroke={active ? '#003898' : '#64748b'}
            strokeWidth="2"
            fill={active ? 'rgba(0, 56, 152, 0.15)' : 'none'}
          />
          <path d="M8 11h.01M12 11h.01M16 11h.01" stroke={active ? '#003898' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    },
    {
      label: 'Browse Items',
      href: '/items',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-all">
          <path
            d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
            stroke={active ? '#003898' : '#64748b'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? 'rgba(0, 56, 152, 0.15)' : 'none'}
          />
          <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke={active ? '#003898' : '#64748b'} strokeWidth="2" strokeLinecap="round" />
          <path d="M12 11v4M9 13h6" stroke={active ? '#003898' : '#64748b'} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    },
    {
      label: 'My Profile',
      href: '/profile',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-all">
          <circle
            cx="12"
            cy="8"
            r="3.5"
            stroke={active ? '#003898' : '#64748b'}
            strokeWidth="2"
            fill={active ? 'rgba(0, 56, 152, 0.15)' : 'none'}
          />
          <path
            d="M6 19C6 16.2386 8.68629 14 12 14C15.3137 14 18 16.2386 18 19"
            stroke={active ? '#003898' : '#64748b'}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-all">
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke={active ? '#003898' : '#64748b'}
            strokeWidth="2"
            fill={active ? 'rgba(0, 56, 152, 0.15)' : 'none'}
          />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            stroke={active ? '#003898' : '#64748b'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    }
  ];

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-100 flex-col h-dvh sticky top-0 bg-white z-40 shrink-0 p-6 justify-between select-none">
      <div className="space-y-8">
        {/* App Logo */}
        <div className="flex items-center gap-3">
          <Image src="/favicon.svg" alt="Findit" width={28} height={28} />
          <div>
            <h1 className="font-bold text-slate-800 text-lg tracking-tight leading-none">Findit</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Babcock University</span>
          </div>
        </div>

        {/* Quick CTA - Report Button */}
        <Link
          href="/report"
          className="flex h-12 w-full bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl items-center justify-center gap-2 transition-all shadow-md shadow-[#003898]/10 hover:shadow-[#003898]/25 hover:shadow-lg active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Report Lost / Found
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 h-11 px-4 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-[#003898]/5 text-[#003898] font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className="shrink-0">{item.icon(active)}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile section */}
      <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-3.5 bg-slate-100 rounded w-3/4" />
              <div className="h-2.5 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate leading-snug">
                {user.full_name || user.email.split('@')[0]}
              </p>
              <p className="text-xs text-slate-400 truncate leading-none mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
        ) : null}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 h-11 px-4 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition-all w-full text-left"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
