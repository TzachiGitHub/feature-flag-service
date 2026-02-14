import React from 'react';
import { Variation, Rollout, ROLLOUT_COLORS, ROLLOUT_DOT_COLORS } from './types';
import { RotateCcw, HelpCircle } from 'lucide-react';

interface RolloutSliderProps {
  variations: Variation[];
  rollout: Rollout;
  onChange: (rollout: Rollout) => void;
}

const GRADIENT_COLORS = [
  ['#6366f1', '#818cf8'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
  ['#ef4444', '#f87171'],
  ['#06b6d4', '#22d3ee'],
  ['#a855f7', '#c084fc'],
];

export default function RolloutSlider({ variations, rollout, onChange }: RolloutSliderProps) {
  const handleWeightChange = (idx: number, newWeight: number) => {
    const clamped = Math.max(0, Math.min(100, newWeight));
    const newVars = rollout.variations.map((v, i) => (i === idx ? { ...v, weight: clamped } : { ...v }));
    const othersSum = newVars.reduce((s, v, i) => (i === newVars.length - 1 ? s : s + v.weight), 0);
    newVars[newVars.length - 1].weight = Math.max(0, 100 - othersSum);
    onChange({ ...rollout, variations: newVars });
  };

  const resetToEqual = () => {
    const count = rollout.variations.length;
    const even = Math.floor(100 / count);
    const remainder = 100 - even * (count - 1);
    onChange({
      ...rollout,
      variations: rollout.variations.map((v, i) => ({
        ...v,
        weight: i === count - 1 ? remainder : even,
      })),
    });
  };

  const total = rollout.variations.reduce((s, v) => s + v.weight, 0);
  const hasZero = rollout.variations.some((v) => v.weight === 0);

  return (
    <div className="space-y-3">
      {/* Gradient bar with percentage labels */}
      <div className="relative h-8 rounded-full overflow-hidden bg-slate-600 flex">
        {rollout.variations.map((rv, i) => {
          const colors = GRADIENT_COLORS[i % GRADIENT_COLORS.length];
          return rv.weight > 0 ? (
            <div
              key={rv.variationId}
              className="relative h-full flex items-center justify-center overflow-hidden"
              style={{
                width: `${rv.weight}%`,
                background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                transition: 'width 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {rv.weight >= 12 && (
                <span className="text-white text-xs font-bold drop-shadow-sm">
                  {rv.weight}%
                </span>
              )}
            </div>
          ) : null;
        })}
      </div>

      {/* Warnings */}
      {total !== 100 && (
        <p className="text-xs text-red-400">⚠️ Weights must sum to 100% (currently {total}%)</p>
      )}
      {hasZero && (
        <p className="text-xs text-amber-400">⚠️ One or more variations have 0% weight</p>
      )}

      {/* Rows */}
      {rollout.variations.map((rv, i) => {
        const v = variations.find((x) => x.id === rv.variationId);
        return (
          <div key={rv.variationId} className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${ROLLOUT_DOT_COLORS[i % ROLLOUT_DOT_COLORS.length]}`} />
            <span className="text-sm text-slate-300 w-32 truncate">{v?.name || rv.variationId}</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min={0}
                max={100}
                value={rv.weight}
                onChange={(e) => handleWeightChange(i, parseInt(e.target.value))}
                disabled={i === rollout.variations.length - 1}
                className="w-full accent-indigo-500 disabled:opacity-50"
              />
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={rv.weight}
              onChange={(e) => handleWeightChange(i, parseInt(e.target.value) || 0)}
              disabled={i === rollout.variations.length - 1}
              className="w-16 bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
            />
            <span className="text-sm text-slate-400">%</span>
          </div>
        );
      })}

      {/* Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Bucket by:</span>
          <div className="relative group inline-block">
            <select
              value={rollout.bucketBy || 'key'}
              onChange={(e) => onChange({ ...rollout, bucketBy: e.target.value })}
              className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {['key', 'name', 'email', 'country', 'plan'].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-600 text-[10px] text-slate-200 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Determines how users are assigned to variations
            </div>
          </div>
        </div>
        <button
          onClick={resetToEqual}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={12} /> Reset to equal
        </button>
      </div>
    </div>
  );
}
