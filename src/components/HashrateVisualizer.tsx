import React, { useState, useMemo, useRef } from 'react';
import { TrendingUp, Activity, Play, Star, Sparkles, Layers, Sliders, Maximize2 } from 'lucide-react';
import { HashratePoint } from '../types';

interface HashrateVisualizerProps {
  history: HashratePoint[];
  isMining: boolean;
  currentHashrate: number;
  averageHashrate: number;
  peakHashrate: number;
  activeThreads: number;
  onToggleMining: () => void;
}

export const HashrateVisualizer: React.FC<HashrateVisualizerProps> = ({
  history,
  isMining,
  currentHashrate,
  averageHashrate,
  peakHashrate,
  activeThreads,
  onToggleMining,
}) => {
  const [timeWindow, setTimeWindow] = useState<'30s' | '1m' | '5m'>('1m');
  const [chartMode, setChartMode] = useState<'smooth' | 'stepped'>('smooth');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Filter history according to time window
  const visiblePoints = useMemo(() => {
    if (!history || history.length === 0) return [];
    const countMap = {
      '30s': 30,
      '1m': 60,
      '5m': 120,
    };
    const maxCount = countMap[timeWindow];
    return history.slice(-maxCount);
  }, [history, timeWindow]);

  const formatHs = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)} MH/s`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)} KH/s`;
    return `${Math.round(val)} H/s`;
  };

  // Dimensions
  const W = 800;
  const H = 220;
  const padLeft = 68;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 28;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  // Compute scale boundaries
  const { maxVal, minVal, pointsData } = useMemo(() => {
    if (visiblePoints.length === 0) {
      return { maxVal: 500, minVal: 0, pointsData: [] };
    }

    const rates = visiblePoints.map(p => p.hashrate);
    const highest = Math.max(500, ...rates, peakHashrate > 0 ? peakHashrate * 1.05 : 0);
    // Dynamic top margin for breathing room
    const ceiling = Math.ceil(highest / 100) * 100;
    const floor = 0;

    const data = visiblePoints.map((pt, idx) => {
      const x = padLeft + (idx / Math.max(1, visiblePoints.length - 1)) * plotW;
      const normalized = (pt.hashrate - floor) / Math.max(1, ceiling - floor);
      const y = padTop + plotH - (normalized * plotH);
      return { ...pt, x, y };
    });

    return { maxVal: ceiling, minVal: floor, pointsData: data };
  }, [visiblePoints, peakHashrate, plotW, plotH, padLeft, padTop]);

  // Generate SVG path strings
  const { linePath, areaPath } = useMemo(() => {
    if (pointsData.length === 0) {
      return { linePath: '', areaPath: '' };
    }
    if (pointsData.length === 1) {
      const p = pointsData[0];
      return {
        linePath: `M ${padLeft} ${p.y} L ${padLeft + plotW} ${p.y}`,
        areaPath: `M ${padLeft} ${p.y} L ${padLeft + plotW} ${p.y} L ${padLeft + plotW} ${padTop + plotH} L ${padLeft} ${padTop + plotH} Z`,
      };
    }

    if (chartMode === 'stepped') {
      let d = `M ${pointsData[0].x} ${pointsData[0].y}`;
      for (let i = 1; i < pointsData.length; i++) {
        const prev = pointsData[i - 1];
        const curr = pointsData[i];
        d += ` H ${curr.x} V ${curr.y}`;
      }
      const area = `${d} L ${pointsData[pointsData.length - 1].x} ${padTop + plotH} L ${pointsData[0].x} ${padTop + plotH} Z`;
      return { linePath: d, areaPath: area };
    }

    // Smooth spline interpolation (Catmull-Rom to Cubic Bezier)
    let d = `M ${pointsData[0].x.toFixed(1)} ${pointsData[0].y.toFixed(1)}`;
    for (let i = 0; i < pointsData.length - 1; i++) {
      const p0 = pointsData[Math.max(0, i - 1)];
      const p1 = pointsData[i];
      const p2 = pointsData[i + 1];
      const p3 = pointsData[Math.min(pointsData.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const firstX = pointsData[0].x.toFixed(1);
    const lastX = pointsData[pointsData.length - 1].x.toFixed(1);
    const bottomY = (padTop + plotH).toFixed(1);
    const area = `${d} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return { linePath: d, areaPath: area };
  }, [pointsData, chartMode, plotW, plotH, padLeft, padTop]);

  // Benchmark Lines Y coordinates
  const avgY = padTop + plotH - ((averageHashrate / Math.max(1, maxVal)) * plotH);
  const peakY = padTop + plotH - ((peakHashrate / Math.max(1, maxVal)) * plotH);

  // Y-axis ticks
  const yTicks = [
    { val: maxVal, y: padTop },
    { val: maxVal * 0.66, y: padTop + plotH * 0.34 },
    { val: maxVal * 0.33, y: padTop + plotH * 0.67 },
    { val: 0, y: padTop + plotH },
  ];

  // Mouse / Touch interaction for crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || pointsData.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * W;

    let closestIdx = 0;
    let minDiff = Infinity;
    pointsData.forEach((pt, i) => {
      const diff = Math.abs(pt.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    setHoveredIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const hoveredPoint = hoveredIndex !== null && pointsData[hoveredIndex] ? pointsData[hoveredIndex] : null;
  const latestPoint = pointsData.length > 0 ? pointsData[pointsData.length - 1] : null;

  // Efficiency calculation (H/s per core)
  const threadEfficiency = activeThreads > 0 ? Math.round(currentHashrate / activeThreads) : 0;

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
      {/* Top Header & Telemetry Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold font-mono text-white tracking-wide">
              Real-Time Hashrate Telemetry
            </h3>
            <span className="text-xs text-slate-500 font-mono">·</span>
            <span className="text-xs font-mono text-slate-400">
              RandomX / ARM64
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-400">
            <span>
              Live: <strong className="text-white tabular-nums">{formatHs(currentHashrate)}</strong>
            </span>
            <span>·</span>
            <span>
              60s Avg: <strong className="text-emerald-400 tabular-nums">{formatHs(averageHashrate)}</strong>
            </span>
            <span>·</span>
            <span>
              Peak: <strong className="text-amber-400 tabular-nums">{formatHs(peakHashrate)}</strong>
            </span>
            {isMining && (
              <>
                <span>·</span>
                <span className="hidden md:inline">
                  Core Yield: <strong className="text-orange-400 tabular-nums">{threadEfficiency} H/s/core</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Chart View Filters & Range Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {/* Chart interpolation mode */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setChartMode('smooth')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                chartMode === 'smooth'
                  ? 'bg-orange-950 text-orange-300 font-bold border border-orange-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Smooth Bezier Curve"
            >
              Smooth
            </button>
            <button
              onClick={() => setChartMode('stepped')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                chartMode === 'stepped'
                  ? 'bg-orange-950 text-orange-300 font-bold border border-orange-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stepped Telemetry Grid"
            >
              Stepped
            </button>
          </div>

          {/* Time range selector */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono">
            {(['30s', '1m', '5m'] as const).map(w => (
              <button
                key={w}
                onClick={() => setTimeWindow(w)}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  timeWindow === w
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative mt-3 w-full h-56 sm:h-64 select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full cursor-crosshair overflow-visible"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Area Fill Gradient */}
            <linearGradient id="hashrateAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.32" />
              <stop offset="45%" stopColor="#f97316" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Stroke Filter */}
            <filter id="hashrateGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f97316" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Grid Lines & Y-Axis Labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={padLeft + plotW}
                y2={tick.y}
                stroke="#1e293b"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={tick.y + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="end"
              >
                {formatHs(tick.val)}
              </text>
            </g>
          ))}

          {/* Average Guideline (Emerald) */}
          {averageHashrate > 0 && avgY >= padTop && avgY <= padTop + plotH && (
            <g>
              <line
                x1={padLeft}
                y1={avgY}
                x2={padLeft + plotW}
                y2={avgY}
                stroke="#10b981"
                strokeDasharray="6 3"
                strokeWidth="1.2"
                strokeOpacity="0.75"
              />
              <text
                x={padLeft + plotW - 4}
                y={avgY - 4}
                fill="#10b981"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                Avg {formatHs(averageHashrate)}
              </text>
            </g>
          )}

          {/* Peak Guideline (Amber) */}
          {peakHashrate > 0 && peakY >= padTop && peakY <= padTop + plotH && (
            <g>
              <line
                x1={padLeft}
                y1={peakY}
                x2={padLeft + plotW}
                y2={peakY}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth="1"
                strokeOpacity="0.6"
              />
              <text
                x={padLeft + plotW - 4}
                y={peakY - 4}
                fill="#f59e0b"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                Peak {formatHs(peakHashrate)}
              </text>
            </g>
          )}

          {/* Area Fill */}
          {areaPath && (
            <path d={areaPath} fill="url(#hashrateAreaGrad)" />
          )}

          {/* Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#f97316"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#hashrateGlow)"
            />
          )}

          {/* Share Found Markers (Glow Stars) */}
          {pointsData.map((pt, idx) => {
            if (!pt.hasShare) return null;
            return (
              <g key={`share-${idx}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="6"
                  fill="#10b981"
                  fillOpacity="0.4"
                  className="animate-ping"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Live Head Point Pulse Indicator */}
          {latestPoint && isMining && (
            <g>
              <circle
                cx={latestPoint.x}
                cy={latestPoint.y}
                r="7"
                fill="#f97316"
                fillOpacity="0.3"
                className="animate-ping"
              />
              <circle
                cx={latestPoint.x}
                cy={latestPoint.y}
                r="4.5"
                fill="#f97316"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Crosshair / Hover Guideline */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padTop}
                x2={hoveredPoint.x}
                y2={padTop + plotH}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
                strokeOpacity="0.7"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="5"
                fill="#ffffff"
                stroke="#f97316"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X-Axis Baseline */}
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* X-Axis Time Labels */}
          {pointsData.length > 0 && (
            <>
              <text
                x={padLeft}
                y={H - 6}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="start"
              >
                {pointsData[0].timeLabel || 'T-60s'}
              </text>
              <text
                x={padLeft + plotW / 2}
                y={H - 6}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Window: {timeWindow}
              </text>
              <text
                x={padLeft + plotW}
                y={H - 6}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="end"
              >
                {pointsData[pointsData.length - 1].timeLabel || 'Now'}
              </text>
            </>
          )}
        </svg>

        {/* Floating Interactive Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none px-3 py-1.5 rounded-lg bg-slate-950/95 border border-slate-700/90 shadow-2xl backdrop-blur-md text-xs font-mono text-slate-100 transition-all -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoveredPoint.x / W) * 100}%`,
              top: `${Math.max(12, (hoveredPoint.y / H) * 100 - 6)}%`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="font-bold text-orange-400 tabular-nums">
                {formatHs(hoveredPoint.hashrate)}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between gap-2 mt-0.5">
              <span>{hoveredPoint.timeLabel}</span>
              {hoveredPoint.hasShare && (
                <span className="text-emerald-400 font-semibold">★ Share Found</span>
              )}
            </div>
          </div>
        )}

        {/* Standby State Overlay when Mining is Inactive */}
        {!isMining && currentHashrate === 0 && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] rounded-lg flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-2">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold font-mono text-white">XMRig Miner on Standby</h4>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-sm">
              Press Start Mining or hit [Space] to stream real-time ARM64 RandomX performance telemetry.
            </p>
            <button
              onClick={onToggleMining}
              className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Mining Telemetry</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sub-legend & Stats Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-orange-500 rounded" />
            <span>Hashrate curve</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-500 rounded" />
            <span>60s Average</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-500 rounded" />
            <span>Peak</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>P2Pool Share</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>Target: {plotW ? `${visiblePoints.length} samples` : 'Idle'}</span>
          <span>·</span>
          <span>Sampling: 1 Hz</span>
        </div>
      </div>
    </div>
  );
};
