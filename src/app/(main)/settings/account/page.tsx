'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

export default function AccountSettingsPage() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.replace('/login');
            return;
        }

        fetch(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data) {
                    setDisplayName(data.full_name || '');
                    setEmail(data.email || '');
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router]);

    const handleSave = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        setSaving(true);
        setMessage('');

        try {
            const res = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ full_name: displayName, email }),
            });

            if (res.ok) {
                setMessage('Profile updated successfully!');
            } else {
                setMessage('Failed to update profile. Please try again.');
            }
        } catch {
            setMessage('Error updating profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-dvh bg-[#F8FAFC] flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-[#003898]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-[#F8FAFC] pb-8">
            {/* Header */}
            <header className="px-4 pt-24 mt-4 pb-4 safe-area-top border-b bg-white border-slate-100">
                <div className="flex items-center gap-4">
                    <Link
                        href="/settings"
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F1F5F9]"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold text-[#003898]">Account Settings</h1>
                </div>
            </header>

            <div className="px-4 py-6 space-y-6">
                {/* Success/Error Message */}
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {message}
                    </div>
                )}

                {/* Form */}
                <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide mb-3 px-1 text-slate-500">
                        Personal Information
                    </h2>
                    <div className="bg-white rounded-2xl p-5 space-y-5">
                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your display name"
                                className="w-full h-12 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full h-12 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
                            />
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-12 bg-[#003898] hover:bg-[#002d7a] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {saving ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
