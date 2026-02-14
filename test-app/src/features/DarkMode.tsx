import { useFlag } from '../flags/FlagProvider';

export function useDarkMode(): boolean {
  return useFlag('dark-mode', false);
}

export function DarkModeIndicator() {
  const dark = useDarkMode();
  return (
    <span className="text-xl" title={dark ? 'Dark mode ON' : 'Light mode'}>
      {dark ? '🌙' : '☀️'}
    </span>
  );
}
