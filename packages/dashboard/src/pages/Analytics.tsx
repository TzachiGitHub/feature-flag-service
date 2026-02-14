import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useProjectStore } from '../stores/projectStore';

const PERIODS = ['1h', '24h', '7d', '30d'] as const;
type Period = (typeof PERIODS)[number];
const PERIOD_LABELS: Record<Period, string> = { '1h': 'Last Hour', '24h': 'Last 24h', '7d': 'Last 7 Days', '30d': 'Last 30 Days' };

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899'];

interface EvalData {
  totalEvaluations: number;
  uniqueContexts: number;
  activeFlags: number;
  trend?: number;
  contextsTrend?: number;
  flagsTrend?: number;
  buckets: Array<{ time: string; count: number }>;
  flags?: string[];
}

interface Breakdown {
  variations: Array<{ name: string; count: number; percentage: number }>;
}

interface StaleFlag {
  key: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

// Animated counter
function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = value;
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{formatNumber(display)}</>;
}

// Skeleton
function SkeletonCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 animate-pulse">
      <div className="h-4 w-24 bg-slate-700 rounded mb-3" />
      <div className="h-8 w-20 bg-slate-700 rounded mb-2" />
      <div className="h-3 w-32 bg-slate-700/50 rounded" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 animate-pulse">
      <div className="h-5 w-40 bg-slate-700 rounded mb-4" />
      <div className="h-64 bg-slate-700/30 rounded-lg flex items-end gap-1 px-4 pb-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 bg-slate-700/50 rounded-t" style={{ height: `${20 + Math.random() * 60}%` }} />
        ))}
      </div>
    </div>
  );
}

// Stat card icons
function EvalIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  );
}

// SVG Bar Chart with gradient fills
function BarChart({ buckets, hoveredIndex, onHover, chartType }: {
  buckets: Array<{ time: string; count: number }>;
  hoveredIndex: number | null;
  onHover: (i: number | null) => void;
  chartType: 'bar' | 'line';
}) {
  const W = 700, H = 250, PAD = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const max = Math.max(...buckets.map(b => b.count), 1);
  const barW = buckets.length > 0 ? chartW / buckets.length : chartW;

  const yTicks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  if (chartType === 'line') {
    const points = buckets.map((b, i) => ({
      x: PAD.left + i * barW + barW / 2,
      y: PAD.top + chartH - (b.count / max) * chartH,
    }));
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = linePath + ` L ${points[points.length - 1]?.x ?? PAD.left} ${PAD.top + chartH} L ${points[0]?.x ?? PAD.left} ${PAD.top + chartH} Z`;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-64">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((t, i) => {
          const y = PAD.top + chartH - (t / max) * chartH;
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#334155" strokeWidth={1} />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>{formatNumber(t)}</text>
            </g>
          );
        })}
        {points.length > 0 && (
          <>
            <path d={areaPath} fill="url(#lineGrad)" />
            <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i} onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r={hoveredIndex === i ? 5 : 3} fill={hoveredIndex === i ? '#818cf8' : '#6366f1'} stroke="#1e293b" strokeWidth={2} />
                {hoveredIndex === i && (
                  <g>
                    <rect x={p.x - 40} y={p.y - 30} width={80} height={24} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
                    <text x={p.x} y={p.y - 14} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">{buckets[i].count.toLocaleString()}</text>
                  </g>
                )}
              </g>
            ))}
          </>
        )}
        {buckets.map((b, i) => (
          (buckets.length <= 12 || i % Math.ceil(buckets.length / 12) === 0) ? (
            <text key={i} x={PAD.left + i * barW + barW / 2} y={H - PAD.bottom + 16} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              {b.time}
            </text>
          ) : null
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-64">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => {
        const y = PAD.top + chartH - (t / max) * chartH;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#334155" strokeWidth={1} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>{formatNumber(t)}</text>
          </g>
        );
      })}
      {buckets.map((b, i) => {
        const x = PAD.left + i * barW;
        const h = (b.count / max) * chartH;
        const y = PAD.top + chartH - h;
        const isHovered = hoveredIndex === i;
        return (
          <g key={i} onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)} className="cursor-pointer">
            <rect x={x + 2} y={y} width={Math.max(barW - 4, 2)} height={h} rx={3}
              fill={isHovered ? 'url(#barGradHover)' : 'url(#barGrad)'} className="transition-all duration-150" />
            {isHovered && (
              <g>
                <rect x={x + barW / 2 - 40} y={y - 32} width={80} height={26} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
                <text x={x + barW / 2} y={y - 15} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">{b.count.toLocaleString()}</text>
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#94a3b8" fontSize={8}>{b.time}</text>
              </g>
            )}
            {(buckets.length <= 12 || i % Math.ceil(buckets.length / 12) === 0) && (
              <text x={x + barW / 2} y={H - PAD.bottom + 16} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                {b.time}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// SVG Donut Chart with hover tooltips and center label
function DonutChart({ variations }: { variations: Breakdown['variations'] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const size = 180, cx = size / 2, cy = size / 2, r = 65, thickness = 20;
  let cumAngle = -90;
  const total = variations.reduce((s, v) => s + v.count, 0);

  const arcs = variations.map((v, i) => {
    const angle = (v.percentage / 100) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const ir = r - thickness;
    const x3 = cx + ir * Math.cos(endRad);
    const y3 = cy + ir * Math.sin(endRad);
    const x4 = cx + ir * Math.cos(startRad);
    const y4 = cy + ir * Math.sin(startRad);
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${ir} ${ir} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    return { d, color: CHART_COLORS[i % CHART_COLORS.length], name: v.name, percentage: v.percentage, count: v.count };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-44 h-44">
          {arcs.map((a, i) => (
            <path key={i} d={a.d} fill={a.color}
              className="transition-opacity duration-150 cursor-pointer"
              opacity={hovered !== null && hovered !== i ? 0.4 : 1}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={16} fontWeight="bold">{formatNumber(total)}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize={9}>total</text>
        </svg>
        {hovered !== null && arcs[hovered] && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap shadow-lg pointer-events-none z-10">
            <span className="font-semibold text-white">{arcs[hovered].name}</span>
            <span className="text-slate-400 ml-2">{arcs[hovered].count.toLocaleString()} ({arcs[hovered].percentage.toFixed(1)}%)</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {arcs.map((a, i) => (
          <div key={i} className={`flex items-center gap-2 text-sm transition-opacity ${hovered !== null && hovered !== i ? 'opacity-40' : ''}`}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: a.color }} />
            <span className="text-slate-300">{a.name}</span>
            <span className="text-white font-semibold">{a.percentage.toFixed(1)}%</span>
            <span className="text-slate-500">({a.count.toLocaleString()})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Trend badge
function TrendBadge({ value }: { value?: number }) {
  if (value === undefined || value === null) return null;
  const isUp = value >= 0;
  return (
    <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
      <svg className={`w-3 h-3 ${isUp ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
      {Math.abs(value)}% vs prev
    </div>
  );
}

// No data illustration
function NoDataIllustration() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
      <svg className="w-16 h-16 mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
      <p className="text-sm">No evaluation data for this period</p>
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('24h');
  const [flagFilter, setFlagFilter] = useState('');
  const [flagDropdownOpen, setFlagDropdownOpen] = useState(false);
  const [data, setData] = useState<EvalData | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [staleFlags, setStaleFlags] = useState<StaleFlag[]>([]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const { currentProject } = useProjectStore();
  const projectKey = currentProject?.key ?? '';

  useEffect(() => {
    if (!projectKey) return;
    setLoading(true);
    const params: Record<string, string> = { period };
    if (flagFilter) params.flagKey = flagFilter;
    api.get(`/projects/${projectKey}/analytics/evaluations`, { params })
      .then(r => setData(r.data))
      .catch(() => setData({ totalEvaluations: 0, uniqueContexts: 0, activeFlags: 0, buckets: [] }))
      .finally(() => setLoading(false));
  }, [period, flagFilter, projectKey]);

  useEffect(() => {
    if (!projectKey) return;
    if (flagFilter) {
      api.get(`/projects/${projectKey}/analytics/evaluations/${flagFilter}/breakdown`)
        .then(r => setBreakdown(r.data))
        .catch(() => setBreakdown(null));
    } else {
      setBreakdown(null);
    }
  }, [flagFilter, projectKey]);

  useEffect(() => {
    if (!projectKey) return;
    api.get(`/projects/${projectKey}/analytics/stale-flags`, { params: { days: 7 } })
      .then(r => {
        const raw = r.data?.staleFlags || [];
        setStaleFlags(raw.map((f: any) => typeof f === 'string' ? { key: f } : f));
      })
      .catch(() => setStaleFlags([]));
  }, [projectKey]);

  const availableFlags = data?.flags || [];

  const statCards = [
    { label: 'Total Evaluations', value: data?.totalEvaluations ?? 0, trend: data?.trend, icon: <EvalIcon />, gradient: 'from-indigo-500/10 to-transparent' },
    { label: 'Unique Contexts', value: data?.uniqueContexts ?? 0, trend: data?.contextsTrend, icon: <UsersIcon />, gradient: 'from-emerald-500/10 to-transparent' },
    { label: 'Active Flags', value: data?.activeFlags ?? 0, trend: data?.flagsTrend, icon: <FlagIcon />, gradient: 'from-amber-500/10 to-transparent' },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-slate-700 rounded animate-pulse" />
          <div className="h-9 w-64 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Track flag evaluation metrics and usage patterns</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Flag filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFlagDropdownOpen(!flagDropdownOpen)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:border-slate-600 transition-colors flex items-center gap-2 min-w-[160px]"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              <span className="truncate">{flagFilter || 'All flags'}</span>
              {flagFilter && (
                <button onClick={(e) => { e.stopPropagation(); setFlagFilter(''); setFlagDropdownOpen(false); }} className="ml-auto text-slate-500 hover:text-white">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </button>
            {flagDropdownOpen && availableFlags.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                {availableFlags.map(f => (
                  <button key={f} onClick={() => { setFlagFilter(f); setFlagDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${flagFilter === f ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300'}`}>
                    <code className="font-mono text-xs">{f}</code>
                  </button>
                ))}
              </div>
            )}
            {flagDropdownOpen && availableFlags.length === 0 && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 p-3">
                <input
                  type="text" placeholder="Type flag key..." value={flagFilter}
                  onChange={e => setFlagFilter(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') setFlagDropdownOpen(false); }}
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Period selector */}
          <div className="flex bg-slate-800 rounded-lg border border-slate-700 p-0.5">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${period === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.gradient} bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all duration-200`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">{card.label}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
                {card.icon}
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              <AnimatedNumber value={card.value} />
            </div>
            <TrendBadge value={card.trend} />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Evaluations Over Time</h2>
            <p className="text-xs text-slate-500 mt-0.5">{PERIOD_LABELS[period]}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Chart type toggle */}
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
              <button onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-md transition-colors ${chartType === 'bar' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                title="Bar chart">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </button>
              <button onClick={() => setChartType('line')}
                className={`p-1.5 rounded-md transition-colors ${chartType === 'line' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                title="Line chart">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </button>
            </div>
            {/* Export CSV */}
            <button className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
        {data?.buckets?.length ? (
          <BarChart buckets={data.buckets} hoveredIndex={hoveredBar} onHover={setHoveredBar} chartType={chartType} />
        ) : (
          <NoDataIllustration />
        )}
      </div>

      {/* Variation Breakdown */}
      {flagFilter && breakdown && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            Variation Breakdown — <code className="text-indigo-400 text-base font-mono">{flagFilter}</code>
          </h2>
          <DonutChart variations={breakdown.variations} />
        </div>
      )}

      {/* Stale Flags */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Stale Flags</h2>
            <p className="text-xs text-slate-500 mt-0.5">Flags with no evaluations in 7+ days</p>
          </div>
          {staleFlags.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">{staleFlags.length} stale</span>
          )}
        </div>
        {staleFlags.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-slate-400 text-sm">No stale flags detected — great job!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {staleFlags.map(f => (
              <div key={f.key} className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-3 border border-slate-700/50 hover:border-slate-600 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <code className="text-indigo-400 text-sm bg-slate-950 px-2 py-0.5 rounded font-mono">{f.key}</code>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-amber-400">No evaluations in 7+ days</span>
                  <button className="text-xs text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all">
                    Go to flag →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
