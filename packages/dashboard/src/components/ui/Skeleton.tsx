import clsx from 'clsx';

type SkeletonVariant = 'text' | 'title' | 'avatar' | 'card' | 'table-row' | 'circle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  width?: string;
  height?: string;
  count?: number;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  title: 'h-6 w-3/4 rounded',
  avatar: 'h-10 w-10 rounded-full',
  circle: 'h-8 w-8 rounded-full',
  card: 'h-32 w-full rounded-card',
  'table-row': 'h-12 w-full rounded',
};

export default function Skeleton({
  variant = 'text',
  className,
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const items = Array.from({ length: count });
  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={clsx(
            'relative overflow-hidden bg-slate-700/50',
            variantStyles[variant],
            className
          )}
          style={{ width, height }}
        >
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-600/20 to-transparent" />
        </div>
      ))}
    </>
  );
}

/* ── Presets ────────────────────────── */

export function SkeletonGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx('space-y-3', className)}>{children}</div>;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton variant="title" />
        <Skeleton variant="text" width="40%" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-card border border-slate-700 animate-fade-in">
      <div className="bg-slate-800/60 px-4 py-3 border-b border-slate-700">
        <Skeleton variant="text" width="60%" />
      </div>
      <div className="divide-y divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-4">
            <Skeleton variant="text" width="25%" />
            <Skeleton variant="text" width="15%" />
            <Skeleton variant="text" width="20%" />
            <Skeleton variant="text" width="10%" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FlagListSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-800 border border-slate-700 rounded-card p-4 flex items-center gap-4"
        >
          <Skeleton variant="circle" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="25%" />
          </div>
          <Skeleton variant="text" width="60px" />
        </div>
      ))}
    </div>
  );
}
