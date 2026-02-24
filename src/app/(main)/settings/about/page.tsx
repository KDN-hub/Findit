'use client';

import Link from 'next/link';

export default function AboutSettingsPage() {
  return (
    <div className="min-h-dvh bg-[#F8FAFC] pb-8">
      <header className="px-4 pt-24 mt-4 pb-4 safe-area-top border-b bg-white border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F1F5F9]">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-[#003898]">About Findit</h1>
        </div>
      </header>
      <div className="px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <p className="text-slate-800 font-medium">Findit</p>
          <p className="text-sm text-slate-600">
            Lost-and-found for Babcock University. Report lost or found items, browse the feed, claim items that are yours, and arrange handovers with other users.
          </p>
          <p className="text-sm text-slate-500">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
