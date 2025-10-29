// components/BatchSimulator.tsx
"use client";

import { useState } from "react";
import { simulateSwap } from "../lib/simulator";

interface BatchTrade {
  id: string;
  fromToken: string;
  toToken: string;
  amount: number;
  fromDecimals: number;
  toDecimals: number;
}

interface BatchResult extends BatchTrade {
  expectedOut: number;
  priceImpact: number;
  mevRisk: string;
  totalCost: number;
  status: "pending" | "success" | "failed";
}

export default function BatchSimulator() {
  const [trades, setTrades] = useState<BatchTrade[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [csvInput, setCsvInput] = useState("");

  const handleCSVParse = () => {
    try {
      const lines = csvInput.trim().split("\n");
      const parsedTrades: BatchTrade[] = [];

      lines.forEach((line, idx) => {
        if (idx === 0) return; // Skip header
        const [fromToken, toToken, amount, fromDecimals, toDecimals] = line.split(",");
        
        parsedTrades.push({
          id: `trade-${idx}`,
          fromToken: fromToken.trim(),
          toToken: toToken.trim(),
          amount: parseFloat(amount.trim()),
          fromDecimals: parseInt(fromDecimals.trim()),
          toDecimals: parseInt(toDecimals.trim()),
        });
      });

      setTrades(parsedTrades);
    } catch (err) {
      alert("Invalid CSV format. Use: fromToken,toToken,amount,fromDecimals,toDecimals");
    }
  };

  const simulateAll = async () => {
    setIsSimulating(true);
    const batchResults: BatchResult[] = [];

    for (const trade of trades) {
      try {
        const result = await simulateSwap(
          trade.fromToken,
          trade.toToken,
          trade.amount,
          trade.fromDecimals,
          trade.toDecimals
        );

        if (result) {
          batchResults.push({
            ...trade,
            expectedOut: result.expectedOut,
            priceImpact: result.priceImpactPct,
            mevRisk: result.mevRisk.riskLevel,
            totalCost: result.costAnalysis.totalFeeUSD,
            status: "success",
          });
        } else {
          batchResults.push({
            ...trade,
            expectedOut: 0,
            priceImpact: 0,
            mevRisk: "UNKNOWN",
            totalCost: 0,
            status: "failed",
          });
        }
      } catch (err) {
        batchResults.push({
          ...trade,
          expectedOut: 0,
          priceImpact: 0,
          mevRisk: "ERROR",
          totalCost: 0,
          status: "failed",
        });
      }

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setResults(batchResults);
    setIsSimulating(false);
  };

  const exportResults = () => {
    const csv = [
      "Trade,From,To,Amount,Expected Out,Price Impact %,MEV Risk,Cost USD,Status",
      ...results.map((r) =>
        [
          r.id,
          r.fromToken,
          r.toToken,
          r.amount,
          r.expectedOut.toFixed(6),
          r.priceImpact.toFixed(3),
          r.mevRisk,
          r.totalCost.toFixed(4),
          r.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "batch-simulation-results.csv";
    a.click();
  };

  const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
  const highRiskCount = results.filter((r) => r.mevRisk === "HIGH" || r.mevRisk === "CRITICAL").length;
  const successRate = results.length > 0 ? (results.filter((r) => r.status === "success").length / results.length) * 100 : 0;

  return (
    <div className="border border-green-500/30 bg-black rounded-lg p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
      <div className="mb-4">
        <div className="text-green-500/60 text-xs font-mono mb-2 tracking-widest">
          📊 BATCH SIMULATOR
        </div>
        <div className="text-green-400 text-sm font-mono mb-3">
          Simulate multiple trades at once for bots and power users
        </div>
      </div>

      {/* CSV Input */}
      <div className="mb-4">
        <label className="block text-green-500/60 text-xs font-mono mb-2 tracking-wide">
          CSV INPUT (fromToken,toToken,amount,fromDecimals,toDecimals)
        </label>
        <textarea
          value={csvInput}
          onChange={(e) => setCsvInput(e.target.value)}
          placeholder="So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,1,9,6"
          rows={5}
          className="w-full bg-green-950/20 border border-green-500/30 text-green-400 p-3 rounded font-mono text-xs focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCSVParse}
          disabled={!csvInput.trim()}
          className="flex-1 bg-green-950/20 border border-green-500/30 text-green-400 font-mono py-2 rounded hover:bg-green-950/30 transition-colors disabled:opacity-50"
        >
          Parse CSV
        </button>
        <button
          onClick={simulateAll}
          disabled={trades.length === 0 || isSimulating}
          className="flex-1 bg-green-600 hover:bg-green-500 text-black font-mono font-bold py-2 rounded transition-all duration-200 disabled:opacity-50"
        >
          {isSimulating ? "Simulating..." : `Simulate ${trades.length} Trades`}
        </button>
      </div>

      {/* Summary Stats */}
      {results.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="border border-green-500/30 bg-green-950/10 rounded p-3">
            <div className="text-green-500/60 text-xs font-mono">Success Rate</div>
            <div className="text-green-400 font-mono font-bold text-lg">
              {successRate.toFixed(0)}%
            </div>
          </div>
          <div className="border border-yellow-500/30 bg-yellow-950/10 rounded p-3">
            <div className="text-yellow-500/60 text-xs font-mono">High Risk</div>
            <div className="text-yellow-400 font-mono font-bold text-lg">{highRiskCount}</div>
          </div>
          <div className="border border-green-500/30 bg-green-950/10 rounded p-3">
            <div className="text-green-500/60 text-xs font-mono">Total Cost</div>
            <div className="text-green-400 font-mono font-bold text-lg">
              ${totalCost.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="border border-green-500/30 rounded overflow-hidden">
          <div className="overflow-x-auto max-h-96 custom-scrollbar">
            <table className="w-full text-xs font-mono">
              <thead className="bg-green-950/20 sticky top-0">
                <tr className="text-green-500/60">
                  <th className="p-2 text-left">Trade</th>
                  <th className="p-2 text-right">Expected Out</th>
                  <th className="p-2 text-right">Impact %</th>
                  <th className="p-2 text-center">MEV Risk</th>
                  <th className="p-2 text-right">Cost</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr
                    key={result.id}
                    className={`border-t border-green-500/10 ${
                      idx % 2 === 0 ? "bg-green-950/5" : ""
                    }`}
                  >
                    <td className="p-2 text-green-400">{result.id}</td>
                    <td className="p-2 text-right text-green-400">
                      {result.expectedOut.toFixed(4)}
                    </td>
                    <td
                      className={`p-2 text-right ${
                        result.priceImpact > 2 ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {result.priceImpact.toFixed(2)}%
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          result.mevRisk === "LOW"
                            ? "bg-green-500/20 text-green-400"
                            : result.mevRisk === "MEDIUM"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {result.mevRisk}
                      </span>
                    </td>
                    <td className="p-2 text-right text-green-400">
                      ${result.totalCost.toFixed(4)}
                    </td>
                    <td className="p-2 text-center">
                      {result.status === "success" ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Button */}
      {results.length > 0 && (
        <button
          onClick={exportResults}
          className="w-full mt-4 bg-green-950/20 border border-green-500/30 text-green-400 font-mono py-2 rounded hover:bg-green-950/30 transition-colors"
        >
          📥 Export Results as CSV
        </button>
      )}
    </div>
  );
}