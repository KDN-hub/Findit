'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      if (pathname !== '/admin') {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else {
        setChecked(true);
      }
      return;
    }

    // Role Segregation: System Admin (root@admin.findit) should only be in /admin
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isSystemAdmin = payload.sub === 'root@admin.findit';

      if (isSystemAdmin && pathname !== '/admin') {
        router.replace('/admin');
        return;
      }
    } catch (e) {
      console.error("AuthGuard: Token decode failed", e);
    }

    setChecked(true);
  }, [router, pathname]);

  if (!checked) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#003898]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}
