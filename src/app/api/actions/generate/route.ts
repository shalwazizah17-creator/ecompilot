import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')
    
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    const dateStart = new Date()
    dateStart.setDate(dateStart.getDate() - 30)

    // Fetch metrics grouped by date
    const metrics = await prisma.dailyMetric.findMany({
      where: { brand_id: brandId, date: { gte: dateStart }, source_type: 'META_CAMPAIGN' },
      include: { campaign: true, platform: true }
    })

    const targets = await prisma.target.findMany({ where: { brand_id: brandId } })
    const targetRoas = targets.find(t => t.type === 'ROAS')?.value || 5.0
    
    // Group by Campaign ID
    const campaignStats = new Map<string, any>()

    for (const m of metrics) {
      if (!m.campaign) continue
      const cid = m.campaign.id
      if (!campaignStats.has(cid)) {
        campaignStats.set(cid, {
          campaign: m.campaign,
          platform: m.platform,
          metrics: []
        })
      }
      campaignStats.get(cid).metrics.push(m)
    }

    const newActions = []
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    for (const [, stat] of Array.from(campaignStats.entries())) {
      // Sort metrics by date
      stat.metrics.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      // Data Sufficiency Check: Must have at least 7 days of non-zero spend
      const daysWithSpend = stat.metrics.filter((m: any) => m.spend > 0).length
      if (daysWithSpend < 7) continue // Insufficient data

      // Calculate 30-day aggregates
      let spend30 = 0, attrRev30 = 0, purchases30 = 0
      // Calculate 7-day aggregates
      let spend7 = 0, attrRev7 = 0, purchases7 = 0

      for (const m of stat.metrics) {
        spend30 += m.spend
        attrRev30 += m.attributed_revenue
        purchases30 += m.purchases
        
        if (new Date(m.date) >= sevenDaysAgo) {
          spend7 += m.spend
          attrRev7 += m.attributed_revenue
          purchases7 += m.purchases
        }
      }

      const roas30 = Calculations.roas(attrRev30, spend30)
      const roas7 = Calculations.roas(attrRev7, spend7)
      
      const isTrendingUp = roas7 >= roas30
      const isTrendingDown = roas7 < roas30 * 0.8 // 20% drop in recent window

      // Rule 1: High Performing (Opportunity)
      if (roas30 > targetRoas && roas7 > targetRoas && purchases30 >= 10 && spend30 >= 1000000 && isTrendingUp) {
        newActions.push({
          brand_id: brandId,
          severity: 'OPPORTUNITY',
          title: `Scale Campaign: ${stat.campaign.name}`,
          metric: `30d ROAS: ${roas30.toFixed(2)}x | 7d ROAS: ${roas7.toFixed(2)}x (Target: ${targetRoas.toFixed(2)}x)`,
          recommendation: `Campaign has strong ROAS with sufficient conversion volume and a stable/improving trend. Consider controlled budget scaling.`,
          status: 'OPEN'
        })
      }

      // Rule 2: Poor Performing (Medium / High)
      if (roas30 < targetRoas * 0.8 && roas7 < targetRoas * 0.8 && purchases30 > 0 && spend30 >= 2000000) {
        newActions.push({
          brand_id: brandId,
          severity: spend30 > 5000000 ? 'HIGH' : 'MEDIUM',
          title: `Underperforming Campaign: ${stat.campaign.name}`,
          metric: `30d ROAS: ${roas30.toFixed(2)}x | 7d ROAS: ${roas7.toFixed(2)}x (Target: ${targetRoas.toFixed(2)}x)`,
          recommendation: `Underperformance persists across multiple observations (30-day and 7-day). Review campaign before allocating additional budget.`,
          status: 'OPEN'
        })
      }
    }

    // ==========================================
    // PHASE 6: AFFILIATE INTELLIGENCE
    // ==========================================
    const affiliates = await prisma.affiliate.findMany({
      where: { brand_id: brandId },
      include: {
        metrics: {
          where: { date: { gte: dateStart } },
          orderBy: { date: 'desc' }
        }
      }
    })

    for (const aff of affiliates) {
      if (aff.metrics.length === 0) continue

      const totalSales = aff.metrics.reduce((acc, m) => acc + m.sales, 0)
      const totalCommission = aff.metrics.reduce((acc, m) => acc + m.commission, 0)
      
      if (totalCommission <= 0) continue
      
      const roi = Calculations.affiliateROI(totalSales - totalCommission, totalCommission)

      if (roi > 8 && totalSales > 5000000) {
        newActions.push({
          brand_id: brandId,
          severity: 'HIGH',
          title: `Top Performing Affiliate: @${aff.username}`,
          metric: `ROI: ${roi.toFixed(1)}x | GMV: Rp ${(totalSales/1000000).toFixed(1)}M`,
          recommendation: `Affiliate is drastically outperforming ROI targets. Increase product allocation and test a higher commission to scale volume.`,
          status: 'OPEN'
        })
      } else if (roi < 3 && totalSales > 1000000) {
        newActions.push({
          brand_id: brandId,
          severity: 'MEDIUM',
          title: `Underperforming Affiliate: @${aff.username}`,
          metric: `ROI: ${roi.toFixed(1)}x | GMV: Rp ${(totalSales/1000000).toFixed(1)}M`,
          recommendation: `Commission efficiency is poor. ROI is significantly below target. Consider renegotiating commission or suspending campaign.`,
          status: 'OPEN'
        })
      }
    }

    const brandProfile = await prisma.brandAudienceProfile.findUnique({ where: { brand_id: brandId } })
    if (brandProfile) {
      // Find unchecked opportunities
      const untested = await prisma.affiliate.findMany({
        where: { brand_id: brandId, metrics: { none: {} } }
      })
      if (untested.length >= 3) {
        newActions.push({
          brand_id: brandId,
          severity: 'OPPORTUNITY',
          title: `Untested Affiliates Available`,
          metric: `${untested.length} creators ready`,
          recommendation: `You have multiple creators with strong audience fit but no historical performance data. Run a controlled test campaign.`,
          status: 'OPEN'
        })
      }
    }

    // Insert actions
    let inserted = 0
    for (const action of newActions) {
      // Prevent duplicates by checking title in last 24 hrs
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const existing = await prisma.actionItem.findFirst({
        where: { brand_id: brandId, title: action.title, created_at: { gte: yesterday } }
      })
      if (!existing) {
        await prisma.actionItem.create({ data: action })
        inserted++
      }
    }

    return NextResponse.json({ message: 'Engine run complete', actionsGenerated: inserted })

  } catch (error: any) {
    console.error('Action Engine Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
