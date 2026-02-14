import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import { useProjectStore } from '../stores/projectStore';
import { StatCardSkeleton, ChartSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorBoundary';
import { staggerContainer, staggerItem } from '../lib/animations';

const PERIODS = ['1h', '24h', '7d', '30d'] as const;
type Period = (typeof PERIODS)[number];

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899'];

interface EvalData {
  totalEvaluations: number;
  uniqueContexts: number;
  activeFlags: number;
  trend?: number;
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
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 500;
    const start = performance.now();
    const startVal = 0;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (value - startVal) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{formatNumber(display)}</>;
}

function BarChart({ buckets, hoveredIndex, onHover }: {
  buckets: Array<{ time: string; count: number }>;
  hoveredIndex: number | null;
  onHover: (i: number | null) => void;
}) {
  const W = 700, H = 250, PAD = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const max = Math.max(...buckets.map(b => b.count), 1);
  const barW = buckets.length > 0 ? chartW / buckets.length : chartW;

  const yTicks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48 sm:h-64" role="img" aria-label="Evaluations bar chart">
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
            <rect x={x + 2} y={y} width={Math.max(barW - 4, 2)} height={h} rx={2}
              fill={isHovered ? '#818cf8' : '#6366f1'} opacity={isHovered ? 1 : 0.8}>
              <animate attributeName="height" from="0" to={String(h)} dur="0.5s" fill="freeze" />
              <animate attributeName="y" from={String(PAD.top + chartH)} to={String(y)} dur="0.5s" fill="freeze" />
            </rect>
            {isHovered && (
              <g>
                <rect x={x + barW / 2 - 35} y={y - 28} width={70} height={22} rx={4} fill="#1e293b" stroke="#475569" />
                <text x={x + barW / 2} y={y - 13} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">{b.count.toLocaleString()}</text>
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

function DonutChart({ variations }: { variations: Breakdown['variations'] }) {
  const size = 180, cx = size / 2, cy = size / 2, r = 65, thickness = 20;
  let cumAngle = -90;

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
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-36 h-36 sm:w-44 sm:h-44" role="img" aria-label="Variation breakdown chart">
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color} className="hover:opacity-80 transition-opacity" />
        ))}
      </svg>
      <div className="space-y-2">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
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

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('24h');
  const [flagFilter, setFlagFilter] = useState('');
  const [data, setData] = useState<EvalData | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [staleFlags, setStaleFlags] = useState<StaleFlag[]>([]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { currentProject } = useProjectStore();
  const projectKey = currentProject?.key ?? '';

  useEffect(() => {
    if (!projectKey) return;
    setLoading(true);
    setError(false);
    const params: any = { period };
    if (flagFilter) params.flagKey = flagFilter;
    api.get(`/projects/${projectKey}/analytics/evaluations`, { params })
      .then(r => setData(r.data))
      .catch(() => { setData({ totalEvaluations: 0, uniqueContexts: 0, activeFlags: 0, buckets: [] }); setError(true); })
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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            placeholder="Filter by flag key..."
            value={flagFilter}
            onChange={e => setFlagFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            aria-label="Filter analytics by flag key"
          />
          <div className="flex bg-slate-800 rounded-lg border border-slate-700">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium transition-all duration-150 ${period === p ? 'bg-indigo-600 text-white rounded-lg' : 'text-slate-400 hover:text-white'}`}
                aria-label={`Show ${p} period`}
                aria-pressed={period === p}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <StatCardSkeleton />
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {[
            { label: 'Total Evaluations', value: data?.totalEvaluations ?? 0, trend: data?.trend },
            { label: 'Unique Contexts', value: data?.uniqueContexts ?? 0 },
            { label: 'Active Flags', value: data?.activeFlags ?? 0 },
          ].map((card, i) => (
            <motion.div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:-translate-y-[1px] hover:shadow-lg transition-all duration-150"
              variants={staggerItem}
            >
              <div className="text-sm text-slate-400 mb-1">{card.label}</div>
              <div className="text-3xl font-bold text-white">
                <AnimatedNumber value={card.value} />
              </div>
              {card.trend !== undefined && (
                <div className={`text-sm mt-1 ${card.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {card.trend >= 0 ? '↑' : '↓'} {Math.abs(card.trend)}% vs previous period
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Chart */}
      {loading ? (
        <ChartSkeleton />
      ) : error ? (
        <ErrorState title="Failed to load analytics" onRetry={() => setPeriod(period)} />
      ) : (
        <motion.div
          className="bg-slate-800 border border-slate-700 rounded-xl p-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Evaluations Over Time</h2>
          {data?.buckets?.length ? (
            <BarChart buckets={data.buckets} hoveredIndex={hoveredBar} onHover={setHoveredBar} />
          ) : (
            <div className="h-48 sm:h-64 flex items-center justify-center text-slate-500">No evaluation data for this period</div>
          )}
        </motion.div>
      )}

      {/* Variation Breakdown */}
      {flagFilter && breakdown && (
        <motion.div
          className="bg-slate-800 border border-slate-700 rounded-xl p-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Variation Breakdown — {flagFilter}</h2>
          <DonutChart variations={breakdown.variations} />
        </motion.div>
      )}

      {/* Stale Flags */}
      <motion.div
        className="bg-slate-800 border border-slate-700 rounded-xl p-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Stale Flags</h2>
        {staleFlags.length === 0 ? (
          <div className="text-slate-500 text-sm">No stale flags detected 🎉</div>
        ) : (
          <div className="space-y-2">
            {staleFlags.map(f => (
              <div key={f.key} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 rounded-lg px-4 py-3 border border-slate-700/50 gap-2 hover:bg-slate-850 transition-colors">
                <code className="text-indigo-400 text-sm bg-slate-950 px-2 py-0.5 rounded font-mono">{f.key}</code>
                <span className="text-xs text-amber-400">No evaluations in 7+ days</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
