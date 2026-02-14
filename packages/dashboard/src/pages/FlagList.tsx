import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useFlagStore } from '../stores/flagStore';
import { useProjectStore } from '../stores/projectStore';
import Toggle from '../components/Toggle';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import CreateFlagModal from '../components/CreateFlagModal';

const typeBadgeVariant: Record<string, 'indigo' | 'emerald' | 'amber' | 'blue'> = {
  boolean: 'indigo',
  string: 'emerald',
  number: 'amber',
  json: 'blue',
};

export default function FlagList() {
  const [createOpen, setCreateOpen] = useState(false);
  const { flags, loading, filters, fetchFlags, toggleFlag, setFilter } = useFlagStore();
  const { currentProject, currentEnvironment } = useProjectStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentProject) fetchFlags(currentProject.key);
  }, [currentProject?.key, filters.search, filters.type, filters.tag, filters.archived]);

  const handleToggle = async (e: React.MouseEvent, flagKey: string) => {
    e.stopPropagation();
    if (currentProject && currentEnvironment) {
      await toggleFlag(currentProject.key, flagKey, currentEnvironment.key);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Flag
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="input-field pl-9"
            placeholder="Search flags..."
          />
        </div>
        <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} className="input-field w-auto">
          <option value="">All Types</option>
          <option value="boolean">Boolean</option>
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="json">JSON</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input type="checkbox" checked={filters.archived} onChange={(e) => setFilter('archived', e.target.checked)} className="rounded bg-slate-700 border-slate-600" />
          Show Archived
        </label>
      </div>

      {loading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {!loading && flags.length === 0 && (
        <EmptyState
          title="No flags yet"
          description="Create your first feature flag to get started."
          action={<button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Create Flag</button>}
        />
      )}

      {!loading && flags.length > 0 && (
        <div className="space-y-2">
          {flags.map((flag) => (
            <div
              key={flag.id}
              onClick={() => navigate(`/flags/${flag.key}`)}
              className="card px-5 py-4 flex items-center justify-between hover:bg-slate-750 hover:border-slate-600 cursor-pointer transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-medium group-hover:text-indigo-400 transition-colors">{flag.name}</span>
                  <Badge variant={typeBadgeVariant[flag.type] || 'default'}>{flag.type}</Badge>
                  {flag.archived && <Badge variant="red">archived</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <code className="text-xs text-slate-500 font-mono">{flag.key}</code>
                  {flag.tags?.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                  <span className="text-xs text-slate-600">{new Date(flag.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div onClick={(e) => handleToggle(e, flag.key)}>
                <Toggle enabled={false} onChange={() => {}} />
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateFlagModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
