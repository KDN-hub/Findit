'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NotificationsSettingsPage() {
    const [settings, setSettings] = useState({
        emailAlerts: true,
        pushNotifications: false,
        claimUpdates: true,
        newMatches: true,
        messages: true,
    });

    const toggle = (key: keyof typeof settings) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

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
                    <h1 className="text-xl font-bold text-[#003898]">Notifications</h1>
                </div>
            </header>

            <div className="px-4 py-6 space-y-6">
                {/* General */}
                <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide mb-3 px-1 text-slate-500">
                        General
                    </h2>
                    <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
                        <ToggleRow
                            label="Email Alerts"
                            description="Receive important updates via email"
                            enabled={settings.emailAlerts}
                            onToggle={() => toggle('emailAlerts')}
                        />
                        <ToggleRow
                            label="Push Notifications"
                            description="Receive push notifications on your device"
                            enabled={settings.pushNotifications}
                            onToggle={() => toggle('pushNotifications')}
                        />
                    </div>
                </section>

                {/* Activity */}
                <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide mb-3 px-1 text-slate-500">
                        Activity
                    </h2>
                    <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
                        <ToggleRow
                            label="Claim Updates"
                            description="Get notified when your claims are updated"
                            enabled={settings.claimUpdates}
                            onToggle={() => toggle('claimUpdates')}
                        />
                        <ToggleRow
                            label="New Matches"
                            description="Get notified when items match your lost reports"
                            enabled={settings.newMatches}
                            onToggle={() => toggle('newMatches')}
                        />
                        <ToggleRow
                            label="Messages"
                            description="Get notified for new messages"
                            enabled={settings.messages}
                            onToggle={() => toggle('messages')}
                        />
                    </div>
                </section>

                {/* Info */}
                <p className="text-xs text-slate-400 text-center px-4">
                    These preferences are saved locally. Server-side notification settings will be available in a future update.
                </p>
            </div>
        </div>
    );
}

function ToggleRow({
    label,
    description,
    enabled,
    onToggle,
}: {
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
            <div className="text-left">
                <p className="font-medium text-slate-800">{label}</p>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
            <div
                className={`w-12 h-7 rounded-full p-1 transition-colors ${enabled ? 'bg-[#003898]' : 'bg-slate-300'
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
