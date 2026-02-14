import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Archive, Trash2, Tag, Copy, Filter, LayoutList, Table2 } from 'lucide-react';
import { useFlagStore } from '../stores/flagStore';
import { useProjectStore } from '../stores/projectStore';
import { flagsApi } from '../api/client';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import CreateFlagModal from '../components/CreateFlagModal';
import DataTable, { Column } from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import AnimatedToggle from '../components/AnimatedToggle';
import FlagTypeIcon from '../components/FlagTypeIcon';
import FlagLifecycleBadge from '../components/FlagLifecycleBadge';
import QuickActionsMenu from '../components/QuickActionsMenu';
import { toast } from '../components/Toast';
import type { Flag } from '../types';

const typeBadgeVariant: Record<string, 'indigo' | 'emerald' | 'amber' | 'blue'> = {
  boolean: 'indigo',
  string: 'emerald',
  number: 'amber',
  json: 'blue',
};

const FILTER_CHIPS = [
  { key: 'recent', label: 'Recently modified' },
  { key: 'stale', label: 'Stale flags' },
] as const;

export default function FlagList() {
  const [createOpen, setCreateOpen] = useState(false);
  const { flags, loading, filters, fetchFlags, setFilter } = useFlagStore();
  const { currentProject, currentEnvironment } = useProjectStore();
  const navigate = useNavigate();
  const [envStates, setEnvStates] = useState<Record<string, boolean>>({});
  const [togglingFlags, setTogglingFlags] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'compact'>('table');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) fetchFlags(currentProject.key);
  }, [currentProject?.key, filters.search, filters.type, filters.tag, filters.archived]);

  const fetchEnvStates = useCallback(async () => {
    if (!currentProject || !currentEnvironment || flags.length === 0) return;
    const states: Record<string, boolean> = {};
    await Promise.allSettled(
      flags.map(async (flag) => {
        try {
          const res = await flagsApi.getTargeting(currentProject.key, flag.key, currentEnvironment.key);
          states[flag.key] = res.data.on ?? false;
        } catch { /* ignore */ }
      })
    );
    setEnvStates(states);
  }, [currentProject?.key, currentEnvironment?.key, flags]);

  useEffect(() => { fetchEnvStates(); }, [fetchEnvStates]);

  // Keyboard shortcut: 'n' to create
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setCreateOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleToggle = async (flagKey: string) => {
    if (!currentProject || !currentEnvironment) return;
    const currentOn = envStates[flagKey] ?? false;
    const newOn = !currentOn;
    setEnvStates((prev) => ({ ...prev, [flagKey]: newOn }));
    setTogglingFlags((prev) => new Set(prev).add(flagKey));
    try {
      await flagsApi.toggle(currentProject.key, flagKey, currentEnvironment.key, newOn);
      toast('success', `${flagKey} ${newOn ? 'enabled' : 'disabled'}`);
    } catch {
      setEnvStates((prev) => ({ ...prev, [flagKey]: currentOn }));
      toast('error', 'Failed to toggle flag');
    } finally {
      setTogglingFlags((prev) => { const n = new Set(prev); n.delete(flagKey); return n; });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast('success', 'Key copied to clipboard');
  };

  const handleBulkDelete = async () => {
    if (!currentProject) return;
    const keys = Array.from(selectedKeys);
    for (const key of keys) {
      try { await flagsApi.delete(currentProject.key, key); } catch { /* ignore */ }
    }
    toast('success', `Deleted ${keys.length} flags`);
    setSelectedKeys(new Set());
    fetchFlags(currentProject.key);
  };

  const handleBulkArchive = async () => {
    if (!currentProject) return;
    const keys = Array.from(selectedKeys);
    for (const key of keys) {
      try { await flagsApi.update(currentProject.key, key, { archived: true }); } catch { /* ignore */ }
    }
    toast('success', `Archived ${keys.length} flags`);
    setSelectedKeys(new Set());
    fetchFlags(currentProject.key);
  };

  // Collect all tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    flags.forEach((f) => f.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [flags]);

  // Filtered flags
  const filteredFlags = useMemo(() => {
    let result = flags;
    if (tagFilter) result = result.filter((f) => f.tags?.includes(tagFilter));
    if (activeChip === 'recent') {
      const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((f) => new Date(f.updatedAt).getTime() > week);
    }
    if (activeChip === 'stale') {
      const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((f) => new Date(f.updatedAt).getTime() < week);
    }
    return result;
  }, [flags, tagFilter, activeChip]);

  const columns: Column<Flag>[] = [
    {
      id: 'name',
      header: 'Name / Key',
      sortValue: (f) => f.name.toLowerCase(),
      accessor: (flag) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium hover:text-indigo-400 transition-colors">{flag.name}</span>
            {flag.archived && <Badge variant="red">archived</Badge>}
          </div>
          <code className="text-xs text-slate-500 font-mono">{flag.key}</code>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      width: '100px',
      sortValue: (f) => f.type,
      accessor: (flag) => (
        <div className="flex items-center gap-1.5">
          <FlagTypeIcon type={flag.type} size={14} />
          <Badge variant={typeBadgeVariant[flag.type] || 'default'}>{flag.type}</Badge>
        </div>
      ),
    },
    {
      id: 'lifecycle',
      header: 'Status',
      width: '110px',
      accessor: (flag) => <FlagLifecycleBadge createdAt={flag.createdAt} updatedAt={flag.updatedAt} />,
    },
    {
      id: 'tags',
      header: 'Tags',
      accessor: (flag) => (
        <div className="flex flex-wrap gap-1">
          {flag.tags?.map((tag) => (
            <button
              key={tag}
              onClick={(e) => { e.stopPropagation(); setTagFilter(tagFilter === tag ? null : tag); }}
              className="cursor-pointer"
            >
              <Badge>{tag}</Badge>
            </button>
          ))}
        </div>
      ),
    },
    {
      id: 'envStatus',
      header: 'Environment',
      width: '130px',
      accessor: (flag) => {
        const isOn = envStates[flag.key] ?? false;
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOn ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className={`text-xs font-medium ${isOn ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isOn ? 'ON' : 'OFF'}
            </span>
            {currentEnvironment && (
              <span className="text-[10px] text-slate-600">{currentEnvironment.name}</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'updated',
      header: 'Last Updated',
      width: '140px',
      sortValue: (f) => new Date(f.updatedAt).getTime(),
      accessor: (flag) => (
        <span className="text-xs text-slate-400" title={new Date(flag.updatedAt).toLocaleString()}>
          {formatRelative(flag.updatedAt)}
        </span>
      ),
    },
    {
      id: 'toggle',
      header: 'Toggle',
      width: '80px',
      sortable: false,
      accessor: (flag) => (
        <div onClick={(e) => e.stopPropagation()}>
          <AnimatedToggle
            enabled={envStates[flag.key] ?? false}
            onChange={() => handleToggle(flag.key)}
            disabled={togglingFlags.has(flag.key) || !currentEnvironment}
            size="sm"
          />
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: '40px',
      sortable: false,
      accessor: (flag) => (
        <div onClick={(e) => e.stopPropagation()}>
          <QuickActionsMenu
            actions={[
              { label: 'Copy key', icon: Copy, onClick: () => handleCopyKey(flag.key) },
              { label: 'Settings', icon: Tag, onClick: () => navigate(`/flags/${flag.key}`) },
              { label: 'Delete', icon: Trash2, onClick: () => {}, danger: true, divider: true },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
          {filteredFlags.length > 0 && (
            <p className="text-sm text-slate-500 mt-1">
              Showing {filteredFlags.length} of {flags.length} flags
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Table view"
            >
              <Table2 size={16} />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'compact' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Compact view"
            >
              <LayoutList size={16} />
            </button>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Flag
            <kbd className="hidden sm:inline-flex ml-1 text-[10px] bg-indigo-700/50 px-1.5 py-0.5 rounded">N</kbd>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilter('search', v)}
          placeholder="Search flags by name or key..."
          className="flex-1 min-w-[200px]"
        />
        <select
          value={filters.type}
          onChange={(e) => setFilter('type', e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Types</option>
          <option value="boolean">Boolean</option>
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="json">JSON</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.archived}
            onChange={(e) => setFilter('archived', e.target.checked)}
            className="rounded bg-slate-700 border-slate-600"
          />
          Archived
        </label>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setActiveChip(activeChip === chip.key ? null : chip.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeChip === chip.key
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            {chip.label}
          </button>
        ))}
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              tagFilter === tag
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Tag size={10} className="inline mr-1" />{tag}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedKeys.size > 0 && (
        <div
          className="mb-4 flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/30 rounded-lg px-4 py-2.5"
          style={{ animation: 'slideDown 200ms ease-out' }}
        >
          <span className="text-sm text-indigo-300 font-medium">{selectedKeys.size} selected</span>
          <button
            onClick={handleBulkArchive}
            className="text-sm text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700 transition-colors"
          >
            <Archive size={14} /> Archive
          </button>
          <button
            onClick={handleBulkDelete}
            className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            onClick={() => setSelectedKeys(new Set())}
            className="text-sm text-slate-400 hover:text-white ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredFlags}
        rowKey={(f) => f.id}
        onRowClick={(f) => navigate(`/flags/${f.key}`)}
        loading={loading}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        emptyState={
          flags.length > 0 ? (
            <EmptyState
              title="No flags match filters"
              description="Try adjusting your search or filters."
            />
          ) : (
            <EmptyState
              title="No flags yet"
              description="Create your first feature flag to get started."
              action={
                <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Create Flag
                </button>
              }
            />
          )
        }
      />

      <CreateFlagModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
