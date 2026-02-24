'use client';

import Link from 'next/link';

export default function TermsSettingsPage() {
  return (
    <div className="min-h-dvh bg-[#F8FAFC] pb-8">
      <header className="px-4 pt-24 mt-4 pb-4 safe-area-top border-b bg-white border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F1F5F9]">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-[#003898]">Terms of Service</h1>
        </div>
      </header>
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl p-5 space-y-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">1. Acceptance</p>
          <p>By using Findit you agree to these terms. The app is for the Babcock University community to report and claim lost and found items.</p>
          <p className="font-medium text-slate-800">2. Use of the service</p>
          <p>You must provide accurate information when reporting or claiming items. Do not misuse the app for spam, fraud, or harassment.</p>
          <p className="font-medium text-slate-800">3. Liability</p>
          <p>Findit connects finders and owners. We are not responsible for the accuracy of listings or the conduct of users during handovers. Use common sense and meet in safe, public places.</p>
          <p className="font-medium text-slate-800">4. Changes</p>
          <p>We may update these terms. Continued use of the app after changes constitutes acceptance.</p>
        </div>
      </div>
    </div>
  );
}
