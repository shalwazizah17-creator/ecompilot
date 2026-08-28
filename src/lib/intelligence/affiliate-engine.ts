export type AffiliateInput = {
  audienceMatch: number; // 0-100
  performanceVolume: number; // 0-100
  historicalROI: number; // e.g. 5 for 500%
  targetROI: number;
  conversionRate: number; // 0-100
  commissionPercent: number;
  growthPotential: number; // 0-100
  historicalStability: number; // 0-100
};

export type AffiliateResult = {
  score: number; // 0-100
  grade: 'STAR' | 'HIGH POTENTIAL' | 'STABLE' | 'RISK';
  details: {
    audienceMatchScore: number;
    performanceVolumeScore: number;
    roiScore: number;
    conversionScore: number;
    stabilityScore: number;
    commissionEfficiencyScore: number;
    growthPotentialScore: number;
  };
};

export function evaluateAffiliate(input: AffiliateInput): AffiliateResult {
  // Weights based on requirements
  const weights = {
    audienceMatch: 0.20,
    performanceVolume: 0.20,
    roi: 0.20,
    conversion: 0.15,
    stability: 0.10,
    commissionEfficiency: 0.10,
    growthPotential: 0.05
  };

  const roiRatio = Math.min(1.5, input.historicalROI / (input.targetROI || 1));
  const roiScore = roiRatio * 100;

  // Commission efficiency: lower commission with high ROI is better, but here we just score based on if it's within a reasonable bound
  const expectedCommission = 10;
  const commissionEfficiencyScore = Math.max(0, 100 - Math.abs(input.commissionPercent - expectedCommission) * 5);

  const scores = {
    audienceMatchScore: input.audienceMatch * weights.audienceMatch,
    performanceVolumeScore: input.performanceVolume * weights.performanceVolume,
    roiScore: roiScore * weights.roi,
    conversionScore: input.conversionRate * weights.conversion,
    stabilityScore: input.historicalStability * weights.stability,
    commissionEfficiencyScore: commissionEfficiencyScore * weights.commissionEfficiency,
    growthPotentialScore: input.growthPotential * weights.growthPotential
  };

  const totalScore = Math.min(100, Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0)
  ));

  let grade: AffiliateResult['grade'] = 'RISK';
  if (totalScore >= 85) grade = 'STAR';
  else if (totalScore >= 70) grade = 'HIGH POTENTIAL';
  else if (totalScore >= 50) grade = 'STABLE';

  return {
    score: totalScore,
    grade,
    details: scores
  };
}

export type AffiliateSimulatorInput = {
  commissionPercent: number;
  targetGMV: number;
  expectedConversion: number; // 0-100
  averageOrderValue: number;
  targetROI: number;
};

export type AffiliateSimulatorResult = {
  estimatedCommission: number;
  estimatedRevenue: number;
  breakEvenGMV: number;
  estimatedProfit: number;
  requiredOrders: number;
  maximumSustainableCommission: number;
  recommendedCommission: [number, number];
};

export function simulateAffiliateFinancials(input: AffiliateSimulatorInput): AffiliateSimulatorResult {
  const estimatedCommission = input.targetGMV * (input.commissionPercent / 100);
  const estimatedRevenue = input.targetGMV;
  // Assume a base HPP and other fees take up e.g. 60% of revenue just for simulation if not provided, 
  // but to be precise, we need gross margin. Let's assume a 30% gross margin before affiliate commission.
  const baseGrossMarginPercent = 30; 
  const grossProfit = input.targetGMV * (baseGrossMarginPercent / 100);
  const estimatedProfit = grossProfit - estimatedCommission;

  const requiredOrders = input.targetGMV / (input.averageOrderValue || 1);
  const maximumSustainableCommission = baseGrossMarginPercent - 5; // keep at least 5% margin
  
  // Break even GMV = fixed costs / contribution margin. 
  // If we assume no fixed costs for affiliate, break-even is just when margin = 0.
  // Actually, we just need the commission to be less than the gross margin.
  const breakEvenGMV = 0; // It's always profitable if commission < gross margin.

  return {
    estimatedCommission,
    estimatedRevenue,
    breakEvenGMV,
    estimatedProfit,
    requiredOrders,
    maximumSustainableCommission,
    recommendedCommission: [Math.max(5, maximumSustainableCommission - 10), maximumSustainableCommission - 2]
  };
}
