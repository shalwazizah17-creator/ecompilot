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
}

