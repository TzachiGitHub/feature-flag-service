import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), debounceMs);
  };

  const handleClear = () => {
    setLocal('');
    onChange('');
  };

  return (
    <div
      className={clsx(
        'relative flex items-center transition-all duration-200',
        focused && 'ring-2 ring-indigo-500 rounded-lg',
        className
      )}
    >
      <Search className="absolute left-3 h-4 w-4 text-slate-500 pointer-events-none" />
      <input
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="input-field pl-9 pr-8 w-full"
        placeholder={placeholder}
      />
      {local && (
        <button
          onClick={handleClear}
          className="absolute right-2 p-1 text-slate-400 hover:text-white rounded transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
