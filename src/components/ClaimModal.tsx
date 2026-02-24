'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

interface ClaimModalProps {
  itemId: string;
  onClose: () => void;
}

export function ClaimModal({ itemId, onClose }: ClaimModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [proofDescription, setProofDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (proofDescription.length < 20) {
      setError('Please provide more details to verify your claim (at least 20 characters)');
      return;
    }

    startTransition(async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('You must be logged in to claim an item');
          return;
        }

        const res = await fetch(`${API_BASE_URL}/claims`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            item_id: parseInt(itemId),
            proof_description: proofDescription
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Failed to submit claim');
        }

        onClose();
        // data contains conversation_id from backend
        router.push(`/messages/${data.conversation_id}`);
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 safe-area-bottom animate-slide-up mb-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#003898]">Claim This Item</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#F1F5F9] rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-4">
          Please describe how you can prove this item belongs to you. This will start a secure conversation with the finder.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#003898] mb-2">
              Proof of Ownership
            </label>
            <textarea
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              placeholder="Describe unique features, contents, or any proof that this item is yours..."
              rows={4}
              className="w-full px-4 py-3 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all resize-none"
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              {proofDescription.length}/20 characters minimum
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-14 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isPending ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Submit Claim'
            )}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500 text-center">
          Your contact info will only be shared with the finder after they approve your claim.
        </p>
      </div>
    </div>
  );
}
