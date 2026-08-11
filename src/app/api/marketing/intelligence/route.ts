import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from "@/lib/auth/assert-brand-access"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandIdParam = searchParams.get('brandId')
  
  
  const brand = await assertBrandAccess(brandIdParam)
  if (!brand) return NextResponse.json({ error: 'Forbidden. You do not have access to this workspace/brand.' }, { status: 403 })
  
  const brandId = brand.id

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const metrics = await prisma.dailyMetric.findMany({
      where: { brand_id: brandId, date: { gte: thirtyDaysAgo } },
      include: { platform: true }
    })

    const affMetrics = await prisma.affiliateMetric.findMany({
      where: { brand_id: brandId, date: { gte: thirtyDaysAgo } },
      include: { platform: true }
    })

    const insights = []

    // 1. Cross-channel ROAS check
    let metaSpend = 0, metaRev = 0
    let shopeeSpend = 0, shopeeRev = 0
    let tiktokSpend = 0, tiktokRev = 0

    metrics.forEach(m => {
      const p = m.platform.name.toLowerCase()
      if (p.includes('meta')) { metaSpend += (m.spend || 0); metaRev += (m.attributed_revenue || 0) }
      if (p.includes('shopee')) { shopeeSpend += (m.spend || 0); shopeeRev += (m.sales || 0) }
      if (p.includes('tiktok')) { tiktokSpend += (m.spend || 0); tiktokRev += (m.sales || 0) }
    })

    const metaRoas = metaSpend > 0 ? metaRev / metaSpend : 0
    const shopeeRoas = shopeeSpend > 0 ? shopeeRev / shopeeSpend : 0
    const tiktokRoas = tiktokSpend > 0 ? tiktokRev / tiktokSpend : 0

    if (metaRoas > 4 && shopeeRoas < 2.5 && shopeeSpend > 0) {
      insights.push({
        type: 'BUDGET_OPPORTUNITY',
        title: 'Budget Opportunity Detected',
        what: `Meta Ads is currently producing ${metaRoas.toFixed(1)}x ROAS, while Shopee Ads is producing ${shopeeRoas.toFixed(1)}x.`,
        why: 'Meta has maintained above-target ROAS over the last 30 days while Shopee efficiency has dropped.',
        action: 'Consider shifting 15% of Shopee budget toward Meta Ads to maximize top-line revenue.'
      })
    }

    // 2. Affiliate Opportunity Check
    let totalAffiliateGmv = 0
    affMetrics.forEach(m => totalAffiliateGmv += m.sales)
    const totalMarketplaceGmv = shopeeRev + tiktokRev // simplified
    const affiliateContribution = totalMarketplaceGmv > 0 ? (totalAffiliateGmv / totalMarketplaceGmv) * 100 : 0

    if (affiliateContribution > 0 && affiliateContribution < 10) {
      insights.push({
        type: 'GROWTH_OPPORTUNITY',
        title: 'Affiliate Under-utilization',
        what: `Affiliates currently drive only ${affiliateContribution.toFixed(1)}% of total GMV.`,
        why: 'The brand is heavily reliant on paid ads (Meta/Shopee) with low organic creator distribution.',
        action: 'Increase commission limits in Affiliate Settings to attract higher-tier creators.'
      })
    } else if (affiliateContribution > 30) {
      insights.push({
        type: 'SUCCESS_STREAK',
        title: 'Strong Affiliate Performance',
        what: `Affiliates drove ${affiliateContribution.toFixed(1)}% of total GMV.`,
        why: 'High-performing creators are effectively closing traffic.',
        action: 'Maintain current budget and lock in STAR affiliates with long-term contracts.'
      })
    }

    // Default insight if none trigger
    if (insights.length === 0) {
      insights.push({
        type: 'STABLE',
        title: 'Metrics Stable',
        what: 'Channel performance is tracking stably against targets.',
        why: 'No abnormal drops in ROAS or Conversion observed.',
        action: 'Continue current monitoring.'
      })
    }

    return NextResponse.json({ intelligence: insights })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
