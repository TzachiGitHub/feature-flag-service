import React from 'react';
import { IndividualTarget, Variation } from './types';
import ChipInput from './ChipInput';

interface IndividualTargetsProps {
  targets: IndividualTarget[];
  variations: Variation[];
  onChange: (targets: IndividualTarget[]) => void;
}

export default function IndividualTargets({ targets, variations, onChange }: IndividualTargetsProps) {
  const addTarget = () => {
    const usedIds = targets.map((t) => t.variationId);
    const next = variations.find((v) => !usedIds.includes(v.id));
    if (next) {
      onChange([...targets, { contextKind: 'user', variationId: next.id, values: [] }]);
    }
  };

  const updateTarget = (idx: number, updates: Partial<IndividualTarget>) => {
    onChange(targets.map((t, i) => (i === idx ? { ...t, ...updates } : t)));
  };

  const removeTarget = (idx: number) => {
    onChange(targets.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Individual Targets</h3>
        <button
          onClick={addTarget}
          disabled={targets.length >= variations.length}
          className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Target
        </button>
      </div>

      {targets.length === 0 && (
        <p className="text-xs text-slate-500 italic">No individual targets configured.</p>
      )}

      {targets.map((target, idx) => {
        const variation = variations.find((v) => v.id === target.variationId);
        return (
          <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={target.variationId}
                  onChange={(e) => updateTarget(idx, { variationId: e.target.value })}
                  className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {variations.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <span className="text-slate-500">→</span>
              </div>
              <button onClick={() => removeTarget(idx)} className="text-slate-400 hover:text-red-400 text-sm">
                Remove
              </button>
            </div>
            <ChipInput
              values={target.values}
              onChange={(values) => updateTarget(idx, { values })}
              placeholder="Add context keys..."
            />
          </div>
        );
      })}
    </div>
  );
}
