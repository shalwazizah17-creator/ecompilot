export type ConfidenceInput = {
  observationDays: number;
  dataCoveragePercent: number;
  volume: number;
  trendStability: number; // 0-1
  missingPlatforms: number;
  anomaliesDetected: number;
};

export type ConfidenceResult = {
  score: number;
  level: 'HIGH CONFIDENCE' | 'GOOD CONFIDENCE' | 'MODERATE CONFIDENCE' | 'LOW CONFIDENCE' | 'INSUFFICIENT DATA';
  reason: string;
};

export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
  let score = 100;
  let reason = 'Data is sufficient.';

  if (input.observationDays < 7) {
    score -= (7 - input.observationDays) * 10;
    reason = `Only ${input.observationDays} days of data available. Minimum recommended is 7 days.`;
  }

  if (input.dataCoveragePercent < 100) {
    score -= (100 - input.dataCoveragePercent) * 0.5;
  }

  if (input.missingPlatforms > 0) {
    score -= input.missingPlatforms * 15;
    reason = `Missing data from ${input.missingPlatforms} platforms.`;
  }

  if (input.anomaliesDetected > 0) {
    score -= input.anomaliesDetected * 10;
    reason = `${input.anomaliesDetected} anomalies detected in the dataset.`;
  }

  if (input.trendStability < 0.5) {
    score -= (0.5 - input.trendStability) * 40;
    reason = 'Trend is highly unstable.';
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: ConfidenceResult['level'];
  if (score >= 90) level = 'HIGH CONFIDENCE';
  else if (score >= 75) level = 'GOOD CONFIDENCE';
  else if (score >= 60) level = 'MODERATE CONFIDENCE';
  else if (score >= 40) level = 'LOW CONFIDENCE';
  else level = 'INSUFFICIENT DATA';

  if (level === 'INSUFFICIENT DATA') {
    reason = 'Recommendation confidence is low because data is insufficient to form a strong conclusion.';
  }

  return { score, level, reason };
}
