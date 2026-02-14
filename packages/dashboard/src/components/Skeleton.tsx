import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'table-row' | 'rect';
  width?: string;
  height?: string;
  count?: number;
}

function SkeletonBase({ className, width, height }: { className?: string; width?: string; height?: string }) {
  return (
    <div
      className={clsx('relative overflow-hidden rounded bg-slate-700/50', className)}
      style={{ width, height }}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-slate-600/20 to-transparent" />
    </div>
  );
}

export default function Skeleton({ className, variant = 'text', width, height, count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const variantClass = {
    text: 'h-4 w-full rounded',
    title: 'h-6 w-3/4 rounded',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-lg',
    'table-row': 'h-12 w-full rounded',
    rect: '',
  }[variant];

  return (
    <>
      {items.map((i) => (
        <SkeletonBase key={i} className={clsx(variantClass, className)} width={width} height={height} />
      ))}
    </>
  );
}

// Preset skeleton screens
export function FlagListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="card px-5 py-4 flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton variant="text" className="w-40 h-5" />
              <Skeleton variant="rect" className="w-16 h-5 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton variant="text" className="w-32 h-3" />
              <Skeleton variant="text" className="w-20 h-3" />
            </div>
          </div>
          <Skeleton variant="rect" className="w-11 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="title" className="w-48" />
        <Skeleton variant="rect" className="w-28 h-9 rounded-md" />
      </div>
      <div className="space-y-3">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton variant="table-row" className="bg-slate-700/30" />
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} variant="table-row" />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="title" className="w-20 h-8" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <Skeleton variant="text" className="w-48 h-5 mb-4" />
      <Skeleton variant="rect" className="w-full h-64 rounded-lg" />
    </div>
  );
}

export function SegmentCardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2">
          <Skeleton variant="text" className="w-36 h-5" />
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="text" className="w-full h-3" />
        </div>
      ))}
    </div>
  );
}

export function AuditLogSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton variant="rect" className="w-full h-16 rounded-xl" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton variant="avatar" className="w-6 h-6" />
            <Skeleton variant="text" className="w-48 h-4" />
          </div>
          <Skeleton variant="text" className="w-32 h-3" />
        </div>
      ))}
    </div>
  );
}

export function FlagDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton variant="text" className="w-20 h-4" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton variant="title" className="w-56 h-8" />
          <Skeleton variant="text" className="w-40 h-4" />
        </div>
        <Skeleton variant="rect" className="w-16 h-8 rounded-full" />
      </div>
      <div className="flex gap-6 border-b border-slate-700 pb-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="text" className="w-20 h-4" />
        ))}
      </div>
      <Skeleton variant="card" className="h-64" />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton variant="title" className="w-32 h-8" />
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
        <Skeleton variant="text" className="w-32 h-5" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center justify-between bg-slate-900 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="avatar" className="w-3 h-3" />
              <div className="space-y-1">
                <Skeleton variant="text" className="w-24 h-4" />
                <Skeleton variant="text" className="w-16 h-3" />
              </div>
            </div>
            <Skeleton variant="rect" className="w-48 h-6 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
        <Skeleton variant="text" className="w-32 h-5" />
        <Skeleton variant="rect" className="w-full h-32 rounded-lg" />
      </div>
    </div>
  );
}

export function LearnSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-64 flex-shrink-0 border-r border-slate-700 p-4 space-y-2">
        <Skeleton variant="text" className="w-16 h-3 mb-4" />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} variant="text" className="w-full h-7 rounded-lg" />
        ))}
      </div>
      <div className="flex-1 p-8 space-y-6">
        <Skeleton variant="title" className="w-72 h-9" />
        <Skeleton variant="text" className="w-96 h-4" />
        <Skeleton variant="card" className="h-48" />
        <Skeleton variant="card" className="h-48" />
      </div>
    </div>
  );
}

export function TargetingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <Skeleton variant="text" className="w-32 h-5" />
        <Skeleton variant="rect" className="w-11 h-6 rounded-full" />
      </div>
      <Skeleton variant="card" className="h-24" />
      <Skeleton variant="card" className="h-48" />
      <Skeleton variant="card" className="h-24" />
    </div>
  );
}
