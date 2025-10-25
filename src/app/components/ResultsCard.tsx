// components/ResultsCard.tsx
import React from "react";

interface ResultsCardProps {
  result: {
    expectedOut: number;
    priceImpactPct: number;
    route: string[];
    tokenIn: string;
    tokenOut: string;
    success: boolean;
    computeUnitsUsed: number;
    logs: string[];
    accountsRead: number;
    error: any;
    mevRisk: {
      riskScore: number;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      sandwichRisk: boolean;
      frontrunRisk: boolean;
      estimatedMEVLoss: number;
      recommendations: string[];
      details: {
        priceImpactRisk: number;
        liquidityRisk: number;
        profitabilityRisk: number;
      };
    };
    priorityFees: {
      recommended: number;
      landingProbability: Array<{
        label: string;
        fee: number;
        probability: number;
        estimatedTime: string;
      }>;
      networkCongestion: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    costAnalysis: {
      totalFeeUSD: number;
      computeUnitPrice: number;
      breakdown: {
        networkFee: string;
        priorityFee: string;
        total: string;
      };
    };
  };
}

export default function ResultsCard({ result }: ResultsCardProps) {
  const {
    expectedOut = 0,
    priceImpactPct = 0,
    route = [],
    tokenIn = "",
    tokenOut = "",
    success = false,
    computeUnitsUsed = 0,
    accountsRead = 0,
    mevRisk = {
      riskScore: 0,
      riskLevel: "LOW",
      sandwichRisk: false,
      frontrunRisk: false,
      estimatedMEVLoss: 0,
      recommendations: [],
      details: { priceImpactRisk: 0, liquidityRisk: 0, profitabilityRisk: 0 },
    },
    priorityFees = {
      recommended: 0,
      landingProbability: [],
      networkCongestion: "LOW",
    },
    costAnalysis = {
      totalFeeUSD: 0,
      computeUnitPrice: 0,
      breakdown: { networkFee: "0", priorityFee: "0", total: "0" },
    },
  } = result || {};
  

  // Risk level colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'border-red-500 bg-red-950/20';
      case 'HIGH':
        return 'border-orange-500 bg-orange-950/20';
      case 'MEDIUM':
        return 'border-yellow-500 bg-yellow-950/20';
      default:
        return 'border-green-500/30 bg-green-950/10';
    }
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'text-red-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Simulation Status */}
      <div
        className={`border rounded-lg p-4 ${
          success
            ? 'border-green-500/30 bg-green-950/10'
            : 'border-red-500/30 bg-red-950/10'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-green-500/60 text-xs font-mono tracking-widest">
            SIMULATION STATUS
          </div>
          <div
            className={`text-sm font-mono font-bold ${
              success ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {success ? '✓ SUCCESS' : '✗ FAILED'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <div className="text-green-500/60">Expected Output</div>
            <div className="text-green-400 font-bold text-lg">
            {typeof expectedOut === "number" ? expectedOut.toFixed(6) : "—"} {tokenOut}

            </div>
          </div>
          <div>
            <div className="text-green-500/60">Price Impact</div>
            <div
              className={`font-bold text-lg ${
                priceImpactPct > 2 ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {Number(priceImpactPct).toFixed(3)}%
            </div>
          </div>
        </div>
      </div>

      {/* MEV Risk Alert */}
      {mevRisk.riskLevel !== 'LOW' && (
        <div className={`border rounded-lg p-4 ${getRiskColor(mevRisk.riskLevel)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-xs tracking-widest">
              ⚠️ MEV RISK ALERT
            </div>
            <div className="text-sm font-mono font-bold">
              {mevRisk.riskLevel}
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-green-500/60">Risk Score:</span>
              <span className="text-green-400">{mevRisk.riskScore}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-500/60">Estimated Loss:</span>
              <span className="text-green-400">
                ${mevRisk.estimatedMEVLoss.toFixed(2)}
              </span>
            </div>

            {/* Risk Breakdown */}
            <div className="mt-3 pt-3 border-t border-green-500/20">
              <div className="text-green-500/60 mb-2">Risk Factors:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Price Impact</span>
                  <span className="text-green-400">
                    {mevRisk.details.priceImpactRisk}/40
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Liquidity</span>
                  <span className="text-green-400">
                    {mevRisk.details.liquidityRisk}/30
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Trade Size</span>
                  <span className="text-green-400">
                    {mevRisk.details.profitabilityRisk}/30
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-3 pt-3 border-t border-green-500/20">
              <div className="text-green-500/60 mb-2">Recommendations:</div>
              {mevRisk.recommendations.map((rec, idx) => (
                <div key={idx} className="text-green-400">
                  • {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Priority Fee Strategy */}
      <div className="border border-green-500/30 bg-green-950/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-green-500/60 text-xs font-mono tracking-widest">
            ⚡ PRIORITY FEE STRATEGY
          </div>
          <div
            className={`text-xs font-mono ${getCongestionColor(
              priorityFees.networkCongestion
            )}`}
          >
            Network: {priorityFees.networkCongestion}
          </div>
        </div>

        <div className="space-y-2">
          {priorityFees.landingProbability.map((item) => {
            const feeSOL = item.fee / 1_000_000_000;
            const isRecommended = item.label === 'Fast';

            return (
              <div
                key={item.label}
                className={`flex justify-between items-center text-xs font-mono p-2 rounded ${
                  isRecommended ? 'bg-green-500/10 border border-green-500/30' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {isRecommended && (
                    <span className="text-green-400">★</span>
                  )}
                  <span className="text-green-400">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-500/60">{item.estimatedTime}</span>
                  <span className="text-green-400">
                    {(item.probability * 100).toFixed(0)}%
                  </span>
                  <span className="text-green-400 font-bold min-w-[80px] text-right">
                    {feeSOL.toFixed(6)} SOL
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="border border-green-500/30 bg-green-950/10 rounded-lg p-4">
        <div className="text-green-500/60 text-xs font-mono tracking-widest mb-3">
          💰 COST ANALYSIS
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-green-500/60">Network Fee:</span>
            <span className="text-green-400">{costAnalysis.breakdown.networkFee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-500/60">Priority Fee:</span>
            <span className="text-green-400">{costAnalysis.breakdown.priorityFee}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-green-500/20 font-bold">
            <span className="text-green-400">Total Cost:</span>
            <span className="text-green-400">{costAnalysis.breakdown.total}</span>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="border border-green-500/30 bg-green-950/10 rounded-lg p-4">
        <div className="text-green-500/60 text-xs font-mono tracking-widest mb-3">
          🔧 TECHNICAL DETAILS
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-green-500/60">Compute Units:</span>
            <span className="text-green-400">
              {computeUnitsUsed.toLocaleString()} / 1,400,000
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-500/60">Accounts Read:</span>
            <span className="text-green-400">{accountsRead}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-500/60">Route:</span>
            <span className="text-green-400">{route.join(' → ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-500/60">CU Price:</span>
            <span className="text-green-400">
              {costAnalysis.computeUnitPrice.toLocaleString()} lamports
            </span>
          </div>
        </div>

        {/* Compute Unit Bar */}
        <div className="mt-3">
          <div className="h-2 bg-green-950/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{
                width: `${Math.min((computeUnitsUsed / 1400000) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="text-xs font-mono text-green-500/60 mt-1 text-right">
            {((computeUnitsUsed / 1400000) * 100).toFixed(1)}% of limit
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full bg-green-600 hover:bg-green-500 text-black font-mono font-bold py-3 rounded transition-all duration-200 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] flex items-center justify-center gap-2">
        <span>EXECUTE TRANSACTION</span>
        <span>→</span>
      </button>
    </div>
  );
}