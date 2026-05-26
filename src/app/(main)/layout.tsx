import { BottomNavigation } from '@/components/BottomNavigation';
import { SidebarNavigation } from '@/components/SidebarNavigation';
import { SwipeableLayout } from '@/components/SwipeableLayout';
import { AuthGuard } from '@/components/AuthGuard';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-dvh bg-slate-50/30 flex flex-col md:flex-row">
        <SidebarNavigation />
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <SwipeableLayout>
            <div className="flex-1 pb-24 md:pb-8 md:px-8 md:max-w-6xl md:mx-auto md:w-full">
              {children}
            </div>
          </SwipeableLayout>
          <BottomNavigation />
        </div>
      </div>
    </AuthGuard>
  );
}
