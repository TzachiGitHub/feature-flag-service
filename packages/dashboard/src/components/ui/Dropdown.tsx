import { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';

/* ── Headless Dropdown ────────────────────────── */

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export default function Dropdown({
  trigger,
  children,
  align = 'left',
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={ref} className={clsx('relative inline-block', className)}>
      <div
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {open && (
        <div
          className={clsx(
            'absolute z-20 mt-1.5 min-w-[180px]',
            'bg-slate-800 border border-slate-700 rounded-lg shadow-dropdown',
            'animate-scale-in origin-top',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <DropdownContext.Provider value={{ close: () => setOpen(false) }}>
            {children}
          </DropdownContext.Provider>
        </div>
      )}
    </div>
  );
}

/* ── Context ────────────────────────── */

import { createContext, useContext } from 'react';

const DropdownContext = createContext<{ close: () => void }>({ close: () => {} });

/* ── DropdownMenu (pre-styled) ────────────────────────── */

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(-1);

  const getItems = useCallback(() => {
    if (!ref.current) return [];
    return Array.from(
      ref.current.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = getItems();
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = focusIndex < items.length - 1 ? focusIndex + 1 : 0;
        setFocusIndex(next);
        items[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = focusIndex > 0 ? focusIndex - 1 : items.length - 1;
        setFocusIndex(prev);
        items[prev]?.focus();
      }
    },
    [focusIndex, getItems]
  );

  return (
    <div ref={ref} role="menu" className="py-1" onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

/* ── DropdownItem ────────────────────────── */

interface DropdownItemProps {
  icon?: React.ReactNode;
  label: string;
  shortcut?: string;
  description?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export function DropdownItem({
  icon,
  label,
  shortcut,
  description,
  disabled = false,
  danger = false,
  onClick,
}: DropdownItemProps) {
  const { close } = useContext(DropdownContext);

  return (
    <button
      role="menuitem"
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => {
        onClick?.();
        close();
      }}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors',
        'focus:outline-none focus:bg-slate-700/60',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : danger
            ? 'text-red-400 hover:bg-red-500/10'
            : 'text-slate-300 hover:bg-slate-700/60'
      )}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
      <span className="flex-1">
        <span className="block">{label}</span>
        {description && (
          <span className="block text-xs text-slate-500 mt-0.5">{description}</span>
        )}
      </span>
      {shortcut && (
        <span className="text-[10px] text-slate-600 font-mono">{shortcut}</span>
      )}
    </button>
  );
}

/* ── DropdownSeparator ────────────────────────── */

export function DropdownSeparator() {
  return <div className="my-1 border-t border-slate-700" />;
}
