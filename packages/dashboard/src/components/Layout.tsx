import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Flag, Layers, BarChart3, ScrollText, Settings, GraduationCap, Menu, X, LogOut, Beaker } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import EnvironmentBadge from './EnvironmentBadge';
import ToastContainer from './Toast';
import BottomNav from './BottomNav';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import { ErrorBoundary } from './ErrorBoundary';
import { slideUp } from '../lib/animations';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcuts';

const navItems = [
  { to: '/flags', label: 'Flags', icon: Flag },
  { to: '/segments', label: 'Segments', icon: Layers },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
  { to: '/playground', label: 'Playground', icon: Beaker },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
];

// Page title mapping
const pageTitles: Record<string, string> = {
  '/flags': 'Flags',
  '/segments': 'Segments',
  '/analytics': 'Analytics',
  '/audit-log': 'Audit Log',
  '/playground': 'Playground',
  '/settings': 'Settings',
  '/learn': 'Learn',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { projects, currentProject, environments, currentEnvironment, fetchProjects, fetchEnvironments, setCurrentProject, setCurrentEnvironment } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Update page title
  useEffect(() => {
    const base = 'FlagService';
    const pathKey = '/' + location.pathname.split('/')[1];
    const pageTitle = pageTitles[pathKey];
    document.title = pageTitle ? `${pageTitle} - ${base}` : base;
  }, [location.pathname]);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (currentProject) fetchEnvironments(currentProject.key);
  }, [currentProject?.key]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Keyboard shortcut for showing shortcuts modal
  useKeyboardShortcut({
    key: '?',
    shift: true,
    handler: () => setShortcutsOpen(true),
  });

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      // This will be triggered by pages that set a flag
      const hasUnsaved = document.querySelector('[data-unsaved="true"]');
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - hidden on mobile (bottom nav used instead) */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-800">
          <span className="text-2xl" role="img" aria-label="Flag icon">🚩</span>
          <span className="text-lg font-bold text-white">FlagService</span>
          {/* Close button on mobile */}
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border-l-[3px] border-indigo-500 pl-[9px]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border-l-[3px] border-transparent pl-[9px]'
              )}
              aria-label={label}
            >
              <Icon className="h-4 w-4 transition-transform duration-150 group-hover:scale-110" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Project selector */}
        <div className="px-3 py-4 border-t border-slate-800">
          <label className="text-xs text-slate-500 mb-1 block" htmlFor="project-select">Project</label>
          <select
            id="project-select"
            value={currentProject?.key || ''}
            onChange={(e) => {
              const p = projects.find((p) => p.key === e.target.value);
              if (p) setCurrentProject(p);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-white transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="Select project"
          >
            {projects.map((p) => (
              <option key={p.key} value={p.key}>{p.name}</option>
            ))}
          </select>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.3)] flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {environments.map((env) => (
              <EnvironmentBadge
                key={env.key}
                env={env}
                selected={currentEnvironment?.key === env.key}
                onClick={() => setCurrentEnvironment(env)}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* User avatar */}
            <div
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold"
              aria-hidden="true"
            >
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
            <span className="text-sm text-slate-400 hidden sm:block">{user?.name || user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content with page transitions */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 sm:pb-6 scroll-smooth">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={slideUp.initial}
                animate={slideUp.animate}
                exit={slideUp.exit}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* Bottom nav for mobile */}
      <BottomNav />

      <ToastContainer />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
