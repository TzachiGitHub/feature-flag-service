import { create } from 'zustand';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { toastAnimation } from '../lib/animations';

interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (type: 'success' | 'error', message: string) => void;
  removeToast: (id: number) => void;
}

let nextId = 0;
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = nextId++;
    set((s) => {
      // Max 3 visible
      const toasts = [...s.toasts, { id, type, message }].slice(-3);
      return { toasts };
    });
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(type: 'success' | 'error', message: string) {
  useToastStore.getState().addToast(type, message);
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-16 sm:bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            {...toastAnimation}
            layout
            className={clsx(
              'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm min-w-[200px] max-w-[360px]',
              t.type === 'success' ? 'bg-emerald-900/90 text-emerald-200' : 'bg-red-900/90 text-red-200'
            )}
          >
            {t.type === 'success' ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-2 hover:opacity-70 transition-opacity flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="h-3 w-3" />
            </button>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-lg">
              <motion.div
                className={clsx(
                  'h-full',
                  t.type === 'success' ? 'bg-emerald-400/40' : 'bg-red-400/40'
                )}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
