import clsx from 'clsx';
import { X } from 'lucide-react';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'cyan'
  | 'pink';

type BadgeSize = 'xs' | 'sm';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  warning: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  error: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  info: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  neutral: { bg: 'bg-slate-700', text: 'text-slate-300', dot: 'bg-slate-400' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400' },
  cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  pink: { bg: 'bg-pink-500/15', text: 'text-pink-400', dot: 'bg-pink-400' },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1.5',
};

export default function UIBadge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  icon,
  removable = false,
  onRemove,
  className,
}: BadgeProps) {
  const v = variantStyles[variant];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        v.bg,
        v.text,
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full flex-shrink-0',
            v.dot,
            pulse && 'animate-pulse-dot'
          )}
        />
      )}
      {icon && <span className="flex-shrink-0 [&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="flex-shrink-0 -mr-0.5 hover:opacity-70 transition-opacity"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
