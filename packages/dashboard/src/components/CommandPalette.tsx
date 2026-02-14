import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Layers, BarChart3, ScrollText, Settings, GraduationCap, Beaker, Search, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
import { useFlagStore } from '../stores/flagStore';
import { useProjectStore } from '../stores/projectStore';

interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  href: string;
  group: string;
}

const pages: PaletteItem[] = [
  { id: 'page-flags', label: 'Flags', description: 'Feature flag management', icon: Flag, href: '/flags', group: 'Pages' },
  { id: 'page-segments', label: 'Segments', description: 'User segments', icon: Layers, href: '/segments', group: 'Pages' },
  { id: 'page-analytics', label: 'Analytics', description: 'Evaluation analytics', icon: BarChart3, href: '/analytics', group: 'Pages' },
  { id: 'page-audit', label: 'Audit Log', description: 'Change history', icon: ScrollText, href: '/audit-log', group: 'Pages' },
  { id: 'page-playground', label: 'Playground', description: 'Test flag evaluations', icon: Beaker, href: '/playground', group: 'Pages' },
  { id: 'page-settings', label: 'Settings', description: 'Project settings', icon: Settings, href: '/settings', group: 'Pages' },
  { id: 'page-learn', label: 'Learn', description: 'Documentation', icon: GraduationCap, href: '/learn', group: 'Pages' },
];

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const flags = useFlagStore((s) => s.flags);
  const currentProject = useProjectStore((s) => s.currentProject);

  // Build items list from flags + pages
  const allItems = useMemo<PaletteItem[]>(() => {
    const flagItems: PaletteItem[] = flags.map((f) => ({
      id: `flag-${f.key}`,
      label: f.name,
      description: f.key,
      icon: Flag,
      href: `/flags/${f.key}`,
      group: 'Flags',
    }));
    return [...pages, ...flagItems];
  }, [flags]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    return allItems.filter(
      (item) => fuzzyMatch(query, item.label) || (item.description && fuzzyMatch(query, item.description))
    );
  }, [allItems, query]);

  // Group results
  const grouped = useMemo(() => {
    const groups: Record<string, PaletteItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, [filtered]);

  const flatFiltered = useMemo(() => filtered, [filtered]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const selectItem = useCallback(
    (item: PaletteItem) => {
      setOpen(false);
      navigate(item.href);
    },
    [navigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatFiltered[activeIndex]) selectItem(flatFiltered[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  let itemIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-700">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search flags, segments, pages…"
            className="w-full bg-transparent py-4 text-lg text-white placeholder-slate-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {flatFiltered.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No results found</div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {group}
                </div>
                {items.map((item) => {
                  const idx = itemIndex++;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                        idx === activeIndex ? 'bg-indigo-600/20 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500 truncate">{item.description}</div>
                        )}
                      </div>
                      {idx === activeIndex && <CornerDownLeft className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-700 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> Navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
