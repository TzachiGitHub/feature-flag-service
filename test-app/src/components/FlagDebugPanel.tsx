import { useState } from 'react';
import { useFlagContext } from '../flags/FlagProvider';

const reasonColors: Record<string, string> = {
  OFF: 'text-gray-400',
  TARGET_MATCH: 'text-blue-400',
  RULE_MATCH: 'text-purple-400',
  FALLTHROUGH: 'text-green-400',
  ROLLOUT: 'text-orange-400',
  ERROR: 'text-red-400',
  UNKNOWN: 'text-gray-500',
  FLAG_NOT_FOUND: 'text-yellow-400',
  NOT_READY: 'text-yellow-400',
};

function FlagValue({ value }: { value: unknown }) {
  if (typeof value === 'object' && value !== null) {
    return (
      <pre className="text-yellow-300 whitespace-pre-wrap text-xs m-0 bg-gray-800 rounded p-2 overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  if (typeof value === 'boolean') {
    return <span className={`font-bold ${value ? 'text-green-400' : 'text-red-400'}`}>{String(value)}</span>;
  }
  return <span className="text-cyan-300">{JSON.stringify(value)}</span>;
}

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
            <div className="space-y-3">
              {entries.map(([key, detail]) => (
                <div key={key} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-indigo-400 font-semibold text-sm">{key}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${reasonColors[detail.reason] || 'text-gray-400'} bg-gray-700`}>
                      {detail.reason}
                    </span>
                  </div>
                  <div className="mb-1">
                    <span className="text-xs text-gray-500 mr-2">Value:</span>
                    <FlagValue value={detail.value} />
                  </div>
                  {detail.variationId && (
                    <div className="text-xs text-gray-500 mt-1">
                      Variation: <span className="font-mono text-gray-400">{detail.variationId}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
