'use client';

import Link from 'next/link';

export default function PrivacySettingsPage() {
  return (
    <div className="min-h-dvh bg-[#F8FAFC] pb-8">
      <header className="px-4 pt-24 mt-4 pb-4 safe-area-top border-b bg-white border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F1F5F9]">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-[#003898]">Privacy Policy</h1>
        </div>
      </header>
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl p-5 space-y-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Data we collect</p>
          <p>We store your email, name, and profile information to run the service. When you report or claim items, we store those listings and messages.</p>
          <p className="font-medium text-slate-800">How we use it</p>
          <p>Your data is used to operate Findit: matching finders and owners, showing your display name to other users in conversations, and sending login and password-reset emails.</p>
          <p className="font-medium text-slate-800">Sharing</p>
          <p>We do not sell your data. Other users see only your display name and any information you share in messages. We may disclose data if required by law.</p>
          <p className="font-medium text-slate-800">Security</p>
          <p>Passwords are hashed. We use secure connections and take reasonable steps to protect your data.</p>
          <p className="font-medium text-slate-800">Your rights</p>
          <p>You can delete your account from Settings. That removes your account and associated data from our systems.</p>
        </div>
      </div>
    </div>
  );
}
