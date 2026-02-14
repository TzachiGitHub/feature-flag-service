import React, { useState, useRef, useEffect } from 'react';
import { Clause, OPERATORS, MULTI_VALUE_OPS, NUMERIC_OPS, SEMVER_OPS, CONTEXT_KINDS, COMMON_ATTRIBUTES } from './types';
import ChipInput from './ChipInput';
import { Hash, Regex, Copy, Trash2 } from 'lucide-react';

interface ClauseEditorProps {
  clause: Clause;
  onChange: (clause: Clause) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
}

const OPERATOR_DESCRIPTIONS: Record<string, string> = {
  equals: 'Exact match against provided values',
  notEquals: 'Does not match any provided values',
  contains: 'String contains the substring',
  startsWith: 'String starts with the prefix',
  endsWith: 'String ends with the suffix',
  in: 'Matches any of the provided values',
  matches: 'Matches a regular expression pattern',
  greaterThan: 'Numeric value is greater than',
  lessThan: 'Numeric value is less than',
  greaterThanOrEqual: 'Numeric value is greater than or equal to',
  lessThanOrEqual: 'Numeric value is less than or equal to',
  semverEqual: 'Semantic version equals',
  semverGreaterThan: 'Semantic version is greater than',
  semverLessThan: 'Semantic version is less than',
};

export default function ClauseEditor({ clause, onChange, onRemove, onDuplicate }: ClauseEditorProps) {
  const isMultiValue = MULTI_VALUE_OPS.includes(clause.op);
  const isNumeric = NUMERIC_OPS.includes(clause.op);
  const isSemver = SEMVER_OPS.includes(clause.op);
  const isRegex = clause.op === 'matches';
  const isInvalid = !clause.attribute.trim() || clause.values.length === 0;

  const [showAttrDropdown, setShowAttrDropdown] = useState(false);
  const [attrFilter, setAttrFilter] = useState(clause.attribute);
  const attrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAttrFilter(clause.attribute);
  }, [clause.attribute]);

  useEffect(() => {
    if (!showAttrDropdown) return;
    const handler = (e: MouseEvent) => {
      if (attrRef.current && !attrRef.current.contains(e.target as Node)) setShowAttrDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAttrDropdown]);

  const filteredAttrs = COMMON_ATTRIBUTES.filter((a) =>
    a.toLowerCase().includes(attrFilter.toLowerCase())
  );

  return (
    <div className={`flex flex-wrap items-start gap-2 rounded-lg p-3 transition-colors ${
      isInvalid ? 'bg-slate-800 border border-red-500/30' : 'bg-slate-800 border border-slate-700'
    }`}>
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

      {/* Attribute with autocomplete dropdown */}
      <div className="relative" ref={attrRef}>
        <input
          value={attrFilter}
          onChange={(e) => { setAttrFilter(e.target.value); onChange({ ...clause, attribute: e.target.value }); }}
          onFocus={() => setShowAttrDropdown(true)}
          placeholder="attribute"
          className={`bg-slate-700 text-white border rounded-md px-2 py-1.5 text-sm w-32 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none ${
            !clause.attribute.trim() ? 'border-red-500/50' : 'border-slate-600'
          }`}
        />
        {showAttrDropdown && filteredAttrs.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-40 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10 py-1 max-h-40 overflow-y-auto">
            {filteredAttrs.map((attr) => (
              <button
                key={attr}
                onClick={() => {
                  onChange({ ...clause, attribute: attr });
                  setAttrFilter(attr);
                  setShowAttrDropdown(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600 transition-colors"
              >
                {attr}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Operator with tooltip */}
      <div className="relative group">
        <select
          value={clause.op}
          onChange={(e) => onChange({ ...clause, op: e.target.value, values: [] })}
          className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {OPERATORS.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-600 text-xs text-slate-200 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
          {OPERATOR_DESCRIPTIONS[clause.op] || clause.op}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-600 rotate-45 -mt-1" />
        </div>
        {/* Type indicator */}
        {isNumeric && <Hash size={12} className="absolute -top-1 -right-1 text-amber-400" />}
        {isRegex && <Regex size={12} className="absolute -top-1 -right-1 text-purple-400" />}
      </div>

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

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        {onDuplicate && (
          <button onClick={onDuplicate} className="text-slate-500 hover:text-indigo-400 p-1 transition-colors" title="Duplicate clause">
            <Copy size={14} />
          </button>
        )}
        <button onClick={onRemove} className="text-slate-500 hover:text-red-400 p-1 transition-colors" title="Remove clause">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
