import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { flagsApi } from '../api/client';
import { useProjectStore } from '../stores/projectStore';
import { useFlagStore } from '../stores/flagStore';
import { toast } from './Toast';
import Spinner from './Spinner';
import { modalOverlay, modalContent } from '../lib/animations';

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
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => nameRef.current?.focus(), 100);
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

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
        name, key, description, type: type.toUpperCase(),
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onClose}
          {...modalOverlay}
        >
          <motion.div
            className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-modal sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            {...modalContent}
            role="dialog"
            aria-modal="true"
            aria-label="Create Feature Flag"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Create Feature Flag</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close modal">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="create-name">Name</label>
                <input ref={nameRef} id="create-name" value={name} onChange={(e) => handleNameChange(e.target.value)} className="input-field" placeholder="My Feature Flag" required aria-label="Flag name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="create-key">Key</label>
                <input id="create-key" value={key} onChange={(e) => { setKey(e.target.value); setAutoKey(false); }} className="input-field font-mono text-sm" placeholder="my-feature-flag" required aria-label="Flag key" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="create-desc">Description</label>
                <textarea id="create-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={2} placeholder="Optional description" aria-label="Flag description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="create-type">Type</label>
                <select id="create-type" value={type} onChange={(e) => setType(e.target.value)} className="input-field" aria-label="Flag type">
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
                      <input value={v.name} onChange={(e) => { const n = [...variations]; n[i].name = e.target.value; setVariations(n); }} className="input-field flex-1" placeholder="Name" aria-label={`Variation ${i + 1} name`} />
                      <input value={v.value} onChange={(e) => { const n = [...variations]; n[i].value = e.target.value; setVariations(n); }} className="input-field flex-1 font-mono" placeholder="Value" aria-label={`Variation ${i + 1} value`} />
                      <button type="button" onClick={() => setVariations(variations.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-400 transition-colors" aria-label={`Remove variation ${i + 1}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setVariations([...variations, { value: '', name: '' }])} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors" aria-label="Add variation">
                    <Plus className="h-3 w-3" /> Add Variation
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="create-tags">Tags</label>
                <input id="create-tags" value={tags} onChange={(e) => setTags(e.target.value)} className="input-field" placeholder="tag1, tag2, tag3" aria-label="Flag tags" />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary active:scale-[0.98] transition-transform" aria-label="Cancel">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 active:scale-[0.98] transition-transform" aria-label="Create flag">
                  {loading && <Spinner size="sm" />} Create Flag
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
