import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Star } from 'lucide-react';
import clsx from 'clsx';
import { flagsApi } from '../api/client';
import { toast } from './Toast';
import type { Flag, Variation } from '../types';

const VARIATION_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#84cc16'];

interface VariationEditorProps {
  flag: Flag;
  projectKey?: string;
  onSaved: () => void;
}

function JsonEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (v: string) => {
    onChange(v);
    try {
      if (v.trim()) JSON.parse(v);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch { /* ignore */ }
  };

  // Simple syntax highlighting
  const highlighted = highlightJson(value);

  return (
    <div className="relative">
      <div className="relative">
        <pre
          className="absolute inset-0 p-3 font-mono text-sm overflow-auto pointer-events-none whitespace-pre-wrap break-words"
          aria-hidden
          dangerouslySetInnerHTML={{ __html: highlighted }}
          style={{ color: 'transparent' }}
        />
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={clsx(
            'w-full bg-slate-900 border rounded-lg p-3 font-mono text-sm text-slate-200 outline-none resize-y min-h-[100px]',
            'focus:ring-2 focus:ring-indigo-500',
            error ? 'border-red-500' : 'border-slate-700'
          )}
          rows={4}
          spellCheck={false}
          style={{ caretColor: 'white' }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        {error ? (
          <span className="text-xs text-red-400">{error}</span>
        ) : (
          <span className="text-xs text-emerald-400">Valid JSON</span>
        )}
        <button onClick={handleFormat} className="text-xs text-indigo-400 hover:text-indigo-300">
          Format
        </button>
      </div>
    </div>
  );
}

function highlightJson(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"\\]*(\\.[^"\\]*)*)"\s*:/g, '<span style="color:#93c5fd">"$1"</span>:')
    .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span style="color:#86efac">"$1"</span>')
    .replace(/\b(true|false)\b/g, '<span style="color:#fbbf24">$1</span>')
    .replace(/\b(null)\b/g, '<span style="color:#f87171">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#c4b5fd">$1</span>');
}

export default function VariationEditor({ flag, projectKey, onSaved }: VariationEditorProps) {
  const [variations, setVariations] = useState<Array<{ id: string; name: string; value: any; description?: string }>>([]);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const isBoolean = flag.type.toLowerCase() === 'boolean';

  useEffect(() => {
    setVariations(flag.variations.map((v) => ({ ...v })));
  }, [flag]);

  const hasChanges = JSON.stringify(variations) !== JSON.stringify(flag.variations);

  const updateVariation = (idx: number, updates: Partial<Variation>) => {
    setVariations((prev) => prev.map((v, i) => i === idx ? { ...v, ...updates } : v));
  };

  const addVariation = () => {
    const id = Math.random().toString(36).slice(2, 10);
    const typeLower = flag.type.toLowerCase();
    const defaultValue = typeLower === 'string' ? '' : typeLower === 'number' ? 0 : typeLower === 'json' ? '{}' : '';
    setVariations([...variations, { id, name: `Variation ${variations.length + 1}`, value: defaultValue }]);
  };

  const removeVariation = (idx: number) => {
    if (variations.length <= 2) {
      toast('error', 'Must have at least 2 variations');
      return;
    }
    setVariations(variations.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!projectKey) return;
    setSaving(true);
    try {
      await flagsApi.update(projectKey, flag.key, { variations });
      toast('success', 'Variations saved');
      onSaved();
    } catch (err: any) {
      toast('error', err.message || 'Failed to save variations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Variations</h3>
        {!isBoolean && (
          <button onClick={addVariation} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <Plus size={14} /> Add Variation
          </button>
        )}
      </div>

      <div className="space-y-3">
        {variations.map((v, i) => {
          const color = VARIATION_COLORS[i % VARIATION_COLORS.length];
          const isJson = flag.type.toLowerCase() === 'json';
          const isEditing = editing[v.id];

          return (
            <div
              key={v.id || i}
              className="card p-4 border-l-4 transition-all hover:shadow-lg"
              style={{ borderLeftColor: color }}
            >
              <div className="flex items-start gap-3">
                {/* Drag handle (visual) */}
                {!isBoolean && (
                  <div className="pt-1 cursor-grab text-slate-600 hover:text-slate-400">
                    <GripVertical size={16} />
                  </div>
                )}

                {/* Color dot */}
                <div className="pt-1.5">
                  <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name */}
                  <div className="flex items-center gap-2 mb-2">
                    {isEditing ? (
                      <input
                        value={v.name}
                        onChange={(e) => updateVariation(i, { name: e.target.value })}
                        onBlur={() => setEditing({ ...editing, [v.id]: false })}
                        className="input-field text-sm py-1"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditing({ ...editing, [v.id]: true })}
                        className="text-white font-medium text-sm hover:text-indigo-400 transition-colors"
                        title="Click to edit name"
                      >
                        {v.name || `Variation ${i + 1}`}
                      </button>
                    )}
                    {i === 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">
                        <Star size={10} /> Default
                      </span>
                    )}
                    {/* Variation chip */}
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: color + '20', color }}
                    >
                      v{i + 1}
                    </span>
                  </div>

                  {/* Value */}
                  {isJson ? (
                    <JsonEditor
                      value={typeof v.value === 'string' ? v.value : JSON.stringify(v.value, null, 2)}
                      onChange={(val) => updateVariation(i, { value: val })}
                    />
                  ) : isBoolean ? (
                    <code className="text-sm text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded">
                      {JSON.stringify(v.value)}
                    </code>
                  ) : (
                    <input
                      value={typeof v.value === 'string' ? v.value : JSON.stringify(v.value)}
                      onChange={(e) => updateVariation(i, {
                        value: flag.type.toLowerCase() === 'number' ? Number(e.target.value) : e.target.value,
                      })}
                      className="input-field font-mono text-sm"
                      type={flag.type.toLowerCase() === 'number' ? 'number' : 'text'}
                      placeholder="Value"
                    />
                  )}
                </div>

                {/* Delete */}
                {!isBoolean && (
                  <button
                    onClick={() => removeVariation(i)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    title="Remove variation"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      {hasChanges && (
        <div
          className="sticky bottom-4 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-3 flex items-center justify-between"
          style={{ animation: 'slideUp 200ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <span className="text-sm text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </span>
          <div className="flex gap-2">
            <button onClick={() => setVariations(flag.variations.map((v) => ({ ...v })))} className="btn-secondary text-sm">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving...' : 'Save Variations'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
