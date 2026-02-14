import React, { useState } from 'react';

interface AuditDiffProps {
  before: any;
  after: any;
}

function syntaxHighlight(json: string): React.ReactNode[] {
  const lines = json.split('\n');
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;
    // Colorize keys, strings, numbers, booleans, null
    const regex = /("(?:\\.|[^"\\])*")\s*:/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    // Simple approach: replace known patterns
    const colored = remaining
      .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g, '<KEY>"$1"</KEY>:')
      .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, '<STR>"$1"</STR>')
      .replace(/\b(true|false)\b/g, '<BOOL>$1</BOOL>')
      .replace(/\b(null)\b/g, '<NULL>$1</NULL>')
      .replace(/:\s*(\d+(?:\.\d+)?)/g, ': <NUM>$1</NUM>');

    // Parse our custom tags
    const tagRegex = /<(KEY|STR|BOOL|NULL|NUM)>(.*?)<\/\1>/g;
    lastIndex = 0;
    let tagMatch: RegExpExecArray | null;
    while ((tagMatch = tagRegex.exec(colored)) !== null) {
      if (tagMatch.index > lastIndex) {
        parts.push(<span key={key++} className="text-slate-400">{colored.slice(lastIndex, tagMatch.index)}</span>);
      }
      const type = tagMatch[1];
      const val = tagMatch[2];
      const colorClass = type === 'KEY' ? 'text-indigo-400' : type === 'STR' ? 'text-emerald-400' : type === 'BOOL' ? 'text-amber-400' : type === 'NULL' ? 'text-slate-500' : 'text-cyan-400';
      parts.push(<span key={key++} className={colorClass}>{val}</span>);
      lastIndex = tagMatch.index + tagMatch[0].length;
    }
    if (lastIndex < colored.length) {
      parts.push(<span key={key++} className="text-slate-400">{colored.slice(lastIndex)}</span>);
    }

    return <div key={i} className="leading-6">{parts.length ? parts : <span>{' '}</span>}</div>;
  });
}

function diffKeys(before: any, after: any): Set<string> {
  const changed = new Set<string>();
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const k of allKeys) {
    if (JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k])) {
      changed.add(k);
    }
  }
  return changed;
}

export default function AuditDiff({ before, after }: AuditDiffProps) {
  const [collapsed, setCollapsed] = useState(false);
  const changedKeys = diffKeys(before, after);
  const beforeStr = JSON.stringify(before, null, 2) || '{}';
  const afterStr = JSON.stringify(after, null, 2) || '{}';

  const lineCount = Math.max(beforeStr.split('\n').length, afterStr.split('\n').length);
  const isLarge = lineCount > 30;

  return (
    <div className="mt-3">
      {isLarge && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-indigo-400 hover:text-indigo-300 mb-2"
        >
          {collapsed ? '▶ Expand diff' : '▼ Collapse diff'}
        </button>
      )}
      {(!isLarge || !collapsed) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-950/30 border border-red-900/30 rounded-lg p-4 overflow-auto max-h-96">
            <div className="text-xs text-red-400 font-semibold mb-2">Before</div>
            <pre className="font-mono text-xs">{syntaxHighlight(beforeStr)}</pre>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-900/30 rounded-lg p-4 overflow-auto max-h-96">
            <div className="text-xs text-emerald-400 font-semibold mb-2">After</div>
            <pre className="font-mono text-xs">{syntaxHighlight(afterStr)}</pre>
          </div>
        </div>
      )}
      {changedKeys.size > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-slate-500">Changed:</span>
          {Array.from(changedKeys).map(k => (
            <span key={k} className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">{k}</span>
          ))}
        </div>
      )}
    </div>
  );
}
