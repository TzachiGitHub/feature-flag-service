import { useState } from 'react';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, Check, ToggleLeft, Type, Hash, Braces } from 'lucide-react';
import clsx from 'clsx';
import { flagsApi } from '../api/client';
import { useProjectStore } from '../stores/projectStore';
import { useFlagStore } from '../stores/flagStore';
import { toast } from './Toast';
import Spinner from './Spinner';

function toKebab(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'variations', label: 'Variations' },
  { id: 'review', label: 'Review' },
] as const;

const FLAG_TYPES = [
  { value: 'boolean', label: 'Boolean', icon: ToggleLeft, desc: 'True or false flag' },
  { value: 'string', label: 'String', icon: Type, desc: 'Text-based variations' },
  { value: 'number', label: 'Number', icon: Hash, desc: 'Numeric variations' },
  { value: 'json', label: 'JSON', icon: Braces, desc: 'Structured JSON variations' },
];

export default function CreateFlagModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
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

  const reset = () => {
    setStep(0); setName(''); setKey(''); setDescription(''); setType('boolean');
    setTags(''); setVariations([]); setAutoKey(true); setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const flagVariations = type === 'boolean'
        ? [{ value: true, name: 'True' }, { value: false, name: 'False' }]
        : variations.map((v) => ({
            value: type === 'number' ? Number(v.value) : type === 'json' ? JSON.parse(v.value || '{}') : v.value,
            name: v.name,
          }));
      await flagsApi.create(currentProject.key, {
        name, key, description, type: type.toUpperCase(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        variations: flagVariations,
      });
      toast('success', 'Flag created');
      await fetchFlags(currentProject.key);
      handleClose();
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Failed to create flag');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0 && key.trim().length > 0;
    if (step === 1) {
      if (type === 'boolean') return true;
      return variations.length >= 2 && variations.every((v) => v.name.trim() && v.value.trim());
    }
    return true;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="card p-0 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'modalIn 200ms ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Create Feature Flag</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    i < step ? 'bg-emerald-500 text-white' :
                    i === step ? 'bg-indigo-600 text-white' :
                    'bg-slate-700 text-slate-400'
                  )}>
                    {i < step ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={clsx(
                    'text-xs font-medium',
                    i <= step ? 'text-white' : 'text-slate-500'
                  )}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={clsx(
                    'h-px flex-1 mx-2',
                    i < step ? 'bg-emerald-500' : 'bg-slate-700'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Basics */}
          {step === 0 && (
            <div className="space-y-4" style={{ animation: 'fadeSlideIn 200ms ease-out' }}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="input-field"
                  placeholder="My Feature Flag"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Key</label>
                <input
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setAutoKey(false); }}
                  className="input-field font-mono text-sm"
                  placeholder="my-feature-flag"
                />
                <p className="text-xs text-slate-500 mt-1">Used in your code to reference this flag</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {FLAG_TYPES.map((ft) => {
                    const Icon = ft.icon;
                    return (
                      <button
                        key={ft.value}
                        type="button"
                        onClick={() => { setType(ft.value); if (ft.value === 'boolean') setVariations([]); }}
                        className={clsx(
                          'flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                          type === ft.value
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                        )}
                      >
                        <Icon size={20} className={type === ft.value ? 'text-indigo-400' : 'text-slate-400'} />
                        <div>
                          <div className={clsx('text-sm font-medium', type === ft.value ? 'text-white' : 'text-slate-300')}>
                            {ft.label}
                          </div>
                          <div className="text-xs text-slate-500">{ft.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input-field"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>
          )}

          {/* Step 2: Variations */}
          {step === 1 && (
            <div className="space-y-4" style={{ animation: 'fadeSlideIn 200ms ease-out' }}>
              {type === 'boolean' ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">Boolean flags have two default variations:</p>
                  <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-white font-medium">True</span>
                    <code className="text-sm text-slate-400 ml-auto font-mono">true</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="text-white font-medium">False</span>
                    <code className="text-sm text-slate-400 ml-auto font-mono">false</code>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400 mb-2">
                    Define at least 2 variations for your {type} flag.
                  </p>
                  {variations.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      <span
                        className="w-3 h-3 rounded-full mt-2 shrink-0"
                        style={{ backgroundColor: VARIATION_COLORS[i % VARIATION_COLORS.length] }}
                      />
                      <div className="flex-1 space-y-2">
                        <input
                          value={v.name}
                          onChange={(e) => { const n = [...variations]; n[i].name = e.target.value; setVariations(n); }}
                          className="input-field text-sm"
                          placeholder="Variation name"
                        />
                        {type === 'json' ? (
                          <textarea
                            value={v.value}
                            onChange={(e) => { const n = [...variations]; n[i].value = e.target.value; setVariations(n); }}
                            className="input-field font-mono text-sm"
                            rows={3}
                            placeholder='{ "key": "value" }'
                          />
                        ) : (
                          <input
                            value={v.value}
                            onChange={(e) => { const n = [...variations]; n[i].value = e.target.value; setVariations(n); }}
                            className="input-field font-mono text-sm"
                            placeholder="Value"
                            type={type === 'number' ? 'number' : 'text'}
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setVariations(variations.filter((_, j) => j !== i))}
                        className="text-slate-400 hover:text-red-400 mt-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setVariations([...variations, { value: '', name: '' }])}
                    className="w-full border border-dashed border-slate-600 rounded-lg p-3 text-sm text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={14} /> Add Variation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 2 && (
            <div className="space-y-4" style={{ animation: 'fadeSlideIn 200ms ease-out' }}>
              <h3 className="text-white font-medium">Review your flag</h3>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Name</span>
                  <span className="text-sm text-white font-medium">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Key</span>
                  <code className="text-sm text-indigo-400 font-mono">{key}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Type</span>
                  <span className="text-sm text-white">{type}</span>
                </div>
                {description && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Description</span>
                    <span className="text-sm text-slate-300 text-right max-w-[200px]">{description}</span>
                  </div>
                )}
                {tags && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Tags</span>
                    <div className="flex gap-1">
                      {tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                        <span key={t} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm text-slate-400 mb-2">Variations</h4>
                <div className="space-y-2">
                  {type === 'boolean' ? (
                    <>
                      <div className="flex items-center gap-2 p-2 bg-slate-800 border border-slate-700 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-sm text-white">True</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-slate-800 border border-slate-700 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="text-sm text-white">False</span>
                      </div>
                    </>
                  ) : (
                    variations.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-800 border border-slate-700 rounded-lg">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: VARIATION_COLORS[i % VARIATION_COLORS.length] }}
                        />
                        <span className="text-sm text-white">{v.name}</span>
                        <code className="text-xs text-slate-400 font-mono ml-auto">{v.value}</code>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
          <button
            onClick={step === 0 ? handleClose : () => setStep(step - 1)}
            className="btn-secondary flex items-center gap-1"
          >
            {step === 0 ? 'Cancel' : <><ChevronLeft size={16} /> Back</>}
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="btn-primary flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading && <Spinner size="sm" />} Create Flag
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

const VARIATION_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];
