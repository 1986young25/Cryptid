/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity, TrendingUp, Shield, Radio } from 'lucide-react';

export interface TelemetryPoint {
  time: string;
  timestamp: number;
  entropy: number;
  mahalanobis: number;
}

interface TelemetryStreamChartProps {
  currentEntropy: number;
  currentMahalanobis: number;
  isSimulating: boolean;
}

export const TelemetryStreamChart: React.FC<TelemetryStreamChartProps> = ({
  currentEntropy,
  currentMahalanobis,
  isSimulating,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dataHistory, setDataHistory] = useState<TelemetryPoint[]>([]);

  // Accumulate time-series points
  useEffect(() => {
    const now = Date.now();
    const timeStr = new Date(now).toTimeString().split(' ')[0];
    
    setDataHistory(prev => {
      const newPoint: TelemetryPoint = {
        time: timeStr,
        timestamp: now,
        entropy: currentEntropy,
        mahalanobis: currentMahalanobis,
      };
      const updated = [...prev, newPoint];
      // Keep last 30 data points
      if (updated.length > 30) {
        return updated.slice(updated.length - 30);
      }
      return updated;
    });
  }, [currentEntropy, currentMahalanobis]);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || dataHistory.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 600;
    const height = 260;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(dataHistory, d => d.timestamp) as [number, number])
      .range([0, innerWidth]);

    const yScaleEntropy = d3.scaleLinear()
      .domain([1.4, 1.8])
      .range([innerHeight, 0]);

    const yScaleMahalanobis = d3.scaleLinear()
      .domain([0.0, 0.3])
      .range([innerHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => d3.timeFormat('%H:%M:%S')(new Date(d as number)));

    const yAxisEntropy = d3.axisLeft(yScaleEntropy)
      .ticks(4);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .style('font-family', 'monospace')
      .style('font-size', '10px');

    g.append('g')
      .call(yAxisEntropy)
      .attr('color', '#64748b')
      .selectAll('text')
      .style('font-family', 'monospace')
      .style('font-size', '10px');

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.15)
      .call(d3.axisLeft(yScaleEntropy).ticks(4).tickSize(-innerWidth).tickFormat(() => ''));

    // Line generators
    const entropyLine = d3.line<TelemetryPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScaleEntropy(d.entropy))
      .curve(d3.curveMonotoneX);

    const mahalanobisLine = d3.line<TelemetryPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScaleMahalanobis(d.mahalanobis))
      .curve(d3.curveMonotoneX);

    // Entropy Path (Cyan)
    g.append('path')
      .datum(dataHistory)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2.5)
      .attr('d', entropyLine);

    // Mahalanobis Path (Purple)
    g.append('path')
      .datum(dataHistory)
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('d', mahalanobisLine);

    // Data points for Entropy
    g.selectAll('.dot-entropy')
      .data(dataHistory)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.timestamp))
      .attr('cy', d => yScaleEntropy(d.entropy))
      .attr('r', 3)
      .attr('fill', '#06b6d4');

  }, [dataHistory]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-tight">Telemetry Stream (D3.js)</h3>
            <p className="text-xs text-slate-400 font-mono">Mahalanobis Distance M(s) & Shannon Entropy H(X) Drifts</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 bg-cyan-400 rounded" />
            <span className="text-slate-300">Entropy H(X)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 bg-purple-400 rounded border-t border-dashed border-purple-400" />
            <span className="text-slate-300">Mahalanobis M(s)</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[260px] bg-slate-950/60 rounded-xl border border-slate-800/80 p-2 relative flex items-center justify-center">
        {dataHistory.length < 2 ? (
          <div className="text-xs text-slate-500 font-mono animate-pulse">Initializing D3 stream buffer...</div>
        ) : (
          <svg ref={svgRef} className="w-full h-full overflow-visible" />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-mono">Live Entropy Value</span>
            <p className="text-base font-bold font-mono text-cyan-400 mt-0.5">{currentEntropy.toFixed(4)} bits</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
            Stable (&ge; 1.50)
          </span>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-mono">Live Mahalanobis Distance</span>
            <p className="text-base font-bold font-mono text-purple-400 mt-0.5">{currentMahalanobis.toFixed(4)} M(s)</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono border border-purple-500/20">
            Optimal (&le; 0.15)
          </span>
        </div>
      </div>
    </div>
  );
};
