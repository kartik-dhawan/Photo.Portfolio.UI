'use client';

import { useState, useEffect, useRef } from 'react';
import { subscribeToast } from '@/lib/toast';

interface ToastItem {
  id: number;
  message: string;
  leaving: boolean;
}

let _id = 0;
const DURATION = 4000;
const FADE_DURATION = 300;

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = (id: number) => {
    // Mark as leaving so the fade-out animation runs
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    // Remove after fade-out
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, FADE_DURATION);
    timers.current.set(id, t);
  };

  useEffect(() => {
    return subscribeToast((message) => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, message, leaving: false }]);
      const t = setTimeout(() => dismiss(id), DURATION);
      timers.current.set(id, t);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(({ id, message, leaving }) => (
        <div
          key={id}
          onClick={() => dismiss(id)}
          style={{ transition: `opacity ${FADE_DURATION}ms, transform ${FADE_DURATION}ms` }}
          className={`pointer-events-auto flex items-start gap-3 bg-black border border-zinc-800 px-4 py-3 max-w-xs cursor-pointer
            ${leaving ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
        >
          {/* check icon */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-500 shrink-0 mt-[1px]"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-mono text-[11px] text-zinc-300 leading-relaxed">
            {message}
          </span>
        </div>
      ))}
    </div>
  );
}
