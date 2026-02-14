import { useFlag } from '../flags/FlagProvider';

export function NewBadge() {
  const show = useFlag('new-feature-badge', false);
  if (!show) return null;
  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
      NEW
    </span>
  );
}
