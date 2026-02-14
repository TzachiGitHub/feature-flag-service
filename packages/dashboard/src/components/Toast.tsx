import { create } from 'zustand';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import clsx from 'clsx';

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
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
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
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={clsx('flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm', t.type === 'success' ? 'bg-emerald-900/90 text-emerald-200' : 'bg-red-900/90 text-red-200')}>
          {t.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {t.message}
          <button onClick={() => removeToast(t.id)} className="ml-2"><X className="h-3 w-3" /></button>
        </div>
      ))}
    </div>
  );
}
