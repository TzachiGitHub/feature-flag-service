import React, { useState } from 'react';
import api from '../api/client';

const PRESETS: Record<string, object> = {
  'Free User': { kind: 'user', key: 'user-free-01', name: 'Alex Free', attributes: { email: 'alex@example.com', country: 'US', plan: 'free' } },
  'Premium User': { kind: 'user', key: 'user-premium-01', name: 'Jane Doe', attributes: { email: 'jane@example.com', country: 'US', plan: 'premium' } },
  'Admin': { kind: 'user', key: 'admin-01', name: 'Admin User', attributes: { email: 'admin@company.com', country: 'US', plan: 'enterprise', role: 'admin' } },
  'EU User': { kind: 'user', key: 'user-eu-01', name: 'Hans Mueller', attributes: { email: 'hans@example.de', country: 'DE', plan: 'premium' } },
};

const REASON_COLORS: Record<string, string> = {
  OFF: 'text-slate-500 bg-slate-500/10',
  TARGET_MATCH: 'text-blue-400 bg-blue-400/10',
  RULE_MATCH: 'text-purple-400 bg-purple-400/10',
  FALLTHROUGH: 'text-slate-400 bg-slate-400/10',
  ERROR: 'text-red-400 bg-red-400/10',
  PREREQUISITE_FAILED: 'text-amber-400 bg-amber-400/10',
};

interface EvalResult {
  flagKey: string;
  value: any;
  variation: string;
  reason: string;
  details?: any;
}

const DEFAULT_CONTEXT = JSON.stringify({
  kind: 'user',
  key: 'user-123',
  name: 'Jane Doe',
  attributes: {
    email: 'jane@example.com',
    country: 'US',
    plan: 'premium',
  },
}, null, 2);

export default function Playground() {
  const [contextStr, setContextStr] = useState(DEFAULT_CONTEXT);
  const [results, setResults] = useState<EvalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const projectKey = 'default';

  const handleEvaluate = async () => {
    setError('');
    setSelectedFlag(null);
    try {
      const context = JSON.parse(contextStr);
      setLoading(true);
      const r = await api.post(`/projects/${projectKey}/evaluate`, { context });
      setResults(r.data?.results || r.data || []);
    } catch (e: any) {
      if (e instanceof SyntaxError) {
        setError('Invalid JSON');
      } else {
        setError(e.message || 'Evaluation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (name: string) => {
    setContextStr(JSON.stringify(PRESETS[name], null, 2));
  };

  const selectedResult = results.find(r => r.flagKey === selectedFlag);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Playground</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Context Editor */}
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-3">Evaluation Context</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.keys(PRESETS).map(name => (
                <button
                  key={name}
                  onClick={() => applyPreset(name)}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1 rounded-md transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
            <textarea
              value={contextStr}
              onChange={e => setContextStr(e.target.value)}
              rows={16}
              spellCheck={false}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
            />
            {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Evaluating...' : 'Evaluate All Flags'}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-3">Results</h2>
            {results.length === 0 ? (
              <div className="text-slate-500 text-sm py-12 text-center">
                Click "Evaluate All Flags" to see results
              </div>
            ) : (
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-700">
                      <th className="pb-2 font-medium">Flag Key</th>
                      <th className="pb-2 font-medium">Value</th>
                      <th className="pb-2 font-medium">Variation</th>
                      <th className="pb-2 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr
                        key={r.flagKey}
                        onClick={() => setSelectedFlag(selectedFlag === r.flagKey ? null : r.flagKey)}
                        className={`border-b border-slate-700/50 cursor-pointer hover:bg-slate-750 transition-colors ${selectedFlag === r.flagKey ? 'bg-slate-700/30' : ''}`}
                      >
                        <td className="py-2.5">
                          <code className="text-indigo-400 text-xs">{r.flagKey}</code>
                        </td>
                        <td className="py-2.5 text-white font-mono text-xs">
                          {typeof r.value === 'boolean' ? (
                            <span className={r.value ? 'text-emerald-400' : 'text-slate-400'}>{String(r.value)}</span>
                          ) : (
                            String(r.value)
                          )}
                        </td>
                        <td className="py-2.5 text-slate-300 text-xs">{r.variation}</td>
                        <td className="py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REASON_COLORS[r.reason] || REASON_COLORS.FALLTHROUGH}`}>
                            {r.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedResult?.details && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Evaluation Detail — {selectedResult.flagKey}</h3>
              <pre className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-auto max-h-64">
                {JSON.stringify(selectedResult.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
