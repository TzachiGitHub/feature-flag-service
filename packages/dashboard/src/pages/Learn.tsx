import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { learnContent } from '../data/learnContent';

function parseContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  const str = text;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{str.slice(lastIndex, match.index)}</span>);
    }
    const m = match[1];
    if (m.startsWith('**')) {
      parts.push(<strong key={key++} className="text-white font-semibold">{m.slice(2, -2)}</strong>);
    } else if (m.startsWith('`')) {
      parts.push(<code key={key++} className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded text-sm">{m.slice(1, -1)}</code>);
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < str.length) {
    parts.push(<span key={key++}>{str.slice(lastIndex)}</span>);
  }
  return parts;
}

function CodeExample({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const highlighted = code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(\/\/.*)/g, '<span class="text-slate-500">$1</span>')
    .replace(/('.*?'|".*?")/g, '<span class="text-emerald-400">$1</span>')
    .replace(/\b(import|from|export|function|return|const|let|var|if|else|async|await|new)\b/g, '<span class="text-indigo-400">$1</span>')
    .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-amber-400">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-cyan-400">$1</span>');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 relative group">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-slate-500">{language}</div>
        <button
          onClick={handleCopy}
          className="text-xs text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Copy code"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300"
        dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  );
}

export default function Learn() {
  const [activeId, setActiveId] = useState(learnContent[0]?.id || '');
  const [tocOpen, setTocOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollTo = (id: string) => {
    setActiveId(id);
    setTocOpen(false);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    for (const topic of learnContent) {
      const el = sectionRefs.current[topic.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-full relative">
      {/* Mobile TOC toggle */}
      <button
        className="lg:hidden fixed top-20 left-4 z-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
        onClick={() => setTocOpen(!tocOpen)}
        aria-label="Toggle table of contents"
        aria-expanded={tocOpen}
      >
        📖 Contents
      </button>

      {/* Mobile TOC overlay */}
      {tocOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setTocOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <motion.nav
            className="absolute left-0 top-0 w-64 h-full bg-slate-900 border-r border-slate-700 p-4 overflow-y-auto"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Table of contents"
          >
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Learn</h2>
            <ul className="space-y-1">
              {learnContent.map(topic => (
                <li key={topic.id}>
                  <button
                    onClick={() => scrollTo(topic.id)}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      activeId === topic.id
                        ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    aria-label={topic.title}
                  >
                    <span className="mr-2">{topic.icon}</span>
                    {topic.title}
                  </button>
                </li>
              ))}
            </ul>
          </motion.nav>
        </div>
      )}

      {/* Desktop sidebar TOC */}
      <nav className="hidden lg:block w-64 flex-shrink-0 border-r border-slate-700 p-4 overflow-y-auto sticky top-0 h-screen" aria-label="Table of contents">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Learn</h2>
        <ul className="space-y-1">
          {learnContent.map(topic => (
            <li key={topic.id}>
              <button
                onClick={() => scrollTo(topic.id)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-all duration-150 ${
                  activeId === topic.id
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                aria-label={topic.title}
              >
                <span className="mr-2">{topic.icon}</span>
                {topic.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl pt-14 lg:pt-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Learn Feature Flags</h1>
        <p className="text-slate-400 mb-10">Everything you need to know about feature flags, from basics to advanced architecture.</p>

        {learnContent.map(topic => (
          <motion.div
            key={topic.id}
            id={topic.id}
            ref={el => { sectionRefs.current[topic.id] = el; }}
            className="mb-16"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">{topic.icon}</span>
              {topic.title}
            </h2>
            {topic.sections.map((section, i) => (
              <div key={i} className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">{section.heading}</h3>
                <div className="text-slate-300 leading-relaxed space-y-3">
                  {section.content.split('\n\n').map((para, j) => (
                    <p key={j}>{parseContent(para)}</p>
                  ))}
                </div>
                {section.codeExample && (
                  <CodeExample code={section.codeExample.code} language={section.codeExample.language} />
                )}
              </div>
            ))}
            {topic.id !== learnContent[learnContent.length - 1].id && (
              <hr className="border-slate-700 mt-10" />
            )}
          </motion.div>
        ))}
      </main>
    </div>
  );
}
