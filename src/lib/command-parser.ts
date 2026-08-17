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
    if ((q.includes('should i') || q.includes('budget') || q.includes('anggaran') || q.includes('where should i move')) &&
      (q.includes('increase') || q.includes('decrease') || q.includes('move') || q.includes('naik') || q.includes('turun'))) {
      let target = 'ALL'
      if (q.includes('meta')) target = 'Meta Ads'
      else if (q.includes('tiktok')) target = 'TikTok Ads'
      else if (q.includes('shopee')) target = 'Shopee Ads'
      else if (q.includes('tokopedia')) target = 'Tokopedia Ads'
      return { intent: 'BUDGET_OPTIMIZATION', target, confidence: 0.95 }
    }

    // 2. Affiliate Discovery Intent
    if ((q.includes('affiliate') || q.includes('afiliasi')) &&
      (q.includes('which') || q.includes('best') || q.includes('prioritize') || q.includes('show') || q.includes('terbaik') || q.includes('hubungi'))) {
      return { intent: 'AFFILIATE_DISCOVERY', target: 'ALL', confidence: 0.9 }
    }

    // 3. ROAS Analysis Intent
    if (q.includes('roas') && (q.includes('worst') || q.includes('below') || q.includes('above') || q.includes('target') || q.includes('rendah') || q.includes('tinggi'))) {
      let action = 'COMPARE'
      if (q.includes('below') || q.includes('worst') || q.includes('rendah')) action = 'FIND_LOW'
      if (q.includes('above') || q.includes('best') || q.includes('tinggi')) action = 'FIND_HIGH'
      return { intent: 'ROAS_ANALYSIS', action, confidence: 0.85 }
    }

    // 4. Marketplace Growth Comparison — check BEFORE generic trend to avoid collision
    if ((q.includes('marketplace') || q.includes('platform')) &&
      (q.includes('grew') || q.includes('grow') || q.includes('most') || q.includes('tumbuh') || q.includes('terbesar') || q.includes('paling'))) {
      return { intent: 'MARKETPLACE_COMPARISON', action: 'FIND_TOP_GROWTH', confidence: 0.85 }
    }

    // 5. GMV Drop / Growth Analysis
    if (q.includes('grew') || q.includes('drop') || q.includes('decline') || q.includes('caused') ||
      q.includes('turun') || q.includes('naik') || q.includes('kenapa') || q.includes('why did') || q.includes('why')) {
      let metric = 'GMV'
      if (q.includes('profit') || q.includes('margin')) metric = 'PROFIT'
      let action = 'ANALYZE_DROP'
      if (q.includes('grew') || q.includes('increase') || q.includes('naik')) action = 'ANALYZE_GROWTH'
      return { intent: 'TREND_ANALYSIS', metric, action, confidence: 0.8 }
    }

    // 6. Margin / Profitability Intent (Phase 13)
    if (q.includes('margin') || q.includes('profit') ||
      (q.includes('produk') && (q.includes('rugi') || q.includes('loss') || q.includes('losing'))) ||
      q.includes('losing money') || q.includes('unprofitable')) {
      let action = 'FIND_LOW_MARGIN'
      if (q.includes('loss') || q.includes('rugi') || q.includes('losing')) action = 'FIND_LOSS'
      if (q.includes('safe') || q.includes('aman')) action = 'FIND_SAFE'
      return { intent: 'MARGIN_ANALYSIS', action, confidence: 0.9 }
    }

    // 7. Ads Scale / Reduce Intent
    if ((q.includes('ads') || q.includes('iklan') || q.includes('campaign') || q.includes('kampanye')) &&
      (q.includes('scale') || q.includes('reduce') || q.includes('increase') || q.includes('decrease') ||
        q.includes('kurangi') || q.includes('naik') || q.includes('turun') || q.includes('scale up'))) {
      const action = q.includes('reduce') || q.includes('kurangi') ? 'REDUCE' : 'SCALE'
      return { intent: 'ADS_OPTIMIZATION', action, confidence: 0.85 }
    }

    // 8. Competitor Intelligence Intent (Phase 14)
    if (q.includes('competitor') || q.includes('kompetitor') || q.includes('harga pesaing') || q.includes('rival')) {
      return { intent: 'COMPETITOR_ANALYSIS', action: 'SHOW_PRICE_CHANGES', confidence: 0.9 }
    }

    // 9. Inventory / Stockout Intent (Phase 15)
    if (q.includes('stock') || q.includes('stok') || q.includes('habis') || q.includes('stockout') || q.includes('inventory') || q.includes('inventori')) {
      return { intent: 'INVENTORY_RISK', action: 'FIND_STOCKOUT_RISK', confidence: 0.9 }
    }

    // 10. Customer Sentiment / Complaints (Phase 16)
    if (q.includes('customer') || q.includes('pelanggan') || q.includes('review') || q.includes('ulasan') ||
      q.includes('complaint') || q.includes('keluhan') || q.includes('complain') || q.includes('sentiment')) {
      return { intent: 'CUSTOMER_SENTIMENT', action: 'SHOW_TOP_COMPLAINTS', confidence: 0.9 }
    }

    // 11. Today's Priority Actions (Phase 17)
    if (q.includes('today') || q.includes('hari ini') || q.includes('what should') || q.includes('apa yang harus') ||
      q.includes('priority') || q.includes('prioritas') || q.includes('action') || q.includes('tindakan')) {
      return { intent: 'ACTION_PRIORITY', action: 'SHOW_TODAY_ACTIONS', confidence: 0.85 }
    }

    return { intent: 'UNKNOWN', confidence: 0 }
  }
}

