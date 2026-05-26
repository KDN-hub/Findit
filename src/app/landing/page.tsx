'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ── FAQ Data ──────────────────────────────────────────────────────
const faqs = [
  {
    q: 'What is Findit?',
    a: 'Findit is a lost and found platform built for Babcock University. It helps students, staff, and visitors report lost or found items and reconnect with their belongings quickly and securely.',
  },
  {
    q: 'How do I install Findit on my phone?',
    a: 'Open Findit in Chrome on your phone, tap the menu (three dots) and select "Add to Home Screen" or "Install App". Findit will appear on your phone just like a regular app — no App Store needed!',
  },
  {
    q: 'Is Findit free to use?',
    a: 'Yes! Findit is completely free for all Babcock University students, staff, and visitors.',
  },
  {
    q: 'How does the claim verification work?',
    a: 'When you claim an item, you submit proof of ownership. The finder reviews it and if approved, both parties receive unique verification codes to confirm a safe handover in person.',
  },
  {
    q: 'Can I use Findit on my laptop?',
    a: 'Absolutely. Findit works on any device with a web browser. However, the best experience is on mobile — you can install it as an app for quick access.',
  },
];

// ── FAQ Item Component ──────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-1 text-left group"
      >
        <span className="font-semibold text-slate-800 text-[15px] pr-4 group-hover:text-[#003898] transition-colors">
          {q}
        </span>
        <svg
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-5' : 'max-h-0'}`}
      >
        <p className="text-slate-500 text-sm leading-relaxed px-1">{a}</p>
      </div>
    </div>
  );
}

// ── Stat Counter Animation ──────────────────────────────────────
function AnimatedStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    const el = document.getElementById(`stat-${label.replace(/\s/g, '')}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [label]);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, value]);

  return (
    <div id={`stat-${label.replace(/\s/g, '')}`} className="text-center">
      <p className="text-4xl md:text-5xl font-bold text-[#003898]">
        {count}{suffix}
      </p>
      <p className="text-slate-500 text-sm mt-1">{label}</p>
    </div>
  );
}

// ── Main Landing Page ──────────────────────────────────────────
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-dvh bg-white">
      {/* ── NAVIGATION ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/favicon.svg" alt="Findit" width={24} height={24} />
            <span className={`text-xl font-bold tracking-tight transition-colors ${scrolled ? 'text-[#003898]' : 'text-white'}`}>
              Findit
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Install', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                className={`text-sm font-medium transition-colors hover:text-[#003898] ${
                  scrolled ? 'text-slate-600' : 'text-white/80 hover:text-white'
                }`}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={`hidden md:inline-flex text-sm font-semibold transition-colors ${
                scrolled ? 'text-[#003898]' : 'text-white'
              }`}
            >
              Log In
            </Link>
            <Link
              href="/login"
              className="h-10 px-5 bg-[#003898] text-white text-sm font-semibold rounded-full flex items-center justify-center hover:bg-[#002266] transition-all active:scale-95 shadow-lg shadow-[#003898]/20"
            >
              Open App
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden w-10 h-10 flex items-center justify-center rounded-lg ${scrolled ? 'text-slate-700' : 'text-white'}`}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg animate-slide-up">
            <div className="px-6 py-4 space-y-1">
              {['Features', 'How It Works', 'Install', 'FAQ'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 text-slate-700 font-medium hover:text-[#003898] transition-colors"
                >
                  {item}
                </a>
              ))}
              <Link href="/login" className="block py-3 text-[#003898] font-semibold">
                Log In →
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative bg-gradient-to-br from-[#002266] via-[#003898] to-[#003898] overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Built for Babcock University
              </div>
              <h1 className="text-4xl md:text-[56px] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
                Never Lose It.{' '}
                <span className="text-white/60">Always Find It.</span>
              </h1>
              <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
                The fastest way to report, find, and recover lost items on campus. Snap a photo, post it, and let the community help.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="h-14 px-8 bg-white text-[#003898] font-bold text-base rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-xl shadow-black/10"
                >
                  Get Started — It&apos;s Free
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <a
                  href="#how-it-works"
                  className="h-14 px-8 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold text-base rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* Right — Phone Mockup */}
            <div className="hidden md:flex justify-center">
              <div className="relative">
                {/* Phone frame */}
                <div className="w-[280px] h-[560px] bg-slate-900 rounded-[40px] p-3 shadow-2xl shadow-black/30 border border-slate-700">
                  <div className="w-full h-full bg-white rounded-[28px] overflow-hidden relative">
                    {/* Status bar */}
                    <div className="h-11 bg-[#003898] flex items-center justify-center">
                      <div className="w-20 h-5 bg-black rounded-full" />
                    </div>
                    {/* App content mock */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Image src="/logo-dark.svg" alt="Findit" width={60} height={24} />
                        <div className="w-8 h-8 bg-slate-100 rounded-full" />
                      </div>
                      <div className="mt-2">
                        <div className="h-4 bg-[#003898] rounded w-32 mb-1" />
                        <div className="h-3 bg-slate-200 rounded w-24" />
                      </div>
                      {/* Item cards mock */}
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-slate-50 rounded-2xl p-3 flex gap-3 border border-slate-100">
                          <div className="w-16 h-16 bg-slate-200 rounded-xl shrink-0" />
                          <div className="flex-1 space-y-1.5 py-1">
                            <div className="h-3 bg-slate-300 rounded w-full" />
                            <div className="h-2.5 bg-slate-200 rounded w-3/4" />
                            <div className="h-2 bg-slate-100 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Floating notification */}
                <div className="absolute -top-4 -right-8 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-slate-100 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Item Found!</p>
                    <p className="text-[10px] text-slate-400">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6">
          <AnimatedStat value={500} suffix="+" label="Items Recovered" />
          <AnimatedStat value={2000} suffix="+" label="Active Users" />
          <AnimatedStat value={30} suffix="s" label="Avg Report Time" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 md:py-24 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#003898] font-semibold text-sm uppercase tracking-wider mb-2">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
              Everything You Need to Recover Your Items
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                ),
                title: 'Snap & Report',
                desc: 'Take a photo, add a description, and post in under 30 seconds. Your report is instantly visible to the entire campus.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: 'Secure Verification',
                desc: 'Our dual-code verification ensures items reach their rightful owners. No more fraudulent claims or mix-ups.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                  </svg>
                ),
                title: 'Biometric Login',
                desc: 'Log in instantly with your fingerprint or Face ID. No more passwords to remember.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                ),
                title: 'In-App Messaging',
                desc: 'Chat directly with the finder or owner to coordinate a safe handover — all within the app.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
                title: 'Location Tagging',
                desc: 'Tag where items were found with campus locations. Makes it easy for owners to recognize their belongings.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                ),
                title: 'Push Notifications',
                desc: 'Get notified instantly when someone finds your item or when a new claim is submitted on your report.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-[#003898]/20 hover:shadow-lg hover:shadow-[#003898]/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-[#003898]/5 rounded-xl flex items-center justify-center text-[#003898] mb-4 group-hover:bg-[#003898] group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#003898] font-semibold text-sm uppercase tracking-wider mb-2">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
              From Lost to Found in 4 Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Report', desc: 'Snap a photo and fill in the details. Your report goes live instantly.', emoji: '📸' },
              { step: '02', title: 'Discover', desc: 'Browse the feed or search for your lost item by keyword or location.', emoji: '🔍' },
              { step: '03', title: 'Claim', desc: 'Found your item? Submit a claim with proof of ownership.', emoji: '✋' },
              { step: '04', title: 'Handover', desc: 'Meet up and exchange verification codes for a safe handover.', emoji: '🤝' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-[#003898]/20 to-[#003898]/5" />
                )}
                <div className="w-20 h-20 bg-[#003898]/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                  {item.emoji}
                </div>
                <p className="text-[#003898] font-bold text-xs tracking-wider mb-1">{item.step}</p>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTALL GUIDE ── */}
      <section id="install" className="py-16 md:py-24 bg-gradient-to-br from-[#002266] via-[#003898] to-[#003898] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-white/60 font-semibold text-sm uppercase tracking-wider mb-2">Install the App</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
              Get Findit on Your Phone
            </h2>
            <p className="text-white/50 text-base max-w-lg mx-auto">
              No App Store needed. Install Findit directly from your browser in just 3 taps.
            </p>
          </div>

          {/* Install Steps */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: 'Open in Chrome',
                desc: 'Visit finditapp-v1.vercel.app in Google Chrome on your phone.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                ),
              },
              {
                step: '2',
                title: 'Tap the Menu',
                desc: 'Tap the three-dot menu (⋮) at the top-right corner of Chrome.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                  </svg>
                ),
              },
              {
                step: '3',
                title: 'Install App',
                desc: 'Select "Add to Home Screen" or "Install App" and tap Install.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M12 15V3m0 0l-3 3m3-3l3 3" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                  {item.icon}
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 bg-white text-[#003898] rounded-full text-sm font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* iOS note */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/10 rounded-xl px-5 py-3">
              <svg className="w-5 h-5 text-white/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-white/60 text-sm">
                <span className="font-semibold text-white/80">iPhone users:</span> Open in Safari → Tap the Share button → &quot;Add to Home Screen&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 md:py-24 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#003898] font-semibold text-sm uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight mb-4">
            Ready to Find What&apos;s Yours?
          </h2>
          <p className="text-slate-500 text-lg mb-8 max-w-lg mx-auto">
            Join hundreds of Babcock University students already using Findit to recover their lost belongings.
          </p>
          <Link
            href="/login"
            className="inline-flex h-14 px-10 bg-[#003898] text-white font-bold text-base rounded-2xl items-center justify-center gap-2 hover:bg-[#002266] transition-all active:scale-95 shadow-lg shadow-[#003898]/20"
          >
            Open Findit Now
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a0f1c] text-white/60">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/favicon.svg" alt="Findit" width={22} height={22} />
                <span className="text-xl font-bold text-white tracking-tight">Findit</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                The official lost and found platform for Babcock University. Helping students, staff, and visitors reconnect with their belongings.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5">
                {['Features', 'How It Works', 'Install App', 'FAQ'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase().replace(/\s/g, '-')}`} className="text-sm hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
              <ul className="space-y-2.5">
                <li><Link href="/login" className="text-sm hover:text-white transition-colors">Log In</Link></li>
                <li><Link href="/signup" className="text-sm hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs">&copy; {new Date().getFullYear()} Findit. Built for Babcock University.</p>
            <p className="text-xs">Made with ❤️ for the Babcock community</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
