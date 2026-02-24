'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

type Step = 1 | 2 | 3;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Step 1: Send OTP ──────────────────────────────────────
  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || 'Something went wrong. Please try again.');
          return;
        }
        // Only advance if the backend confirms the email was actually sent
        if (data.email_sent) {
          setStep(2);
        } else {
          setError('Could not send reset code. Please check your email and try again.');
        }
      } catch {
        setError('Could not connect to the server. Please try again.');
      }
    });
  }

  // ── Step 2: Verify OTP (just advance to step 3) ──────────
  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (otp.length !== 4) {
      setError('Please enter the 4-digit code from your email.');
      return;
    }
    setStep(3);
  }

  // ── Step 3: Reset Password ────────────────────────────────
  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, new_password: newPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || 'Reset failed. Please try again.');
          // If OTP is wrong/expired, send user back to step 2
          if (data.detail?.toLowerCase().includes('code')) setStep(2);
          return;
        }
        setSuccess('Password reset! Redirecting to login…');
        setTimeout(() => router.push('/login'), 1500);
      } catch {
        setError('Could not connect to the server. Please try again.');
      }
    });
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
        href={step === 1 ? '/login' : '#'}
        onClick={step > 1 ? (e) => { e.preventDefault(); setStep((s) => (s - 1) as Step); setError(''); } : undefined}
        className="w-12 h-12 bg-[#E8ECF4] rounded-full flex items-center justify-center mb-8"
      >
        <svg className="w-5 h-5 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>

      {/* Step indicator dots */}
      <div className="flex gap-2 mb-8">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-[#003898]' : s < step ? 'w-4 bg-[#003898]/40' : 'w-4 bg-[#E8ECF4]'}`}
          />
        ))}
      </div>

      {/* ── STEP 1: Email ── */}
      {step === 1 && (
        <form onSubmit={handleSendCode} className="flex-1 flex flex-col">
          <div className="mb-10">
            <h1 className="text-[32px] font-bold text-[#003898] mb-2">Forgot Password?</h1>
            <p className="text-[#6B7280] text-base">Enter your email and we'll send you a reset code.</p>
          </div>

          <div className="flex-1 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <div>
              <label className="block text-[#003898] text-sm font-medium mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@email.com"
                className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
                required
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-14 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPending ? <Spinner /> : 'Send Code'}
            </button>
            <p className="text-center text-[#6B7280] mt-4 text-sm">
              Remember your password?{' '}
              <Link href="/login" className="text-[#003898] font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </form>
      )}

      {/* ── STEP 2: OTP ── */}
      {step === 2 && (
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
              We sent a 4-digit code to <span className="font-medium text-slate-700">{email}</span>. Enter it below.
            </p>
          </div>

          <div className="flex-1 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <div>
              <label className="block text-[#003898] text-sm font-medium mb-2">Reset code</label>
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
              onClick={() => { setError(''); handleSendCode({ preventDefault: () => { } } as React.FormEvent); }}
              className="text-sm text-[#003898] hover:underline"
            >
              Didn't receive it? Resend code
            </button>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full h-14 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              Verify Code
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 3: New Password ── */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="flex-1 flex flex-col">
          <div className="mb-10">
            <h1 className="text-[32px] font-bold text-[#003898] mb-2">New Password</h1>
            <p className="text-[#6B7280] text-base">Choose a strong new password for your account.</p>
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
            <div>
              <label className="block text-[#003898] text-sm font-medium mb-2">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full h-14 px-4 pr-12 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Minimum 6 characters</p>
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={isPending || !!success}
              className="w-full h-14 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPending ? <Spinner /> : 'Reset Password'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
