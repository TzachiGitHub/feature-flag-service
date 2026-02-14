import { useState, useEffect } from 'react';
import clsx from 'clsx';

interface AnimatedToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
}

export default function AnimatedToggle({
  enabled,
  onChange,
  disabled,
  size = 'md',
  label,
  showLabel = false,
}: AnimatedToggleProps) {
  const [pressed, setPressed] = useState(false);

  const sizeClasses = {
    sm: { track: 'h-5 w-9', knob: 'h-3.5 w-3.5', on: 'translate-x-[18px]', off: 'translate-x-[3px]' },
    md: { track: 'h-6 w-11', knob: 'h-4 w-4', on: 'translate-x-6', off: 'translate-x-1' },
    lg: { track: 'h-8 w-16', knob: 'h-6 w-6', on: 'translate-x-[34px]', off: 'translate-x-[3px]' },
  };

  const s = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label || 'Toggle'}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        className={clsx(
          'relative inline-flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900',
          s.track,
          enabled
            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
            : 'bg-slate-600',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
        style={{
          transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms ease',
        }}
      >
        <span
          className={clsx(
            'inline-block rounded-full bg-white shadow-sm',
            s.knob,
            enabled ? s.on : s.off,
            pressed && !disabled && 'scale-110',
          )}
          style={{
            transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), scale 150ms ease',
          }}
        />
        {showLabel && size === 'lg' && (
          <span
            className={clsx(
              'absolute text-[10px] font-bold',
              enabled ? 'left-2 text-white' : 'right-2 text-slate-400'
            )}
          >
            {enabled ? 'ON' : 'OFF'}
          </span>
        )}
      </button>
    </div>
  );
}
