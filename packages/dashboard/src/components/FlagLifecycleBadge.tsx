import { Sparkles, Activity, Clock } from 'lucide-react';
import clsx from 'clsx';

type Lifecycle = 'new' | 'active' | 'stale';

function getLifecycle(createdAt: string, updatedAt: string): Lifecycle {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (now - created < sevenDays) return 'new';
  if (now - updated > sevenDays) return 'stale';
  return 'active';
}

const config: Record<Lifecycle, { label: string; icon: typeof Sparkles; bg: string; text: string; dot: string }> = {
  new: { label: 'New', icon: Sparkles, bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  active: { label: 'Active', icon: Activity, bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  stale: { label: 'Stale', icon: Clock, bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
};

export default function FlagLifecycleBadge({ createdAt, updatedAt }: { createdAt: string; updatedAt: string }) {
  const lifecycle = getLifecycle(createdAt, updatedAt);
  const c = config[lifecycle];
  const Icon = c.icon;

  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', c.bg, c.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', c.dot, lifecycle === 'active' && 'animate-pulse')} />
      <Icon size={12} />
      {c.label}
    </span>
  );
}

export { getLifecycle };
