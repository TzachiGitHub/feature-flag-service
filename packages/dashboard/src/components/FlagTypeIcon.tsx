import { ToggleLeft, Type, Hash, Braces } from 'lucide-react';
import clsx from 'clsx';

const iconMap: Record<string, { icon: typeof ToggleLeft; color: string }> = {
  boolean: { icon: ToggleLeft, color: 'text-indigo-400' },
  string: { icon: Type, color: 'text-emerald-400' },
  number: { icon: Hash, color: 'text-amber-400' },
  json: { icon: Braces, color: 'text-blue-400' },
};

export default function FlagTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  const entry = iconMap[type.toLowerCase()] || iconMap.boolean;
  const Icon = entry.icon;
  return <Icon className={clsx(entry.color)} size={size} />;
}
