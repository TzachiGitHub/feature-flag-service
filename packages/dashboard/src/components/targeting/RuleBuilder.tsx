import React from 'react';
import { TargetingRule, Clause, Variation } from './types';
import ClauseEditor from './ClauseEditor';
import VariationPicker from './VariationPicker';

interface RuleBuilderProps {
  rules: TargetingRule[];
  variations: Variation[];
  segments?: Array<{ key: string; name: string }>;
  onChange: (rules: TargetingRule[]) => void;
  /** If true, hide the serve section (for segment rules) */
  hideServe?: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function newClause(): Clause {
  return { attribute: '', op: 'equals', values: [], negate: false };
}

function newRule(): TargetingRule {
  return { id: generateId(), description: '', clauses: [newClause()], serve: { variationId: undefined } };
}

export default function RuleBuilder({ rules, variations, segments, onChange, hideServe = false }: RuleBuilderProps) {
  const updateRule = (idx: number, updates: Partial<TargetingRule>) => {
    onChange(rules.map((r, i) => (i === idx ? { ...r, ...updates } : r)));
  };

  const removeRule = (idx: number) => onChange(rules.filter((_, i) => i !== idx));

  const moveRule = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= rules.length) return;
    const copy = [...rules];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    onChange(copy);
  };

  const addClause = (ruleIdx: number) => {
    const rule = rules[ruleIdx];
    updateRule(ruleIdx, { clauses: [...rule.clauses, newClause()] });
  };

  const updateClause = (ruleIdx: number, clauseIdx: number, clause: Clause) => {
    const rule = rules[ruleIdx];
    updateRule(ruleIdx, {
      clauses: rule.clauses.map((c, i) => (i === clauseIdx ? clause : c)),
    });
  };

  const removeClause = (ruleIdx: number, clauseIdx: number) => {
    const rule = rules[ruleIdx];
    updateRule(ruleIdx, { clauses: rule.clauses.filter((_, i) => i !== clauseIdx) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Rules</h3>
        <button
          onClick={() => onChange([...rules, newRule()])}
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          + Add Rule
        </button>
      </div>

      {rules.length === 0 && (
        <p className="text-xs text-slate-500 italic">No rules configured. The default rule will apply.</p>
      )}

      {rules.map((rule, ruleIdx) => (
        <div key={rule.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">#{ruleIdx + 1}</span>
              <input
                value={rule.description}
                onChange={(e) => updateRule(ruleIdx, { description: e.target.value })}
                placeholder="Rule description..."
                className="bg-transparent text-white text-sm placeholder-slate-500 outline-none border-b border-transparent focus:border-slate-600"
              />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => moveRule(ruleIdx, -1)} disabled={ruleIdx === 0} className="text-slate-400 hover:text-white disabled:opacity-30 p-1" title="Move up">↑</button>
              <button onClick={() => moveRule(ruleIdx, 1)} disabled={ruleIdx === rules.length - 1} className="text-slate-400 hover:text-white disabled:opacity-30 p-1" title="Move down">↓</button>
              <button onClick={() => removeRule(ruleIdx)} className="text-slate-400 hover:text-red-400 p-1" title="Delete rule">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Clauses */}
          <div className="space-y-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">IF (all match)</span>
            {rule.clauses.map((clause, clauseIdx) => (
              <React.Fragment key={clauseIdx}>
                {clauseIdx > 0 && <div className="text-xs text-indigo-400 font-medium pl-2">AND</div>}
                <ClauseEditor
                  clause={clause}
                  onChange={(c) => updateClause(ruleIdx, clauseIdx, c)}
                  onRemove={() => removeClause(ruleIdx, clauseIdx)}
                />
              </React.Fragment>
            ))}
            <button
              onClick={() => addClause(ruleIdx)}
              className="text-xs text-slate-400 hover:text-slate-300"
            >
              + Add Clause
            </button>
          </div>

          {/* Serve */}
          {!hideServe && rule.serve && (
            <div className="pt-2 border-t border-slate-700">
              <span className="text-xs text-slate-500 uppercase tracking-wider">THEN SERVE</span>
              <div className="mt-2">
                <VariationPicker
                  variations={variations}
                  selectedId={rule.serve.variationId}
                  onChange={(id) => updateRule(ruleIdx, { serve: { ...rule.serve, variationId: id, rollout: undefined } })}
                  allowRollout
                  rollout={rule.serve.rollout}
                  onRolloutChange={(rollout) => updateRule(ruleIdx, { serve: { ...rule.serve, rollout, variationId: undefined } })}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
