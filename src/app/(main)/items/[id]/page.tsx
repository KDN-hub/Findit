'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/config';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { ItemImage } from '@/components/ItemImage';

interface ItemDetail {
  id: number;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  location: string | null;
  keywords: string | null;
  date_found: string | null;
  image_url: string | null;
  user_id: number;
  reporter_name: string | null;
  created_at: string | null;
}

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimPending, setClaimPending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Fetch current user when we have a token (to check if viewer is the finder)
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setCurrentUserId(null);
      return;
    }
    fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCurrentUserId(data?.id ?? null))
      .catch(() => setCurrentUserId(null));
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      setLoading(true);
      setError('');

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request Timeout')), 5000);
      });

      const fetchPromise = fetch(`${API_BASE_URL}/items/${id}`);

      try {
        const res = await Promise.race([fetchPromise, timeoutPromise]);

        if (!res.ok) {
          if (res.status === 404) {
            setError('Item not found');
          } else {
            setError(`Server error: ${res.status}`);
          }
          setLoading(false);
          return;
        }

        const data: ItemDetail = await res.json();
        setItem(data);
        setLoading(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.message === 'Request Timeout') {
            setError('Request Timeout - The server took too long to respond');
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to load item. Please try again.');
        }
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleClaimItem = async () => {
    if (!item) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in to claim this item.');
      router.push('/login');
      return;
    }

    // Optimistic update: show Pending immediately
    setClaimPending(true);
    setClaiming(true);

    try {
      const response = await fetch(`${API_BASE_URL}/conversations/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: item.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to initiate conversation');
      }

      const data = await response.json();
      router.push(`/messages/${data.conversation_id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start conversation';
      setClaimPending(false);
      setClaiming(false);
      toast.error(message);
    } finally {
      setClaiming(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <p className="text-slate-600">Loading item details...</p>
      </div>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center px-6">
        <div className="text-center w-full max-w-md">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-sm text-red-700 mb-4">{error || 'Item not found'}</p>
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                const fetchItem = async () => {
                  try {
                    const timeoutPromise = new Promise<never>((_, reject) => {
                      setTimeout(() => reject(new Error('Request Timeout')), 5000);
                    });
                    const fetchPromise = fetch(`${API_BASE_URL}/items/${id}`);
                    const res = await Promise.race([fetchPromise, timeoutPromise]);

                    if (!res.ok) {
                      setError(`Server error: ${res.status}`);
                      setLoading(false);
                      return;
                    }

                    const data: ItemDetail = await res.json();
                    setItem(data);
                    setLoading(false);
                  } catch (err: unknown) {
                    if (err instanceof Error) {
                      setError(err.message === 'Request Timeout'
                        ? 'Request Timeout - The server took too long to respond'
                        : err.message);
                    } else {
                      setError('Failed to load item. Please try again.');
                    }
                    setLoading(false);
                  }
                };
                if (id) fetchItem();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
          <Link href="/items" className="text-sm text-[#003898] font-medium underline inline-block mt-4">
            ← Back to items
          </Link>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not specified';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Item display
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <div className="flex-1 px-6 py-6">
        {/* Title */}
        <h1 className="text-2xl font-bold text-[#003898] mb-4">{item.title}</h1>

        {/* Status Badge */}
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'Found' ? 'bg-green-100 text-green-800' :
            item.status === 'Lost' ? 'bg-red-100 text-red-800' :
            item.status === 'Recovered' ? 'bg-emerald-100 text-emerald-800' :
              'bg-blue-100 text-blue-800'
            }`}>
            {item.status}
          </span>
          {claimPending && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              Pending
            </span>
          )}
        </div>

        {/* Image */}
        {item.image_url ? (
          <div className="mb-6">
            <div className="w-full rounded-lg overflow-hidden bg-slate-100">
              <ItemImage
                src={item.image_url}
                alt={item.title}
                className="w-full max-h-80 object-cover rounded-lg"
                loading="lazy"
              />
            </div>
          </div>
        ) : (
          (() => {
            const { Icon, bg, color } = getCategoryIcon(item.category);
            return (
              <div className="mb-6">
                <div className={`w-full h-64 rounded-lg flex flex-col items-center justify-center gap-3 ${bg}`}>
                  <Icon className={`w-16 h-16 ${color}`} strokeWidth={1.2} />
                  <span className="text-sm font-medium text-slate-400">No Image Provided</span>
                </div>
              </div>
            );
          })()
        )}

        {/* Description */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-2">Description</p>
          <p className="text-slate-700 leading-relaxed">
            {item.description || 'No description provided.'}
          </p>
        </div>

        {/* Location */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-2">Location</p>
          <p className="text-slate-700">{item.location || 'Not specified'}</p>
        </div>

        {/* Date Found */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-2">Date Found</p>
          <p className="text-slate-700">{formatDate(item.date_found)}</p>
        </div>

        {/* Category */}
        {item.category && (
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-2">Category</p>
            <p className="text-slate-700">{item.category}</p>
          </div>
        )}

        {/* Keywords */}
        {item.keywords && (
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-2">Keywords</p>
            <p className="text-slate-700">{item.keywords}</p>
          </div>
        )}

        {/* Reporter Name */}
        {item.reporter_name && (
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-2">Reported by</p>
            <p className="text-slate-700">{item.reporter_name}</p>
          </div>
        )}

        {/* Claim Item / Recovered Button */}
        <div className="mt-8">
          {item.status === 'Recovered' ? (
            <div className="w-full bg-green-600 text-white text-center py-3 px-6 rounded-lg font-semibold cursor-default flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Recovered
            </div>
          ) : currentUserId !== null && currentUserId === item.user_id ? (
            <div className="w-full bg-slate-100 border border-slate-200 text-slate-600 text-center py-3 px-6 rounded-lg font-medium">
              You are the finder of this item. You cannot claim your own post.
            </div>
          ) : claimPending ? (
            <div className="w-full bg-amber-500 text-white text-center py-3 px-6 rounded-lg font-semibold cursor-default flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Pending…
            </div>
          ) : (
            <button
              onClick={handleClaimItem}
              disabled={claiming}
              className="w-full bg-[#003898] hover:bg-[#002d7a] disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-center py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              {claiming ? 'Connecting...' : 'Claim Item'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
