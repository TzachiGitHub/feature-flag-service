import React from 'react';
import { Clause, OPERATORS, MULTI_VALUE_OPS, NUMERIC_OPS, SEMVER_OPS, CONTEXT_KINDS, COMMON_ATTRIBUTES } from './types';
import ChipInput from './ChipInput';

interface ClauseEditorProps {
  clause: Clause;
  onChange: (clause: Clause) => void;
  onRemove: () => void;
}

export default function ClauseEditor({ clause, onChange, onRemove }: ClauseEditorProps) {
  const isMultiValue = MULTI_VALUE_OPS.includes(clause.op);
  const isNumeric = NUMERIC_OPS.includes(clause.op);
  const isSemver = SEMVER_OPS.includes(clause.op);

  return (
    <div className="flex flex-wrap items-start gap-2 bg-slate-750 rounded-md p-2">
      {/* Context Kind */}
      <select
        value={clause.contextKind || ''}
        onChange={(e) => onChange({ ...clause, contextKind: e.target.value || undefined })}
        className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        <option value="">Context...</option>
        {CONTEXT_KINDS.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>

      {/* Attribute */}
      <input
        list="attr-suggestions"
        value={clause.attribute}
        onChange={(e) => onChange({ ...clause, attribute: e.target.value })}
        placeholder="attribute"
        className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1.5 text-sm w-28 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <datalist id="attr-suggestions">
        {COMMON_ATTRIBUTES.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      {/* Operator */}
      <select
        value={clause.op}
        onChange={(e) => onChange({ ...clause, op: e.target.value, values: [] })}
        className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        {OPERATORS.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>

      {/* Values */}
      <div className="flex-1 min-w-[150px]">
        {isMultiValue ? (
          <ChipInput
            values={clause.values}
            onChange={(values) => onChange({ ...clause, values })}
            placeholder="Add values..."
          />
        ) : isNumeric ? (
          <input
            type="number"
            value={clause.values[0] || ''}
            onChange={(e) => onChange({ ...clause, values: [e.target.value] })}
            placeholder="0"
            className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1.5 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        ) : isSemver ? (
          <input
            value={clause.values[0] || ''}
            onChange={(e) => onChange({ ...clause, values: [e.target.value] })}
            placeholder="1.2.3"
            className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1.5 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        ) : (
          <input
            value={clause.values[0] || ''}
            onChange={(e) => onChange({ ...clause, values: [e.target.value] })}
            placeholder="value"
            className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1.5 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        )}
      </div>

      {/* Negate */}
      <label className="flex items-center gap-1 text-sm text-slate-400 whitespace-nowrap">
        <input
          type="checkbox"
          checked={clause.negate}
          onChange={(e) => onChange({ ...clause, negate: e.target.checked })}
          className="rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500"
        />
        Negate
      </label>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-red-400 p-1"
        title="Remove clause"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
