import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useProjectStore } from '../stores/projectStore';
import { Segment } from '../components/targeting/types';

export default function Segments() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const navigate = useNavigate();
  const { currentProject } = useProjectStore();
  const projectKey = currentProject?.key ?? '';

  useEffect(() => {
    apiClient.get(`/api/projects/${projectKey}/segments`)
      .then((res: any) => setSegments(res.data?.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectKey]);

  const createSegment = async () => {
    if (!newName || !newKey) return;
    try {
      await apiClient.post(`/api/projects/${projectKey}/segments`, {
        name: newName,
        key: newKey,
        description: newDesc,
        included: [],
        excluded: [],
        rules: [],
      });
      setShowCreate(false);
      setNewName(''); setNewKey(''); setNewDesc('');
      // Refresh
      const res = await apiClient.get(`/api/projects/${projectKey}/segments`);
      setSegments(res.data?.items || res.data || []);
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Segments</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Segment
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6 space-y-3">
          <input value={newName} onChange={(e) => { setNewName(e.target.value); if (!newKey || newKey === newName.toLowerCase().replace(/\s+/g, '-')) setNewKey(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} placeholder="Segment name" className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="segment-key" className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
          <div className="flex gap-2">
            <button onClick={createSegment} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg">Create</button>
            <button onClick={() => setShowCreate(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-center py-12">Loading segments...</div>
      ) : segments.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-slate-500 text-4xl mb-3">📦</div>
          <h2 className="text-lg text-slate-300 font-medium">No segments yet</h2>
          <p className="text-sm text-slate-500 mt-1">Create a segment to group users by shared attributes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {segments.map((seg) => (
            <div
              key={seg.key}
              onClick={() => navigate(`/segments/${seg.key}`)}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{seg.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{seg.key}</span>
                  {seg.description && <p className="text-sm text-slate-400 mt-1">{seg.description}</p>}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{seg.rules?.length || 0} rules</span>
                  <span>{(seg.included?.length || 0) + (seg.excluded?.length || 0)} targets</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
