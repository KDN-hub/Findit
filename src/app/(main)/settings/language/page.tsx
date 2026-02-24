'use client';

import Link from 'next/link';

export default function LanguageSettingsPage() {
  return (
    <div className="min-h-dvh bg-[#F8FAFC] pb-8">
      <header className="px-4 pt-24 mt-4 pb-4 safe-area-top border-b bg-white border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F1F5F9]">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-[#003898]">Language</h1>
        </div>
      </header>
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
          <div className="p-4">
            <p className="font-medium text-slate-800">English</p>
            <p className="text-sm text-slate-500">Currently selected</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-4 px-1">More languages may be added in a future update.</p>
      </div>
    </div>
  );
}
