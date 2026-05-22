'use client';

import { Suspense, useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // ── Verify OTP ──────────
  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResendStatus('');
    
    if (otp.length !== 4) {
      setError('Please enter the 4-digit code from your email.');
      return;
    }
    
    startTransition(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-registration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || 'Verification failed. Please try again.');
          return;
        }
        setSuccess('Account verified successfully! Redirecting to login...');
        
        const redirectTo = searchParams.get('redirect');
        setTimeout(() => {
          const redirectParam = redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : '';
          router.push(`/login?verified=true${redirectParam}`);
        }, 2000);
      } catch {
        setError('Could not connect to the server. Please try again.');
      }
    });
  }

  // ── Resend OTP ──────────
  async function handleResendCode() {
    setError('');
    setSuccess('');
    setResendStatus('Sending...');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendStatus('');
        setError(data.detail || 'Could not send verification code.');
        return;
      }
      setResendStatus('Verification code resent successfully!');
    } catch {
      setResendStatus('');
      setError('Could not connect to the server. Please try again.');
    }
  }

  // ── Spinner ───────────────────────────────────────────────
  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="min-h-dvh bg-white flex flex-col px-6 pt-16 pb-8 safe-area-top safe-area-bottom">

      {/* Back Button */}
      <Link
        href="/login"
        className="w-12 h-12 bg-[#E8ECF4] rounded-full flex items-center justify-center mb-8"
      >
        <svg className="w-5 h-5 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>

      {/* ── OTP Form ── */}
      <form onSubmit={handleVerifyOtp} className="flex-1 flex flex-col">
        <div className="mb-10">
          {/* Email icon */}
          <div className="w-16 h-16 bg-[#003898] rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-[32px] font-bold text-[#003898] mb-2">Check your email</h1>
          <p className="text-[#6B7280] text-base">
            We sent a 4-digit code to <span className="font-medium text-slate-700">{email}</span>. Enter it below to verify your account.
          </p>
        </div>

        <div className="flex-1 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
          {resendStatus && !success && (
             <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
               <p className="text-sm text-[#003898]">{resendStatus}</p>
             </div>
          )}
          <div>
            <label className="block text-[#003898] text-sm font-medium mb-2">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 text-center text-2xl font-bold tracking-[0.5em] placeholder:text-slate-300 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
              required
            />
          </div>
          <button
            type="button"
            onClick={handleResendCode}
            className="text-sm text-[#003898] hover:underline"
          >
            Didn't receive it? Resend code
          </button>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={isPending || !!success}
            className="w-full h-14 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isPending ? <Spinner /> : 'Verify Account'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-white flex flex-col px-6 pt-16 pb-8 safe-area-top safe-area-bottom justify-center">
        <div className="animate-pulse text-[#6B7280] text-center">Loading…</div>
      </div>
    }>
      <VerifyOtpForm />
    </Suspense>
  );
}
