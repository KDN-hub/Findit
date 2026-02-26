'use client';

import { useState, useTransition } from 'react';
import { API_BASE_URL } from '@/lib/config';
import { getItemImageSrc } from '@/lib/imageUtils';

interface FinderVerificationModalProps {
  conversationId: number;
  claimerName: string;
  itemName: string;
  location: string;
  date: string;
  imageUrl?: string | null;
  onClose: () => void;
  onVerify: () => void;
}

export function FinderVerificationModal({
  conversationId,
  claimerName,
  itemName,
  location,
  date,
  imageUrl,
  onClose,
  onVerify,
}: FinderVerificationModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const resolvedImageUrl = getItemImageSrc(imageUrl);

  const handleVerify = () => {
    setError(null);
    startTransition(async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('You must be signed in to verify.');
          return;
        }
        const res = await fetch(
          `${API_BASE_URL}/conversations/${conversationId}/approve-verification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.detail || 'Failed to approve verification.');
          return;
        }
        onVerify();
      } catch {
        setError('Something went wrong. Please try again.');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#003898]">Identity verification</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-[#003898]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Image Area */}
        <div className="w-full h-40 bg-[#F1F5F9] rounded-xl flex items-center justify-center mb-6 overflow-hidden">
          {resolvedImageUrl && !imgError ? (
            <img
              src={resolvedImageUrl}
              alt={itemName}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <svg className="w-16 h-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <p className="text-base text-slate-700">
            <span className="text-slate-500">Claimer&apos;s name</span>
            <span className="float-right font-medium">{claimerName}</span>
          </p>
          <p className="text-base text-slate-700">
            <span className="text-slate-500">Item name</span>
            <span className="float-right font-medium">{itemName}</span>
          </p>
          <p className="text-base text-slate-700">
            <span className="text-slate-500">Location</span>
            <span className="float-right font-medium">{location}</span>
          </p>
          <p className="text-base text-slate-700">
            <span className="text-slate-500">Date</span>
            <span className="float-right font-medium">{date}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isPending}
          className="w-full h-14 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isPending ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            'Verify'
          )}
        </button>
      </div>
    </div>
  );
}
