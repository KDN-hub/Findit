'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      {/* Hide status bar / match theme */}
      <style jsx global>{`
        body {
          background-color: #003898;
        }
        /* Hide scrollbar during splash */
        html, body {
          overflow: hidden;
        }
      `}</style>
      
      <div className="min-h-dvh bg-[#003898] flex items-center justify-center">
        {/* Logo Container */}
        <div className="flex items-center gap-1">
          {/* Location Pin with Magnifying Glass Icon */}
          <svg 
            width="80" 
            height="100" 
            viewBox="0 0 80 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            {/* Main pin shape */}
            <path 
              d="M40 0C20.1 0 4 16.1 4 36C4 56 40 100 40 100C40 100 76 56 76 36C76 16.1 59.9 0 40 0Z" 
              fill="white"
            />
            {/* Inner circle (cutout effect) */}
            <circle cx="40" cy="36" r="20" fill="#003898"/>
            {/* Magnifying glass handle */}
            <rect 
              x="52" 
              y="52" 
              width="8" 
              height="24" 
              rx="4" 
              transform="rotate(-45 52 52)" 
              fill="white"
            />
          </svg>
          
          {/* Findit Text */}
          <span className="text-white text-5xl font-bold tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Findit
          </span>
        </div>
      </div>
    </>
  );
}
