import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import { useProjectStore } from '../stores/projectStore';
import { toast } from '../components/Toast';
import { SettingsSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorBoundary';
import { staggerContainer, staggerItem } from '../lib/animations';

interface Environment {
  key: string;
  name: string;
  color: string;
  sdkKey: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const highlighted = code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(\/\/.*)/g, '<span class="text-slate-500">$1</span>')
    .replace(/('.*?'|".*?")/g, '<span class="text-emerald-400">$1</span>')
    .replace(/\b(import|from|export|function|return|const|let|var|if|else)\b/g, '<span class="text-indigo-400">$1</span>')
    .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-amber-400">$1</span>');

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} />
      </div>
      {language && <div className="text-xs text-slate-500 mb-1">{language}</div>}
      <pre className="bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300"
        dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  );
}

export default function Settings() {
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [rotateConfirm, setRotateConfirm] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const { currentProject, fetchProjects } = useProjectStore();
  const projectKey = currentProject?.key ?? '';
  const projectName = currentProject?.name ?? 'My Project';

  const fetchEnvs = () => {
    setLoading(true);
    setError(false);
    api.get(`/projects/${projectKey}/environments`)
      .then(r => setEnvs(r.data?.environments || r.data || []))
      .catch(() => { setEnvs([]); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEnvs(); }, [projectKey]);

  const maskKey = (key: string) => {
    if (key.length <= 10) return '***';
    return key.slice(0, 4) + '***...***' + key.slice(-3);
  };

  const toggleReveal = (envKey: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      next.has(envKey) ? next.delete(envKey) : next.add(envKey);
      return next;
    });
  };

  const handleRotateKey = async (envKey: string) => {
    try {
      const res = await api.post(`/projects/${projectKey}/environments/${envKey}/rotate-key`);
      const newKey = res.data?.sdkKey;
      if (newKey) {
        setEnvs(prev => prev.map(e => e.key === envKey ? { ...e, sdkKey: newKey } : e));
      }
      toast('success', `SDK key rotated for ${envKey}`);
    } catch {
      toast('error', 'Failed to rotate key');
    }
    setRotateConfirm(null);
  };

  const handleDeleteProject = async () => {
    if (deleteInput !== projectName) return;
    try {
      await api.delete(`/projects/${projectKey}`);
      toast('success', 'Project deleted');
      await fetchProjects();
      window.location.href = '/';
    } catch {
      toast('error', 'Failed to delete project');
    }
    setDeleteConfirm(false);
  };

  const installSnippet = `npm install @feature-flag/sdk-js @feature-flag/sdk-react`;

  const usageSnippet = `import { FlagProvider, useFlag } from '@feature-flag/sdk-react';

function App() {
  return (
    <FlagProvider sdkKey="your-sdk-key" context={{ kind: 'user', key: 'user-123' }}>
      <MyApp />
    </FlagProvider>
  );
}

function MyComponent() {
  const darkMode = useFlag('dark-mode', false);
  return darkMode ? <DarkTheme /> : <LightTheme />;
}`;

  if (loading) return <SettingsSkeleton />;

  return (
    <motion.div
      className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Environments */}
      {error ? (
        <ErrorState title="Failed to load environments" onRetry={fetchEnvs} />
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Environments</h2>
          <motion.div className="space-y-3" variants={staggerContainer} initial="initial" animate="animate">
            {envs.map(env => (
              <motion.div
                key={env.key}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 rounded-lg p-4 border border-slate-700/50 gap-3 hover:bg-slate-850 transition-colors"
                variants={staggerItem}
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: env.color }} aria-hidden="true" />
                  <div>
                    <div className="text-white font-medium">{env.name}</div>
                    <div className="text-xs text-slate-500">{env.key}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <code
                    className="text-xs bg-slate-950 px-3 py-1.5 rounded text-slate-400 cursor-pointer font-mono hover:bg-slate-900 transition-colors break-all"
                    onClick={() => toggleReveal(env.key)}
                    title="Click to reveal"
                    role="button"
                    aria-label={revealedKeys.has(env.key) ? 'Hide SDK key' : 'Reveal SDK key'}
                  >
                    {revealedKeys.has(env.key) ? env.sdkKey : maskKey(env.sdkKey)}
                  </code>
                  <CopyButton text={env.sdkKey} />
                  {rotateConfirm === env.key ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400">Rotate?</span>
                      <button onClick={() => handleRotateKey(env.key)} className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors" aria-label="Confirm rotate">Yes</button>
                      <button onClick={() => setRotateConfirm(null)} className="text-xs text-slate-400 hover:text-slate-300 transition-colors" aria-label="Cancel rotate">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setRotateConfirm(env.key)} className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors" aria-label={`Rotate SDK key for ${env.name}`}>
                      Rotate Key
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* SDK Integration */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">SDK Integration</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Installation</h3>
            <CodeBlock code={installSnippet} language="bash" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Usage</h3>
            <CodeBlock code={usageSnippet} language="typescript" />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-slate-800 border-l-4 border-l-red-600 border border-red-900/50 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-4">Deleting this project is permanent and cannot be undone.</p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
            aria-label="Delete project"
          >
            Delete Project
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">Type <strong className="text-white">{projectName}</strong> to confirm:</p>
            <input
              type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 w-full sm:w-64 transition-colors"
              placeholder={projectName}
              aria-label="Type project name to confirm deletion"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteProject}
                disabled={deleteInput !== projectName}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
                aria-label="Confirm project deletion"
              >
                Confirm Delete
              </button>
              <button onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }} className="text-sm text-slate-400 hover:text-white transition-colors" aria-label="Cancel deletion">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
