import React, { useState, useRef, useEffect } from 'react';
import { Search, Users, Plus } from 'lucide-react';

interface SegmentPickerProps {
  segmentKeys: string[];
  availableSegments: Array<{ key: string; name: string; description?: string; memberCount?: number }>;
  onChange: (segmentKeys: string[]) => void;
}

export default function SegmentPicker({ segmentKeys, availableSegments, onChange }: SegmentPickerProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  const addSegment = (key: string) => {
    if (!segmentKeys.includes(key)) {
      onChange([...segmentKeys, key]);
    }
    setSearch('');
    setShowDropdown(false);
  };

  const removeSegment = (key: string) => {
    onChange(segmentKeys.filter((k) => k !== key));
  };

  const available = availableSegments.filter(
    (s) => !segmentKeys.includes(s.key) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) || s.key.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-2">
      {/* Selected segments */}
      <div className="flex flex-wrap gap-1.5">
        {segmentKeys.map((key) => {
          const seg = availableSegments.find((s) => s.key === key);
          return (
            <div key={key} className="group relative">
              <span className="inline-flex items-center gap-1.5 bg-indigo-600/30 text-indigo-300 text-sm px-2.5 py-1 rounded-lg border border-indigo-500/30 transition-colors hover:bg-indigo-600/40">
                <Users size={12} />
                {seg?.name || key}
                {seg?.memberCount !== undefined && (
                  <span className="text-[10px] text-indigo-400/70 bg-indigo-500/20 px-1.5 rounded-full">
                    {seg.memberCount}
                  </span>
                )}
                <button onClick={() => removeSegment(key)} className="text-indigo-400 hover:text-white ml-0.5">×</button>
              </span>
              {/* Hover preview */}
              {seg?.description && (
                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-700 text-xs text-slate-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 w-48">
                  <div className="font-medium text-white mb-1">{seg.name}</div>
                  <div className="text-slate-400">{seg.description}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Searchable dropdown */}
      <div ref={ref} className="relative">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search segments..."
            className="w-full bg-slate-700 text-white border border-slate-600 rounded-md pl-8 pr-3 py-1.5 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
            {available.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-400 text-center">
                No segments found
              </div>
            ) : (
              available.map((s) => (
                <button
                  key={s.key}
                  onClick={() => addSegment(s.key)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <Users size={14} className="text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{s.name}</div>
                    <div className="text-xs text-slate-400 truncate">{s.key}</div>
                  </div>
                  {s.memberCount !== undefined && (
                    <span className="text-xs text-slate-500">{s.memberCount} members</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <a href="/segments" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
        <Plus size={12} /> Create New Segment
      </a>
    </div>
  );
}
