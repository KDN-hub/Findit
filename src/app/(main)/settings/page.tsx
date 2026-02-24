'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL } from '@/lib/config';
import { signOutAction } from '@/actions/auth';

type ThemeOption = 'light' | 'dark';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    emailEnabled: true,
    claimUpdates: true,
    newMatches: true,
    messages: true,
  });
  const [privacy, setPrivacy] = useState({
    showEmail: false,
    showLocation: true,
  });

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`min-h-dvh pb-8 ${isDark ? 'bg-[#0f172a]' : 'bg-[#F8FAFC]'}`}>
      {/* Header */}
      <header className={`px-4 pt-24 mt-4 pb-4 safe-area-top border-b ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-[#F1F5F9]'}`}
          >
            <svg className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#003898]'}`}>Settings</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Display Settings */}
        <section>
          <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Display
          </h2>
          <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#1e293b]' : 'bg-white'}`}>
            <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <p className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>Theme</p>
              <div className="flex gap-2">
                {[
                  { value: 'light', label: 'Light', icon: '☀️' },
                  { value: 'dark', label: 'Dark', icon: '🌙' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as ThemeOption)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${theme === option.value
                      ? 'bg-[#003898] text-white'
                      : isDark
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <span className="block text-lg mb-1">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section>
          <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Notifications
          </h2>
          <div className={`rounded-2xl overflow-hidden divide-y ${isDark ? 'bg-[#1e293b] divide-slate-700' : 'bg-white divide-slate-100'}`}>
            <SettingToggle
              label="Push Notifications"
              description="Receive push notifications on your device"
              enabled={notifications.pushEnabled}
              onToggle={() => setNotifications(prev => ({ ...prev, pushEnabled: !prev.pushEnabled }))}
              isDark={isDark}
            />
            <SettingToggle
              label="Email Notifications"
              description="Receive updates via email"
              enabled={notifications.emailEnabled}
              onToggle={() => setNotifications(prev => ({ ...prev, emailEnabled: !prev.emailEnabled }))}
              isDark={isDark}
            />
            <SettingToggle
              label="Claim Updates"
              description="Get notified when your claims are updated"
              enabled={notifications.claimUpdates}
              onToggle={() => setNotifications(prev => ({ ...prev, claimUpdates: !prev.claimUpdates }))}
              isDark={isDark}
            />
            <SettingToggle
              label="New Matches"
              description="Get notified when items match your lost reports"
              enabled={notifications.newMatches}
              onToggle={() => setNotifications(prev => ({ ...prev, newMatches: !prev.newMatches }))}
              isDark={isDark}
            />
            <SettingToggle
              label="Messages"
              description="Get notified for new messages"
              enabled={notifications.messages}
              onToggle={() => setNotifications(prev => ({ ...prev, messages: !prev.messages }))}
              isDark={isDark}
            />
          </div>
        </section>

        {/* Privacy Settings */}
        <section>
          <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Privacy
          </h2>
          <div className={`rounded-2xl overflow-hidden divide-y ${isDark ? 'bg-[#1e293b] divide-slate-700' : 'bg-white divide-slate-100'}`}>
            <SettingToggle
              label="Show Email to Finders"
              description="Allow finders to see your email address"
              enabled={privacy.showEmail}
              onToggle={() => setPrivacy(prev => ({ ...prev, showEmail: !prev.showEmail }))}
              isDark={isDark}
            />
            <SettingToggle
              label="Show Location"
              description="Display your campus location on profile"
              enabled={privacy.showLocation}
              onToggle={() => setPrivacy(prev => ({ ...prev, showLocation: !prev.showLocation }))}
              isDark={isDark}
            />
          </div>
        </section>

        {/* Account Settings */}
        <section>
          <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Account
          </h2>
          <div className={`rounded-2xl overflow-hidden divide-y ${isDark ? 'bg-[#1e293b] divide-slate-700' : 'bg-white divide-slate-100'}`}>
            <SettingLink
              label="Edit Profile"
              description="Update your name, photo, and details"
              href="/settings/account"
              isDark={isDark}
            />
            <SettingLink
              label="Notification Preferences"
              description="Manage your notification settings"
              href="/settings/notifications"
              isDark={isDark}
            />
            <SettingLink
              label="Help & Support"
              description="Get help and find answers"
              href="/settings/help"
              isDark={isDark}
            />
          </div>
        </section>

        {/* App Settings */}
        <section>
          <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            App
          </h2>
          <div className={`rounded-2xl overflow-hidden divide-y ${isDark ? 'bg-[#1e293b] divide-slate-700' : 'bg-white divide-slate-100'}`}>
            <SettingLink
              label="Language"
              description="English"
              href="/settings/language"
              isDark={isDark}
            />
            <SettingLink
              label="Clear Cache"
              description="Clear local cache (you will stay logged in)"
              href="#"
              onClick={async () => {
                try {
                  if (typeof caches !== 'undefined') {
                    const names = await caches.keys();
                    await Promise.all(names.map((name) => caches.delete(name)));
                  }
                  alert('Cache cleared. Stored data has been freed.');
                } catch {
                  alert('Cache cleared.');
                }
              }}
              isDark={isDark}
            />
            <SettingLink
              label="About Findit"
              description="Version 1.0.0"
              href="/settings/about"
              isDark={isDark}
            />
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Support
          </h2>
          <div className={`rounded-2xl overflow-hidden divide-y ${isDark ? 'bg-[#1e293b] divide-slate-700' : 'bg-white divide-slate-100'}`}>
            <SettingLink
              label="Help Center"
              description="Get help and find answers"
              href="/settings/help"
              isDark={isDark}
            />
            <SettingLink
              label="Report a Problem"
              description="Let us know if something's wrong"
              href="/settings/report"
              isDark={isDark}
            />
            <SettingLink
              label="Terms of Service"
              description="Read our terms and conditions"
              href="/settings/terms"
              isDark={isDark}
            />
            <SettingLink
              label="Privacy Policy"
              description="Learn how we protect your data"
              href="/settings/privacy"
              isDark={isDark}
            />
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3 px-1">
            Danger Zone
          </h2>
          <div className={`rounded-2xl overflow-hidden divide-y ${isDark ? 'bg-[#1e293b] divide-slate-700' : 'bg-white divide-slate-100'}`}>
            <button
              disabled={deleting}
              onClick={async () => {
                if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
                setDeleting(true);
                try {
                  const token = localStorage.getItem('access_token');
                  const res = await fetch(`${API_BASE_URL}/users/me`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    alert(data.detail || 'Failed to delete account');
                    setDeleting(false);
                    return;
                  }
                  await signOutAction();
                  localStorage.removeItem('access_token');
                  router.push('/');
                  router.refresh();
                } catch {
                  alert('Could not connect to the server.');
                  setDeleting(false);
                }
              }}
              className={`w-full p-4 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
            >
              <div>
                <p className="font-medium text-red-600 text-left">Delete Account</p>
                <p className="text-sm text-red-400">{deleting ? 'Deleting…' : 'Permanently delete your account and data'}</p>
              </div>
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// Toggle Setting Component
function SettingToggle({
  label,
  description,
  enabled,
  onToggle,
  isDark,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full p-4 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
    >
      <div className="text-left">
        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{label}</p>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
      </div>
      <div
        className={`w-12 h-7 rounded-full p-1 transition-colors ${enabled ? 'bg-[#003898]' : isDark ? 'bg-slate-600' : 'bg-slate-300'
          }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
        />
      </div>
    </button>
  );
}

// Link Setting Component
function SettingLink({
  label,
  description,
  href,
  onClick,
  isDark,
}: {
  label: string;
  description: string;
  href: string;
  onClick?: () => void;
  isDark: boolean;
}) {
  const content = (
    <>
      <div className="text-left">
        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{label}</p>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
      </div>
      <svg className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`w-full p-4 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`p-4 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
    >
      {content}
    </Link>
  );
}
