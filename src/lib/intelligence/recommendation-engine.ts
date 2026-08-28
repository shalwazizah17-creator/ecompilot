import { calculateConfidence, ConfidenceInput } from './confidence-engine';

export type RecInput = {
  category: string; // BUDGET, MARKETPLACE, PRODUCT, CAMPAIGN, AFFILIATE, PRICING, MARGIN, INVENTORY
  metric: string;
  currentValue: number;
  targetValue?: number;
  previousValue?: number;
  dataCoverage: number;
  observationDays: number;
  volume: number;
  trendStability: number;
  missingPlatforms: number;
  anomaliesDetected: number;
  businessImpact?: string;
  customReason?: string;
  customActionSteps?: string[];
  forceSeverity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  forceRecommendation?: string;
};

export type RecommendationOutput = {
  title: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  recommendation: string;
  reason: string;
  evidence: Array<{ metric: string; value: string; trend: string; description: string }>;
  expectedImpact: string;
  risk: string;
  actionSteps: string[];
  confidenceScore: number;
  confidenceLevel: string;
  dataCoverage: number;
  observationDays: number;
};

export function generateRecommendation(input: RecInput): RecommendationOutput {
  const confInput: ConfidenceInput = {
    observationDays: input.observationDays,
    dataCoveragePercent: input.dataCoverage,
    volume: input.volume,
    trendStability: input.trendStability,
    missingPlatforms: input.missingPlatforms,
    anomaliesDetected: input.anomaliesDetected
  };

  const confidence = calculateConfidence(confInput);
  
  const diffPercentTarget = input.targetValue ? ((input.currentValue - input.targetValue) / input.targetValue) * 100 : 0;
  const diffPercentPrev = input.previousValue ? ((input.currentValue - input.previousValue) / input.previousValue) * 100 : 0;
  
  let recommendation = input.forceRecommendation || 'Pertahankan strategi saat ini.';
  let severity: RecommendationOutput['severity'] = input.forceSeverity || 'INFO';
  let risk = 'Risiko minimal.';
  let expectedImpact = input.businessImpact || 'Performa stabil.';
  let actionSteps = input.customActionSteps || ['Lanjutkan pemantauan rutin.'];
  let reason = input.customReason || '';

  if (!input.forceRecommendation && confidence.score <= 60) {
    recommendation = 'Tunda tindakan agresif sampai data cukup.';
    severity = 'LOW';
    risk = 'Mengambil keputusan berdasarkan data yang minim berisiko tinggi (hallucination risk).';
    actionSteps = ['Tunggu hingga periode observasi minimum tercapai (7 hari).', 'Pastikan integrasi data marketplace berjalan normal.'];
    if (!reason) reason = 'Bukti data tidak mencukupi untuk membuat rekomendasi yang kuat.';
  } else if (!input.forceRecommendation && input.targetValue) {
    if (diffPercentTarget < -15) {
      recommendation = `Kurangi budget atau evaluasi ulang strategi ${input.category}.`;
      severity = diffPercentTarget < -30 ? 'CRITICAL' : 'HIGH';
      risk = 'Perubahan drastis dapat menurunkan volume secara tiba-tiba.';
      expectedImpact = 'Mencegah kerugian lebih lanjut dan menstabilkan ROI.';
      actionSteps = ['Kurangi alokasi budget 10–15%.', 'Evaluasi performa dalam 3 hari ke depan.'];
      if (!reason) reason = `${input.metric} berada di bawah target sebesar ${Math.abs(diffPercentTarget).toFixed(1)}%.`;
    } else if (diffPercentTarget > 10) {
      recommendation = `Tingkatkan alokasi budget untuk ${input.category}.`;
      severity = 'MEDIUM';
      risk = 'Diminishing returns jika budget dinaikkan terlalu agresif tanpa pengawasan.';
      expectedImpact = 'Peningkatan volume dan skala bisnis.';
      actionSteps = ['Naikkan budget 10–15%.', 'Pantau stabilitas ROAS harian.'];
      if (!reason) reason = `${input.metric} stabil di atas target (+${diffPercentTarget.toFixed(1)}%).`;
    } else {
      if (!reason) reason = `${input.metric} berada pada batas aman sesuai target.`;
    }
  }

  const evidence = [];
  if (input.targetValue) {
    evidence.push({
      metric: input.metric,
      value: input.currentValue.toString(),
      trend: diffPercentTarget >= 0 ? 'NAIK' : 'TURUN',
      description: `Target: ${input.targetValue} (${diffPercentTarget > 0 ? '+' : ''}${diffPercentTarget.toFixed(1)}% vs target)`
    });
  }
  if (input.previousValue) {
    evidence.push({
      metric: `${input.metric} (Sebelumnya)`,
      value: input.previousValue.toString(),
      trend: diffPercentPrev >= 0 ? 'NAIK' : 'TURUN',
      description: `Perubahan: ${diffPercentPrev > 0 ? '+' : ''}${diffPercentPrev.toFixed(1)}% vs periode sebelumnya`
    });
  }

  return {
    title: `Penyesuaian Strategi ${input.category}`,
    category: input.category,
    severity,
    recommendation,
    reason,
    evidence,
    expectedImpact,
    risk,
    actionSteps,
    confidenceScore: confidence.score,
    confidenceLevel: confidence.level,
    dataCoverage: input.dataCoverage,
    observationDays: input.observationDays
  };
}
