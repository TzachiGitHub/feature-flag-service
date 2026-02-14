import clsx from 'clsx';
import type { Environment } from '../types';

const colorMap: Record<string, string> = {
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function EnvironmentBadge({ env, selected, onClick }: { env: Environment; selected?: boolean; onClick?: () => void }) {
  const colors = colorMap[env.color] || colorMap.blue;
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1 rounded-full text-xs font-medium border transition-all',
        colors,
        selected && 'ring-2 ring-offset-1 ring-offset-slate-900 ring-current'
      )}
    >
      {env.name}
    </button>
  );
}
