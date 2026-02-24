'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        paddingLeft: '16px',
        paddingRight: '16px'
      }}
    >
      {/*Container for positioning*/}
      <div className="relative max-w-md mx-auto pointer-events-auto">

        {/* Center FAB - positioned above the notch */}
        <Link
          href="/report"
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-16 h-16 rounded-full flex items-center justify-center z-20 transition-transform active:scale-95"
          style={{
            backgroundColor: 'var(--color-nav-fab)',
            boxShadow: '0 4px 20px rgba(0, 56, 152, 0.4)'
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/*Navigation Bar with SVG Notch - Pill Shape with Shadow */}
        <div
          className="relative"
          style={{
            filter: 'drop-shadow(0 4px 24px rgba(0, 0, 0, 0.15))'
          }}
        >
          {/* SVG Shape with Notch - Full Pill/Capsule Shape */}
          <svg
            className="w-full h-14"
            viewBox="0 0 400 64"
            preserveAspectRatio="none"
            fill="var(--color-nav-bg)"
          >
            {/* Main bar with curved notch - pill shape with rounded bottom corners */}
            <path d="
              M32,0 
              L150,0 
              C155,0 160,0 165,5
              C175,15 180,32 200,32
              C220,32 225,15 235,5
              C240,0 245,0 250,0
              L368,0 
              C386,0 400,14 400,32 
              L400,32
              C400,50 386,64 368,64
              L32,64 
              C14,64 0,50 0,32
              L0,32 
              C0,14 14,0 32,0 
              Z
            "/>
          </svg>

          {/* Navigation Items - positioned over the SVG */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            {/* Left Side - Home & Messages */}
            <div className="flex items-center gap-1">
              {/* Home */}
              <Link
                href="/dashboard"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive('/dashboard') ? 'var(--color-nav-highlight)' : 'transparent'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 10.5V19C4 19.5523 4.44772 20 5 20H9V14H15V20H19C19.5523 20 20 19.5523 20 19V10.5L12 4L4 10.5Z"
                    stroke={isActive('/dashboard') ? 'var(--color-nav-icon-active)' : 'var(--color-nav-icon)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={isActive('/dashboard') ? 'var(--color-nav-icon-active)' : 'none'}
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="2"
                    fill={isActive('/dashboard') ? 'var(--color-nav-highlight)' : 'var(--color-nav-icon)'}
                  />
                </svg>
              </Link>

              {/* Messages */}
              <Link
                href="/messages"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive('/messages') ? 'var(--color-nav-highlight)' : 'transparent'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="12"
                    rx="3"
                    stroke={isActive('/messages') ? 'var(--color-nav-icon-active)' : 'var(--color-nav-icon)'}
                    strokeWidth="1.5"
                    fill={isActive('/messages') ? 'var(--color-nav-icon-active)' : 'none'}
                  />
                  <circle cx="8" cy="11" r="1" fill={isActive('/messages') ? 'var(--color-nav-highlight)' : 'var(--color-nav-icon)'} />
                  <circle cx="12" cy="11" r="1" fill={isActive('/messages') ? 'var(--color-nav-highlight)' : 'var(--color-nav-icon)'} />
                  <circle cx="16" cy="11" r="1" fill={isActive('/messages') ? 'var(--color-nav-highlight)' : 'var(--color-nav-icon)'} />
                </svg>
              </Link>
            </div>

            {/* Center Spacer for FAB */}
            <div className="w-20" />

            {/* Right Side - Items & Profile */}
            <div className="flex items-center gap-1">
              {/* Items/Stats */}
              <Link
                href="/items"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive('/items') ? 'var(--color-nav-highlight)' : 'transparent'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="5"
                    y="14"
                    width="3"
                    height="6"
                    rx="1"
                    stroke={isActive('/items') ? 'var(--color-nav-icon-active)' : 'var(--color-nav-icon)'}
                    strokeWidth="1.5"
                    fill={isActive('/items') ? 'var(--color-nav-icon-active)' : 'none'}
                  />
                  <rect
                    x="10.5"
                    y="10"
                    width="3"
                    height="10"
                    rx="1"
                    stroke={isActive('/items') ? 'var(--color-nav-icon-active)' : 'var(--color-nav-icon)'}
                    strokeWidth="1.5"
                    fill={isActive('/items') ? 'var(--color-nav-icon-active)' : 'none'}
                  />
                  <rect
                    x="16"
                    y="6"
                    width="3"
                    height="14"
                    rx="1"
                    stroke={isActive('/items') ? 'var(--color-nav-icon-active)' : 'var(--color-nav-icon)'}
                    strokeWidth="1.5"
                    fill={isActive('/items') ? 'var(--color-nav-icon-active)' : 'none'}
                  />
                </svg>
              </Link>

              {/* Profile */}
              <Link
                href="/profile"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive('/profile') ? 'var(--color-nav-highlight)' : 'transparent'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="8"
                    r="3.5"
                    stroke={isActive('/profile') ? 'var(--color-nav-icon-active)' : 'var(--color-nav-icon)'}
                    strokeWidth="1.5"
                    fill={isActive('/profile') ? 'var(--color-nav-icon-active)' : 'none'}
                  />
                  <path
                    d="M6 19C6 16.2386 8.68629 14 12 14C15.3137 14 18 16.2386 18 19"
                    stroke={isActive('/profile') ? 'var(--color-nav-icon-active)' : 'var(--color-nav-icon)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
