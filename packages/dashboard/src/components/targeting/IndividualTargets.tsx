import React, { useState } from 'react';
import { IndividualTarget, Variation } from './types';
import ChipInput from './ChipInput';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface IndividualTargetsProps {
  targets: IndividualTarget[];
  variations: Variation[];
  onChange: (targets: IndividualTarget[]) => void;
}

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

function UserAvatar({ name, index }: { name: string; index: number }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function IndividualTargets({ targets, variations, onChange }: IndividualTargetsProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const COLLAPSE_THRESHOLD = 5;

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

      {targets.length > 0 && (
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search targets..."
            className="w-full bg-slate-700 text-white border border-slate-600 rounded-md pl-8 pr-3 py-1.5 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      )}

      {targets.map((target, idx) => {
        const variation = variations.find((v) => v.id === target.variationId);
        const isExpanded = expanded[idx] !== false; // default expanded
        const filteredValues = searchFilter
          ? target.values.filter((v) => v.toLowerCase().includes(searchFilter.toLowerCase()))
          : target.values;
        const showCollapse = target.values.length > COLLAPSE_THRESHOLD;
        const displayValues = showCollapse && !expanded[idx] ? filteredValues.slice(0, COLLAPSE_THRESHOLD) : filteredValues;
        const remaining = filteredValues.length - COLLAPSE_THRESHOLD;

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
                <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                  {target.values.length} user{target.values.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button onClick={() => removeTarget(idx)} className="text-slate-400 hover:text-red-400 text-sm">
                Remove
              </button>
            </div>

            {/* Show target values with avatars */}
            {displayValues.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {displayValues.map((val, vi) => (
                  <span key={vi} className="inline-flex items-center gap-1 bg-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded-full">
                    <UserAvatar name={val} index={vi} />
                    {val}
                  </span>
                ))}
                {showCollapse && !expanded[idx] && remaining > 0 && (
                  <button
                    onClick={() => setExpanded({ ...expanded, [idx]: true })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                  >
                    +{remaining} more <ChevronDown size={12} />
                  </button>
                )}
                {showCollapse && expanded[idx] && (
                  <button
                    onClick={() => setExpanded({ ...expanded, [idx]: false })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                  >
                    Show less <ChevronUp size={12} />
                  </button>
                )}
              </div>
            )}

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
