'use client';

import { useEffect, useState } from 'react';

const DURATION_MS = 2500;

export function HandoverSuccessAnimation({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, DURATION_MS);
    return () => clearTimeout(t);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-fade-in"
      aria-live="polite"
      role="status"
      aria-label="Handover successful"
    >
      <div className="flex flex-col items-center justify-center animate-scale-in">
        <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-800">Success!</p>
        <p className="text-sm text-slate-500">Item returned successfully</p>
      </div>
    </div>
  );
}
