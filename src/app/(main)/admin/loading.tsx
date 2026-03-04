export default function AdminLoading() {
  return (
    <div className="min-h-dvh bg-[var(--color-background)] pb-24 px-4 pt-24">
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="space-y-3">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
