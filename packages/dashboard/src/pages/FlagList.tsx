import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFlagStore } from '../stores/flagStore';
import { useProjectStore } from '../stores/projectStore';
import { flagsApi } from '../api/client';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import CreateFlagModal from '../components/CreateFlagModal';
import { FlagListSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorBoundary';
import { toast } from '../components/Toast';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { staggerContainer, staggerItem } from '../lib/animations';

const typeBadgeVariant: Record<string, 'indigo' | 'emerald' | 'amber' | 'blue'> = {
  boolean: 'indigo',
  string: 'emerald',
  number: 'amber',
  json: 'blue',
};

export default function FlagList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState(false);
  const { flags, loading, filters, fetchFlags, setFilter } = useFlagStore();
  const { currentProject, currentEnvironment } = useProjectStore();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const [envStates, setEnvStates] = useState<Record<string, boolean>>({});
  const [togglingFlags, setTogglingFlags] = useState<Set<string>>(new Set());

  // Keyboard shortcuts
  useKeyboardShortcut({ key: 'n', handler: () => setCreateOpen(true) });
  useKeyboardShortcut({ key: '/', handler: () => searchRef.current?.focus() });

  useEffect(() => {
    if (currentProject) {
      setError(false);
      fetchFlags(currentProject.key).catch(() => setError(true));
    }
  }, [currentProject?.key, filters.search, filters.type, filters.tag, filters.archived]);

  const fetchEnvStates = useCallback(async () => {
    if (!currentProject || !currentEnvironment || flags.length === 0) return;
    const states: Record<string, boolean> = {};
    await Promise.allSettled(
      flags.map(async (flag) => {
        try {
          const res = await flagsApi.getTargeting(currentProject.key, flag.key, currentEnvironment.key);
          states[flag.key] = res.data.on ?? false;
        } catch {
          // ignore
        }
      })
    );
    setEnvStates(states);
  }, [currentProject?.key, currentEnvironment?.key, flags]);

  useEffect(() => {
    fetchEnvStates();
  }, [fetchEnvStates]);

  const handleToggle = async (e: React.MouseEvent, flagKey: string) => {
    e.stopPropagation();
    if (!currentProject || !currentEnvironment) return;
    const currentOn = envStates[flagKey] ?? false;
    const newOn = !currentOn;

    setEnvStates(prev => ({ ...prev, [flagKey]: newOn }));
    setTogglingFlags(prev => new Set(prev).add(flagKey));

    try {
      await flagsApi.toggle(currentProject.key, flagKey, currentEnvironment.key, newOn);
      toast('success', `${flagKey} ${newOn ? 'enabled' : 'disabled'}`);
    } catch {
      setEnvStates(prev => ({ ...prev, [flagKey]: currentOn }));
      toast('error', 'Failed to toggle flag');
    } finally {
      setTogglingFlags(prev => {
        const next = new Set(prev);
        next.delete(flagKey);
        return next;
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary flex items-center gap-2 active:scale-[0.98] transition-transform"
          aria-label="Create new flag"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Flag</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            ref={searchRef}
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="input-field pl-9"
            placeholder="Search flags... (press /)"
            aria-label="Search flags"
          />
        </div>
        <select
          value={filters.type}
          onChange={(e) => setFilter('type', e.target.value)}
          className="input-field w-full sm:w-auto"
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          <option value="boolean">Boolean</option>
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="json">JSON</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.archived}
            onChange={(e) => setFilter('archived', e.target.checked)}
            className="rounded bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
            aria-label="Show archived flags"
          />
          Show Archived
        </label>
      </div>

      {loading && <FlagListSkeleton />}

      {!loading && error && (
        <ErrorState
          title="Failed to load flags"
          message="Could not fetch feature flags. Please try again."
          onRetry={() => currentProject && fetchFlags(currentProject.key)}
        />
      )}

      {!loading && !error && flags.length === 0 && (
        <EmptyState
          title="No flags yet"
          description="Create your first feature flag to get started."
          action={
            <button
              onClick={() => setCreateOpen(true)}
              className="btn-primary flex items-center gap-2 active:scale-[0.98] transition-transform"
              aria-label="Create first flag"
            >
              <Plus className="h-4 w-4" /> Create Flag
            </button>
          }
        />
      )}

      {!loading && !error && flags.length > 0 && (
        <>
          <p className="text-xs text-slate-500 mb-3">Showing {flags.length} flag{flags.length !== 1 ? 's' : ''}</p>
          <motion.div
            className="space-y-2"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {flags.map((flag) => {
              const isOn = envStates[flag.key] ?? false;
              const isToggling = togglingFlags.has(flag.key);
              return (
                <motion.div
                  key={flag.id}
                  variants={staggerItem}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigate(`/flags/${flag.key}`)}
                  className="card px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-750 hover:border-slate-600 hover:-translate-y-[1px] hover:shadow-lg cursor-pointer transition-all duration-150 group"
                  role="button"
                  tabIndex={0}
                  aria-label={`Flag: ${flag.name}, ${isOn ? 'enabled' : 'disabled'}`}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/flags/${flag.key}`); }}
                >
                  <div className="min-w-0 flex-1 mb-2 sm:mb-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-white font-medium group-hover:text-indigo-400 transition-colors">{flag.name}</span>
                      <Badge variant={typeBadgeVariant[flag.type] || 'default'}>{flag.type}</Badge>
                      {flag.archived && <Badge variant="red">archived</Badge>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <code className="text-xs text-slate-500 font-mono">{flag.key}</code>
                      {flag.tags?.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                      <span className="text-xs text-slate-600">{new Date(flag.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                    <span className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
                      isOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {isOn ? 'ON' : 'OFF'}
                    </span>
                    {currentEnvironment && (
                      <span className="text-[10px] text-slate-500 hidden sm:inline">{currentEnvironment.name}</span>
                    )}
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={(e) => handleToggle(e, flag.key)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 min-w-[48px] min-h-[28px] ${
                        isOn ? 'bg-emerald-500' : 'bg-slate-600'
                      } ${isToggling ? 'opacity-50' : ''}`}
                      aria-label={`Toggle ${flag.name} ${isOn ? 'off' : 'on'}`}
                      aria-checked={isOn}
                      role="switch"
                    >
                      <motion.span
                        className="inline-block h-5 w-5 rounded-full bg-white shadow-sm"
                        animate={{ x: isOn ? 24 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      <CreateFlagModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
