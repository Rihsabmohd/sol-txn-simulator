// lib/simulator.ts
import { Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';

// ==================== INTERFACES ====================

export interface SimulationResult {
  // Basic quote data
  expectedOut: number;
  priceImpactPct: number;
  route: string[];
  rawResponse: any;
  
  // Enhanced simulation data
  success: boolean;
  computeUnitsUsed: number;
  logs: string[];
  accountsRead: number;
  error: any;
  
  // MEV Analysis
  mevRisk: MEVRiskAnalysis;
  
  // Priority Fee Data
  priorityFees: PriorityFeeAnalysis;
  
  // Cost breakdown
  costAnalysis: CostAnalysis;
}

export interface MEVRiskAnalysis {
  riskScore: number; // 0-100
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
}

export interface PriorityFeeAnalysis {
  min: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
  max: number;
  recommended: number;
  landingProbability: Array<{
    label: string;
    fee: number;
    probability: number;
    estimatedTime: string;
  }>;
  networkCongestion: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CostAnalysis {
  baseFee: number; // lamports
  priorityFee: number; // lamports
  totalFee: number; // lamports
  totalFeeUSD: number;
  computeUnitPrice: number;
  breakdown: {
    networkFee: string;
    priorityFee: string;
    total: string;
  };
}

export interface RouteComparison {
  dex: string;
  expectedOut: number;
  priceImpact: number;
  route: string[];
  efficiency: number;
  computeUnits: number;
}

// ==================== MAIN SIMULATION FUNCTION ====================

export async function simulateSwap(
  inputMint: string,
  outputMint: string,
  amountIn: number,
  inputDecimals: number,
  outputDecimals: number,
  walletPublicKey?: string,
  slippageBps = 50
): Promise<SimulationResult | null> {
  try {
    if (!inputMint || !outputMint) throw new Error("Missing token mints");

    console.log("Starting simulation:", { inputMint, outputMint, amountIn });

    // 1. Get Jupiter Quote
    const quote = await getJupiterQuote(
      inputMint,
      outputMint,
      amountIn,
      inputDecimals,
      slippageBps
    );

    if (!quote) {
      console.error("No quote received from Jupiter");
      return null;
    }

    console.log("Quote received:", quote);

    // 2. Calculate basic results (Lite API format)
    const expectedOut = Number(quote.outAmount) / Math.pow(10, outputDecimals);
    const priceImpact = parseFloat(quote.priceImpactPct || "0");
    const route = extractRoute(quote);

    // 3. Get Priority Fee Analysis
    const priorityFees = await analyzePriorityFees();

    // 4. Perform MEV Risk Analysis
    const mevRisk = analyzeMEVRisk(amountIn, priceImpact, quote);

    // 5. Simulate actual transaction if wallet provided
    let simulationData = {
      success: true,
      computeUnitsUsed: estimateComputeUnits(route.length),
      logs: [],
      accountsRead: route.length * 3, // Estimate
      error: null,
    };

    if (walletPublicKey) {
      try {
        const actualSimulation = await simulateTransaction(
          quote,
          walletPublicKey
        );
        if (actualSimulation) {
          simulationData = actualSimulation;
        }
      } catch (err) {
        console.warn("Transaction simulation failed, using estimates:", err);
      }
    }

    // 6. Calculate cost analysis
    const costAnalysis = calculateCostAnalysis(
      simulationData.computeUnitsUsed,
      priorityFees.recommended
    );

    return {
      expectedOut,
      priceImpactPct: priceImpact,
      route,
      rawResponse: quote,
      ...simulationData,
      mevRisk,
      priorityFees,
      costAnalysis,
    };
  } catch (err) {
    console.error("simulateSwap error:", err);
    
    // Provide more helpful error message
    if (err instanceof Error) {
      if (err.message.includes("Failed to fetch")) {
        throw new Error("Network error: Unable to connect to Jupiter API. Please check your internet connection.");
      }
      throw err;
    }
    
    return null;
  }
}

// ==================== HELPER FUNCTIONS ====================

async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amountIn: number,
  inputDecimals: number,
  slippageBps: number
): Promise<any> {
  const rawAmount = BigInt(
    Math.floor(amountIn * Math.pow(10, inputDecimals))
  ).toString();

  // Using Jupiter Lite API V1
  const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${encodeURIComponent(
    inputMint
  )}&outputMint=${encodeURIComponent(
    outputMint
  )}&amount=${rawAmount}&slippageBps=${slippageBps}&restrictIntermediateTokens=true`;

  console.log("Fetching Jupiter quote:", url);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    console.error("Jupiter API error:", res.status, errorText);
    throw new Error(`Jupiter quote failed: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  console.log("Jupiter quote response:", data);
  return data;
}

async function simulateTransaction(
  quote: any,
  walletPublicKey: string
): Promise<any> {
  try {
    // Get swap transaction from Jupiter Lite API
    const swapResponse = await fetch("https://lite-api.jup.ag/swap/v1/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: walletPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
    });

    if (!swapResponse.ok) {
      throw new Error("Failed to get swap transaction");
    }

    const { swapTransaction } = await swapResponse.json();

    // Simulate on-chain
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const txBuffer = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(txBuffer);

    const simulation = await connection.simulateTransaction(transaction, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });

    return {
      success: simulation.value.err === null,
      computeUnitsUsed: simulation.value.unitsConsumed || 0,
      logs: simulation.value.logs || [],
      accountsRead: simulation.value.accounts?.length || 0,
      error: simulation.value.err,
    };
  } catch (err) {
    console.warn("Transaction simulation error:", err);
    return null;
  }
}

export async function analyzePriorityFees(): Promise<PriorityFeeAnalysis> {
  try {
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const recentFees = await connection.getRecentPrioritizationFees();

    const fees = recentFees
      .map((f) => f.prioritizationFee)
      .filter((f) => f > 0);
    fees.sort((a, b) => a - b);

    if (fees.length === 0) {
      // Fallback if no fee data
      return getDefaultPriorityFees();
    }

    const p25 = fees[Math.floor(fees.length * 0.25)] || 1000;
    const median = fees[Math.floor(fees.length * 0.5)] || 5000;
    const p75 = fees[Math.floor(fees.length * 0.75)] || 10000;
    const p95 = fees[Math.floor(fees.length * 0.95)] || 50000;

    // Determine network congestion
    let networkCongestion: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (median > 50000) networkCongestion = 'HIGH';
    else if (median > 10000) networkCongestion = 'MEDIUM';

    return {
      min: fees[0] || 0,
      p25,
      median,
      p75,
      p95,
      max: fees[fees.length - 1] || 100000,
      recommended: p75,
      landingProbability: [
        {
          label: "Economy",
          fee: p25,
          probability: 0.25,
          estimatedTime: "~10-20s",
        },
        {
          label: "Standard",
          fee: median,
          probability: 0.5,
          estimatedTime: "~5-10s",
        },
        {
          label: "Fast",
          fee: p75,
          probability: 0.75,
          estimatedTime: "~2-5s",
        },
        {
          label: "Turbo",
          fee: p95,
          probability: 0.95,
          estimatedTime: "~1-2s",
        },
      ],
      networkCongestion,
    };
  } catch (err) {
    console.error("Priority fee analysis error:", err);
    return getDefaultPriorityFees();
  }
}

function analyzeMEVRisk(
  amountIn: number,
  priceImpact: number,
  quote: any
): MEVRiskAnalysis {
  let riskScore = 0;
  const details = {
    priceImpactRisk: 0,
    liquidityRisk: 0,
    profitabilityRisk: 0,
  };

  // Price impact risk (0-40 points)
  if (priceImpact > 5) {
    details.priceImpactRisk = 40;
    riskScore += 40;
  } else if (priceImpact > 3) {
    details.priceImpactRisk = 30;
    riskScore += 30;
  } else if (priceImpact > 1) {
    details.priceImpactRisk = 20;
    riskScore += 20;
  } else if (priceImpact > 0.5) {
    details.priceImpactRisk = 10;
    riskScore += 10;
  }

  // Liquidity risk based on route complexity (0-30 points)
  const routeCount = quote.routePlan?.length || 1;
  if (routeCount > 3) {
    details.liquidityRisk = 30;
    riskScore += 30;
  } else if (routeCount > 2) {
    details.liquidityRisk = 20;
    riskScore += 20;
  } else if (routeCount > 1) {
    details.liquidityRisk = 10;
    riskScore += 10;
  }

  // Profitability risk based on trade size (0-30 points)
  if (amountIn > 100000) {
    details.profitabilityRisk = 30;
    riskScore += 30;
  } else if (amountIn > 50000) {
    details.profitabilityRisk = 20;
    riskScore += 20;
  } else if (amountIn > 10000) {
    details.profitabilityRisk = 10;
    riskScore += 10;
  }

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore > 70) riskLevel = 'CRITICAL';
  else if (riskScore > 45) riskLevel = 'HIGH';
  else if (riskScore > 20) riskLevel = 'MEDIUM';

  const recommendations: string[] = [];
  if (riskScore > 45) recommendations.push("Use private RPC (e.g., Jito)");
  if (priceImpact > 2) recommendations.push("Split trade into smaller chunks");
  if (routeCount > 2) recommendations.push("Consider direct routes");
  if (riskScore > 20) recommendations.push("Increase slippage tolerance by 0.5%");
  if (recommendations.length === 0) recommendations.push("Trade looks safe to execute");

  const estimatedMEVLoss = (priceImpact / 100) * amountIn * 0.3; // Rough estimate

  return {
    riskScore,
    riskLevel,
    sandwichRisk: priceImpact > 1,
    frontrunRisk: amountIn > 10000,
    estimatedMEVLoss,
    recommendations,
    details,
  };
}

function calculateCostAnalysis(
  computeUnits: number,
  priorityFee: number
): CostAnalysis {
  const LAMPORTS_PER_SOL = 1_000_000_000;
  const SOL_PRICE_USD = 150; // Approximate, should be fetched in production

  // Base fee is approximately 5000 lamports per signature
  const baseFee = 5000;

  // Priority fee calculation
  const computeUnitPrice = Math.ceil(priorityFee / computeUnits);
  const totalPriorityFee = computeUnitPrice * computeUnits;

  const totalFee = baseFee + totalPriorityFee;
  const totalFeeSOL = totalFee / LAMPORTS_PER_SOL;
  const totalFeeUSD = totalFeeSOL * SOL_PRICE_USD;

  return {
    baseFee,
    priorityFee: totalPriorityFee,
    totalFee,
    totalFeeUSD,
    computeUnitPrice,
    breakdown: {
      networkFee: `${(baseFee / LAMPORTS_PER_SOL).toFixed(6)} SOL`,
      priorityFee: `${(totalPriorityFee / LAMPORTS_PER_SOL).toFixed(6)} SOL`,
      total: `${totalFeeSOL.toFixed(6)} SOL ($${totalFeeUSD.toFixed(4)})`,
    },
  };
}

function extractRoute(quote: any): string[] {
  const route: string[] = [];

  // Jupiter Lite API format
  if (Array.isArray(quote.routePlan)) {
    quote.routePlan.forEach((r: any) => {
      const label = r?.swapInfo?.label || null;
      if (label) route.push(label);
    });
  }

  return route.length > 0 ? route : ["Jupiter"];
}

function estimateComputeUnits(routeLength: number): number {
  // Rough estimates based on route complexity
  const baseUnits = 50000;
  const perHopUnits = 30000;
  return baseUnits + routeLength * perHopUnits;
}

function getDefaultPriorityFees(): PriorityFeeAnalysis {
  return {
    min: 1000,
    p25: 5000,
    median: 10000,
    p75: 25000,
    p95: 50000,
    max: 100000,
    recommended: 25000,
    landingProbability: [
      { label: "Economy", fee: 5000, probability: 0.25, estimatedTime: "~10-20s" },
      { label: "Standard", fee: 10000, probability: 0.5, estimatedTime: "~5-10s" },
      { label: "Fast", fee: 25000, probability: 0.75, estimatedTime: "~2-5s" },
      { label: "Turbo", fee: 50000, probability: 0.95, estimatedTime: "~1-2s" },
    ],
    networkCongestion: 'MEDIUM',
  };
}

// ==================== ROUTE COMPARISON ====================

export async function compareRoutes(
  inputMint: string,
  outputMint: string,
  amountIn: number,
  inputDecimals: number,
  outputDecimals: number
): Promise<RouteComparison[]> {
  const routes: RouteComparison[] = [];

  try {
    // Get best route (all DEXs)
    const bestQuote = await getJupiterQuote(
      inputMint,
      outputMint,
      amountIn,
      inputDecimals,
      50
    );

    if (bestQuote) {
      const expectedOut = Number(bestQuote.outAmount) / Math.pow(10, outputDecimals);
      const routeLabels = extractRoute(bestQuote);
      
      routes.push({
        dex: "Best Route",
        expectedOut,
        priceImpact: bestQuote.priceImpactPct || 0,
        route: routeLabels,
        efficiency: (expectedOut / amountIn) * 100,
        computeUnits: estimateComputeUnits(routeLabels.length),
      });
    }

    return routes;
  } catch (err) {
    console.error("Route comparison error:", err);
    return routes;
  }
}