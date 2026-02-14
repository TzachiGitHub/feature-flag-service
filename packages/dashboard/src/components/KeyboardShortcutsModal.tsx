import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { modalOverlay, modalContent } from '../lib/animations';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeRef.current?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          {...modalOverlay}
        >
          <motion.div
            className="card p-6 w-full max-w-md shadow-modal"
            onClick={(e) => e.stopPropagation()}
            {...modalContent}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close shortcuts modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-2 rounded hover:bg-slate-700/30 transition-colors">
                  <div>
                    <span className="text-sm text-slate-300">{shortcut.description}</span>
                    <span className="text-xs text-slate-500 ml-2">({shortcut.scope})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd
                        key={j}
                        className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 font-mono"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
