'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatTimeAgo } from '@/services/items';
import { API_BASE_URL } from '@/lib/config';
import { signOutAction } from '@/actions/auth';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  auth_provider: string;
}

interface ApiItem {
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

export default function DashboardPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [todaysItems, setTodaysItems] = useState<ApiItem[]>([]);
  const [previousItems, setPreviousItems] = useState<ApiItem[]>([]);

  // Check auth and fetch user profile
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    fetch(`${API_BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
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
        if (data) setUser(data);
        setAuthChecked(true);
      })
      .catch(async () => {
        await signOutAction();
        localStorage.removeItem('access_token');
        router.replace('/login');
      });
  }, [router]);

  // Fetch real items from API
  useEffect(() => {
    fetch(`${API_BASE_URL}/items`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ApiItem[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todays: ApiItem[] = [];
        const older: ApiItem[] = [];

        for (const item of data) {
          const itemDate = new Date(item.created_at || '');
          itemDate.setHours(0, 0, 0, 0);
          if (itemDate.getTime() === today.getTime()) {
            todays.push(item);
          } else {
            older.push(item);
          }
        }

        setTodaysItems(todays);
        setPreviousItems(older.slice(0, 5));
      })
      .catch((err) => console.error('Failed to fetch items:', err));
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (todaysItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % todaysItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [todaysItems.length]);

  // Scroll to current slide
  useEffect(() => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: currentSlide * slideWidth,
        behavior: 'smooth',
      });
    }
  }, [currentSlide]);

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

      {/* Today's Items Carousel */}
      <section className="px-4 mb-6">
        <div className="relative">
          <div
            ref={carouselRef}
            className="flex overflow-x-hidden rounded-2xl bg-[#F1F5F9]"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {todaysItems.length > 0 ? (
              todaysItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="w-full flex-shrink-0 h-64 flex flex-col items-center justify-center"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {(() => {
                    if (item.image_url) {
                      return (
                        <img
                          src={`${API_BASE_URL}${item.image_url}`}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      );
                    }
                    const { Icon, bg, color } = getCategoryIcon(item.category);
                    return (
                      <div className={`w-full h-full flex flex-col items-center justify-center gap-3 ${bg}`}>
                        <Icon className={`w-16 h-16 ${color}`} strokeWidth={1.2} />
                        <p className="text-sm font-semibold text-slate-500">{item.title}</p>
                        <p className="text-[11px] text-slate-400">{item.location}</p>
                      </div>
                    );
                  })()}
                </Link>
              ))
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-slate-400">
                <p>No items reported today</p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {todaysItems.length > 1 && (
            <>
              <button
                onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : todaysItems.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-[#003898] hover:bg-white hover:scale-110 active:scale-95 transition-all z-10"
                aria-label="Previous item"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev < todaysItems.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-[#003898] hover:bg-white hover:scale-110 active:scale-95 transition-all z-10"
                aria-label="Next item"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Carousel Indicators */}
          {todaysItems.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {todaysItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                    ? 'bg-[#003898] w-6'
                    : 'bg-slate-300'
                    }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Previously Section */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#003898]">Previously</h2>
          <Link href="/items" className="text-sm text-[#003898] font-medium underline">
            See more
          </Link>
        </div>

        <div className="space-y-3">
          {previousItems.length > 0 ? (
            previousItems.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="flex items-center gap-4 p-3 bg-[#F8FAFC] rounded-2xl hover:bg-slate-100 transition-colors"
              >
                {(() => {
                  const { Icon, bg, color } = getCategoryIcon(item.category);
                  return (
                    <div className={`w-24 h-24 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${item.image_url ? 'bg-[#E8ECF4]' : bg}`}>
                      {item.image_url ? (
                        <img src={`${API_BASE_URL}${item.image_url}`} alt={item.title} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Icon className={`w-9 h-9 ${color}`} strokeWidth={1.5} />
                      )}
                    </div>
                  );
                })()}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-500">{item.location}</p>
                  <h3 className="text-lg font-semibold text-[#003898] truncate">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.keywords || item.category}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-[#003898]">{item.created_at ? formatTimeAgo(item.created_at) : ''}</span>
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">No previous items yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
