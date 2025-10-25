"use client";

import { useState } from "react";
import TokenSelector from "./components/TokenSelector";
import ResultsCard from "./components/ResultsCard";
import { simulateSwap } from "./lib/simulator";

export default function Home() {
  const [amountIn, setAmountIn] = useState<number>(100);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [tokenIn, setTokenIn] = useState<any>(null);
  const [tokenOut, setTokenOut] = useState<any>(null);

  const handleSimulate = async () => {
    if (!tokenIn || !tokenOut || !amountIn || amountIn <= 0) {
      alert("Please select both tokens and enter an amount");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const simulationResult = await simulateSwap(
        tokenIn.address,
        tokenOut.address,
        amountIn, // Already a number
        tokenIn.decimals,
        tokenOut.decimals,
        walletAddress || undefined
      );

      if (simulationResult) {
        setResult({
          ...simulationResult,
          tokenIn: tokenIn.symbol,
          tokenOut: tokenOut.symbol,
        });
      } else {
        alert("Simulation failed. Please try again.");
      }
    } catch (error) {
      console.error("Simulation error:", error);
      alert("An error occurred during simulation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-8">
      {/* Scanline effect overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.02)_50%)] bg-[length:100%_4px] opacity-30"></div>

      {/* Glow effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-green-500/40 text-xs font-mono mb-2 tracking-widest">
            DECENTRALIZED EXCHANGE SIMULATOR
          </div>
          <h1 className="text-4xl font-mono font-bold text-green-400 mb-1 tracking-tight">
            ⚡ SOLANA TX SIMULATOR
          </h1>
          <div className="text-green-500/40 text-xs font-mono">
            v2.0.0 // CYPHERPUNK EDITION // MEV PROTECTED
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-black border border-green-500/30 rounded-lg p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
          {/* Wallet Input (Optional) */}
          <div className="mb-4">
            <label className="block text-green-500/60 text-xs font-mono mb-2 tracking-wide">
              WALLET ADDRESS (OPTIONAL - FOR FULL SIMULATION)
            </label>
            <input
              type="text"
              className="w-full bg-green-950/20 border border-green-500/30 text-green-400 p-3 rounded font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Your wallet address..."
            />
            <div className="text-green-500/40 text-xs font-mono mt-1">
              Leave empty for estimation mode
            </div>
          </div>

          {/* Token Selection */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <TokenSelector
              label="From"
              selectedToken={tokenIn}
              onSelect={setTokenIn}
            />

            <div className="pt-6">
              <div className="w-10 h-10 rounded-full border border-green-500/30 flex items-center justify-center text-green-500/60 hover:border-green-500 hover:text-green-400 transition-colors cursor-pointer">
                →
              </div>
            </div>

            <TokenSelector
              label="To"
              selectedToken={tokenOut}
              onSelect={setTokenOut}
            />
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-green-500/60 text-xs font-mono mb-2 tracking-wide">
              AMOUNT IN ({tokenIn ? tokenIn.symbol : "Select token"})
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full bg-green-950/20 border border-green-500/30 text-green-400 p-3 rounded font-mono focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                value={isNaN(amountIn) ? "" : amountIn}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmountIn(val === "" ? 0 : parseFloat(val));
                }}
                placeholder="0.00"
                step="0.01"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500/40 text-sm font-mono">
                {tokenIn ? tokenIn.symbol : ""}
              </div>
            </div>
          </div>

          {/* Quick Amount Presets */}
          {tokenIn && (
            <div className="mb-6 flex gap-2">
              <div className="text-green-500/60 text-xs font-mono mr-2 flex items-center">
                QUICK:
              </div>
              {[10, 50, 100, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setAmountIn(amount)}
                  className="bg-green-950/20 border border-green-500/30 text-green-400 px-3 py-1 rounded text-xs font-mono hover:bg-green-950/40 hover:border-green-500 transition-all"
                >
                  {amount}
                </button>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-green-950/10 border border-green-500/20 rounded p-3 mb-6">
            <div className="text-green-500/40 text-xs font-mono mb-2">
              📊 SIMULATION FEATURES
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-green-400">
              <div>• MEV Risk Analysis</div>
              <div>• Priority Fee Optimization</div>
              <div>• Compute Unit Tracking</div>
              <div>• Multi-Route Comparison</div>
            </div>
          </div>

          {/* Simulate Button */}
          <button
            onClick={handleSimulate}
            disabled={isLoading || !tokenIn || !tokenOut || !amountIn}
            className="w-full bg-green-600 hover:bg-green-500 text-black font-mono font-bold py-4 rounded transition-all duration-200 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600 relative overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>SIMULATING...</span>
              </div>
            ) : (
              "⚡ EXECUTE SIMULATION"
            )}
          </button>
        </div>

        {/* Results */}
        {result && <ResultsCard result={result} />}

        {/* Feature Highlights */}
        {!result && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="border border-green-500/20 rounded p-4 bg-green-950/5">
              <div className="text-green-400 font-mono text-sm mb-1">
                🛡️ MEV Protection
              </div>
              <div className="text-green-500/60 text-xs font-mono">
                Detect sandwich attacks & frontrun risks
              </div>
            </div>
            <div className="border border-green-500/20 rounded p-4 bg-green-950/5">
              <div className="text-green-400 font-mono text-sm mb-1">
                ⚡ Smart Fees
              </div>
              <div className="text-green-500/60 text-xs font-mono">
                Optimize priority fees for speed & cost
              </div>
            </div>
            <div className="border border-green-500/20 rounded p-4 bg-green-950/5">
              <div className="text-green-400 font-mono text-sm mb-1">
                🔧 Technical Analysis
              </div>
              <div className="text-green-500/60 text-xs font-mono">
                Real compute units & account tracking
              </div>
            </div>
            <div className="border border-green-500/20 rounded p-4 bg-green-950/5">
              <div className="text-green-400 font-mono text-sm mb-1">
                📊 Route Optimization
              </div>
              <div className="text-green-500/60 text-xs font-mono">
                Compare multiple DEX routes instantly
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <div className="text-green-500/30 text-xs font-mono">
            [ POWERED BY JUPITER AGGREGATOR & SOLANA RPC ]
          </div>
          <div className="text-green-500/30 text-xs font-mono">
            [ PRIVACY IS A RIGHT, NOT A PRIVILEGE ]
          </div>
        </div>
      </div>

      {/* Global Styles for Custom Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 255, 0, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 196, 93, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.5);
        }
      `}</style>
    </div>
  );
}