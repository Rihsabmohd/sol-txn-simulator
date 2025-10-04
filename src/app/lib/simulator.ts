// lib/simulator.ts

export interface SimulationResult {
    expectedOut: number;       // human-readable output amount
    priceImpactPct: number;    // price impact in %
    route: string[];           // labels of DEXs used
    rawResponse: any;          // full Jupiter response for debugging
  }
  
  /**
   * Simulate a swap using Jupiter Lite API
   * @param inputMint Token mint of the input token
   * @param outputMint Token mint of the output token
   * @param amountIn Human-readable input amount (e.g., 1.5 USDC)
   * @param inputDecimals Decimals of input token
   * @param outputDecimals Decimals of output token
   * @param slippageBps Slippage tolerance in basis points (default 50 = 0.5%)
   * @returns SimulationResult or null if failed
   */
  export async function simulateSwap(
    inputMint: string,
    outputMint: string,
    amountIn: number,
    inputDecimals: number,
    outputDecimals: number,
    slippageBps = 50
  ): Promise<SimulationResult | null> {
    try {
      if (!inputMint || !outputMint) throw new Error("Missing token mints");
  
      // Convert human amount to raw units
      const rawAmount = BigInt(Math.floor(amountIn * Math.pow(10, inputDecimals))).toString();
  
      // Jupiter Lite API endpoint
      const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${encodeURIComponent(inputMint
      )}&outputMint=${encodeURIComponent(outputMint)}&amount=${rawAmount}&slippageBps=${slippageBps}&restrictIntermediateTokens=true`;
  
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Jupiter quote failed: ${res.status} ${res.statusText} ${text}`);
      }
  
      const data = await res.json();
  
      // Extract expected output (raw)
      const outRaw = data.outAmount ?? data.out_amount ?? null;
      if (!outRaw) {
        console.warn("simulateSwap: outAmount missing", data);
        return {
          expectedOut: 0,
          priceImpactPct: 0,
          route: [],
          rawResponse: data,
        };
      }
  
      const expectedOut = Number(outRaw) / Math.pow(10, outputDecimals);
  
      // Price impact (percentage)
      const priceImpact =
        data.priceImpactPct ??
        data.priceImpact ??
        0;
  
      // Route extraction (DEX labels)
      const route: string[] = [];
      if (Array.isArray(data.routePlan)) {
        data.routePlan.forEach((r: any) => {
          const label = r?.swapInfo?.label ?? r?.label ?? null;
          if (label) route.push(label);
        });
      } else if (Array.isArray(data?.routes)) {
        const best = data.routes[0];
        if (best?.marketInfos) {
          best.marketInfos.forEach((m: any) => route.push(m.label || m.marketName || "market"));
        }
      }
  
      return {
        expectedOut,
        priceImpactPct: priceImpact,
        route,
        rawResponse: data,
      };
    } catch (err) {
      console.error("simulateSwap error:", err);
      return null;
    }
  }
  