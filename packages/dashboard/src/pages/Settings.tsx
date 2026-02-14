import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useProjectStore } from '../stores/projectStore';
import { toast } from '../components/Toast';

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
      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  // Simple syntax coloring
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
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [rotateConfirm, setRotateConfirm] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const { currentProject, fetchProjects } = useProjectStore();
  const projectKey = currentProject?.key ?? '';
  const projectName = currentProject?.name ?? 'My Project';

  useEffect(() => {
    api.get(`/projects/${projectKey}/environments`)
      .then(r => setEnvs(r.data?.environments || r.data || []))
      .catch(() => setEnvs([
        { key: 'production', name: 'Production', color: '#f43f5e', sdkKey: 'sdk-prod-abc123xyz' },
        { key: 'staging', name: 'Staging', color: '#f59e0b', sdkKey: 'sdk-stg-def456uvw' },
        { key: 'development', name: 'Development', color: '#10b981', sdkKey: 'sdk-dev-ghi789rst' },
      ]));
  }, []);

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Environments */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Environments</h2>
        <div className="space-y-3">
          {envs.map(env => (
            <div key={env.key} className="flex items-center justify-between bg-slate-900 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: env.color }} />
                <div>
                  <div className="text-white font-medium">{env.name}</div>
                  <div className="text-xs text-slate-500">{env.key}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <code
                  className="text-xs bg-slate-950 px-3 py-1.5 rounded text-slate-400 cursor-pointer font-mono"
                  onClick={() => toggleReveal(env.key)}
                  title="Click to reveal"
                >
                  {revealedKeys.has(env.key) ? env.sdkKey : maskKey(env.sdkKey)}
                </code>
                <CopyButton text={env.sdkKey} />
                {rotateConfirm === env.key ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400">Rotate?</span>
                    <button onClick={() => handleRotateKey(env.key)} className="text-xs text-red-400 hover:text-red-300 font-medium">Yes</button>
                    <button onClick={() => setRotateConfirm(null)} className="text-xs text-slate-400 hover:text-slate-300">No</button>
                  </div>
                ) : (
                  <button onClick={() => setRotateConfirm(env.key)} className="text-xs text-amber-400 hover:text-amber-300 font-medium">
                    Rotate Key
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
      <div className="bg-slate-800 border border-red-900/50 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-4">Deleting this project is permanent and cannot be undone.</p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Delete Project
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">Type <strong className="text-white">{projectName}</strong> to confirm:</p>
            <input
              type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-red-500 w-64"
              placeholder={projectName}
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteProject}
                disabled={deleteInput !== projectName}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Confirm Delete
              </button>
              <button onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }} className="text-sm text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
