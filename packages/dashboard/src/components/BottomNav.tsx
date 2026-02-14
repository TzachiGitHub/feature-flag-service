import { NavLink } from 'react-router-dom';
import { Flag, Layers, BarChart3, Settings, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const bottomItems = [
  { to: '/flags', label: 'Flags', icon: Flag },
  { to: '/segments', label: 'Segments', icon: Layers },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const moreItems = [
  { to: '/audit-log', label: 'Audit Log' },
  { to: '/playground', label: 'Playground' },
  { to: '/learn', label: 'Learn' },
];

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              className="fixed bottom-14 right-2 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-modal p-2 min-w-[160px] sm:hidden"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {moreItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) => clsx(
                    'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-700'
                  )}
                >
                  {label}
                </NavLink>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950 border-t border-slate-800 h-14 flex items-center justify-around sm:hidden" role="navigation" aria-label="Mobile navigation">
        {bottomItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
              isActive ? 'text-indigo-400' : 'text-slate-500'
            )}
            aria-label={label}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={clsx(
            'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
            moreOpen ? 'text-indigo-400' : 'text-slate-500'
          )}
          aria-label="More navigation options"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}
