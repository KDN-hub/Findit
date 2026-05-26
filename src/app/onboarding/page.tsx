'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ── Onboarding Slide Data ──────────────────────────────────────────
const slides = [
  {
    id: 1,
    title: 'Find What\u2019s Lost',
    subtitle: 'Lost something on campus? Browse reported items or post your own — we help reconnect you with your belongings.',
    gradient: 'from-[#002266] to-[#003898]',
    icon: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Magnifying glass over location pin */}
        <circle cx="60" cy="52" r="36" stroke="white" strokeWidth="3" strokeDasharray="6 4" opacity="0.2" />
        <path d="M60 10C40.1 10 24 26.1 24 46C24 66 60 105 60 105C60 105 96 66 96 46C96 26.1 79.9 10 60 10Z" fill="white" fillOpacity="0.15" />
        <path d="M60 20C45.6 20 34 31.6 34 46C34 60.5 60 90 60 90C60 90 86 60.5 86 46C86 31.6 74.4 20 60 20Z" fill="white" fillOpacity="0.25" />
        <circle cx="60" cy="46" r="16" fill="white" fillOpacity="0.9" />
        <circle cx="60" cy="46" r="10" stroke="#003898" strokeWidth="3" fill="none" />
        <line x1="67" y1="53" x2="78" y2="64" stroke="#003898" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Report in Seconds',
    subtitle: 'Snap a photo, add details, and post your found or lost item. It takes less than 30 seconds to help someone.',
    gradient: 'from-[#003898] to-[#002266]',
    icon: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Camera / report icon */}
        <rect x="20" y="35" width="80" height="60" rx="12" fill="white" fillOpacity="0.15" />
        <rect x="28" y="42" width="64" height="46" rx="8" fill="white" fillOpacity="0.25" />
        <circle cx="60" cy="65" r="14" fill="white" fillOpacity="0.9" />
        <circle cx="60" cy="65" r="9" stroke="#003898" strokeWidth="2.5" fill="none" />
        <circle cx="60" cy="65" r="4" fill="#003898" />
        <rect x="44" y="30" width="32" height="10" rx="5" fill="white" fillOpacity="0.3" />
        {/* Flash indicator */}
        <path d="M82 48L78 54H82L78 60" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Claim & Verify',
    subtitle: 'Think you found your item? Submit a claim with proof. Our secure verification system ensures the right person gets it back.',
    gradient: 'from-[#002266] to-[#003898]',
    icon: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shield with checkmark */}
        <path d="M60 15L25 35V60C25 82 40 100 60 108C80 100 95 82 95 60V35L60 15Z" fill="white" fillOpacity="0.15" />
        <path d="M60 25L33 41V60C33 78 45 93 60 100C75 93 87 78 87 60V41L60 25Z" fill="white" fillOpacity="0.25" />
        <circle cx="60" cy="60" r="20" fill="white" fillOpacity="0.9" />
        <path d="M49 60L56 67L72 51" stroke="#003898" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 4,
    title: 'Safe Handover',
    subtitle: 'Meet up securely with unique verification codes. Both parties confirm the exchange — no more mix-ups or disputes.',
    gradient: 'from-[#003898] to-[#002266]',
    icon: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Handshake / exchange */}
        <circle cx="60" cy="60" r="40" fill="white" fillOpacity="0.1" />
        <circle cx="60" cy="60" r="30" fill="white" fillOpacity="0.15" />
        {/* Two hands meeting */}
        <path d="M30 65C30 65 40 55 50 55C55 55 58 58 60 60" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
        <path d="M90 65C90 65 80 55 70 55C65 55 62 58 60 60" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
        <circle cx="60" cy="60" r="6" fill="white" fillOpacity="0.9" />
        <path d="M57 60L59 62L63 58" stroke="#003898" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Sparkles */}
        <circle cx="42" cy="42" r="2" fill="white" opacity="0.5" />
        <circle cx="78" cy="42" r="2" fill="white" opacity="0.5" />
        <circle cx="45" cy="80" r="1.5" fill="white" opacity="0.4" />
        <circle cx="75" cy="80" r="1.5" fill="white" opacity="0.4" />
      </svg>
    ),
  },
];

// ── Floating Particles Background ──────────────────────────────────
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: `${6 + Math.random() * 14}px`,
            height: `${6 + Math.random() * 14}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${4 + Math.random() * 6}s ease-in-out ${Math.random() * 3}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main Onboarding Page ──────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = slides.length;
  const isLastSlide = currentSlide === totalSlides - 1;

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('onboarding_complete', 'true');
    router.replace('/login');
  }, [router]);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index < 0 || index >= totalSlides) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating, totalSlides]);

  const nextSlide = useCallback(() => {
    if (isLastSlide) {
      completeOnboarding();
    } else {
      goToSlide(currentSlide + 1);
    }
  }, [isLastSlide, completeOnboarding, goToSlide, currentSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [goToSlide, currentSlide]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientX - touchStart;
    setTouchDelta(delta);
  };

  const handleTouchEnd = () => {
    if (touchStart === null) return;
    if (Math.abs(touchDelta) > 60) {
      if (touchDelta < 0) nextSlide();
      else prevSlide();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const slide = slides[currentSlide];

  return (
    <>
      <style jsx global>{`
        body { background-color: #003898; overflow: hidden; }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          100% { transform: translateY(-30px) rotate(10deg); opacity: 0.6; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
        }
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes slideInContent {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        ref={containerRef}
        className="min-h-dvh flex flex-col safe-area-top safe-area-bottom select-none overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Animated gradient background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-700 ease-in-out`}
        />

        {/* Floating particles */}
        <FloatingParticles />

        {/* Skip button */}
        <div className="relative z-10 flex justify-end px-6 pt-6">
          <button
            onClick={completeOnboarding}
            className="text-white/60 hover:text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
          >
            Skip
          </button>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8">
          {/* Icon */}
          <div
            key={`icon-${currentSlide}`}
            className="mb-10"
            style={{ animation: 'iconBounce 3s ease-in-out infinite, slideInContent 0.5s ease-out' }}
          >
            <div className="w-40 h-40 rounded-[32px] bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              {slide.icon}
            </div>
          </div>

          {/* Text content */}
          <div
            key={`text-${currentSlide}`}
            className="text-center max-w-sm mx-auto"
            style={{ animation: 'slideInContent 0.5s ease-out 0.1s both' }}
          >
            <h2 className="text-[28px] font-bold text-white mb-3 tracking-tight leading-tight">
              {slide.title}
            </h2>
            <p className="text-white/70 text-[15px] leading-relaxed">
              {slide.subtitle}
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 px-8 pb-10">
          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="p-1"
              >
                <div
                  className={`rounded-full transition-all duration-400 ease-out ${
                    i === currentSlide
                      ? 'w-8 h-2.5 bg-white'
                      : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={nextSlide}
            className="w-full h-14 rounded-2xl font-semibold text-[16px] transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2"
            style={{
              background: isLastSlide
                ? 'white'
                : 'rgba(255, 255, 255, 0.15)',
              color: isLastSlide ? '#003898' : 'white',
              backdropFilter: isLastSlide ? 'none' : 'blur(8px)',
              border: isLastSlide ? 'none' : '1px solid rgba(255,255,255,0.2)',
              animation: isLastSlide ? 'pulseGlow 2s ease-in-out infinite' : 'none',
            }}
          >
            {isLastSlide ? (
              <>
                Get Started
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            ) : (
              <>
                Next
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </>
            )}
          </button>

          {/* Login link for returning users */}
          <p className="text-center mt-5">
            <button
              onClick={completeOnboarding}
              className="text-white/50 hover:text-white/80 text-sm font-medium transition-colors"
            >
              Already have an account? <span className="underline underline-offset-2">Log in</span>
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
