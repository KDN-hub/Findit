'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl">📡</div>
      <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
        You&apos;re offline
      </h1>
      <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
        Check your connection and try again. Some features may be unavailable
        until you&apos;re back online.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-[#003898] px-4 py-2 text-sm font-medium text-white hover:bg-[#002d75]"
      >
        Retry
      </button>
    </div>
  );
}
