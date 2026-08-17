export class Calculations {
  /**
   * Safely handles division by zero and null values.
   */
  static safeDiv(numerator: number, denominator: number): number {
    if (denominator === 0 || isNaN(denominator) || !isFinite(denominator)) return 0;
    const result = numerator / denominator;
    if (isNaN(result) || !isFinite(result)) return 0;
    return result;
  }

  static ctr(clicks: number, impressions: number): number {
    return this.safeDiv(clicks, impressions) * 100;
  }

  static cvr(conversions: number, clicks: number): number {
    return this.safeDiv(conversions, clicks) * 100;
  }

  static cpc(spend: number, clicks: number): number {
    return this.safeDiv(spend, clicks);
  }

  static cpa(spend: number, conversions: number): number {
    return this.safeDiv(spend, conversions);
  }

  static roas(revenue: number, spend: number): number {
    return this.safeDiv(revenue, spend);
  }

  static netSales(sales: number, refunds: number, cancellations: number): number {
    return sales - refunds - cancellations;
  }

  static profit(
    netSales: number,
    cogs: number,
    marketplaceFee: number,
    affiliateCost: number,
    adsSpend: number,
    otherCosts: number
  ): number {
    return netSales - cogs - marketplaceFee - affiliateCost - adsSpend - otherCosts;
  }

  static profitMargin(profit: number, netSales: number): number {
    return this.safeDiv(profit, netSales) * 100;
  }

  static budgetUtilization(spent: number, allocated: number): number {
    return this.safeDiv(spent, allocated) * 100;
  }

  static targetAchievement(actual: number, target: number): number {
    return this.safeDiv(actual, target) * 100;
  }

  // Statistical Forecasting (Simple Average Daily Run Rate)
  static forecastCurrentMonth(currentValue: number, daysElapsed: number, totalDaysInMonth: number): number {
    if (daysElapsed === 0 || totalDaysInMonth === 0) return 0;
    const dailyRunRate = this.safeDiv(currentValue, daysElapsed);
    return dailyRunRate * totalDaysInMonth;
  }

  static forecastNextDays(recentValues: number[], daysToForecast: number): number {
    if (recentValues.length === 0) return 0;
    const sum = recentValues.reduce((a, b) => a + b, 0);
    const avg = this.safeDiv(sum, recentValues.length);
    return avg * daysToForecast;
  }

  // ==========================================
  // PHASE 6: AFFILIATE INTELLIGENCE
  // ==========================================

  static affiliateCommission(gmv: number, commissionPct: number): number {
    return gmv * (commissionPct / 100);
  }

  static affiliateNetContribution(
    sales: number,
    refunds: number,
    cancellations: number,
    cogs: number,
    marketplaceFee: number,
    affiliateCost: number,
    otherCosts: number
  ): number {
    const netSales = this.netSales(sales, refunds, cancellations);
    return netSales - cogs - marketplaceFee - affiliateCost - otherCosts;
  }

  static affiliateROI(netContribution: number, affiliateCost: number): number {
    return this.safeDiv(netContribution, affiliateCost);
  }

  // To find the maximum commission we can afford while maintaining Target ROI
  // targetROI = Net Contribution / Affiliate Cost
  // targetROI = (NetSales - COGS - MktFee - AffCost - Other) / AffCost
  // (targetROI * AffCost) + AffCost = NetSales - COGS - MktFee - Other
  // AffCost * (targetROI + 1) = AvailableMargin
  // AffCost = AvailableMargin / (targetROI + 1)
  // MaxCommissionPct = (AffCost / Sales) * 100
  static maximumSustainableCommission(
    sales: number,
    cogs: number,
    marketplaceFee: number,
    otherCosts: number,
    targetROI: number
  ): number {
    if (sales <= 0) return 0;
    const availableMargin = sales - cogs - marketplaceFee - otherCosts;
    const maxAffiliateCost = this.safeDiv(availableMargin, targetROI + 1);
    return this.safeDiv(maxAffiliateCost, sales) * 100;
  }

  static breakEvenCommission(
    sales: number,
    cogs: number,
    marketplaceFee: number,
    otherCosts: number
  ): number {
    return this.maximumSustainableCommission(sales, cogs, marketplaceFee, otherCosts, 0);
  }

  // Discovery Engine Heuristics
  static audienceMatchScore(
    brandPrimaryAgeMin: number, brandPrimaryAgeMax: number,
    brandGender: string,
    affiliateAgeMin: number, affiliateAgeMax: number,
    affiliateGender: string
  ): number {
    let score = 100;
    // Basic heuristics
    if (brandGender !== 'ALL' && affiliateGender !== 'ALL' && brandGender !== affiliateGender) {
      score -= 40;
    }
    // Age overlap penalty
    if (affiliateAgeMin > brandPrimaryAgeMax || affiliateAgeMax < brandPrimaryAgeMin) {
      score -= 30; // completely outside
    } else if (affiliateAgeMin > brandPrimaryAgeMin || affiliateAgeMax > brandPrimaryAgeMax) {
      score -= 10; // partial overlap variance
    }
    return Math.max(0, score);
  }

  static affiliatePotentialScore(
    audienceMatch: number,
    engagementRate: number,
    historicalROI: number,
    categoryMatch: boolean
  ): number {
    // 30% Audience Fit, 20% Engagement Quality, 15% Category Fit, 15% Historical ROI (capped), 20% Base
    const audienceWeighted = (audienceMatch / 100) * 30;
    const engagementWeighted = Math.min((engagementRate / 10) * 20, 20); // Assumes 10% engagement is stellar
    const categoryWeighted = categoryMatch ? 15 : 0;
    const roiWeighted = Math.min((this.safeDiv(historicalROI, 5)) * 15, 15); // Assumes 5x ROI is target

    return Math.round(20 + audienceWeighted + engagementWeighted + categoryWeighted + roiWeighted);
  }

  // ==========================================
  // PHASE 13: MARGIN PROTECTION ENGINE
  // ==========================================

  /**
   * Gross Sales = Selling Price × Units
   */
  static grossSales(sellingPrice: number, units: number): number {
    return Math.max(0, sellingPrice) * Math.max(0, units);
  }

  /**
   * Voucher Cost = Gross Sales × Voucher %
   */
  static voucherCost(grossSales: number, voucherPct: number): number {
    return grossSales * this.safeDiv(Math.max(0, voucherPct), 100);
  }

  /**
   * Marketplace Fee = Gross Sales × Marketplace Fee %
   */
  static marketplaceFeeAmount(grossSales: number, marketplaceFeePct: number): number {
    return grossSales * this.safeDiv(Math.max(0, marketplaceFeePct), 100);
  }

  /**
   * Affiliate Commission = Gross Sales × Affiliate Commission %
   */
  static affiliateCommissionAmount(grossSales: number, affiliateCommissionPct: number): number {
    return grossSales * this.safeDiv(Math.max(0, affiliateCommissionPct), 100);
  }

  /**
   * Net Revenue = Gross Sales - Refunds - Cancellations - Voucher Cost
   */
  static netRevenue(grossSales: number, refunds: number, cancellations: number, voucherCost: number): number {
    const result = grossSales - Math.max(0, refunds) - Math.max(0, cancellations) - Math.max(0, voucherCost);
    return isFinite(result) ? result : 0;
  }

  /**
   * Total Variable Cost = HPP + Marketplace Fees + Payment Fees + Affiliate Commission + Ad Cost + Other
   */
  static totalVariableCost(
    hpp: number,
    marketplaceFee: number,
    paymentFee: number,
    affiliateCommission: number,
    adCost: number,
    otherCosts: number
  ): number {
    const result = Math.max(0, hpp) + Math.max(0, marketplaceFee) + Math.max(0, paymentFee)
      + Math.max(0, affiliateCommission) + Math.max(0, adCost) + Math.max(0, otherCosts);
    return isFinite(result) ? result : 0;
  }

  /**
   * Net Profit = Net Revenue - Total Variable Cost
   */
  static netProfit(netRevenue: number, totalVariableCost: number): number {
    const result = netRevenue - totalVariableCost;
    return isFinite(result) ? result : 0;
  }

  /**
   * Margin % = Net Profit / Net Revenue × 100
   */
  static marginPercent(netProfit: number, netRevenue: number): number {
    if (netRevenue <= 0) return netProfit < 0 ? -100 : 0;
    const result = this.safeDiv(netProfit, netRevenue) * 100;
    return Math.max(-999, Math.min(999, result)); // clamp to reasonable range
  }

  /**
   * Full margin analysis for a single SKU scenario
   */
  static skuMarginAnalysis(params: {
    sellingPrice: number;
    units: number;
    hpp: number;
    marketplaceFeePct: number;
    paymentFeePct: number;
    affiliateCommissionPct: number;
    voucherPct: number;
    adSpendPct: number;
    otherCostsPct: number;
    refundsPct: number;
    cancellationsPct: number;
  }) {
    const gross = this.grossSales(params.sellingPrice, params.units);
    const refunds = gross * this.safeDiv(params.refundsPct, 100);
    const cancellations = gross * this.safeDiv(params.cancellationsPct, 100);
    const voucher = this.voucherCost(gross, params.voucherPct);
    const netRev = this.netRevenue(gross, refunds, cancellations, voucher);

    const mktFee = this.marketplaceFeeAmount(gross, params.marketplaceFeePct);
    const payFee = gross * this.safeDiv(params.paymentFeePct, 100);
    const affCom = this.affiliateCommissionAmount(gross, params.affiliateCommissionPct);
    const adCost = gross * this.safeDiv(params.adSpendPct, 100);
    const otherCosts = gross * this.safeDiv(params.otherCostsPct, 100);
    const hppTotal = params.hpp * params.units;

    const varCost = this.totalVariableCost(hppTotal, mktFee, payFee, affCom, adCost, otherCosts);
    const profit = this.netProfit(netRev, varCost);
    const margin = this.marginPercent(profit, netRev);

    return {
      grossSales: gross,
      refunds,
      cancellations,
      voucherCost: voucher,
      netRevenue: netRev,
      hppTotal,
      marketplaceFee: mktFee,
      paymentFee: payFee,
      affiliateCommission: affCom,
      adCost,
      otherCosts,
      totalVariableCost: varCost,
      netProfit: profit,
      marginPercent: margin,
    };
  }

  /**
   * Minimum safe selling price to hit target margin
   * Formula: MinPrice = HPP / (1 - targetMarginRate - allFeesRate)
   */
  static minimumSafePrice(params: {
    hpp: number;
    marketplaceFeePct: number;
    paymentFeePct: number;
    affiliateCommissionPct: number;
    voucherPct: number;
    adSpendPct: number;
    otherCostsPct: number;
    targetMarginPct: number;
  }): number {
    const allCostRates = (
      params.marketplaceFeePct +
      params.paymentFeePct +
      params.affiliateCommissionPct +
      params.voucherPct +
      params.adSpendPct +
      params.otherCostsPct +
      params.targetMarginPct
    ) / 100;

    const denominator = 1 - allCostRates;
    if (denominator <= 0 || !isFinite(denominator)) return params.hpp * 5; // fallback safety
    const result = this.safeDiv(params.hpp, denominator);
    return isFinite(result) && result > 0 ? result : params.hpp;
  }

  /**
   * Maximum safe voucher % at current price while maintaining target margin
   */
  static maximumSafeVoucher(params: {
    sellingPrice: number;
    hpp: number;
    marketplaceFeePct: number;
    paymentFeePct: number;
    affiliateCommissionPct: number;
    adSpendPct: number;
    otherCostsPct: number;
    targetMarginPct: number;
  }): number {
    const fixedCostRate = (
      params.marketplaceFeePct +
      params.paymentFeePct +
      params.affiliateCommissionPct +
      params.adSpendPct +
      params.otherCostsPct
    ) / 100;

    const hppRate = this.safeDiv(params.hpp, params.sellingPrice);
    const targetMarginRate = params.targetMarginPct / 100;
    const maxVoucherRate = 1 - hppRate - fixedCostRate - targetMarginRate;
    return Math.max(0, Math.min(50, maxVoucherRate * 100)); // clamp 0-50%
  }

  /**
   * Margin risk status classification
   */
  static marginRiskStatus(marginPct: number, targetMarginPct: number): 'SAFE' | 'LOW_MARGIN' | 'HIGH_RISK' | 'LOSS' {
    if (marginPct < 0) return 'LOSS';
    if (marginPct < targetMarginPct * 0.5) return 'HIGH_RISK';
    if (marginPct < targetMarginPct) return 'LOW_MARGIN';
    return 'SAFE';
  }

  // ==========================================
  // PHASE 15: INVENTORY INTELLIGENCE
  // ==========================================

  /**
   * Estimated days of stock remaining
   */
  static stockCoverageDays(availableStock: number, avgDailySales: number): number {
    if (availableStock <= 0) return 0;
    if (avgDailySales <= 0) return 999; // infinite if no sales
    return Math.floor(this.safeDiv(availableStock, avgDailySales));
  }

  /**
   * Stockout risk level
   */
  static stockoutRisk(coverageDays: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (coverageDays <= 3) return 'CRITICAL';
    if (coverageDays <= 7) return 'HIGH';
    if (coverageDays <= 14) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Campaign demand forecast
   */
  static campaignDemandForecast(avgDailySales: number, campaignDays: number, upliftMultiplier: number): number {
    return Math.ceil(avgDailySales * campaignDays * Math.max(1, upliftMultiplier));
  }
}


