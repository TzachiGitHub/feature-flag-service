import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { flagsApi } from '../api/client';
import { useProjectStore } from '../stores/projectStore';
import { useFlagStore } from '../stores/flagStore';
import { toast } from './Toast';
import Spinner from './Spinner';

function toKebab(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface Props { open: boolean; onClose: () => void; }

export default function CreateFlagModal({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('boolean');
  const [tags, setTags] = useState('');
  const [variations, setVariations] = useState<{ value: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoKey, setAutoKey] = useState(true);
  const currentProject = useProjectStore((s) => s.currentProject);
  const fetchFlags = useFlagStore((s) => s.fetchFlags);

  const handleNameChange = (v: string) => {
    setName(v);
    if (autoKey) setKey(toKebab(v));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    setLoading(true);
    try {
      const flagVariations = type === 'boolean'
        ? [{ value: true, name: 'True' }, { value: false, name: 'False' }]
        : variations.map((v) => ({ value: type === 'number' ? Number(v.value) : v.value, name: v.name }));
      await flagsApi.create(currentProject.key, {
        name, key, description, type,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        variations: flagVariations,
      });
      toast('success', 'Flag created');
      await fetchFlags(currentProject.key);
      onClose();
      setName(''); setKey(''); setDescription(''); setType('boolean'); setTags(''); setVariations([]); setAutoKey(true);
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Failed to create flag');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Create Feature Flag</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} className="input-field" placeholder="My Feature Flag" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Key</label>
            <input value={key} onChange={(e) => { setKey(e.target.value); setAutoKey(false); }} className="input-field font-mono text-sm" placeholder="my-feature-flag" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={2} placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
              <option value="boolean">Boolean</option>
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="json">JSON</option>
            </select>
          </div>

          {type !== 'boolean' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Variations</label>
              {variations.map((v, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={v.name} onChange={(e) => { const n = [...variations]; n[i].name = e.target.value; setVariations(n); }} className="input-field flex-1" placeholder="Name" />
                  <input value={v.value} onChange={(e) => { const n = [...variations]; n[i].value = e.target.value; setVariations(n); }} className="input-field flex-1 font-mono" placeholder="Value" />
                  <button type="button" onClick={() => setVariations(variations.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setVariations([...variations, { value: '', name: '' }])} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add Variation
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="input-field" placeholder="tag1, tag2, tag3" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Spinner size="sm" />} Create Flag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
