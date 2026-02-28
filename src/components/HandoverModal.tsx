import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/config';

const CODE_EXPIRY_SECONDS = 15 * 60; // 15 minutes

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface HandoverModalProps {
  isOpen: boolean;
  conversationId: number;
  isFinder: boolean;
  onClose: () => void;
  /** Called on verify success; receives API response (e.g. { handover_status: 'success' }). */
  onSuccess?: (data?: { handover_status?: string }) => void;
}

export function HandoverModal({ isOpen, conversationId, isFinder, onClose, onSuccess }: HandoverModalProps) {
  const [myCode, setMyCode] = useState<string>('');
  const [otherCode, setOtherCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const fetchMyCode = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError("You must be logged in.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/handover/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start handover');
      }

      const data = await response.json();
      setMyCode(data.my_code);
      setSecondsRemaining(CODE_EXPIRY_SECONDS);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load your code';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchMyCode();
    }
  }, [isOpen, conversationId, fetchMyCode]);

  // Countdown timer: decrement every second while we have a code and time left
  useEffect(() => {
    if (!myCode || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 1;
        return next < 0 ? 0 : next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [myCode, secondsRemaining]);

  const handleSubmit = async () => {
    if (!otherCode.trim() || otherCode.length !== 4) {
      setError("Please enter a valid 4-digit code");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError("You must be logged in.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/handover/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: otherCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to verify code');
      }

      const data = await response.json();
      setError('');
      onSuccess?.(data);
      onClose();

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to verify code';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setMyCode('');
    setOtherCode('');
    setSecondsRemaining(0);
    setError('');
    onClose();
  };

  const codeExpired = secondsRemaining <= 0 && !!myCode;
  const showCode = !!myCode && !codeExpired;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 pb-24 px-4 sm:pb-0 sm:px-0"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg p-6 pb-8 safe-area-bottom animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#003898]">Hand over verification</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-[#F1F5F9] rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Your Code Section */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-2">Your Code</p>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#003898] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : codeExpired ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <p className="text-sm text-amber-800 mb-3">Code expired. Generate a new one so the other person can verify.</p>
              <button
                type="button"
                onClick={fetchMyCode}
                disabled={loading}
                className="w-full py-3 px-4 bg-[#003898] hover:bg-[#002266] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                Regenerate Code
              </button>
            </div>
          ) : (
            <div className="bg-[#F1F5F9] rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-[#003898] tracking-wider">
                {showCode ? myCode : '----'}
              </p>
              {showCode && (
                <p className="text-sm text-slate-500 mt-2">
                  Expires in <span className="font-semibold text-slate-700">{formatCountdown(secondsRemaining)}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Other Person's Code Section */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-2">
            {isFinder ? "Claimer's Code" : "Finder's Code"}
          </p>
          <input
            type="text"
            value={otherCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
              setOtherCode(value);
              setError('');
            }}
            placeholder="Enter 4-digit code"
            maxLength={4}
            className="w-full px-4 py-3 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all text-center text-2xl font-semibold tracking-wider"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !otherCode.trim() || otherCode.length !== 4 || loading}
          className="w-full h-14 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying...
            </>
          ) : (
            'Submit'
          )}
        </button>

        <p className="mt-4 text-xs text-slate-500 text-center">
          Enter the code shown by the other person to complete the handover.
        </p>
      </div>
    </div>
  );
}
