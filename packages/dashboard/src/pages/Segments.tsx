import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../api/client';
import { useProjectStore } from '../stores/projectStore';
import { Segment } from '../components/targeting/types';
import { SegmentCardSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorBoundary';
import { staggerContainer, staggerItem } from '../lib/animations';

export default function Segments() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const navigate = useNavigate();
  const { currentProject } = useProjectStore();
  const projectKey = currentProject?.key ?? '';

  const fetchSegments = () => {
    setLoading(true);
    setError(false);
    apiClient.get(`/projects/${projectKey}/segments`)
      .then((res: any) => setSegments(res.data?.items || res.data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSegments(); }, [projectKey]);

  const createSegment = async () => {
    if (!newName || !newKey) return;
    try {
      await apiClient.post(`/projects/${projectKey}/segments`, {
        name: newName,
        key: newKey,
        description: newDesc,
        included: [],
        excluded: [],
        rules: [],
      });
      setShowCreate(false);
      setNewName(''); setNewKey(''); setNewDesc('');
      fetchSegments();
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Segments</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 active:scale-[0.98]"
          aria-label="Create new segment"
        >
          + New Segment
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <motion.div
          className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6 space-y-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <input value={newName} onChange={(e) => { setNewName(e.target.value); if (!newKey || newKey === newName.toLowerCase().replace(/\s+/g, '-')) setNewKey(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} placeholder="Segment name" className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" aria-label="Segment name" />
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="segment-key" className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" aria-label="Segment key" />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" aria-label="Segment description" />
          <div className="flex gap-2">
            <button onClick={createSegment} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-all active:scale-[0.98]" aria-label="Create segment">Create</button>
            <button onClick={() => setShowCreate(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-4 py-2 rounded-lg transition-colors" aria-label="Cancel">Cancel</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <SegmentCardSkeleton />
      ) : error ? (
        <ErrorState title="Failed to load segments" onRetry={fetchSegments} />
      ) : segments.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-slate-500 text-4xl mb-3">📦</div>
          <h2 className="text-lg text-slate-300 font-medium">No segments yet</h2>
          <p className="text-sm text-slate-500 mt-1">Create a segment to group users by shared attributes.</p>
        </div>
      ) : (
        <motion.div className="space-y-2" variants={staggerContainer} initial="initial" animate="animate">
          {segments.map((seg) => (
            <motion.div
              key={seg.key}
              variants={staggerItem}
              onClick={() => navigate(`/segments/${seg.key}`)}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-slate-600 hover:-translate-y-[1px] hover:shadow-lg transition-all duration-150"
              role="button"
              tabIndex={0}
              aria-label={`Segment: ${seg.name}`}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/segments/${seg.key}`); }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
