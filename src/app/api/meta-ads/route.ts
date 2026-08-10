import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    
    const brandId = searchParams.get('brandId')
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }
    
    // We fetch hierarchical metrics
    // Simplified for MVP, we just fetch all meta ads data
    const metrics = await prisma.dailyMetric.findMany({
      where: { 
        brand_id: brandId, 
        source_type: { in: ['META_CAMPAIGN', 'META_AD_SET', 'META_AD'] }
      },
      include: {
        campaign: true,
        ad_set: true,
        ad: true
      }
    })

    const campaignsMap = new Map<string, any>()

    for (const m of metrics) {
      if (!m.campaign) continue
      
      const cid = m.campaign.id
      if (!campaignsMap.has(cid)) {
        campaignsMap.set(cid, {
          id: cid,
          name: m.campaign.name,
          objective: m.campaign.objective,
          status: m.campaign.status,
          spend: 0,
          attrRev: 0,
          purchases: 0,
          impressions: 0,
          clicks: 0
        })
      }

      const entry = campaignsMap.get(cid)
      entry.spend += m.spend
      entry.attrRev += m.attributed_revenue
      entry.purchases += m.purchases
      entry.impressions += m.impressions
      entry.clicks += m.clicks
    }

    const campaigns = Array.from(campaignsMap.values()).map(c => ({
      ...c,
      roas: Calculations.roas(c.attrRev, c.spend),
      cpa: Calculations.cpa(c.spend, c.purchases),
      ctr: Calculations.ctr(c.clicks, c.impressions),
      cpc: Calculations.cpc(c.spend, c.clicks),
      cpm: Calculations.safeDiv(c.spend, c.impressions) * 1000
    }))

    return NextResponse.json({ campaigns })

  } catch (error: any) {
    console.error('Meta API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
