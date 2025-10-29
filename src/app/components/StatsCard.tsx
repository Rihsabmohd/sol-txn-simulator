// components/StatsCard.tsx
"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalSimulations: number;
  successRate: number;
  avgComputeUnits: number;
  avgPriorityFee: number;
  mevDetected: number;
  savedFromFailure: number;
}

export default function StatsCard() {
  const [stats, setStats] = useState<Stats>({
    totalSimulations: 0,
    successRate: 0,
    avgComputeUnits: 0,
    avgPriorityFee: 0,
    mevDetected: 0,
    savedFromFailure: 0,
  });

  useEffect(() => {
    // Load stats from localStorage
    const loadStats = () => {
      const stored = localStorage.getItem("simulator-stats");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setStats(parsed);
        } catch (err) {
          console.error("Failed to parse stats:", err);
        }
      }
    };

    loadStats();
    
    // Update every 5 seconds
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      <div className="border border-green-500/30 bg-green-950/10 rounded p-3">
        <div className="text-green-500/60 text-xs font-mono mb-1">Total Simulations</div>
        <div className="text-green-400 font-mono font-bold text-2xl">
          {stats.totalSimulations.toLocaleString()}
        </div>
      </div>

      <div className="border border-green-500/30 bg-green-950/10 rounded p-3">
        <div className="text-green-500/60 text-xs font-mono mb-1">Success Rate</div>
        <div className="text-green-400 font-mono font-bold text-2xl">
          {stats.successRate.toFixed(0)}%
        </div>
      </div>

      <div className="border border-green-500/30 bg-green-950/10 rounded p-3">
        <div className="text-green-500/60 text-xs font-mono mb-1">Avg Compute</div>
        <div className="text-green-400 font-mono font-bold text-2xl">
          {(stats.avgComputeUnits / 1000).toFixed(0)}k
        </div>
      </div>

      <div className="border border-green-500/30 bg-green-950/10 rounded p-3">
        <div className="text-green-500/60 text-xs font-mono mb-1">Avg Priority Fee</div>
        <div className="text-green-400 font-mono font-bold text-xl">
          {(stats.avgPriorityFee / 1e9).toFixed(6)} SOL
        </div>
      </div>

      <div className="border border-yellow-500/30 bg-yellow-950/10 rounded p-3">
        <div className="text-yellow-500/60 text-xs font-mono mb-1">MEV Detected</div>
        <div className="text-yellow-400 font-mono font-bold text-2xl">
          {stats.mevDetected}
        </div>
      </div>

      <div className="border border-green-500/30 bg-green-950/10 rounded p-3">
        <div className="text-green-500/60 text-xs font-mono mb-1">Saved from Failure</div>
        <div className="text-green-400 font-mono font-bold text-2xl">
          {stats.savedFromFailure}
        </div>
      </div>
    </div>
  );
}

// Utility function to update stats (call this after each simulation)
export function updateSimulationStats(result: any) {
  try {
    const stored = localStorage.getItem("simulator-stats");
    let stats: Stats = {
      totalSimulations: 0,
      successRate: 0,
      avgComputeUnits: 0,
      avgPriorityFee: 0,
      mevDetected: 0,
      savedFromFailure: 0,
    };

    if (stored) {
      stats = JSON.parse(stored);
    }

    // Update stats
    stats.totalSimulations += 1;
    
    const newSuccessCount = stats.successRate * (stats.totalSimulations - 1) + (result.success ? 100 : 0);
    stats.successRate = newSuccessCount / stats.totalSimulations;

    const newComputeTotal = stats.avgComputeUnits * (stats.totalSimulations - 1) + result.computeUnitsUsed;
    stats.avgComputeUnits = newComputeTotal / stats.totalSimulations;

    const newFeeTotal = stats.avgPriorityFee * (stats.totalSimulations - 1) + result.priorityFees.recommended;
    stats.avgPriorityFee = newFeeTotal / stats.totalSimulations;

    if (result.mevRisk.riskLevel === "HIGH" || result.mevRisk.riskLevel === "CRITICAL") {
      stats.mevDetected += 1;
    }

    if (result.mevRisk.riskLevel !== "LOW" || result.priceImpactPct > 2) {
      stats.savedFromFailure += 1;
    }

    localStorage.setItem("simulator-stats", JSON.stringify(stats));
  } catch (err) {
    console.error("Failed to update stats:", err);
  }
}