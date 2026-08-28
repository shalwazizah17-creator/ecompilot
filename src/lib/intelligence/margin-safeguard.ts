export type MarginInput = {
  sku: string;
  hpp: number;
  normalPrice: number;
  promoPrice: number;
  voucherDeduction: number;
  platformFeePercent: number; // e.g., 6.5 for 6.5%
  targetMarginPercent: number;
  historicalConversionRate?: number;
  competitorPublicPrice?: number;
};

export type MarginResult = {
  netRevenue: number;
  netProfit: number;
  marginPercent: number;
  breakEvenPrice: number;
  minimumSafePrice: number;
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'LOSS';
  recommendedPriceRange: [number, number];
  recommendedMarginRange: [number, number];
  recommendationAlert: string | null;
};

export function calculateMarginSafeguard(input: MarginInput): MarginResult {
  const platformFee = input.promoPrice * (input.platformFeePercent / 100);
  const netRevenue = input.promoPrice - input.voucherDeduction - platformFee;
  const netProfit = netRevenue - input.hpp;
  const marginPercent = (netProfit / input.promoPrice) * 100;

  // Break-even is when netProfit = 0
  // P - V - (P * fee) - HPP = 0
  // P * (1 - fee) = HPP + V
  // P = (HPP + V) / (1 - fee)
  const feeDecimal = input.platformFeePercent / 100;
  const breakEvenPrice = (input.hpp + input.voucherDeduction) / (1 - feeDecimal);

  // Minimum safe price based on target margin
  // (P - V - (P * fee) - HPP) / P = targetMargin/100
  // P - V - P*fee - HPP = P * target
  // P * (1 - fee - target) = HPP + V
  const targetDecimal = input.targetMarginPercent / 100;
  const minimumSafePrice = (input.hpp + input.voucherDeduction) / (1 - feeDecimal - targetDecimal);

  let status: MarginResult['status'] = 'SAFE';
  if (marginPercent < 0) status = 'LOSS';
  else if (marginPercent < (input.targetMarginPercent * 0.2)) status = 'DANGER'; // Near break-even
  else if (marginPercent < input.targetMarginPercent) status = 'WARNING';
  else status = 'SAFE';

  // Recommended Campaign Price logic
  let recommendationAlert = null;
  const minRecommended = Math.ceil(minimumSafePrice / 1000) * 1000;
  const maxRecommended = Math.ceil((minRecommended * 1.1) / 1000) * 1000;
  
  if (status === 'LOSS' || status === 'DANGER') {
    recommendationAlert = `🔴 Not Recommended. Estimated margin: ${marginPercent.toFixed(1)}%`;
  }

  // Calculate margin range for recommended prices
  const minRecNet = minRecommended - input.voucherDeduction - (minRecommended * feeDecimal);
  const maxRecNet = maxRecommended - input.voucherDeduction - (maxRecommended * feeDecimal);
  
  return {
    netRevenue,
    netProfit,
    marginPercent,
    breakEvenPrice,
    minimumSafePrice,
    status,
    recommendedPriceRange: [minRecommended, maxRecommended],
    recommendedMarginRange: [
      ((minRecNet - input.hpp) / minRecommended) * 100,
      ((maxRecNet - input.hpp) / maxRecommended) * 100
    ],
    recommendationAlert
  };
}
