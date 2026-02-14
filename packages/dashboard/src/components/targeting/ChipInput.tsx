import React, { useState, KeyboardEvent } from 'react';

interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function ChipInput({ values, onChange, placeholder = 'Type and press Enter' }: ChipInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!values.includes(input.trim())) {
        onChange([...values, input.trim()]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-slate-700 border border-slate-600 rounded-md px-2 py-1.5 min-h-[38px]">
      {values.map((v, i) => (
        <span key={i} className="inline-flex items-center gap-1 bg-slate-600 text-slate-200 text-sm px-2 py-0.5 rounded-full">
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
        placeholder={values.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent text-white placeholder-slate-400 outline-none text-sm"
      />
    </div>
  );
}
