import React from 'react';

interface SegmentPickerProps {
  segmentKeys: string[];
  availableSegments: Array<{ key: string; name: string }>;
  onChange: (segmentKeys: string[]) => void;
}

export default function SegmentPicker({ segmentKeys, availableSegments, onChange }: SegmentPickerProps) {
  const addSegment = (key: string) => {
    if (!segmentKeys.includes(key)) {
      onChange([...segmentKeys, key]);
    }
  };

  const removeSegment = (key: string) => {
    onChange(segmentKeys.filter((k) => k !== key));
  };

  const available = availableSegments.filter((s) => !segmentKeys.includes(s.key));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {segmentKeys.map((key) => {
          const seg = availableSegments.find((s) => s.key === key);
          return (
            <span key={key} className="inline-flex items-center gap-1 bg-indigo-600/30 text-indigo-300 text-sm px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              {seg?.name || key}
              <button onClick={() => removeSegment(key)} className="text-indigo-400 hover:text-white">×</button>
            </span>
          );
        })}
      </div>

      {available.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && addSegment(e.target.value)}
          className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Add segment...</option>
          {available.map((s) => (
            <option key={s.key} value={s.key}>{s.name}</option>
          ))}
        </select>
      )}

      <a href="/segments" className="text-xs text-indigo-400 hover:text-indigo-300 block">
        Browse Segments →
      </a>
    </div>
  );
}
