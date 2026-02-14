import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useProjectStore } from '../stores/projectStore';
import { Segment } from '../components/targeting/types';
import ChipInput from '../components/targeting/ChipInput';
import RuleBuilder from '../components/targeting/RuleBuilder';

export default function SegmentDetail() {
  const { segmentKey } = useParams<{ segmentKey: string }>();
  const navigate = useNavigate();
  const { currentProject } = useProjectStore();
  const projectKey = currentProject?.key ?? '';

  const [segment, setSegment] = useState<Segment | null>(null);
  const [saved, setSaved] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = JSON.stringify(segment) !== JSON.stringify(saved);

  useEffect(() => {
    apiClient.get(`/projects/${projectKey}/segments/${segmentKey}`)
      .then((res: any) => {
        const data = res.data || res;
        setSegment(data);
        setSaved(data);
      })
      .catch((err: any) => setError(err.message || 'Failed to load segment'))
      .finally(() => setLoading(false));
  }, [projectKey, segmentKey]);

  const save = async () => {
    if (!segment) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.put(`/projects/${projectKey}/segments/${segmentKey}`, segment);
      setSaved({ ...segment });
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteSegment = async () => {
    if (!confirm('Delete this segment? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/projects/${projectKey}/segments/${segmentKey}`);
      navigate('/segments');
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="text-slate-400 text-center py-8">Loading segment...</div>;
  if (!segment) return <div className="text-red-400 text-center py-8">{error || 'Segment not found'}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{segment.name}</h1>
          <span className="text-sm text-slate-500 font-mono">{segment.key}</span>
          {segment.description && <p className="text-sm text-slate-400 mt-1">{segment.description}</p>}
        </div>
        <button onClick={() => navigate('/segments')} className="text-sm text-slate-400 hover:text-white">
          ← Back to Segments
        </button>
      </div>

      {/* Included */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Included Users</h3>
        <p className="text-xs text-slate-400 mb-2">These context keys are always included in this segment.</p>
        <ChipInput
          values={segment.included || []}
          onChange={(included) => setSegment({ ...segment, included })}
          placeholder="Add context keys..."
        />
      </div>

      {/* Excluded */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Excluded Users</h3>
        <p className="text-xs text-slate-400 mb-2">These context keys are always excluded from this segment.</p>
        <ChipInput
          values={segment.excluded || []}
          onChange={(excluded) => setSegment({ ...segment, excluded })}
          placeholder="Add context keys..."
        />
      </div>

      {/* Rules (no serve) */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <RuleBuilder
          rules={segment.rules || []}
          variations={[]}
          onChange={(rules) => setSegment({ ...segment, rules })}
          hideServe
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {hasChanges && (
          <>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setSegment(saved ? { ...saved } : segment)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Discard
            </button>
          </>
        )}
        <button
          onClick={deleteSegment}
          className="bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Delete Segment
        </button>
      </div>
    </div>
  );
}
