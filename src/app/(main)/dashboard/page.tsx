'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';
import { signOutAction } from '@/actions/auth';
import { DashboardItemsSection } from './DashboardItemsSection';
import { DashboardItemsFallback } from './DashboardItemsFallback';

const DASHBOARD_CACHE_KEY = 'findit_dashboard_cache';

interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  auth_provider: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auth + user (and cache for greeting); items are loaded via Suspense in DashboardItemsSection
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as { user?: UserProfile };
        if (cached.user) setUser(cached.user);
      }
    } catch {
      // ignore
    }

    fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) {
          await signOutAction();
          localStorage.removeItem('access_token');
          router.replace('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          try {
            const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
            const prev = raw ? JSON.parse(raw) : {};
            localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({ ...prev, user: data }));
          } catch {
            // ignore
          }
        }
        setAuthChecked(true);
      })
      .catch(async () => {
        await signOutAction();
        localStorage.removeItem('access_token');
        router.replace('/login');
      });
  }, [router]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/items?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#003898]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white pb-24">
      {/* Header */}
      <header className="px-4 pt-24 mt-4 pb-4 safe-area-top">
        <div className="flex items-center justify-between relative" ref={searchRef}>
          {/* Logo */}
          <div className="shrink-0">
            <Image
              src="/logo-dark.svg"
              alt="Findit"
              width={80}
              height={42}
              className="object-contain"
            />
          </div>

          {/* Search - expands when open */}
          {isSearchOpen ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center h-10 w-52 bg-[#F1F5F9] rounded-full px-3 gap-2">
                <svg className="w-4 h-4 text-[#003898] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  placeholder="Search items..."
                  className="flex-1 h-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 !outline-none !border-none !ring-0 !shadow-none focus:!outline-none focus:!ring-0 focus:!border-none focus:!shadow-none"
                  style={{ boxShadow: 'none', outline: 'none' }}
                />
              </div>
              <button
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="shrink-0 w-8 h-8 bg-[#F1F5F9] rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="shrink-0 w-10 h-10 bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#003898] hover:bg-slate-200 active:scale-95 transition-all"
              title="Search items"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* User Greeting */}
        {user && (
          <div className="mt-4">
            <h2 className="text-xl font-bold text-[#003898]">
              Hello, {user.full_name || user.email.split('@')[0]}! 👋
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        )}
      </header>

      {/* Items stream in via Suspense – layout appears instantly */}
      <Suspense fallback={<DashboardItemsFallback />}>
        <DashboardItemsSection />
      </Suspense>
    </div>
  );
}
