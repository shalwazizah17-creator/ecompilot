export type SeasonalityEvent = {
  eventName: string;
  startDate: Date;
  endDate: Date;
  impactType: 'TRAFFIC_SPIKE' | 'CONVERSION_SPIKE' | 'NORMALIZATION' | 'CATEGORY_SHIFT';
  expectedMultiplier: number;
};

// Mocking some events based on requirement
export function detectSeasonality(date: Date, category: string): SeasonalityEvent | null {
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Payday patterns (25th - 1st)
  if (day >= 25 || day === 1) {
    return {
      eventName: 'Payday Promo',
      startDate: new Date(date.getFullYear(), month, 25),
      endDate: new Date(date.getFullYear(), month + (day === 1 ? 0 : 1), 1),
      impactType: 'CONVERSION_SPIKE',
      expectedMultiplier: 1.5
    };
  }

  // Double dates (e.g. 9.9)
  if (month + 1 === day && day >= 6) { // 6.6, 7.7, 8.8, 9.9, etc.
    return {
      eventName: `${day}.${month + 1} Mega Campaign`,
      startDate: new Date(date.getFullYear(), month, day),
      endDate: new Date(date.getFullYear(), month, day),
      impactType: 'TRAFFIC_SPIKE',
      expectedMultiplier: 3.0
    };
  }

  // January Normalization
  if (month === 0 && day < 15) {
    return {
      eventName: 'Post-Holiday Normalization',
      startDate: new Date(date.getFullYear(), 0, 1),
      endDate: new Date(date.getFullYear(), 0, 15),
      impactType: 'NORMALIZATION',
      expectedMultiplier: 0.8
    };
  }

  // Category specific (Valentine's)
  if (month === 1 && day <= 14 && category === 'Beauty') {
    return {
      eventName: 'Valentine\'s Beauty Shift',
      startDate: new Date(date.getFullYear(), 1, 1),
      endDate: new Date(date.getFullYear(), 1, 14),
      impactType: 'CATEGORY_SHIFT',
      expectedMultiplier: 1.2
    };
  }

  return null;
}

export function assertHistoricalData(comparablePeriods: number): boolean {
  // Never claim seasonality if insufficient historical data exists.
  // Minimum: 3 comparable periods where possible.
  return comparablePeriods >= 3;
}
