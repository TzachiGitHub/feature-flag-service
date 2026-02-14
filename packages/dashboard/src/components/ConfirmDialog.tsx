import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalOverlay, modalContent } from '../lib/animations';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onCancel}
          {...modalOverlay}
        >
          <motion.div
            className="card p-6 w-full max-w-md shadow-modal"
            onClick={(e) => e.stopPropagation()}
            {...modalContent}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
          >
            <h3 id="confirm-title" className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p id="confirm-message" className="text-slate-400 mb-6">{message}</p>
            <div className="flex justify-end gap-3">
              <button
                ref={cancelRef}
                onClick={onCancel}
                className="btn-secondary active:scale-[0.98] transition-transform"
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`${danger ? 'btn-danger' : 'btn-primary'} active:scale-[0.98] transition-transform`}
                aria-label={confirmLabel}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
