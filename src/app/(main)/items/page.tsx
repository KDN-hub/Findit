'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ItemCard } from '@/components/ItemCard';
import { CATEGORIES } from '@/services/items';
import { API_BASE_URL } from '@/lib/config';
import { CAMPUS_LOCATIONS } from '@/lib/constants';

interface ApiItem {
  id: number;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  location: string | null;
  keywords: string | null;
  date_found: string | null;
  reporter_name: string | null;
  image_url: string | null;
  created_at: string | null;
}

export default function ItemsFoundPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [customLocationSearch, setCustomLocationSearch] = useState('');
  const [items, setItems] = useState<ApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/items${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data: ApiItem[] = await res.json();
      setItems(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load items';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedStatus, selectedCategory]);

  // Fetch on mount and when filters change (debounced for search)
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchItems]);

  // Filter by location client-side, then transform for ItemCard
  const filteredItems = items.filter((item) => {
    if (locationFilter === 'All Locations') return true;
    const loc = (item.location || '').toLowerCase();
    if (locationFilter === 'Other') {
      if (customLocationSearch.trim()) {
        return loc.includes(customLocationSearch.trim().toLowerCase());
      }
      return loc.startsWith('other');
    }
    return item.location === locationFilter;
  });

  const toCardItem = (item: ApiItem) => ({
    id: String(item.id),
    title: item.title,
    location: item.location || 'Unknown location',
    category: item.category || 'Other',
    photo_url: null as string | null,
    image_url: item.image_url,
    created_at: item.created_at ? new Date(item.created_at) : new Date(),
    status: item.status,
  });

  const activeItems = filteredItems.filter((i) => i.status !== 'Recovered').map(toCardItem);
  const recoveredItems = filteredItems.filter((i) => i.status === 'Recovered').map(toCardItem);
  const hasItems = activeItems.length > 0 || recoveredItems.length > 0;

  return (
    <div className="min-h-dvh bg-white pb-24">
      {/* Header */}
      <header className="px-4 pt-24 mt-4 pb-4 safe-area-top">
        <div className="flex items-center gap-3 mb-4">
          {/* Back Button */}
          <Link
            href="/dashboard"
            className="w-10 h-10 bg-[#F1F5F9] rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-[#003898]">Items Found</h1>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-4">
          {['All', 'Found', 'Lost', 'Recovered'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${selectedStatus === status
                ? 'bg-[#003898] text-white'
                : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full h-12 pl-4 pr-12 bg-[#F1F5F9] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Category & Location Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-12 pl-4 pr-10 bg-[#F1F5F9] rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                if (e.target.value !== 'Other') setCustomLocationSearch('');
              }}
              className="w-full h-12 pl-4 pr-10 bg-[#F1F5F9] rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all appearance-none cursor-pointer"
            >
              <option value="All Locations">All Locations</option>
              {Object.entries(CAMPUS_LOCATIONS).map(([group, locations]) =>
                group === 'Other' ? (
                  <option key="Other" value="Other">Other</option>
                ) : (
                  <optgroup key={group} label={group}>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </optgroup>
                )
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Custom location search when "Other" is selected */}
        {locationFilter === 'Other' && (
          <div className="relative mt-3">
            <input
              type="text"
              value={customLocationSearch}
              onChange={(e) => setCustomLocationSearch(e.target.value)}
              placeholder="Type a location to search..."
              className="w-full h-12 pl-4 pr-12 bg-[#F1F5F9] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
          </div>
        )}
      </header>

      {/* Items List */}
      <section className="px-4 pb-8">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-[#003898] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading items...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Failed to load items</h3>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button onClick={fetchItems} className="text-sm text-[#003898] font-medium underline">Try again</button>
          </div>
        ) : !hasItems ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No items found</h3>
            <p className="text-sm text-slate-500">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Items */}
            {activeItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Still Looking ({activeItems.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {activeItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {activeItems.length > 0 && recoveredItems.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recovered</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            {/* Recovered Items */}
            {recoveredItems.length > 0 && (
              <div>
                {activeItems.length === 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                      Recovered ({recoveredItems.length})
                    </h2>
                  </div>
                )}
                <div className="space-y-3">
                  {recoveredItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
