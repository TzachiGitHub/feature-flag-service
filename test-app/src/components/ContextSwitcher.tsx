import { useState } from 'react';
import { testContexts, contextLabels } from '../contexts';
import { useFlagContext } from '../flags/FlagProvider';

export function ContextSwitcher() {
  const { identify, context } = useFlagContext();
  const [selected, setSelected] = useState('premiumUser');
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key: string) => {
    setSelected(key);
    identify(testContexts[key]);
  };

  return (
    <div className="relative">
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
      >
        {Object.entries(contextLabels).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <button
        onClick={() => setExpanded(!expanded)}
        className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
        title="Show context details"
      >
        {expanded ? '▲' : '▼'}
      </button>
      {expanded && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 min-w-[280px]">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Context Details</h4>
          <div className="text-xs font-mono space-y-1">
            <div><span className="text-gray-400">kind:</span> <span className="text-indigo-600 dark:text-indigo-400">{context.kind}</span></div>
            <div><span className="text-gray-400">key:</span> <span className="text-indigo-600 dark:text-indigo-400">{context.key}</span></div>
            {context.name && <div><span className="text-gray-400">name:</span> <span className="text-indigo-600 dark:text-indigo-400">{context.name}</span></div>}
            {context.attributes && Object.entries(context.attributes).map(([k, v]) => (
              <div key={k}><span className="text-gray-400">{k}:</span> <span className="text-green-600 dark:text-green-400">{String(v)}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
