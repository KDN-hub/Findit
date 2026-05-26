'use client';

import { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';
import { setSessionCookieAction } from '@/actions/auth';
import { GoogleLogin } from '@react-oauth/google';

const SAFE_REDIRECT_PATHS = ['/dashboard', '/profile', '/items', '/report', '/messages', '/settings'];

function getSafeRedirect(redirect: string | null): string {
  if (!redirect || typeof redirect !== 'string') return '/dashboard';
  const path = redirect.startsWith('/') ? redirect : `/${redirect}`;
  return SAFE_REDIRECT_PATHS.some(p => path === p || path.startsWith(p + '/')) ? path : '/dashboard';
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get('redirect'));
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  function validatePasswordStrength(pwd: string): string | null {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter.';
    if (!/\d/.test(pwd)) return 'Password must contain at least one number.';
    if (!/[@$!%*?&_#^~-]/.test(pwd)) return 'Password must contain at least one special character.';
    return null;
  }

  function saveLastUser(data: any) {
    const userToSave = {
      name: data.full_name || data.email.split('@')[0],
      email: data.email,
      avatar: data.avatar_url || null
    };
    localStorage.setItem('last_user', JSON.stringify(userToSave));
  }

  async function handleGoogleSuccess(credentialResponse: any) {
    const token = credentialResponse.credential;
    if (!token) return;

    setGeneralError('');
    startTransition(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setGeneralError(errorData.detail || 'Google signup failed.');
          return;
        }

        const data = await response.json();
        await setSessionCookieAction(data.id);
        localStorage.setItem('access_token', data.access_token);
        saveLastUser(data);
        router.push(redirectTo);
        router.refresh();
      } catch (err: any) {
        console.error('Google Auth Error:', err);
        setGeneralError('Could not connect to the server for Google signup.');
      }
    });
  }

  function handleGoogleError() {
    setGeneralError('Google Sign-Up failed. Please try again.');
  }

  async function handleSubmit(formData: FormData) {
    setErrors({});
    setGeneralError('');

    startTransition(async () => {
      try {
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const formRole = formData.get('role') as string;
        const matric_number = formData.get('matric_number') as string | null;

        const pwdError = validatePasswordStrength(password);
        if (pwdError) {
          setGeneralError(pwdError);
          return;
        }

        if (formRole === 'staff' && !email.toLowerCase().endsWith('@babcock.edu.ng')) {
          setGeneralError('Staff accounts must use a @babcock.edu.ng email address.');
          return;
        }

        if (formRole === 'student' && !email.toLowerCase().endsWith('@student.babcock.edu.ng')) {
          setGeneralError('Student accounts must use a @student.babcock.edu.ng email address.');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            full_name: name,
            role: formRole,
            matric_number: formRole === 'student' ? matric_number : undefined
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log('Signup Error:', errorData);
          const message = errorData.detail || 'Signup failed';
          setGeneralError(message);
          return;
        }

        setSubmittedEmail(email);
        setShowSuccess(true);
        setTimeout(() => {
          const redirectParam = redirectTo !== '/dashboard' ? `&redirect=${encodeURIComponent(redirectTo)}` : '';
          router.push(`/verify-otp?email=${encodeURIComponent(email)}${redirectParam}`);
        }, 2000);
      } catch (error: any) {
        console.log('Signup Error:', error);
        setGeneralError(error.message || 'Could not connect to the server. Please try again.');
      }
    });
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col px-6 pb-8 safe-area-bottom">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#1e293b] mb-2 uppercase tracking-tight">Create Account</h1>
        <p className="text-[#64748b] text-sm">Please fill the details below to create your account.</p>
      </div>

      {/* Form */}
      <form action={handleSubmit} className="flex-1 flex flex-col">
        <div className="space-y-5 flex-1">
          {generalError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{generalError}</p>
            </div>
          )}

          {/* Full Name Field */}
          <div>
            <label className="block text-[#1e293b] text-sm font-bold mb-2">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              placeholder="e.g. John Doe"
              className="w-full h-12 px-5 bg-white border border-slate-200 rounded-full text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] focus:border-transparent transition-all"
              required
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-500">{errors.name[0]}</p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-[#1e293b] text-sm font-bold mb-2">
              Role
            </label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-12 px-5 bg-white border border-slate-200 rounded-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003898] focus:border-transparent transition-all appearance-none cursor-pointer"
              required
            >
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>

          {/* Conditional Matric Number Field for Students */}
          {role === 'student' && (
            <div>
              <label className="block text-[#1e293b] text-sm font-bold mb-2">
                Matriculation Number
              </label>
              <input
                name="matric_number"
                type="text"
                placeholder="e.g. 19/1234"
                className="w-full h-12 px-5 bg-white border border-slate-200 rounded-full text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] focus:border-transparent transition-all"
                required
              />
              {errors.matric_number && (
                <p className="mt-1.5 text-sm text-red-500">{errors.matric_number[0]}</p>
              )}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-[#1e293b] text-sm font-bold mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder={role === 'visitor' ? "yourname@email.com" : role === 'student' ? "yourname@student.babcock.edu.ng" : "yourname@babcock.edu.ng"}
              className="w-full h-12 px-5 bg-white border border-slate-200 rounded-full text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] focus:border-transparent transition-all"
              required
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-500">{errors.email[0]}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[#1e293b] text-sm font-bold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full h-12 px-5 pr-12 bg-white border border-slate-200 rounded-full text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-500">{errors.password[0]}</p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Must be at least 8 characters, with uppercase, lowercase, number, and special character.
            </p>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="mt-8 space-y-4">
          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-[#003898]/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            {isPending ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Sign up'
            )}
          </button>

          {/* Google Sign Up Button */}
          <div className="w-full flex justify-center [&>div]:w-full [&_iframe]:!w-full [&_iframe]:!min-w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              shape="pill"
              text="signup_with"
              width="100%"
            />
          </div>

          {/* Log In Link */}
          <p className="text-center text-slate-500 pt-4 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1e293b] font-bold hover:text-[#003898] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Signup Successful!</h3>
            <p className="text-sm text-slate-500 mb-6">
              Your account has been created. Redirecting to verification...
            </p>
            <button
              onClick={() => {
                const redirectParam = redirectTo !== '/dashboard' ? `&redirect=${encodeURIComponent(redirectTo)}` : '';
                router.push(`/verify-otp?email=${encodeURIComponent(submittedEmail)}${redirectParam}`);
              }}
              className="w-full h-12 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-colors"
            >
              Verify Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="w-full flex flex-col px-6 py-20 justify-center items-center">
        <div className="animate-pulse text-[#6B7280] text-center">Loading…</div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
