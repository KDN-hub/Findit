'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
    {
        question: 'How do I report a lost item?',
        answer:
            'Go to the Report page from the bottom navigation, fill in the details about your lost item including a description, location, and photo, then submit. Your item will appear in the feed for others to see.',
    },
    {
        question: 'How does the claim process work?',
        answer:
            'When you see an item that belongs to you, tap "Claim" on the item page. The finder will receive your claim and can approve or reject it. Once approved, you can arrange a meetup to get your item back.',
    },
    {
        question: 'Is my personal information safe?',
        answer:
            'Yes! We only share your display name with other users. Your email and personal details are kept private unless you choose to share them in your settings.',
    },
    {
        question: 'Can I edit or delete a reported item?',
        answer:
            'Yes, go to your Profile page and find the item under "My Reported Items." You can edit the details or remove the listing from there.',
    },
    {
        question: "What if I can't find my item?",
        answer:
            'Keep your lost item report active — someone may find it later. You can also check the feed regularly for newly reported found items that match your description.',
    },
    {
        question: 'How do I change my password?',
        answer:
            'Go to Settings → Account Settings to update your password. If you signed up with Google, you manage your password through your Google account.',
    },
];

export default function HelpSettingsPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
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
                    <h1 className="text-xl font-bold text-[#003898]">Help & Support</h1>
                </div>
            </header>

            <div className="px-4 py-6 space-y-6">
                {/* FAQ Section */}
                <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide mb-3 px-1 text-slate-500">
                        Frequently Asked Questions
                    </h2>
                    <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
                        {faqs.map((faq, index) => (
                            <div key={index}>
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                                >
                                    <span className="font-medium text-slate-800 pr-4">{faq.question}</span>
                                    <svg
                                        className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openIndex === index && (
                                    <div className="px-4 pb-4">
                                        <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact Support */}
                <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide mb-3 px-1 text-slate-500">
                        Need More Help?
                    </h2>
                    <div className="bg-white rounded-2xl p-5 space-y-4">
                        <p className="text-sm text-slate-600">
                            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                        </p>
                        <a
                            href="mailto:finditappbu@gmail.com"
                            className="block w-full h-12 bg-[#003898] hover:bg-[#002d7a] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Contact Support
                        </a>
                    </div>
                </section>

                {/* Version Info */}
                <p className="text-xs text-slate-400 text-center">
                    FindIt v1.0.0 • Built with ❤️
                </p>
            </div>
        </div>
    );
}
