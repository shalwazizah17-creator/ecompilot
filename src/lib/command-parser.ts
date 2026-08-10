export type ParsedIntent = {
  intent: string
  target?: string
  action?: string
  metric?: string
  confidence: number
}

export class CommandParser {
  static parse(query: string): ParsedIntent {
    const q = query.toLowerCase()

    // 1. Budget Recommendations Intent
    if ((q.includes('should i') || q.includes('budget') || q.includes('where should i move')) && (q.includes('increase') || q.includes('decrease') || q.includes('move'))) {
      let target = 'ALL'
      if (q.includes('meta')) target = 'Meta Ads'
      else if (q.includes('tiktok')) target = 'TikTok Ads'
      else if (q.includes('shopee')) target = 'Shopee Ads'
      else if (q.includes('tokopedia')) target = 'Tokopedia Ads'

      return {
        intent: 'BUDGET_OPTIMIZATION',
        target,
        confidence: 0.95
      }
    }

    // 2. Affiliate Discovery Intent
    if (q.includes('affiliate') && (q.includes('which') || q.includes('best') || q.includes('prioritize') || q.includes('show'))) {
      return {
        intent: 'AFFILIATE_DISCOVERY',
        target: 'ALL',
        confidence: 0.9
      }
    }

    // 3. ROAS Analysis Intent
    if (q.includes('roas') && (q.includes('worst') || q.includes('below') || q.includes('above') || q.includes('target'))) {
      let action = 'COMPARE'
      if (q.includes('below') || q.includes('worst')) action = 'FIND_LOW'
      if (q.includes('above') || q.includes('best')) action = 'FIND_HIGH'

      return {
        intent: 'ROAS_ANALYSIS',
        action,
        confidence: 0.85
      }
    }

    // 4. Growth & Decline Analysis Intent
    if (q.includes('grew') || q.includes('drop') || q.includes('decline') || q.includes('caused')) {
      let metric = 'GMV'
      if (q.includes('profit')) metric = 'PROFIT'
      
      let action = 'ANALYZE_DROP'
      if (q.includes('grew') || q.includes('increase')) action = 'ANALYZE_GROWTH'

      return {
        intent: 'TREND_ANALYSIS',
        metric,
        action,
        confidence: 0.8
      }
    }

    // 5. Product Profitability Intent
    if (q.includes('product') && (q.includes('profit') || q.includes('margin'))) {
      return {
        intent: 'PRODUCT_ANALYSIS',
        action: 'FIND_LOW_MARGIN',
        confidence: 0.9
      }
    }

    return {
      intent: 'UNKNOWN',
      confidence: 0
    }
  }
}
