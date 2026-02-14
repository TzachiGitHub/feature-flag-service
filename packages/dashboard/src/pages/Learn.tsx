import React, { useState, useEffect, useRef, useCallback } from 'react';
import { learnContent, LearnTopic } from '../data/learnContent';

// Track reading progress in localStorage
function useReadingProgress() {
  const [read, setRead] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('learn-progress');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const markRead = useCallback((id: string) => {
    setRead(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('learn-progress', JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { read, markRead };
}

function estimateReadingTime(topic: LearnTopic): number {
  const totalWords = topic.sections.reduce((sum, s) => {
    const contentWords = s.content.split(/\s+/).length;
    const codeWords = s.codeExample ? s.codeExample.code.split(/\s+/).length * 0.5 : 0;
    return sum + contentWords + codeWords;
  }, 0);
  return Math.max(1, Math.round(totalWords / 200));
}

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
      parts.push(<code key={key++} className="text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded text-sm font-mono">{m.slice(1, -1)}</code>);
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < str.length) {
    parts.push(<span key={key++}>{str.slice(lastIndex)}</span>);
  }
  return parts;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`text-xs font-medium px-2 py-1 rounded transition-all ${
        copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-white hover:bg-slate-700'
      }`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function CodeExample({ code, language }: { code: string; language: string }) {
  const highlighted = code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(\/\/.*)/g, '<span class="text-slate-500">$1</span>')
    .replace(/('.*?'|".*?")/g, '<span class="text-emerald-400">$1</span>')
    .replace(/\b(import|from|export|function|return|const|let|var|if|else|async|await|new)\b/g, '<span class="text-indigo-400">$1</span>')
    .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-amber-400">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-cyan-400">$1</span>');

  return (
    <div className="my-3 relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CopyButton text={code} />
      </div>
      <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-slate-600" />
        {language}
      </div>
      <pre className="bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto text-slate-300 border border-slate-800"
        dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  );
}

// Category grouping
const CATEGORIES: Record<string, string[]> = {
  'Getting Started': ['what-are-feature-flags', 'types-of-feature-flags', 'feature-flag-lifecycle'],
  'Targeting & Rollouts': ['targeting-and-segmentation', 'percentage-rollouts'],
  'Advanced Patterns': ['ab-testing', 'trunk-based-development', 'dark-launches', 'kill-switches'],
  'Best Practices': ['flag-debt', 'client-vs-server-evaluation'],
};

function getCategoryForTopic(id: string): string {
  for (const [cat, ids] of Object.entries(CATEGORIES)) {
    if (ids.includes(id)) return cat;
  }
  return 'Other';
}

export default function Learn() {
  const [activeId, setActiveId] = useState(learnContent[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { read, markRead } = useReadingProgress();

  const scrollTo = (id: string) => {
    setActiveId(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveId(id);
            // Mark as read after 3 seconds of visibility
            const timeout = setTimeout(() => markRead(id), 3000);
            return () => clearTimeout(timeout);
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
  }, [markRead]);

  const totalTopics = learnContent.length;
  const readCount = learnContent.filter(t => read.has(t.id)).length;
  const progressPercent = totalTopics > 0 ? Math.round((readCount / totalTopics) * 100) : 0;

  // Filter topics by search
  const filteredTopics = searchQuery
    ? learnContent.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sections.some(s => s.heading.toLowerCase().includes(searchQuery.toLowerCase()) || s.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : learnContent;

  // Navigate between topics
  const currentIndex = learnContent.findIndex(t => t.id === activeId);
  const prevTopic = currentIndex > 0 ? learnContent[currentIndex - 1] : null;
  const nextTopic = currentIndex < learnContent.length - 1 ? learnContent[currentIndex + 1] : null;

  return (
    <div className="flex h-full">
      {/* Sidebar TOC */}
      <nav className="w-72 flex-shrink-0 border-r border-slate-700 overflow-y-auto sticky top-0 h-screen">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Learn</h2>

          {/* Progress */}
          <div className="mb-4 bg-slate-800 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400">Progress</span>
              <span className="text-white font-semibold">{readCount}/{totalTopics}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Topics grouped by category */}
          {Object.entries(CATEGORIES).map(([category, topicIds]) => {
            const categoryTopics = topicIds
              .map(id => learnContent.find(t => t.id === id))
              .filter((t): t is LearnTopic => t !== undefined)
              .filter(t => !searchQuery || filteredTopics.includes(t));

            if (categoryTopics.length === 0) return null;

            return (
              <div key={category} className="mb-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-3">{category}</h3>
                <ul className="space-y-0.5">
                  {categoryTopics.map(topic => {
                    const isRead = read.has(topic.id);
                    const isActive = activeId === topic.id;
                    const readTime = estimateReadingTime(topic);
                    return (
                      <li key={topic.id}>
                        <button
                          onClick={() => scrollTo(topic.id)}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                            isActive
                              ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {/* Progress dot */}
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRead ? 'bg-emerald-400' : isActive ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{topic.icon}</span>
                              <span className="truncate">{topic.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-600">{readTime} min read</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Learn Feature Flags</h1>
          <p className="text-slate-400">Everything you need to know about feature flags, from basics to advanced architecture.</p>
        </div>

        {filteredTopics.map((topic, topicIndex) => {
          const readTime = estimateReadingTime(topic);
          const isRead = read.has(topic.id);

          return (
            <div
              key={topic.id}
              id={topic.id}
              ref={el => { sectionRefs.current[topic.id] = el; }}
              className="mb-16"
            >
              {/* Topic header card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{topic.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{topic.title}</h2>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {readTime} min read
                        </span>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500">{topic.sections.length} sections</span>
                        {isRead && (
                          <>
                            <span className="text-xs text-slate-600">·</span>
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              Read
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-600 bg-slate-800 px-2 py-1 rounded-full">
                    {getCategoryForTopic(topic.id)}
                  </span>
                </div>
              </div>

              {topic.sections.map((section, i) => (
                <div key={i} className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3">{section.heading}</h3>
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

              {/* Next/Previous navigation */}
              {topicIndex === filteredTopics.length - 1 || filteredTopics[topicIndex + 1]?.id !== learnContent[learnContent.findIndex(t => t.id === topic.id) + 1]?.id ? null : (
                <div className="border-t border-slate-700 pt-6 mt-10" />
              )}
            </div>
          );
        })}

        {/* Bottom navigation */}
        <div className="flex items-center justify-between border-t border-slate-700 pt-6 mt-8">
          {prevTopic ? (
            <button
              onClick={() => scrollTo(prevTopic.id)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-slate-500">Previous</div>
                <div>{prevTopic.icon} {prevTopic.title}</div>
              </div>
            </button>
          ) : <div />}
          {nextTopic ? (
            <button
              onClick={() => scrollTo(nextTopic.id)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group text-right"
            >
              <div>
                <div className="text-xs text-slate-500">Next</div>
                <div>{nextTopic.icon} {nextTopic.title}</div>
              </div>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ) : <div />}
        </div>
      </main>
    </div>
  );
}
