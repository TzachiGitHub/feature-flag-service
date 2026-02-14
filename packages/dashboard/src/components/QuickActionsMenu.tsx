import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Copy, Archive, Trash2, Settings, ExternalLink } from 'lucide-react';

interface Action {
  label: string;
  icon: typeof Copy;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface QuickActionsMenuProps {
  actions: Action[];
}

export default function QuickActionsMenu({ actions }: QuickActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        aria-label="Actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden"
          style={{
            animation: 'dropdownIn 150ms ease-out',
          }}
        >
          {actions.map((action, i) => (
            <div key={i}>
              {action.divider && i > 0 && <div className="border-t border-slate-700 my-1" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  action.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <action.icon size={14} />
                {action.label}
              </button>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export { type Action };
export { Copy, Archive, Trash2, Settings, ExternalLink };
