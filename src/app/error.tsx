'use client';

function isQuotaError(error: Error) {
  return error.message?.includes('Quota exceeded') || error.message?.includes('RESOURCE_EXHAUSTED');
}

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  if (isQuotaError(error)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-black text-white px-6">
        <p className="text-zinc-400 text-sm font-mono uppercase tracking-widest">Maintenance block</p>
        <p className="text-zinc-600 text-xs font-mono text-center max-w-xs">
          Firebase read quota exceeded. Service will resume after 12:30 PM.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-black text-white px-6">
      <p className="text-zinc-400 text-sm font-mono uppercase tracking-widest text-center">
        Service unavailable temporarily, please check after a while
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
