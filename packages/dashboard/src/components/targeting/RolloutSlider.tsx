import React from 'react';
import { Variation, Rollout, ROLLOUT_COLORS, ROLLOUT_DOT_COLORS } from './types';

interface RolloutSliderProps {
  variations: Variation[];
  rollout: Rollout;
  onChange: (rollout: Rollout) => void;
}

export default function RolloutSlider({ variations, rollout, onChange }: RolloutSliderProps) {
  const handleWeightChange = (idx: number, newWeight: number) => {
    const clamped = Math.max(0, Math.min(100, newWeight));
    const newVars = rollout.variations.map((v, i) => (i === idx ? { ...v, weight: clamped } : { ...v }));

    // Auto-adjust last variation to make sum = 100
    const othersSum = newVars.reduce((s, v, i) => (i === newVars.length - 1 ? s : s + v.weight), 0);
    newVars[newVars.length - 1].weight = Math.max(0, 100 - othersSum);

    onChange({ ...rollout, variations: newVars });
  };

  return (
    <div className="space-y-3">
      {/* Visual bar */}
      <div className="flex h-6 rounded-full overflow-hidden bg-slate-600">
        {rollout.variations.map((rv, i) => (
          rv.weight > 0 && (
            <div
              key={rv.variationId}
              className={`${ROLLOUT_COLORS[i % ROLLOUT_COLORS.length]} transition-all`}
              style={{ width: `${rv.weight}%` }}
            />
          )
        ))}
      </div>

      {/* Rows */}
      {rollout.variations.map((rv, i) => {
        const v = variations.find((x) => x.id === rv.variationId);
        return (
          <div key={rv.variationId} className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${ROLLOUT_DOT_COLORS[i % ROLLOUT_DOT_COLORS.length]}`} />
            <span className="text-sm text-slate-300 w-32 truncate">{v?.name || rv.variationId}</span>
            <input
              type="number"
              min={0}
              max={100}
              value={rv.weight}
              onChange={(e) => handleWeightChange(i, parseInt(e.target.value) || 0)}
              disabled={i === rollout.variations.length - 1}
              className="w-20 bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
            />
            <span className="text-sm text-slate-400">%</span>
          </div>
        );
      })}

      {/* Bucket by */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-slate-400">Bucket by:</span>
        <select
          value={rollout.bucketBy || 'key'}
          onChange={(e) => onChange({ ...rollout, bucketBy: e.target.value })}
          className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {['key', 'name', 'email', 'country', 'plan'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
