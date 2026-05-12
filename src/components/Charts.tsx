'use client';

import React from 'react';

const BLUES = ['#dce8f8', '#a8c4e8', '#6896d0', '#3f64ba', '#253b6e', '#182748'];

type HBarDatum = { label: string; value: number; color?: string };

export function HBarChart({ data, unit = '', maxVal }: { data: HBarDatum[], unit?: string, maxVal?: number }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        const color = d.color || BLUES[Math.min(i + 1, BLUES.length - 1)];
        return (
          <div key={i} className="grid grid-cols-[100px_1fr_40px] gap-3 items-center">
            <span className="text-[11px] text-text-muted font-medium text-right truncate">{d.label}</span>
            <div className="h-5 rounded-lg bg-surface-2 overflow-hidden relative border border-border/10">
              <div 
                className="absolute inset-0 h-full rounded-lg transition-all duration-1000 ease-out" 
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
              {pct > 15 && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white mix-blend-overlay">
                  {d.value}{unit}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-text-muted text-right">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

type LineDatum = { label: string; value: number };

export function LineChart({ data, height = 140, color = BLUES[3] }: { data: LineDatum[], height?: number, color?: string }) {
  const W = 400, H = height;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const padL = 30, padR = 10, padT = 10, padB = 25;
  const iW = W - padL - padR;
  const iH = H - padT - padB;

  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1 || 1)) * iW,
    y: padT + (1 - (d.value - min) / range) * iH,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(padT + iH).toFixed(1)} L${padL},${(padT + iH).toFixed(1)} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMid meet" className="block overflow-visible">
      <defs>
        <linearGradient id={`lcArea${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {[0, 0.5, 1].map((f, i) => {
        const y = padT + (1 - f) * iH;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="currentColor" className="text-border" strokeWidth="1" strokeDasharray="4 4" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="9" className="fill-text-muted font-sans">{Math.round(min + f * range)}</text>
          </g>
        );
      })}
      {/* Area */}
      <path d={areaPath} fill={`url(#lcArea${color.replace('#', '')})`} />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="drop-shadow-sm" />
      {/* Points */}
      {pts.map((p, i) => (
        <g key={i} className="group/pt">
          <circle 
            cx={p.x} cy={p.y} r="3.5" 
            className="fill-accent stroke-surface border-2 transition-all duration-200 group-hover/pt:r-5" 
            style={{ fill: color, stroke: 'var(--background)', strokeWidth: 2 }} 
          />
          <text x={p.x} y={H - 5} textAnchor="middle" fontSize="9" className="fill-text-muted font-medium">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}
