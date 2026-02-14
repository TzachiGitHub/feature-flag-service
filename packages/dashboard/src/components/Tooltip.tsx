import React, { useState, useRef, useEffect } from 'react';
import { tooltips } from '../data/tooltips';

interface TooltipProps {
  term: string;
  children: React.ReactNode;
}

export function Tooltip({ term, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);
  const definition = tooltips[term];

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
  }, [show]);

  if (!definition) return <>{children}</>;

  return (
    <span
      ref={ref}
      className="relative inline-block border-b border-dotted border-slate-500 cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className="fixed z-50 max-w-xs px-3 py-2 text-sm text-slate-200 bg-slate-700 rounded-md shadow-lg transform -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{ top: pos.top, left: pos.left }}
        >
          <span className="font-semibold text-white">{term}:</span> {definition}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-700" />
        </span>
      )}
    </span>
  );
}

export function Term({ term, children }: TooltipProps) {
  return <Tooltip term={term}>{children}</Tooltip>;
}

export default Tooltip;
