'use client';

/** Fallback for Suspense around dashboard items – matches loading.tsx UI. */
export function DashboardItemsFallback() {
  return (
    <div className="min-h-[320px] flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#003898]/30 border-t-[#003898] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  );
}
