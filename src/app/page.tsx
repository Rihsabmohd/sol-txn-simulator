"use client";

import { useState } from "react";
import TokenSelector from "./components/TokenSelector";
import ResultsCard from "./components/ResultsCard";
import { simulateSwap } from "./lib/simulator";

// Mock components - replace with your actual imports


export default function Home() {
  const [amountIn, setAmountIn] = useState(100);
  const [result, setResult] = useState(null);

const [tokenIn, setTokenIn] = useState<any>(null);
const [tokenOut, setTokenOut] = useState<any>(null);

  const pool = {
    reserveIn: 100000,
    reserveOut: 5000,
    fee: 0.003,
  };

  const handleSimulate = async () => {
    if (!tokenIn || !tokenOut || !amountIn) return;
  
    const result = await simulateSwap(
      tokenIn.address,
      tokenOut.address,
      parseFloat(amountIn),
      tokenIn.decimals,
      tokenOut.decimals
    );
  
    if (result) {
      setResult(result);
    }
  };
  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-8">
      {/* Scanline effect overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.02)_50%)] bg-[length:100%_4px] opacity-30"></div>
      
      {/* Glow effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-green-500/40 text-xs font-mono mb-2 tracking-widest">DECENTRALIZED EXCHANGE</div>
          <h1 className="text-4xl font-mono font-bold text-green-400 mb-1 tracking-tight">
            ⚡ TX SIMULATOR
          </h1>
          <div className="text-green-500/40 text-xs font-mono">v1.0.0 // CYPHERPUNK EDITION</div>
        </div>

        {/* Main Card */}
        <div className="bg-black border border-green-500/30 rounded-lg p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
          {/* Token Selection */}
          <div className="flex items-center justify-between mb-6">
          <TokenSelector
  label="From"
  selectedToken={tokenIn}
  onSelect={setTokenIn}
/>
            <div className="px-4">
              <div className="w-10 h-10 rounded-full border border-green-500/30 flex items-center justify-center text-green-500/60">
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
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500/40 text-sm font-mono">
                {tokenIn ? tokenIn.symbol : ""}
              </div>
            </div>
          </div>

          {/* Pool Info */}
          <div className="bg-green-950/10 border border-green-500/20 rounded p-3 mb-6">
            <div className="text-green-500/40 text-xs font-mono mb-2">POOL RESERVES</div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-green-400">{tokenIn ? tokenIn.symbol : ""}: {pool.reserveIn.toLocaleString()}</span>
              <span className="text-green-400">{tokenOut ? tokenOut.symbol: ""}: {pool.reserveOut.toLocaleString()}</span>
            </div>
            <div className="text-green-500/40 text-xs font-mono mt-1">Fee: {(pool.fee * 100).toFixed(1)}%</div>
          </div>

          {/* Simulate Button */}
          <button
            onClick={handleSimulate}
            className="w-full bg-green-600 hover:bg-green-500 text-black font-mono font-bold py-3 rounded transition-all duration-200 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
          >
            EXECUTE SIMULATION
          </button>
        </div>

        {/* Results */}
        {result && (
          <ResultsCard
            result={{
              ...result,
              tokenIn: tokenIn.symbol,
              tokenOut: tokenOut.symbol,
            }}
          />
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-green-500/30 text-xs font-mono">
          <div>[ PRIVACY IS A RIGHT, NOT A PRIVILEGE ]</div>
        </div>
      </div>
    </div>
  );
}