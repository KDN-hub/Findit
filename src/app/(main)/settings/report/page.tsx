'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ReportProblemSettingsPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-dvh bg-[#F8FAFC] pb-8">
      <header className="px-4 pt-24 mt-4 pb-4 safe-area-top border-b bg-white border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F1F5F9]">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-[#003898]">Report a Problem</h1>
        </div>
      </header>
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <p className="text-sm text-slate-600">
            Found a bug or have feedback? Send us an email and we&apos;ll get back to you.
          </p>
          {sent ? (
            <p className="text-sm text-green-600 font-medium">Opening your email app…</p>
          ) : (
            <a
              href="mailto:finditappbu@gmail.com?subject=Findit%20App%20-%20Problem%20Report"
              onClick={() => setSent(true)}
              className="block w-full h-12 bg-[#003898] hover:bg-[#002d7a] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Support
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
