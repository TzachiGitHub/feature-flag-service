import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Archive, Trash2, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { useFlagStore } from '../stores/flagStore';
import { useProjectStore } from '../stores/projectStore';
import { flagsApi } from '../api/client';
import Toggle from '../components/Toggle';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';

const tabs = ['Targeting', 'Variations', 'Activity', 'Settings'] as const;

export default function FlagDetail() {
  const { flagKey } = useParams<{ flagKey: string }>();
  const navigate = useNavigate();
  const { currentFlag, loading, fetchFlag } = useFlagStore();
  const { currentProject, currentEnvironment } = useProjectStore();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Targeting');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (currentProject && flagKey) fetchFlag(currentProject.key, flagKey);
  }, [currentProject?.key, flagKey]);

  const handleCopyKey = () => {
    if (currentFlag) {
      navigator.clipboard.writeText(currentFlag.key);
      toast('success', 'Key copied');
    }
  };

  const handleToggle = async () => {
    if (currentProject && currentFlag && currentEnvironment) {
      await flagsApi.toggle(currentProject.key, currentFlag.key, currentEnvironment.key);
      fetchFlag(currentProject.key, currentFlag.key);
    }
  };

  const handleArchive = async () => {
    if (!currentProject || !currentFlag) return;
    await flagsApi.update(currentProject.key, currentFlag.key, { archived: !currentFlag.archived });
    toast('success', currentFlag.archived ? 'Flag unarchived' : 'Flag archived');
    fetchFlag(currentProject.key, currentFlag.key);
  };

  const handleDelete = async () => {
    if (!currentProject || !currentFlag) return;
    await flagsApi.delete(currentProject.key, currentFlag.key);
    toast('success', 'Flag deleted');
    navigate('/flags');
  };

  if (loading || !currentFlag) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/flags')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to flags
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{currentFlag.name}</h1>
              <Badge variant="indigo">{currentFlag.type}</Badge>
              {currentFlag.archived && <Badge variant="red">archived</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm text-slate-500 font-mono">{currentFlag.key}</code>
              <button onClick={handleCopyKey} className="text-slate-500 hover:text-slate-300"><Copy className="h-3 w-3" /></button>
            </div>
            {currentFlag.description && <p className="text-slate-400 mt-2">{currentFlag.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Toggle enabled={false} onChange={handleToggle} />
            <button onClick={handleArchive} className="btn-secondary flex items-center gap-1 text-sm">
              <Archive className="h-4 w-4" /> {currentFlag.archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'pb-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'Targeting' && (
        <div className="card p-6">
          <p className="text-slate-400">Targeting rules will appear here.</p>
        </div>
      )}

      {activeTab === 'Variations' && (
        <div className="space-y-3">
          {currentFlag.variations?.map((v, i) => (
            <div key={v.id || i} className="card px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-white font-medium">{v.name || `Variation ${i + 1}`}</span>
                {v.description && <p className="text-sm text-slate-400 mt-0.5">{v.description}</p>}
              </div>
              <code className="text-sm text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded">{JSON.stringify(v.value)}</code>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Activity' && (
        <div className="card p-6">
          <p className="text-slate-400">Activity log will appear here.</p>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="text-white font-medium mb-4">Flag Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Name</label>
                <input defaultValue={currentFlag.name} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Description</label>
                <textarea defaultValue={currentFlag.description} className="input-field" rows={3} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Tags</label>
                <input defaultValue={currentFlag.tags?.join(', ')} className="input-field" />
              </div>
              <button className="btn-primary">Save Changes</button>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-red-400 font-medium mb-2">Danger Zone</h3>
            <p className="text-sm text-slate-400 mb-3">Permanently delete this flag. This action cannot be undone.</p>
            <button onClick={() => setConfirmDelete(true)} className="btn-danger flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Delete Flag
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Flag"
        message={`Are you sure you want to delete "${currentFlag.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
