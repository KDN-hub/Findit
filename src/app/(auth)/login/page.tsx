'use client';

import { Suspense, useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';
import { setSessionCookieAction } from '@/actions/auth';
import { startAuthentication } from '@simplewebauthn/browser';

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
  const [role, setRole] = useState('student');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // Quick Login State
  const [view, setView] = useState<'normal' | 'quick'>('normal');
  const [lastUser, setLastUser] = useState<{name: string, email: string, avatar: string | null} | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('last_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setLastUser(user);
        setEmailInput(user.email);
        setView('quick');
      } catch (e) {
        // ignore JSON parse errors
      }
    }
  }, []);

  function saveLastUser(data: any) {
    const userToSave = {
      name: data.full_name || data.email.split('@')[0],
      email: data.email,
      avatar: data.avatar_url || null
    };
    localStorage.setItem('last_user', JSON.stringify(userToSave));
    setLastUser(userToSave);
  }

  async function handleBiometricLogin() {
    setGeneralError('');
    if (!emailInput) {
      setGeneralError('Please enter your email address first to login with biometrics.');
      return;
    }

    startTransition(async () => {
      try {
        const optRes = await fetch(`${API_BASE_URL}/auth/webauthn/authenticate/generate-options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput })
        });
        
        if (!optRes.ok) {
          const err = await optRes.json();
          setGeneralError(err.detail || 'Could not start biometric login.');
          return;
        }
        const options = await optRes.json();

        let attResp;
        try {
          attResp = await startAuthentication(options);
        } catch (err: any) {
          if (err.name === 'NotAllowedError') {
             // User cancelled
             return;
          }
          throw err;
        }

        const verifyRes = await fetch(`${API_BASE_URL}/auth/webauthn/authenticate/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput, response: attResp })
        });
        
        if (!verifyRes.ok) {
          const err = await verifyRes.json();
          setGeneralError(err.detail || 'Biometric login failed.');
          return;
        }

        const data = await verifyRes.json();
        await setSessionCookieAction(data.id);
        localStorage.setItem('access_token', data.access_token);
        saveLastUser(data);
        router.push(redirectTo);
        router.refresh();
      } catch (err: any) {
        console.error(err);
        setGeneralError('An error occurred during biometric login.');
      }
    });
  }

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
          
          if (message === "Please verify your email address before logging in.") {
            const redirectParam = redirectTo !== '/dashboard' ? `&redirect=${encodeURIComponent(redirectTo)}` : '';
            router.push(`/verify-otp?email=${encodeURIComponent(email)}${redirectParam}`);
            return;
          }
          
          setGeneralError(message);
          return;
        }

        const data = await response.json();
        await setSessionCookieAction(data.id);
        localStorage.setItem('access_token', data.access_token);
        saveLastUser(data);
        router.push(redirectTo);
        router.refresh();
      } catch (error: any) {
        console.log('Login Error:', error);
        setGeneralError(error.message || 'Could not connect to the server. Please try again.');
      }
    });
  }

  // Quick Login View rendering
  if (view === 'quick' && lastUser) {
    return (
      <div className="min-h-dvh bg-white flex flex-col px-6 pt-16 pb-8 safe-area-top safe-area-bottom items-center">
        
        {/* App Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-[32px] font-bold tracking-tight text-[#003898]">FindIt</h1>
        </div>

        {/* User Info */}
        <div className="flex flex-col items-center mb-16">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden mb-4 border-2 border-white shadow-sm">
            {lastUser.avatar ? (
              <img src={lastUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">
            {lastUser.name}
          </h2>
        </div>

        {/* Fingerprint Icon area */}
        <div className="flex flex-col items-center flex-1">
          <button 
            type="button" 
            onClick={handleBiometricLogin}
            disabled={isPending}
            className="w-24 h-24 rounded-full bg-[#F1F5F9] text-[#003898] flex items-center justify-center mb-6 hover:bg-[#E2E8F0] transition-colors disabled:opacity-50"
          >
            {isPending ? (
               <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
               </svg>
            ) : (
               <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
               </svg>
            )}
          </button>
          
          <p className="text-[#003898] font-medium mb-4">Click to log in with Fingerprint</p>

          {generalError && (
            <p className="text-sm text-red-600 mb-4 text-center px-4">{generalError}</p>
          )}

          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={isPending}
            className="px-8 h-12 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-full transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
          >
            Verify Fingerprint
          </button>
        </div>

        {/* Footer Actions */}
        <div className="w-full flex justify-center items-center space-x-4 pt-6 mt-auto">
          <button 
            type="button" 
            onClick={() => {
              localStorage.removeItem('last_user');
              setLastUser(null);
              setEmailInput('');
              setView('normal');
            }}
            className="text-sm font-medium text-[#003898] hover:underline"
          >
            Switch Account
          </button>
          <span className="text-slate-300">|</span>
          <button 
            type="button" 
            onClick={() => setView('normal')}
            className="text-sm font-medium text-[#003898] hover:underline"
          >
            Login with Password
          </button>
        </div>

      </div>
    );
  }

  return (
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

          {/* Role Field */}
          <div>
            <label className="block text-[#003898] text-sm font-medium mb-2">
              Logging in as
            </label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all appearance-none cursor-pointer"
              required
            >
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-[#003898] text-sm font-medium mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={role === 'visitor' ? "yourname@email.com" : role === 'student' ? "yourname@student.babcock.edu.ng" : "yourname@babcock.edu.ng"}
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
