import React, { useState, KeyboardEvent, ClipboardEvent } from 'react';
import { Clipboard } from 'lucide-react';

interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function ChipInput({ values, onChange, placeholder = 'Type and press Enter' }: ChipInputProps) {
  const [input, setInput] = useState('');

  const addValues = (newValues: string[]) => {
    const trimmed = newValues.map((v) => v.trim()).filter(Boolean);
    const unique = trimmed.filter((v) => !values.includes(v));
    if (unique.length > 0) {
      onChange([...values, ...unique]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addValues([input]);
      setInput('');
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.includes(',') || text.includes('\n') || text.includes('\t')) {
      e.preventDefault();
      const items = text.split(/[,\n\t]+/);
      addValues(items);
      setInput('');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const items = text.split(/[,\n\t]+/).map((v) => v.trim()).filter(Boolean);
      addValues(items);
    } catch { /* clipboard not available */ }
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-700 border border-slate-600 rounded-md px-2 py-1.5 min-h-[38px] focus-within:ring-2 focus-within:ring-indigo-500">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-slate-600 text-slate-200 text-sm px-2 py-0.5 rounded-full transition-colors hover:bg-slate-500">
            {v}
            <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-white">
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-white placeholder-slate-400 outline-none text-sm"
        />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
        >
          <Clipboard size={10} /> Paste from clipboard
        </button>
        <span className="text-[10px] text-slate-600">Comma, newline or tab separated</span>
      </div>
    </div>
  );
}
