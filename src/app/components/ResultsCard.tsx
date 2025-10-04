export default function ResultsCard({ result }) {
    if (!result) return null;
  
    const expectedOut = result.expectedOut ?? result.amountOut ?? 0;
    const priceImpact = result.priceImpactPct ?? result.priceImpact ?? 0;
    const fee = result.feePaid ?? result.fee ?? 0;
  
    return (
      <div className="mt-8 bg-black border border-green-500/30 rounded-lg p-6 font-mono">
        <div className="text-green-500/40 text-xs mb-2">SIMULATION RESULT</div>
  
        <div className="flex justify-between">
          <span className="text-green-500/60">Expected Output:</span>
          <span className="text-green-400">
            {expectedOut.toFixed(6)} {result.tokenOut}
          </span>
        </div>
  
        <div className="flex justify-between mt-2">
          <span className="text-green-500/60">Price Impact:</span>
          <span className="text-green-400">
          {Number(priceImpact || 0).toFixed(3)}%
          </span>
        </div>
  
        <div className="flex justify-between mt-2">
          <span className="text-green-500/60">Fee:</span>
          <span className="text-green-400">{fee.toFixed(6)}</span>
        </div>
  
        {result.route && result.route.length > 0 && (
          <div className="mt-3 text-green-500/50 text-sm">
            Route: {result.route.join(" → ")}
          </div>
        )}
      </div>
    );
  }
  