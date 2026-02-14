import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import AuditDiff from '../components/AuditDiff';
import { useProjectStore } from '../stores/projectStore';
import { AuditLogSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorBoundary';
import { staggerContainer, staggerItem } from '../lib/animations';

interface AuditEntry {
  id: string;
  action: string;
  flagKey: string;
  userName: string;
  userId: string;
  createdAt: string;
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
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flagKey, setFlagKey] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;
  const { currentProject } = useProjectStore();
  const projectKey = currentProject?.key ?? '';

  const fetchEntries = (reset = false) => {
    if (!projectKey) return;
    const newOffset = reset ? 0 : offset;
    setLoading(true);
    setError(false);
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
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(true); }, [projectKey]);

  const handleApply = () => {
    setOffset(0);
    fetchEntries(true);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Audit Log</h1>

      {/* Filters - collapsible on mobile */}
      <div>
        <button
          className="sm:hidden text-sm text-indigo-400 hover:text-indigo-300 mb-2 transition-colors"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          aria-label="Toggle filters"
        >
          {filtersOpen ? '▼ Hide Filters' : '▶ Show Filters'}
        </button>
        <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-end bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-slate-400 mb-1" htmlFor="audit-flag">Flag Key</label>
              <input
                id="audit-flag"
                type="text" value={flagKey} onChange={e => setFlagKey(e.target.value)}
                placeholder="e.g. dark-mode"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                aria-label="Filter by flag key"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-slate-400 mb-1" htmlFor="audit-user">User</label>
              <input
                id="audit-user"
                type="text" value={userFilter} onChange={e => setUserFilter(e.target.value)}
                placeholder="User ID or name"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                aria-label="Filter by user"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-slate-400 mb-1" htmlFor="audit-from">From</label>
              <input
                id="audit-from"
                type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                aria-label="From date"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-slate-400 mb-1" htmlFor="audit-to">To</label>
              <input
                id="audit-to"
                type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                aria-label="To date"
              />
            </div>
            <button
              onClick={handleApply}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98]"
              aria-label="Apply filters"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Entries */}
      {loading && entries.length === 0 ? (
        <AuditLogSkeleton />
      ) : error && entries.length === 0 ? (
        <ErrorState title="Failed to load audit log" onRetry={() => fetchEntries(true)} />
      ) : (
        <motion.div className="space-y-3" variants={staggerContainer} initial="initial" animate="animate">
          {entries.map(entry => (
            <motion.div
              key={entry.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:bg-slate-750 transition-colors"
              variants={staggerItem}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5" role="img" aria-hidden="true">{getIcon(entry.action)}</span>
                  <div>
                    <div className="text-slate-200">
                      <span className="font-semibold text-white">{entry.userName || entry.userId}</span>{' '}
                      <span className="text-slate-400">{entry.action}</span>{' '}
                      <code className="text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs">{entry.flagKey}</code>
                    </div>
                    <div className="text-xs text-slate-500 mt-1" title={new Date(entry.createdAt).toLocaleString()}>
                      {relativeTime(entry.createdAt)}
                    </div>
                  </div>
                </div>
                {(entry.before || entry.after) && (
                  <button
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors self-end sm:self-start"
                    aria-expanded={expandedId === entry.id}
                    aria-label={expandedId === entry.id ? 'Hide diff' : 'Show diff'}
                  >
                    {expandedId === entry.id ? 'Hide diff' : 'Show diff'}
                  </button>
                )}
              </div>
              {expandedId === entry.id && (entry.before || entry.after) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <AuditDiff before={entry.before} after={entry.after} />
                </motion.div>
              )}
            </motion.div>
          ))}

          {entries.length === 0 && !loading && (
            <div className="text-center text-slate-500 py-12">No audit log entries found</div>
          )}

          {loading && entries.length > 0 && (
            <div className="text-center text-slate-500 py-6">Loading...</div>
          )}

          {hasMore && !loading && entries.length > 0 && (
            <button
              onClick={() => fetchEntries(false)}
              className="w-full py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-150 active:scale-[0.99]"
              aria-label="Load more entries"
            >
              Load more
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
