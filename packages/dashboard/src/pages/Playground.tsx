import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import { useProjectStore } from '../stores/projectStore';
import { TableSkeleton } from '../components/Skeleton';
import { staggerContainer, staggerItem } from '../lib/animations';

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
  const { currentProject } = useProjectStore();
  const projectKey = currentProject?.key ?? '';

  const handleEvaluate = async () => {
    setError('');
    setSelectedFlag(null);
    if (!projectKey) { setError('No project selected'); return; }
    try {
      const context = JSON.parse(contextStr);
      setLoading(true);
      const r = await api.post(`/projects/${projectKey}/flags/evaluate`, { context });
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Playground</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Context Editor */}
        <div className="space-y-4">
          <motion.div
            className="bg-slate-800 border border-slate-700 rounded-xl p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-white mb-3">Evaluation Context</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.keys(PRESETS).map(name => (
                <button
                  key={name}
                  onClick={() => applyPreset(name)}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1.5 rounded-md transition-all duration-150 active:scale-[0.98]"
                  aria-label={`Apply ${name} preset`}
                >
                  {name}
                </button>
              ))}
            </div>
            <textarea
              value={contextStr}
              onChange={e => setContextStr(e.target.value)}
              rows={12}
              spellCheck={false}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
              aria-label="Evaluation context JSON"
            />
            {error && <div className="text-red-400 text-sm mt-2" role="alert">{error}</div>}
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-all duration-150 active:scale-[0.98]"
              aria-label="Evaluate all flags"
            >
              {loading ? 'Evaluating...' : 'Evaluate All Flags'}
            </button>
          </motion.div>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          <motion.div
            className="bg-slate-800 border border-slate-700 rounded-xl p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <h2 className="text-lg font-semibold text-white mb-3">Results</h2>
            {loading ? (
              <TableSkeleton />
            ) : results.length === 0 ? (
              <div className="text-slate-500 text-sm py-12 text-center">
                Click "Evaluate All Flags" to see results
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm min-w-[400px]" role="table">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-700">
                      <th className="pb-2 font-medium">Flag Key</th>
                      <th className="pb-2 font-medium">Value</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">Variation</th>
                      <th className="pb-2 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <motion.tbody variants={staggerContainer} initial="initial" animate="animate">
                    {results.map(r => (
                      <motion.tr
                        key={r.flagKey}
                        variants={staggerItem}
                        onClick={() => setSelectedFlag(selectedFlag === r.flagKey ? null : r.flagKey)}
                        className={`border-b border-slate-700/50 cursor-pointer hover:bg-slate-750 transition-colors ${selectedFlag === r.flagKey ? 'bg-slate-700/30' : ''}`}
                        role="row"
                        tabIndex={0}
                        aria-label={`${r.flagKey}: ${String(r.value)}`}
                        onKeyDown={(e) => { if (e.key === 'Enter') setSelectedFlag(selectedFlag === r.flagKey ? null : r.flagKey); }}
                      >
                        <td className="py-2.5">
                          <code className="text-indigo-400 text-xs">{r.flagKey}</code>
                        </td>
                        <td className="py-2.5 text-white font-mono text-xs">
                          {typeof r.value === 'boolean' ? (
                            <span className={`inline-flex items-center gap-1 ${r.value ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {r.value ? '✓' : '✗'} {String(r.value)}
                            </span>
                          ) : (
                            String(r.value)
                          )}
                        </td>
                        <td className="py-2.5 text-slate-300 text-xs hidden sm:table-cell">{r.variation}</td>
                        <td className="py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REASON_COLORS[r.reason] || REASON_COLORS.FALLTHROUGH}`}>
                            {r.reason}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Detail panel */}
          {selectedResult?.details && (
            <motion.div
              className="bg-slate-800 border border-slate-700 rounded-xl p-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <h3 className="text-sm font-semibold text-white mb-2">Evaluation Detail — {selectedResult.flagKey}</h3>
              <pre className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-auto max-h-64">
                {JSON.stringify(selectedResult.details, null, 2)}
              </pre>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
