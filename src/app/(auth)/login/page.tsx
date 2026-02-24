'use client';

import { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { API_BASE_URL } from '@/lib/config';
import { setSessionCookieAction } from '@/actions/auth';

const SAFE_REDIRECT_PATHS = ['/dashboard', '/profile', '/items', '/report', '/messages', '/settings'];

function getSafeRedirect(redirect: string | null): string {
  if (!redirect || typeof redirect !== 'string') return '/dashboard';
  const path = redirect.startsWith('/') ? redirect : `/${redirect}`;
  return SAFE_REDIRECT_PATHS.some(p => path === p || path.startsWith(p + '/')) ? path : '/dashboard';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get('redirect'));
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');

  async function handleSubmit(formData: FormData) {
    setErrors({});
    setGeneralError('');

    startTransition(async () => {
      try {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log('Login Error:', errorData);
          const message = errorData.detail || 'Invalid email or password';
          setGeneralError(message);
          return;
        }

        const data = await response.json();
        await setSessionCookieAction(data.id);
        localStorage.setItem('access_token', data.access_token);
        router.push(redirectTo);
        router.refresh();
      } catch (error: any) {
        console.log('Login Error:', error);
        setGeneralError(error.message || 'Could not connect to the server. Please try again.');
      }
    });
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: credentialResponse.credential }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Google login failed');
        }

        const data = await res.json();
        await setSessionCookieAction(data.id);
        localStorage.setItem('access_token', data.access_token);
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error: any) {
      console.log('Login Failed');
      console.error('Google login error', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <div className="min-h-dvh bg-white flex flex-col px-6 pt-10 pb-8 safe-area-top safe-area-bottom">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[32px] font-bold text-[#003898] mb-2 mt-4">Welcome back!</h1>
          <p className="text-[#6B7280] text-base">Login below we missed you</p>
        </div>

        {/* Form */}
        <form action={handleSubmit} className="flex flex-col flex-1">
          <div className="space-y-6 flex-1">
            {generalError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{generalError}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[#003898] text-sm font-medium mb-2">
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="yourname@email.com"
                className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
                required
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500">{errors.email[0]}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[#003898] text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  className="w-full h-14 px-4 pr-12 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
                  required
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
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500">{errors.password[0]}</p>
              )}
            </div>
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-[#003898] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Spacer - flex-1 expands to push buttons down; max-h-[96px] caps how far */}
          <div className="flex-1 min-h-[32px] max-h-[40px]" />

          {/* Buttons Section */}
          <div className="space-y-4">
            {/* Sign In Button */}
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
                'Sign In'
              )}
            </button>

            {/* Google Sign In Button */}
            <div className="flex justify-center w-full my-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.log('Login Failed');
                }}
                useOneTap={false}
                theme="outline"
                size="large"
                width="100%"
                shape="rectangular"
              />
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-[#6B7280] pt-2">
              Don&apos;t have an account{' '}
              <Link href="/signup" className="text-[#003898] font-semibold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </GoogleOAuthProvider>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-white flex flex-col px-6 pt-10 pb-8 safe-area-top safe-area-bottom justify-center">
        <div className="animate-pulse text-[#6B7280] text-center">Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

