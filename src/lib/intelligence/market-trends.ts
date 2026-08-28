export type MarketTrendEvent = {
  category: string;
  platform: string;
  region: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  summary: string;
  source: string;
  sourceUrl?: string;
  confidence: number;
  publishedAt: Date;
  validFrom: Date;
  validUntil?: Date;
};

// Internal dummy database of trends for Phase 13 requirements
// (Normally fetched from DB)
const MARKET_TRENDS_DB: MarketTrendEvent[] = [
  {
    category: 'Skincare',
    platform: 'TikTok',
    region: 'ID',
    trend: 'UP',
    summary: 'Peningkatan pencarian untuk produk Ceramide dan Sunscreen akibat pergantian musim.',
    source: 'Official TikTok Shop Trend Report',
    confidence: 90,
    publishedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    validFrom: new Date(),
    validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
  },
  {
    category: 'Beauty',
    platform: 'Shopee',
    region: 'ID',
    trend: 'STABLE',
    summary: 'Penjualan kosmetik stabil menjelang periode gajian.',
    source: 'Shopee Insight Q3',
    confidence: 85,
    publishedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
    validFrom: new Date(),
    validUntil: new Date(new Date().setDate(new Date().getDate() + 10)),
  }
];

export async function getActiveMarketTrends(category?: string): Promise<MarketTrendEvent[]> {
  const now = new Date();
  let trends = MARKET_TRENDS_DB.filter(t => 
    t.validFrom <= now && 
    (!t.validUntil || t.validUntil >= now)
  );

  if (category) {
    trends = trends.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  return trends;
}

export function validateTrendSource(source: string): boolean {
  const acceptableSources = [
    'official marketplace announcements',
    'official platform documentation',
    'public industry reports',
    'reputable market research',
    'reputable ecommerce publications',
    'public campaign calendars',
    'Shopee Insight Q3',
    'Official TikTok Shop Trend Report'
  ];
  return acceptableSources.some(s => source.toLowerCase().includes(s.toLowerCase()));
}
