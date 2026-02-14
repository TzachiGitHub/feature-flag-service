import React, { useState, useEffect, useCallback } from 'react';
import { Variation, TargetingConfig, IndividualTarget, TargetingRule, Rollout } from './types';
import { apiClient } from '../../api/client';
import IndividualTargets from './IndividualTargets';
import RuleBuilder from './RuleBuilder';
import VariationPicker from './VariationPicker';
import PrerequisiteSelector from './PrerequisiteSelector';

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

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);

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
      // Map offVariation → offVariationId for the server
      const payload = {
        ...config,
        offVariationId: config.offVariation,
        rules: config.rules.map((r: any) => ({ ...r, variationId: r.serve?.variationId, serve: undefined })),
      };
      delete (payload as any).offVariation;
      await apiClient.patch(`/projects/${projectKey}/flags/${flagKey}/environments/${envKey}`, payload);
      setSavedConfig({ ...config });
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => setConfig({ ...savedConfig });

  if (loading) {
    return <div className="text-slate-400 text-center py-8">Loading targeting configuration...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Targeting Toggle */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
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
        <button
          onClick={() => setConfig({ ...config, on: !config.on })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.on ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            config.on ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
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

      {/* Actions */}
      {hasChanges && (
        <div className="flex gap-3 sticky bottom-4">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={discard}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
