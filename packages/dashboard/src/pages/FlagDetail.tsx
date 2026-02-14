import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Archive, Trash2, ArrowLeft, Clock, User } from 'lucide-react';
import clsx from 'clsx';
import { useFlagStore } from '../stores/flagStore';
import { useProjectStore } from '../stores/projectStore';
import { flagsApi, auditLogApi } from '../api/client';
import { TargetingEditor } from '../components/targeting';
import AuditDiff from '../components/AuditDiff';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';

const tabs = ['Targeting', 'Variations', 'Activity', 'Settings'] as const;

interface AuditEntry {
  id: string;
  action: string;
  userName: string;
  userId: string;
  flagKey?: string;
  before?: any;
  after?: any;
  comment?: string;
  createdAt: string;
}

function SettingsTab({ flag, projectKey, onSaved }: { flag: any; projectKey?: string; onSaved: () => void }) {
  const [name, setName] = useState(flag.name || '');
  const [description, setDescription] = useState(flag.description || '');
  const [tagsStr, setTagsStr] = useState((flag.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setName(flag.name || '');
    setDescription(flag.description || '');
    setTagsStr((flag.tags || []).join(', '));
  }, [flag]);

  const handleSave = async () => {
    if (!projectKey) return;
    setSaving(true);
    try {
      const tags = tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean);
      await flagsApi.update(projectKey, flag.key, { name, description, tags });
      toast('success', 'Settings saved');
      onSaved();
    } catch (err: any) {
      toast('error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectKey) return;
    try {
      await flagsApi.delete(projectKey, flag.key);
      toast('success', 'Flag deleted');
      navigate('/flags');
    } catch (err: any) {
      toast('error', err.message || 'Failed to delete flag');
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h3 className="text-white font-medium mb-4">Flag Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" rows={3} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Tags</label>
            <input value={tagsStr} onChange={e => setTagsStr(e.target.value)} className="input-field" />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
      <div className="border-t border-slate-700 pt-6">
        <h3 className="text-red-400 font-medium mb-2">Danger Zone</h3>
        <p className="text-sm text-slate-400 mb-3">Permanently delete this flag. This action cannot be undone.</p>
        <button onClick={() => setConfirmDelete(true)} className="btn-danger flex items-center gap-2">
          <Trash2 className="h-4 w-4" /> Delete Flag
        </button>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Flag"
        message={`Are you sure you want to delete "${flag.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export default function FlagDetail() {
  const { flagKey } = useParams<{ flagKey: string }>();
  const navigate = useNavigate();
  const { currentFlag, loading, fetchFlag } = useFlagStore();
  const { currentProject, currentEnvironment } = useProjectStore();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Targeting');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [envOn, setEnvOn] = useState<boolean | null>(null);

  // Activity state
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditOffset, setAuditOffset] = useState(0);
  const AUDIT_LIMIT = 20;

  useEffect(() => {
    if (currentProject && flagKey) fetchFlag(currentProject.key, flagKey);
  }, [currentProject?.key, flagKey]);

  // Fetch targeting on/off state for current environment
  const fetchEnvState = useCallback(async () => {
    if (!currentProject || !flagKey || !currentEnvironment) return;
    try {
      const res = await flagsApi.getTargeting(currentProject.key, flagKey, currentEnvironment.key);
      const data = res.data;
      setEnvOn(data.on ?? false);
    } catch {
      setEnvOn(null);
    }
  }, [currentProject?.key, flagKey, currentEnvironment?.key]);

  useEffect(() => {
    fetchEnvState();
  }, [fetchEnvState]);

  // Fetch audit log
  const fetchAuditLog = useCallback(async (offset = 0, append = false) => {
    if (!currentProject || !flagKey) return;
    setAuditLoading(true);
    try {
      const res = await auditLogApi.list(currentProject.key, { flagKey, limit: AUDIT_LIMIT, offset });
      const data = res.data;
      setAuditEntries(prev => append ? [...prev, ...data.entries] : data.entries);
      setAuditTotal(data.total);
      setAuditOffset(offset + data.entries.length);
    } catch {
      // ignore
    } finally {
      setAuditLoading(false);
    }
  }, [currentProject?.key, flagKey]);

  useEffect(() => {
    if (activeTab === 'Activity') {
      setAuditEntries([]);
      setAuditOffset(0);
      fetchAuditLog(0, false);
    }
  }, [activeTab, fetchAuditLog]);

  const handleCopyKey = () => {
    if (currentFlag) {
      navigator.clipboard.writeText(currentFlag.key);
      toast('success', 'Key copied');
    }
  };

  const handleToggle = async () => {
    if (!currentProject || !currentFlag || !currentEnvironment || envOn === null) return;
    const newOn = !envOn;
    setToggling(true);
    setEnvOn(newOn); // optimistic update
    try {
      await flagsApi.toggle(currentProject.key, currentFlag.key, currentEnvironment.key, newOn);
      toast('success', `Flag ${newOn ? 'enabled' : 'disabled'} in ${currentEnvironment.name}`);
    } catch {
      setEnvOn(!newOn); // revert
      toast('error', 'Failed to toggle flag');
    } finally {
      setToggling(false);
    }
  };

  const handleArchive = async () => {
    if (!currentProject || !currentFlag) return;
    try {
      const willArchive = !currentFlag.archived;
      await flagsApi.update(currentProject.key, currentFlag.key, { archived: willArchive });
      toast('success', willArchive ? 'Flag archived' : 'Flag unarchived');
      await fetchFlag(currentProject.key, currentFlag.key);
    } catch (err: any) {
      toast('error', err.message || 'Failed to archive flag');
    }
  };

  const handleDelete = async () => {
    if (!currentProject || !currentFlag) return;
    try {
      await flagsApi.delete(currentProject.key, currentFlag.key);
      toast('success', 'Flag deleted');
      navigate('/flags');
    } catch (err: any) {
      toast('error', err.message || 'Failed to delete flag');
    }
  };

  if (loading || !currentFlag) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const isOn = envOn === true;

  return (
    <div>
      {/* Archived banner */}
      {currentFlag.archived && (
        <div className="bg-amber-900/30 border border-amber-700/50 text-amber-300 rounded-lg px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <Archive className="h-4 w-4" />
          This flag is archived. It will not be evaluated by SDKs.
        </div>
      )}

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
            {/* Enhanced toggle with ON/OFF label */}
            <div className="flex items-center gap-2">
              {currentEnvironment && (
                <span className="text-xs text-slate-500">{currentEnvironment.name}</span>
              )}
              <button
                type="button"
                disabled={toggling || envOn === null}
                onClick={handleToggle}
                className={clsx(
                  'relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900',
                  isOn ? 'bg-emerald-500' : 'bg-slate-600',
                  (toggling || envOn === null) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span
                  className={clsx(
                    'inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm',
                    isOn ? 'translate-x-9' : 'translate-x-1'
                  )}
                />
                <span className={clsx(
                  'absolute text-[10px] font-bold',
                  isOn ? 'left-2 text-white' : 'right-2 text-slate-400'
                )}>
                  {isOn ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
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
      {activeTab === 'Targeting' && currentProject && currentEnvironment && (
        <TargetingEditor
          projectKey={currentProject.key}
          flagKey={currentFlag.key}
          envKey={currentEnvironment.key}
          variations={currentFlag.variations.map(v => ({ id: v.id, value: v.value, name: v.name || `Variation` }))}
        />
      )}

      {activeTab === 'Targeting' && (!currentProject || !currentEnvironment) && (
        <div className="card p-6">
          <p className="text-slate-400">Select a project and environment to configure targeting.</p>
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
        <div className="space-y-4">
          {auditLoading && auditEntries.length === 0 && (
            <div className="flex justify-center py-8"><Spinner size="md" /></div>
          )}
          {!auditLoading && auditEntries.length === 0 && (
            <div className="card p-6 text-center">
              <p className="text-slate-400">No activity recorded for this flag yet.</p>
            </div>
          )}
          {auditEntries.length > 0 && (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-700" />
              <div className="space-y-4">
                {auditEntries.map((entry) => (
                  <div key={entry.id} className="relative pl-12">
                    {/* Timeline dot */}
                    <div className="absolute left-[14px] top-4 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-800 z-10" />
                    <div className="card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-sm">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-white font-medium">{entry.userName}</span>
                          </div>
                          <Badge variant={
                            entry.action.includes('toggle') ? 'amber' :
                            entry.action.includes('create') ? 'emerald' :
                            entry.action.includes('delete') || entry.action.includes('archive') ? 'red' :
                            'indigo'
                          }>
                            {entry.action}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {entry.comment && (
                        <p className="text-sm text-slate-300 mb-2">{entry.comment}</p>
                      )}
                      {(entry.before || entry.after) && (
                        <AuditDiff before={entry.before} after={entry.after} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {auditEntries.length < auditTotal && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchAuditLog(auditOffset, true)}
                disabled={auditLoading}
                className="btn-secondary text-sm"
              >
                {auditLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Settings' && (
        <SettingsTab flag={currentFlag} projectKey={currentProject?.key} onSaved={() => currentProject && flagKey && fetchFlag(currentProject.key, flagKey)} />
      )}

    </div>
  );
}
