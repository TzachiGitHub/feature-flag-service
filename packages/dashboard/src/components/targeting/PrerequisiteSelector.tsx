import React, { useState, useEffect } from 'react';
import { Prerequisite, Variation } from './types';
import { apiClient } from '../../api/client';

interface PrerequisiteSelectorProps {
  prerequisites: Prerequisite[];
  currentFlagKey: string;
  projectKey: string;
  onChange: (prerequisites: Prerequisite[]) => void;
}

interface FlagSummary {
  key: string;
  name: string;
  variations: Variation[];
}

export default function PrerequisiteSelector({ prerequisites, currentFlagKey, projectKey, onChange }: PrerequisiteSelectorProps) {
  const [flags, setFlags] = useState<FlagSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/api/projects/${projectKey}/flags`)
      .then((res: any) => {
        const items = (res.data?.items || res.data || []) as FlagSummary[];
        setFlags(items.filter((f: FlagSummary) => f.key !== currentFlagKey));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectKey, currentFlagKey]);

  const addPrereq = () => {
    if (flags.length === 0) return;
    const first = flags[0];
    onChange([...prerequisites, { flagKey: first.key, variationId: first.variations?.[0]?.id || '' }]);
  };

  const updatePrereq = (idx: number, updates: Partial<Prerequisite>) => {
    onChange(prerequisites.map((p, i) => (i === idx ? { ...p, ...updates } : p)));
  };

  const removePrereq = (idx: number) => {
    onChange(prerequisites.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Prerequisites</h3>
        <button onClick={addPrereq} className="text-xs text-indigo-400 hover:text-indigo-300">
          + Add Prerequisite
        </button>
      </div>

      {prerequisites.length === 0 && (
        <p className="text-xs text-slate-500 italic">No prerequisites.</p>
      )}

      {prerequisites.map((prereq, idx) => {
        const flag = flags.find((f) => f.key === prereq.flagKey);
        return (
          <div key={idx} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-3">
            <select
              value={prereq.flagKey}
              onChange={(e) => {
                const f = flags.find((x) => x.key === e.target.value);
                updatePrereq(idx, { flagKey: e.target.value, variationId: f?.variations?.[0]?.id || '' });
              }}
              className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-sm flex-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {flags.map((f) => (
                <option key={f.key} value={f.key}>{f.name || f.key}</option>
              ))}
            </select>
            <span className="text-xs text-slate-400">must serve</span>
            <select
              value={prereq.variationId}
              onChange={(e) => updatePrereq(idx, { variationId: e.target.value })}
              className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {(flag?.variations || []).map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <button onClick={() => removePrereq(idx)} className="text-slate-400 hover:text-red-400">×</button>
          </div>
        );
      })}
    </div>
  );
}
