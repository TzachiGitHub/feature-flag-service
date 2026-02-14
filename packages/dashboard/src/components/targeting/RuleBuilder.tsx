import React from 'react';
import { TargetingRule, Clause, Variation } from './types';
import ClauseEditor from './ClauseEditor';
import VariationPicker from './VariationPicker';
import { GripVertical, Copy, Trash2 } from 'lucide-react';

interface RuleBuilderProps {
  rules: TargetingRule[];
  variations: Variation[];
  segments?: Array<{ key: string; name: string }>;
  onChange: (rules: TargetingRule[]) => void;
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

  const duplicateRule = (idx: number) => {
    const rule = rules[idx];
    const dup: TargetingRule = {
      ...JSON.parse(JSON.stringify(rule)),
      id: generateId(),
      description: rule.description ? `${rule.description} (copy)` : '',
    };
    const next = [...rules];
    next.splice(idx + 1, 0, dup);
    onChange(next);
  };

  const addClause = (ruleIdx: number) => {
    const rule = rules[ruleIdx];
    updateRule(ruleIdx, { clauses: [...rule.clauses, newClause()] });
  };

  const duplicateClause = (ruleIdx: number, clauseIdx: number) => {
    const rule = rules[ruleIdx];
    const clause = { ...rule.clauses[clauseIdx], values: [...rule.clauses[clauseIdx].values] };
    const clauses = [...rule.clauses];
    clauses.splice(clauseIdx + 1, 0, clause);
    updateRule(ruleIdx, { clauses });
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
        <div key={rule.id} className="relative">
          {/* Connector line between rules */}
          {ruleIdx > 0 && (
            <div className="flex items-center justify-center -mt-1 -mb-1 py-1">
              <div className="w-px h-4 bg-slate-700" />
            </div>
          )}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700">
              {/* Drag handle */}
              <div className="cursor-grab text-slate-600 hover:text-slate-400 active:cursor-grabbing" title="Drag to reorder">
                <GripVertical size={16} />
              </div>

              {/* Rule number badge */}
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                {ruleIdx + 1}
              </span>

              <input
                value={rule.description}
                onChange={(e) => updateRule(ruleIdx, { description: e.target.value })}
                placeholder="Rule description..."
                className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none border-b border-transparent focus:border-slate-600"
              />

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => moveRule(ruleIdx, -1)}
                  disabled={ruleIdx === 0}
                  className="text-slate-400 hover:text-white disabled:opacity-30 p-1 transition-colors"
                  title="Move up"
                >↑</button>
                <button
                  onClick={() => moveRule(ruleIdx, 1)}
                  disabled={ruleIdx === rules.length - 1}
                  className="text-slate-400 hover:text-white disabled:opacity-30 p-1 transition-colors"
                  title="Move down"
                >↓</button>
                <button
                  onClick={() => duplicateRule(ruleIdx)}
                  className="text-slate-400 hover:text-indigo-400 p-1 transition-colors"
                  title="Duplicate rule"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => removeRule(ruleIdx)}
                  className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                  title="Delete rule"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Clauses */}
            <div className="px-4 py-3 space-y-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">IF (all match)</span>
              {rule.clauses.map((clause, clauseIdx) => (
                <React.Fragment key={clauseIdx}>
                  {clauseIdx > 0 && <div className="text-xs text-indigo-400 font-medium pl-2">AND</div>}
                  <ClauseEditor
                    clause={clause}
                    onChange={(c) => updateClause(ruleIdx, clauseIdx, c)}
                    onRemove={() => removeClause(ruleIdx, clauseIdx)}
                    onDuplicate={() => duplicateClause(ruleIdx, clauseIdx)}
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
              <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50">
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
        </div>
      ))}
    </div>
  );
}
