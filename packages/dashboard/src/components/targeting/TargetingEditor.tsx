import React, { useState, useEffect, useCallback } from 'react';
import { Variation, TargetingConfig, IndividualTarget, TargetingRule, Rollout } from './types';
import { apiClient } from '../../api/client';
import IndividualTargets from './IndividualTargets';
import RuleBuilder from './RuleBuilder';
import VariationPicker from './VariationPicker';
import PrerequisiteSelector from './PrerequisiteSelector';
import AnimatedToggle from '../AnimatedToggle';
import ConfirmDialog from '../ConfirmDialog';
import { toast } from '../Toast';

interface TargetingEditorProps {
  projectKey: string;
  flagKey: string;
  envKey: string;
  variations: Variation[];
}

const defaultConfig: TargetingConfig = {
  on: false,
  targets: [],
  rules: [],
  fallthrough: {},
  offVariation: undefined,
  prerequisites: [],
};

export default function TargetingEditor({ projectKey, flagKey, envKey, variations }: TargetingEditorProps) {
  const [config, setConfig] = useState<TargetingConfig>(defaultConfig);
  const [savedConfig, setSavedConfig] = useState<TargetingConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [saveComment, setSaveComment] = useState('');

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);

  const changeCount = (() => {
    let count = 0;
    if (config.on !== savedConfig.on) count++;
    if (config.offVariation !== savedConfig.offVariation) count++;
    if (JSON.stringify(config.targets) !== JSON.stringify(savedConfig.targets)) count++;
    if (JSON.stringify(config.rules) !== JSON.stringify(savedConfig.rules)) count++;
    if (JSON.stringify(config.fallthrough) !== JSON.stringify(savedConfig.fallthrough)) count++;
    if (JSON.stringify(config.prerequisites) !== JSON.stringify(savedConfig.prerequisites)) count++;
    return count;
  })();

  // Warn on page unload if unsaved changes
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/projects/${projectKey}/flags/${flagKey}/environments/${envKey}`);
      const data = res.data || res;
      const loaded: TargetingConfig = {
        on: data.on ?? false,
        targets: data.targets || [],
        rules: (data.rules || []).map((r: any) => ({ ...r, serve: r.serve || { variationId: r.variationId } })),
        fallthrough: data.fallthrough || {},
        offVariation: data.offVariationId || data.offVariation,
        prerequisites: data.prerequisites || [],
      };
      setConfig(loaded);
      setSavedConfig(loaded);
    } catch (err: any) {
      setError(err.message || 'Failed to load targeting config');
    } finally {
      setLoading(false);
    }
  }, [projectKey, flagKey, envKey]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        ...config,
        offVariationId: config.offVariation,
        rules: config.rules.map((r: any) => ({ ...r, variationId: r.serve?.variationId, serve: undefined })),
        comment: saveComment || undefined,
      };
      delete (payload as any).offVariation;
      await apiClient.patch(`/projects/${projectKey}/flags/${flagKey}/environments/${envKey}`, payload);
      setSavedConfig({ ...config });
      setShowReview(false);
      setSaveComment('');
      toast('success', 'Targeting saved');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => setConfig({ ...savedConfig });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-32 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-slate-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Visual Pipeline */}
      <div className="flex items-center gap-0 text-xs overflow-x-auto pb-2">
        {[
          { label: 'OFF Variation', active: true },
          { label: 'Prerequisites', active: config.prerequisites.length > 0 },
          { label: 'Individual Targets', active: config.targets.length > 0 },
          { label: 'Rules', active: config.rules.length > 0 },
          { label: 'Default Rule', active: true },
        ].map((stage, i, arr) => (
          <React.Fragment key={stage.label}>
            <div className={`px-3 py-1.5 rounded-md border whitespace-nowrap transition-colors ${
              stage.active
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'bg-slate-800 border-slate-700 text-slate-600'
            }`}>
              {stage.label}
            </div>
            {i < arr.length - 1 && (
              <svg className="w-4 h-4 text-slate-600 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Targeting Toggle */}
      <div className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${
        config.on
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : 'bg-slate-800 border-slate-700'
      }`}>
        <div>
          <h3 className="text-white font-medium">
            Targeting is {config.on ? (
              <span className="text-emerald-400">ON</span>
            ) : (
              <span className="text-slate-400">OFF</span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {config.on
              ? 'Users will be evaluated against targeting rules.'
              : 'All users will receive the off variation.'}
          </p>
        </div>
        <AnimatedToggle
          enabled={config.on}
          onChange={(on) => setConfig({ ...config, on })}
          size="md"
        />
      </div>

      {/* Off Variation */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Off Variation</h3>
        <p className="text-xs text-slate-400 mb-2">Served when targeting is OFF.</p>
        <select
          value={config.offVariation || ''}
          onChange={(e) => setConfig({ ...config, offVariation: e.target.value || undefined })}
          className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Select variation...</option>
          {variations.map((v) => (
            <option key={v.id} value={v.id}>{v.name} ({JSON.stringify(v.value)})</option>
          ))}
        </select>
      </div>

      {/* Prerequisites */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <PrerequisiteSelector
          prerequisites={config.prerequisites}
          currentFlagKey={flagKey}
          projectKey={projectKey}
          onChange={(prerequisites) => setConfig({ ...config, prerequisites })}
        />
      </div>

      {/* Individual Targets */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <IndividualTargets
          targets={config.targets}
          variations={variations}
          onChange={(targets) => setConfig({ ...config, targets })}
        />
      </div>

      {/* Rules */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <RuleBuilder
          rules={config.rules}
          variations={variations}
          onChange={(rules) => setConfig({ ...config, rules })}
        />
      </div>

      {/* Default Rule (Fallthrough) */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Default Rule</h3>
        <p className="text-xs text-slate-400 mb-3">Served when no rules match.</p>
        <VariationPicker
          variations={variations}
          selectedId={config.fallthrough.variationId}
          onChange={(id) => setConfig({ ...config, fallthrough: { variationId: id } })}
          allowRollout
          rollout={config.fallthrough.rollout}
          onRolloutChange={(rollout) => setConfig({ ...config, fallthrough: { rollout } })}
        />
      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700"
          style={{ animation: 'stickySlideUp 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {changeCount} unsaved change{changeCount !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button onClick={discard} className="btn-secondary text-sm">
                Discard
              </button>
              <button
                onClick={() => setShowReview(true)}
                className="btn-primary text-sm"
              >
                Review & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowReview(false)}>
          <div className="card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-4">Review Changes</h2>

            {/* Diff */}
            <div className="space-y-3 mb-4">
              {config.on !== savedConfig.on && (
                <DiffItem label="Targeting" before={savedConfig.on ? 'ON' : 'OFF'} after={config.on ? 'ON' : 'OFF'} />
              )}
              {config.offVariation !== savedConfig.offVariation && (
                <DiffItem label="Off Variation" before={savedConfig.offVariation || 'none'} after={config.offVariation || 'none'} />
              )}
              {JSON.stringify(config.targets) !== JSON.stringify(savedConfig.targets) && (
                <DiffItem label="Individual Targets" before={`${savedConfig.targets.length} targets`} after={`${config.targets.length} targets`} />
              )}
              {JSON.stringify(config.rules) !== JSON.stringify(savedConfig.rules) && (
                <DiffItem label="Rules" before={`${savedConfig.rules.length} rules`} after={`${config.rules.length} rules`} />
              )}
              {JSON.stringify(config.fallthrough) !== JSON.stringify(savedConfig.fallthrough) && (
                <DiffItem label="Default Rule" before="changed" after="updated" />
              )}
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-1">Comment (optional)</label>
              <textarea
                value={saveComment}
                onChange={(e) => setSaveComment(e.target.value)}
                className="input-field text-sm"
                rows={2}
                placeholder="Describe the changes..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowReview(false)} className="btn-secondary">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes stickySlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function DiffItem({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <div className="text-xs font-medium text-slate-400 mb-1">{label}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-red-400 line-through">{before}</span>
        <span className="text-slate-500">→</span>
        <span className="text-emerald-400">{after}</span>
      </div>
    </div>
  );
}
