import React from 'react';
import { Variation, Rollout } from './types';
import RolloutSlider from './RolloutSlider';

interface VariationPickerProps {
  variations: Variation[];
  selectedId?: string;
  onChange: (variationId: string) => void;
  allowRollout?: boolean;
  rollout?: Rollout;
  onRolloutChange?: (rollout: Rollout) => void;
}

export default function VariationPicker({
  variations,
  selectedId,
  onChange,
  allowRollout = false,
  rollout,
  onRolloutChange,
}: VariationPickerProps) {
  const isRollout = allowRollout && rollout && rollout.variations.length > 0;

  const toggleRollout = () => {
    if (!onRolloutChange) return;
    if (isRollout) {
      onRolloutChange({ variations: [] });
      if (variations.length > 0) onChange(variations[0].id);
    } else {
      const even = Math.floor(100 / variations.length);
      const remainder = 100 - even * (variations.length - 1);
      onRolloutChange({
        variations: variations.map((v, i) => ({
          variationId: v.id,
          weight: i === variations.length - 1 ? remainder : even,
        })),
      });
    }
  };

  return (
    <div className="space-y-2">
      {allowRollout && onRolloutChange && (
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={toggleRollout}
            className={`text-xs px-3 py-1 rounded-full border ${
              !isRollout
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-700 border-slate-600 text-slate-300'
            }`}
          >
            Specific variation
          </button>
          <button
            onClick={toggleRollout}
            className={`text-xs px-3 py-1 rounded-full border ${
              isRollout
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-700 border-slate-600 text-slate-300'
            }`}
          >
            Percentage rollout
          </button>
        </div>
      )}

      {isRollout ? (
        <RolloutSlider variations={variations} rollout={rollout!} onChange={onRolloutChange!} />
      ) : (
        <select
          value={selectedId || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="" disabled>Select variation...</option>
          {variations.map((v) => (
            <option key={v.id} value={v.id}>{v.name} ({JSON.stringify(v.value)})</option>
          ))}
        </select>
      )}
    </div>
  );
}
