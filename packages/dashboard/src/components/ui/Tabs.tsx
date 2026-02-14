import { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, active, onChange, className }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current.get(active);
    const container = containerRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setUnderline({
        left: elRect.left - containerRect.left + container.scrollLeft,
        width: elRect.width,
      });
    }
  }, [active, tabs]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative flex overflow-x-auto border-b border-slate-700 scrollbar-none',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            if (el) tabRefs.current.set(tab.id, el);
          }}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
            tab.id === active
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count != null && (
            <span
              className={clsx(
                'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium',
                tab.id === active
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-slate-700 text-slate-400'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}

      {/* animated underline */}
      <div
        className="absolute bottom-0 h-0.5 bg-indigo-500 transition-all duration-200 ease-out"
        style={{ left: underline.left, width: underline.width }}
      />
    </div>
  );
}
