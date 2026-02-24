import { BottomNavigation } from '@/components/BottomNavigation';
import { SwipeableLayout } from '@/components/SwipeableLayout';
import { AuthGuard } from '@/components/AuthGuard';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-dvh bg-white flex flex-col">
        <SwipeableLayout>
          <div className="flex-1 pb-24">
            {children}
          </div>
        </SwipeableLayout>
        <BottomNavigation />
      </div>
    </AuthGuard>
  );
}
