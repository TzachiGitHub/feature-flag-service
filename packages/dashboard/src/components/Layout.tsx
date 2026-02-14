import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Flag, Layers, BarChart3, ScrollText, Settings, GraduationCap, Menu, X, LogOut, Beaker } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import EnvironmentBadge from './EnvironmentBadge';
import ToastContainer from './Toast';

const navItems = [
  { to: '/flags', label: 'Flags', icon: Flag },
  { to: '/segments', label: 'Segments', icon: Layers },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
  { to: '/playground', label: 'Playground', icon: Beaker },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { projects, currentProject, environments, currentEnvironment, fetchProjects, fetchEnvironments, setCurrentProject, setCurrentEnvironment } = useProjectStore();
  const navigate = useNavigate();

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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-800">
          <span className="text-2xl">🚩</span>
          <span className="text-lg font-bold text-white">FlagService</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Project selector */}
        <div className="px-3 py-4 border-t border-slate-800">
          <label className="text-xs text-slate-500 mb-1 block">Project</label>
          <select
            value={currentProject?.key || ''}
            onChange={(e) => {
              const p = projects.find((p) => p.key === e.target.value);
              if (p) setCurrentProject(p);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-white"
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
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
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
            <span className="text-sm text-slate-400 hidden sm:block">{user?.name || user?.email}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
