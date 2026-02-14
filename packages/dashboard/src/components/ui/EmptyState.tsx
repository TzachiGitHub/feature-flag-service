import clsx from 'clsx';
import { Flag, Users, BarChart3, ScrollText, Search } from 'lucide-react';

type EmptyStateSize = 'sm' | 'lg';

interface EmptyStateProps {
  icon?: React.ReactNode;
  illustration?: 'flags' | 'segments' | 'analytics' | 'audit' | 'search';
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: EmptyStateSize;
  className?: string;
}

/* ── SVG Illustrations ────────────────────────── */

const illustrations: Record<string, React.ReactNode> = {
  flags: (
    <div className="relative animate-float">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border-2 border-dashed border-indigo-500/30 flex items-center justify-center">
        <Flag className="h-8 w-8 text-indigo-400/60" />
      </div>
    </div>
  ),
  segments: (
    <div className="relative animate-float">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-dashed border-emerald-500/30 flex items-center justify-center">
        <Users className="h-8 w-8 text-emerald-400/60" />
      </div>
    </div>
  ),
  analytics: (
    <div className="relative animate-float">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border-2 border-dashed border-blue-500/30 flex items-center justify-center">
        <BarChart3 className="h-8 w-8 text-blue-400/60" />
      </div>
    </div>
  ),
  audit: (
    <div className="relative animate-float">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-500/30 flex items-center justify-center">
        <ScrollText className="h-8 w-8 text-amber-400/60" />
      </div>
    </div>
  ),
  search: (
    <div className="relative animate-float">
      <div className="w-16 h-16 rounded-2xl bg-slate-500/10 border-2 border-dashed border-slate-500/30 flex items-center justify-center">
        <Search className="h-8 w-8 text-slate-400/60" />
      </div>
    </div>
  ),
};

export default function UIEmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  size = 'lg',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        size === 'lg' ? 'py-16' : 'py-8',
        className
      )}
    >
      {illustration && illustrations[illustration] && (
        <div className="mb-5">{illustrations[illustration]}</div>
      )}
      {icon && !illustration && (
        <div className="mb-4 text-slate-600">{icon}</div>
      )}
      <h3
        className={clsx(
          'font-medium text-white',
          size === 'lg' ? 'text-lg mb-1' : 'text-sm mb-0.5'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={clsx(
            'text-slate-400 max-w-sm',
            size === 'lg' ? 'text-sm mb-5' : 'text-xs mb-3'
          )}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
