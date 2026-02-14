import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';
import AuditDiff from '../components/AuditDiff';
import { useProjectStore } from '../stores/projectStore';

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

const ACTION_TYPES = ['all', 'toggle', 'create', 'update', 'delete', 'targeting'] as const;
type ActionType = (typeof ACTION_TYPES)[number];

// SVG icons for actions
function ActionIcon({ action }: { action: string }) {
  const lower = action.toLowerCase();
  if (lower.includes('toggle')) {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
      </svg>
    );
  }
  if (lower.includes('create')) {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (lower.includes('delete')) {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    );
  }
  if (lower.includes('targeting')) {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  // update / default
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function getActionColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('toggle')) return 'bg-blue-500';
  if (lower.includes('create')) return 'bg-emerald-500';
  if (lower.includes('delete')) return 'bg-red-500';
  if (lower.includes('targeting')) return 'bg-purple-500';
  return 'bg-amber-500'; // update
}

function getActionBgColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('toggle')) return 'bg-blue-500/10 text-blue-400';
  if (lower.includes('create')) return 'bg-emerald-500/10 text-emerald-400';
  if (lower.includes('delete')) return 'bg-red-500/10 text-red-400';
  if (lower.includes('targeting')) return 'bg-purple-500/10 text-purple-400';
  return 'bg-amber-500/10 text-amber-400';
}

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  );
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

function getDateGroup(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'This Week';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Skeleton for timeline
function TimelineSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-700" />
            <div className="w-0.5 flex-1 bg-slate-700/50 mt-2" />
          </div>
          <div className="flex-1 pb-6">
            <div className="h-4 w-48 bg-slate-700 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-700/50 rounded mb-2" />
            <div className="h-16 w-full bg-slate-700/30 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flagKey, setFlagKey] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionType>('all');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const limit = 20;
  const { currentProject } = useProjectStore();
  const projectKey = currentProject?.key ?? '';

  const fetchEntries = useCallback((reset = false) => {
    if (!projectKey) return;
    const newOffset = reset ? 0 : offset;
    setLoading(true);
    const params: Record<string, string | number> = { limit, offset: newOffset };
    if (flagKey) params.flagKey = flagKey;
    if (userFilter) params.userId = userFilter;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    api.get(`/projects/${projectKey}/audit-log`, { params })
      .then(r => {
        const items = r.data?.entries || r.data || [];
        const total = r.data?.total;
        if (total !== undefined) setTotalCount(total);
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
  }, [projectKey, offset, flagKey, userFilter, fromDate, toDate]);

  useEffect(() => { fetchEntries(true); }, [projectKey]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) {
        fetchEntries(false);
      }
    }, { threshold: 0.1 });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchEntries]);

  const handleApply = () => {
    setOffset(0);
    fetchEntries(true);
  };

  // Filter entries by action type client-side
  const filteredEntries = actionFilter === 'all'
    ? entries
    : entries.filter(e => e.action.toLowerCase().includes(actionFilter));

  // Group entries by date
  const groups: Array<{ label: string; entries: AuditEntry[] }> = [];
  let currentGroup = '';
  for (const entry of filteredEntries) {
    const group = getDateGroup(entry.createdAt);
    if (group !== currentGroup) {
      groups.push({ label: group, entries: [] });
      currentGroup = group;
    }
    groups[groups.length - 1].entries.push(entry);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track all changes across your project
            {totalCount !== null && <span className="text-slate-500"> · {totalCount} total entries</span>}
          </p>
        </div>
        <button className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 border border-slate-700 transition-colors flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
        {/* Action filter chips */}
        <div className="flex flex-wrap gap-2">
          {ACTION_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setActionFilter(type)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
                actionFilter === type
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
            </button>
          ))}
        </div>
        {/* Detail filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Flag Key</label>
            <input
              type="text" value={flagKey} onChange={e => setFlagKey(e.target.value)}
              placeholder="e.g. dark-mode"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">User</label>
            <input
              type="text" value={userFilter} onChange={e => setUserFilter(e.target.value)}
              placeholder="User ID or name"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">From</label>
            <input
              type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">To</label>
            <input
              type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button onClick={handleApply} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
            Apply
          </button>
        </div>
      </div>

      {/* Timeline */}
      {loading && entries.length === 0 ? (
        <TimelineSkeleton />
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-slate-400">No audit log entries found</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-0">
          {groups.map((group, gi) => (
            <div key={gi}>
              {/* Date group header */}
              <div className="flex items-center gap-3 mb-4 mt-6 first:mt-0">
                <div className="h-px flex-1 bg-slate-700" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{group.label}</span>
                <div className="h-px flex-1 bg-slate-700" />
              </div>

              {/* Timeline entries */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-700/50" />

                {group.entries.map((entry, ei) => (
                  <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0 group">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionBgColor(entry.action)} ring-4 ring-slate-900`}>
                        <ActionIcon action={entry.action} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <UserAvatar name={entry.userName || entry.userId} />
                            <div className="min-w-0">
                              <div className="text-sm">
                                <span className="font-semibold text-white">{entry.userName || entry.userId}</span>
                                <span className="text-slate-400 mx-1.5">{entry.action}</span>
                                <code className="text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">{entry.flagKey}</code>
                              </div>
                              <div className="text-xs text-slate-500 mt-1" title={new Date(entry.createdAt).toLocaleString()}>
                                {relativeTime(entry.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {(entry.before || entry.after) && (
                              <button
                                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded-md hover:bg-indigo-500/10 transition-colors flex items-center gap-1"
                              >
                                <svg className={`w-3.5 h-3.5 transition-transform ${expandedId === entry.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                                {expandedId === entry.id ? 'Hide diff' : 'Show diff'}
                              </button>
                            )}
                          </div>
                        </div>
                        {expandedId === entry.id && (entry.before || entry.after) && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <AuditDiff before={entry.before} after={entry.after} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Sentinel for infinite scroll */}
          {hasMore && <div ref={sentinelRef} className="h-4" />}

          {loading && entries.length > 0 && (
            <div className="flex items-center justify-center py-4 gap-2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Loading more...</span>
            </div>
          )}

          {!hasMore && entries.length > 0 && (
            <div className="text-center text-xs text-slate-500 py-4">
              Showing {filteredEntries.length} entries — no more to load
            </div>
          )}
        </div>
      )}
    </div>
  );
}
