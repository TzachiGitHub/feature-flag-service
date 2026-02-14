import { useFlagContext } from '../flags/FlagProvider';

export function ConnectionStatus() {
  const { connected, connectionType, ready } = useFlagContext();

  if (!ready) {
    return <span className="flex items-center gap-1.5 text-xs text-yellow-600">🟡 Connecting...</span>;
  }

  if (connected) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
        🟢 Connected ({connectionType.toUpperCase()})
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-red-500">
      🔴 Disconnected {connectionType !== 'none' ? `(${connectionType})` : ''}
    </span>
  );
}
