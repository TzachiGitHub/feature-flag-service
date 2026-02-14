import React, { useState, useEffect } from 'react';
import api from '../api/client';
import AuditDiff from '../components/AuditDiff';

interface AuditEntry {
  id: string;
  action: string;
  flagKey: string;
  userName: string;
  userId: string;
  timestamp: string;
  before?: any;
  after?: any;
}

const ACTION_ICONS: Record<string, string> = {
  toggle: '🔄',
  update: '✏️',
  create: '➕',
  delete: '🗑️',
  targeting: '🎯',
};

function getIcon(action: string): string {
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (action.toLowerCase().includes(key)) return icon;
  }
  return '📝';
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flagKey, setFlagKey] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;
  const projectKey = 'default';

  const fetchEntries = (reset = false) => {
    const newOffset = reset ? 0 : offset;
    setLoading(true);
    const params: any = { limit, offset: newOffset };
    if (flagKey) params.flagKey = flagKey;
    if (userFilter) params.userId = userFilter;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    api.get(`/projects/${projectKey}/audit-log`, { params })
      .then(r => {
        const items = r.data?.entries || r.data || [];
        if (reset) {
          setEntries(items);
          setOffset(items.length);
        } else {
          setEntries(prev => [...prev, ...items]);
          setOffset(newOffset + items.length);
        }
        setHasMore(items.length === limit);
      })
      .catch(() => {
        if (reset) setEntries([]);
        setHasMore(false);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(true); }, []);

  const handleApply = () => {
    setOffset(0);
    fetchEntries(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Audit Log</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Flag Key</label>
          <input
            type="text" value={flagKey} onChange={e => setFlagKey(e.target.value)}
            placeholder="e.g. dark-mode"
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-40"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">User</label>
          <input
            type="text" value={userFilter} onChange={e => setUserFilter(e.target.value)}
            placeholder="User ID or name"
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-40"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">From</label>
          <input
            type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">To</label>
          <input
            type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button onClick={handleApply} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
          Apply
        </button>
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{getIcon(entry.action)}</span>
                <div>
                  <div className="text-slate-200">
                    <span className="font-semibold text-white">{entry.userName || entry.userId}</span>{' '}
                    <span className="text-slate-400">{entry.action}</span>{' '}
                    <code className="text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs">{entry.flagKey}</code>
                  </div>
                  <div className="text-xs text-slate-500 mt-1" title={new Date(entry.timestamp).toLocaleString()}>
                    {relativeTime(entry.timestamp)}
                  </div>
                </div>
              </div>
              {(entry.before || entry.after) && (
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {expandedId === entry.id ? 'Hide diff' : 'Show diff'}
                </button>
              )}
            </div>
            {expandedId === entry.id && (entry.before || entry.after) && (
              <AuditDiff before={entry.before} after={entry.after} />
            )}
          </div>
        ))}

        {entries.length === 0 && !loading && (
          <div className="text-center text-slate-500 py-12">No audit log entries found</div>
        )}

        {loading && (
          <div className="text-center text-slate-500 py-6">Loading...</div>
        )}

        {hasMore && !loading && entries.length > 0 && (
          <button
            onClick={() => fetchEntries(false)}
            className="w-full py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
