'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-black text-white px-6">
      <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
        Something went wrong
      </p>
      <button
        onClick={reset}
        className="text-xs font-mono text-zinc-400 border border-zinc-700 px-4 py-2 hover:border-zinc-400 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
