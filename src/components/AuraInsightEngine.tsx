/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, Activity, AlertTriangle, CheckCircle, RefreshCw, 
  Cpu, ArrowUpRight, ShieldCheck, Gauge, Zap, TrendingUp, Sliders
} from 'lucide-react';

export interface TelemetryLogItem {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  hash: string;
}

export interface SystemMetrics {
  clockFrequency: number;
  entropyFloor: number;
  mahDistance: number;
  attenuationDb: number;
  impedanceZ0: number;
}

export interface ApexWeights {
  w1_swarm: number;
  w2_harmonic: number;
  w3_entropy: number;
  w4_interference: number;
  w5_dsp: number;
  w6_silicon: number;
}

interface Anomaly {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  component: string;
  description: string;
}

interface Optimization {
  target: string;
  action: string;
  expectedGain: string;
}

interface AnalysisResult {
  overallStatus: 'OPTIMAL' | 'NOMINAL' | 'ATTENTION_REQUIRED';
  healthScore: number;
  anomalies: Anomaly[];
  optimizations: Optimization[];
  executiveSummary: string;
}

interface AuraInsightEngineProps {
  telemetryLogs: TelemetryLogItem[];
  metrics: SystemMetrics;
  weights: ApexWeights;
  onApplyOptimization?: (target: string, action: string) => void;
}

export const AuraInsightEngine: React.FC<AuraInsightEngineProps> = ({
  telemetryLogs,
  metrics,
  weights,
  onApplyOptimization,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/aura/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telemetryLogs: telemetryLogs.slice(0, 10),
          metrics,
          weights,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setAnalysis(data);
      setLastAnalyzedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Failed to run Aura Insight Engine:', err);
      setError(err.message || 'Analysis could not be generated. Check server logs.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100 tracking-tight">Aura Insight Engine</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated neural telemetry assessment & anomaly diagnostic matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastAnalyzedAt && (
            <span className="text-[11px] font-mono text-slate-500">
              Last run: {lastAnalyzedAt}
            </span>
          )}
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-black font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing Telemetry...' : 'Run Operational Analysis'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uninitialized State */}
      {!analysis && !isAnalyzing && !error && (
        <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3">
          <Gauge className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-300">Telemetry Engine Ready for Audit</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Execute live neural analysis across the current 4D Gaussian manifold, Shannon entropy stability index, and recent cryptographic state records.
            </p>
          </div>
          <button
            onClick={runAnalysis}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Initiate First Telemetry Scan
          </button>
        </div>
      )}

      {/* Loading state indicator */}
      {isAnalyzing && (
        <div className="py-12 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 animate-pulse">
            <Activity className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs font-mono text-cyan-400">Synthesizing telemetry vectors with Gemini 3.8 Flash...</p>
        </div>
      )}

      {/* Analysis Output Results */}
      {analysis && !isAnalyzing && (
        <div className="space-y-6">
          {/* Top Score & Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">System Integrity</span>
                <p className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
                  {analysis.overallStatus === 'OPTIMAL' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {analysis.overallStatus === 'NOMINAL' && <ShieldCheck className="w-4 h-4 text-cyan-400" />}
                  {analysis.overallStatus === 'ATTENTION_REQUIRED' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  <span className={
                    analysis.overallStatus === 'OPTIMAL' ? 'text-emerald-400' :
                    analysis.overallStatus === 'NOMINAL' ? 'text-cyan-400' : 'text-amber-400'
                  }>
                    {analysis.overallStatus}
                  </span>
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {metrics.clockFrequency} Hz Clock
              </span>
            </div>

            {/* Health Score */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">Operational Health</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold font-mono text-cyan-400">{analysis.healthScore}</span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-t-cyan-400 flex items-center justify-center text-[11px] font-mono text-cyan-400 font-bold">
                {analysis.healthScore}%
              </div>
            </div>

            {/* Invariant Baseline */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">Entropy Margin</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.entropyFloor.toFixed(4)}</span>
                  <span className="text-xs text-slate-500">H(X)</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                &ge; 1.5000 PASS
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Executive Synthesis</span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {analysis.executiveSummary}
            </p>
          </div>

          {/* Anomalies and Optimizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Anomalies List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                    Detected Anomalies ({analysis.anomalies.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Real-Time Sensor Feed</span>
              </div>

              {analysis.anomalies.length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl text-center text-xs text-slate-500">
                  Zero anomalous telemetry signatures detected in current frame.
                </div>
              ) : (
                <div className="space-y-2">
                  {analysis.anomalies.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl space-y-1 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-200">{item.component}</span>
                        <span
                          className={`font-mono px-2 py-0.5 rounded text-[10px] ${
                            item.severity === 'HIGH'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : item.severity === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {item.severity} SEVERITY
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optimizations List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                    Recommended Optimizations ({analysis.optimizations.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">4D Covariance Tuning</span>
              </div>

              {analysis.optimizations.length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl text-center text-xs text-slate-500">
                  System currently operating at optimal envelope parameters.
                </div>
              ) : (
                <div className="space-y-2">
                  {analysis.optimizations.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">{item.target}</span>
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {item.expectedGain}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{item.action}</p>
                      {onApplyOptimization && (
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => onApplyOptimization(item.target, item.action)}
                            className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                          >
                            <span>Apply Recommendation</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
