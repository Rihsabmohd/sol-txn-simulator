// components/TransactionAnalyzer.tsx
"use client";

import { useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

interface AnalysisResult {
  signature: string;
  success: boolean;
  error: string | null;
  computeUnitsUsed: number;
  fee: number;
  timestamp: number;
  logs: string[];
  analysis: {
    failureReason: string;
    couldHaveBeenPrevented: boolean;
    recommendations: string[];
  };
}

export default function TransactionAnalyzer() {
  const [signature, setSignature] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeTransaction = async () => {
    if (!signature.trim()) {
      setError("Please enter a transaction signature");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      
      // Fetch transaction details
      const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        throw new Error("Transaction not found. Make sure the signature is correct.");
      }

      // Extract transaction data
      const success = tx.meta?.err === null;
      const computeUnitsUsed = tx.meta?.computeUnitsConsumed || 0;
      const fee = tx.meta?.fee || 0;
      const logs = tx.meta?.logMessages || [];
      const timestamp = tx.blockTime || 0;

      // Analyze failure reasons
      const analysis = analyzeFailure(tx.meta?.err, logs, computeUnitsUsed);

      setResult({
        signature,
        success,
        error: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
        computeUnitsUsed,
        fee,
        timestamp,
        logs,
        analysis,
      });
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze transaction");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeFailure = (error: any, logs: string[], computeUnits: number) => {
    const recommendations: string[] = [];
    let failureReason = "Unknown failure";
    let couldHaveBeenPrevented = false;

    // Check for slippage errors
    if (logs.some(log => log.includes("slippage") || log.includes("Slippage"))) {
      failureReason = "Slippage tolerance exceeded";
      couldHaveBeenPrevented = true;
      recommendations.push("Increase slippage tolerance to 1-2%");
      recommendations.push("Use our simulator to check price impact before trading");
      recommendations.push("Split large trades into smaller chunks");
    }

    // Check for insufficient funds
    if (logs.some(log => log.includes("insufficient funds") || log.includes("Insufficient"))) {
      failureReason = "Insufficient funds in wallet";
      couldHaveBeenPrevented = true;
      recommendations.push("Ensure wallet has enough SOL for fees");
      recommendations.push("Account for priority fees in your calculations");
    }

    // Check for compute budget exceeded
    if (logs.some(log => log.includes("exceeded") || log.includes("compute budget"))) {
      failureReason = "Compute budget exceeded";
      couldHaveBeenPrevented = true;
      recommendations.push("Increase compute unit limit");
      recommendations.push("Simplify the transaction route");
      recommendations.push("Use our simulator to estimate compute units");
    }

    // Check for blockhash expiration
    if (logs.some(log => log.includes("Blockhash not found") || log.includes("expired"))) {
      failureReason = "Transaction expired (blockhash too old)";
      couldHaveBeenPrevented = true;
      recommendations.push("Increase priority fee for faster inclusion");
      recommendations.push("Retry with a fresh blockhash");
    }

    // Check for priority fee issues
    if (!error && computeUnits > 0 && logs.length > 0) {
      // Transaction succeeded but could have been optimized
      if (computeUnits < 50000) {
        recommendations.push("Your compute usage was low - could use lower priority fees");
      }
    }

    if (error && recommendations.length === 0) {
      recommendations.push("This error requires manual investigation");
      recommendations.push("Check Solscan for detailed logs");
    }

    return {
      failureReason,
      couldHaveBeenPrevented,
      recommendations: recommendations.length > 0 ? recommendations : ["Transaction analysis complete"],
    };
  };

  return (
    <div className="border border-green-500/30 bg-black rounded-lg p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
      <div className="mb-4">
        <div className="text-green-500/60 text-xs font-mono mb-2 tracking-widest">
          🔍 TRANSACTION ANALYZER
        </div>
        <div className="text-green-400 text-sm font-mono mb-3">
          Analyze failed transactions to understand what went wrong
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-green-500/60 text-xs font-mono mb-2 tracking-wide">
          TRANSACTION SIGNATURE
        </label>
        <input
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Enter transaction signature..."
          className="w-full bg-green-950/20 border border-green-500/30 text-green-400 p-3 rounded font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </div>

      <button
        onClick={analyzeTransaction}
        disabled={isAnalyzing || !signature.trim()}
        className="w-full bg-green-600 hover:bg-green-500 text-black font-mono font-bold py-3 rounded transition-all duration-200 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <span>ANALYZING...</span>
          </div>
        ) : (
          "🔍 ANALYZE TRANSACTION"
        )}
      </button>

      {error && (
        <div className="mt-4 border border-red-500/30 bg-red-950/20 rounded p-3">
          <div className="text-red-400 font-mono text-xs">{error}</div>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          {/* Status */}
          <div
            className={`border rounded p-4 ${
              result.success
                ? "border-green-500/30 bg-green-950/10"
                : "border-red-500/30 bg-red-950/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-500/60 text-xs font-mono">STATUS</span>
              <span
                className={`font-mono font-bold ${
                  result.success ? "text-green-400" : "text-red-400"
                }`}
              >
                {result.success ? "✓ SUCCESS" : "✗ FAILED"}
              </span>
            </div>
            {!result.success && (
              <div className="text-xs font-mono text-green-400">
                Reason: {result.analysis.failureReason}
              </div>
            )}
          </div>

          {/* Could Have Been Prevented */}
          {!result.success && result.analysis.couldHaveBeenPrevented && (
            <div className="border border-yellow-500/30 bg-yellow-950/10 rounded p-4">
              <div className="text-yellow-400 font-mono text-sm font-bold mb-2">
                ⚠️ THIS COULD HAVE BEEN PREVENTED
              </div>
              <div className="text-yellow-400/80 text-xs font-mono">
                Using our simulator before executing would have caught this issue!
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="border border-green-500/30 bg-green-950/10 rounded p-4">
            <div className="text-green-500/60 text-xs font-mono mb-3">TRANSACTION DETAILS</div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-green-500/60">Compute Units:</span>
                <span className="text-green-400">{result.computeUnitsUsed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-500/60">Fee Paid:</span>
                <span className="text-green-400">{(result.fee / 1e9).toFixed(6)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-500/60">Timestamp:</span>
                <span className="text-green-400">
                  {new Date(result.timestamp * 1000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="border border-green-500/30 bg-green-950/10 rounded p-4">
            <div className="text-green-500/60 text-xs font-mono mb-3">💡 RECOMMENDATIONS</div>
            <div className="space-y-2">
              {result.analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="text-green-400 text-xs font-mono">
                  • {rec}
                </div>
              ))}
            </div>
          </div>

          {/* View on Solscan */}
          <a
            href={`https://solscan.io/tx/${result.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-950/20 border border-green-500/30 text-green-400 font-mono text-sm py-2 rounded text-center hover:bg-green-950/30 transition-colors"
          >
            View on Solscan →
          </a>
        </div>
      )}
    </div>
  );
}