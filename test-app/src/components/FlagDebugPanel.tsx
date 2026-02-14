import { useState } from 'react';
import { useFlagContext } from '../flags/FlagProvider';

const reasonColors: Record<string, string> = {
  OFF: 'text-gray-400',
  TARGET_MATCH: 'text-blue-400',
  RULE_MATCH: 'text-purple-400',
  FALLTHROUGH: 'text-green-400',
  ERROR: 'text-red-400',
  UNKNOWN: 'text-gray-500',
  FLAG_NOT_FOUND: 'text-yellow-400',
  NOT_READY: 'text-yellow-400',
};

export function FlagDebugPanel() {
  const { flagDetails, ready, refresh } = useFlagContext();
  const [collapsed, setCollapsed] = useState(false);
  const entries = Object.entries(flagDetails);

  return (
    <div className="bg-gray-900 text-gray-100 rounded-xl overflow-hidden mt-8">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h3 className="text-sm font-semibold flex items-center gap-2">
          🔧 Flag Debug Panel
          <span className="text-xs text-gray-500">({entries.length} flags)</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); refresh(); }}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
          >
            ↻ Refresh
          </button>
          <span className="text-gray-500 text-sm">{collapsed ? '▶' : '▼'}</span>
        </div>
      </div>
      {!collapsed && (
        <div className="px-4 pb-4">
          {!ready ? (
            <p className="text-gray-500 text-sm py-2">Loading flags...</p>
          ) : entries.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">No flags received. Check SDK key and API connection.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
                  <th className="text-left py-2 pr-4">Flag Key</th>
                  <th className="text-left py-2 pr-4">Value</th>
                  <th className="text-left py-2 pr-4">Variation ID</th>
                  <th className="text-left py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([key, detail]) => (
                  <tr key={key} className="border-b border-gray-800 last:border-0">
                    <td className="py-2 pr-4 font-mono text-indigo-400">{key}</td>
                    <td className="py-2 pr-4 font-mono max-w-xs" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                      {typeof detail.value === 'object'
                        ? <pre className="text-yellow-300 whitespace-pre-wrap text-xs m-0">{JSON.stringify(detail.value, null, 2)}</pre>
                        : typeof detail.value === 'boolean'
                        ? <span className={detail.value ? 'text-green-400' : 'text-red-400'}>{String(detail.value)}</span>
                        : <span className="text-cyan-300">{JSON.stringify(detail.value)}</span>
                      }
                    </td>
                    <td className="py-2 pr-4 text-gray-500 font-mono text-xs">{detail.variationId || '—'}</td>
                    <td className={`py-2 font-medium text-xs ${reasonColors[detail.reason] || 'text-gray-400'}`}>
                      {detail.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
