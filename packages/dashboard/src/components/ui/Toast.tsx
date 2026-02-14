import { create } from 'zustand';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

/* ── Types ────────────────────────── */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
  duration: number;
  createdAt: number;
  dismissing?: boolean;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, opts?: { action?: ToastAction; duration?: number }) => void;
  removeToast: (id: number) => void;
  dismissToast: (id: number) => void;
}

const MAX_VISIBLE = 3;
let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (type, message, opts) => {
    const id = nextId++;
    const duration = opts?.duration ?? 4000;
    const item: ToastItem = { id, type, message, action: opts?.action, duration, createdAt: Date.now() };
    set((s) => {
      const toasts = [...s.toasts, item];
      // Keep max visible, queue rest
      return { toasts: toasts.slice(-MAX_VISIBLE - 5) };
    });
    setTimeout(() => get().dismissToast(id), duration);
  },
  dismissToast: (id) => {
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, dismissing: true } : t)),
    }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 150);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(type: ToastType, message: string, opts?: { action?: ToastAction; duration?: number }) {
  useToastStore.getState().addToast(type, message, opts);
}

/* ── Icons ────────────────────────── */

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  error: <XCircle className="h-4 w-4 text-red-400" />,
  info: <Info className="h-4 w-4 text-blue-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
};

const bgStyles: Record<ToastType, string> = {
  success: 'bg-emerald-950/90 border-emerald-800/50 text-emerald-200',
  error: 'bg-red-950/90 border-red-800/50 text-red-200',
  info: 'bg-blue-950/90 border-blue-800/50 text-blue-200',
  warning: 'bg-amber-950/90 border-amber-800/50 text-amber-200',
};

const progressColors: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
};

/* ── Toast Item ────────────────────────── */

function ToastCard({ item }: { item: ToastItem }) {
  const dismissToast = useToastStore((s) => s.dismissToast);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.animationDuration = `${item.duration}ms`;
    }
  }, [item.duration]);

  return (
    <div
      className={clsx(
        'relative overflow-hidden flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm min-w-[300px] max-w-[420px]',
        bgStyles[item.type],
        item.dismissing ? 'animate-slide-out-right' : 'animate-slide-in-right'
      )}
    >
      <span className="flex-shrink-0 mt-0.5">{icons[item.type]}</span>
      <span className="flex-1">{item.message}</span>
      {item.action && (
        <button
          onClick={() => {
            item.action!.onClick();
            dismissToast(item.id);
          }}
          className="flex-shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {item.action.label}
        </button>
      )}
      <button
        onClick={() => dismissToast(item.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20">
        <div
          ref={progressRef}
          className={clsx('h-full animate-progress-countdown', progressColors[item.type])}
        />
      </div>
    </div>
  );
}

/* ── Container ────────────────────────── */

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const visible = toasts.slice(-MAX_VISIBLE);

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {visible.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}
