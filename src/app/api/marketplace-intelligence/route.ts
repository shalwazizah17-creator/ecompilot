import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'
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

    // Fetch Marketplace Sales
    const salesMetrics = await prisma.dailyMetric.findMany({
      where: { brand_id: brandId, date: { gte: thirtyDaysAgo }, source_type: 'MARKETPLACE_SALES' },
      include: { platform: true }
    })

    // Fetch Affiliate Sales
    const affiliateMetrics = await prisma.affiliateMetric.findMany({
      where: { brand_id: brandId, date: { gte: thirtyDaysAgo } }
    })

    // Fetch Ads Sales
    const adMetrics = await prisma.dailyMetric.findMany({
      where: { brand_id: brandId, date: { gte: thirtyDaysAgo }, source_type: { in: ['META_CAMPAIGN', 'AD_PERFORMANCE'] } }
    })

    let totalGMV = 0
    let totalNetSales = 0
    let totalOrders = 0
    let totalAdSpend = 0
    let totalAdRevenue = 0
    let totalAffiliateGMV = 0
    let totalAffiliateCommission = 0

    // Aggregate Sales
    const platformGrowth = new Map<string, number>()
    
    for (const s of salesMetrics) {
      totalGMV += s.sales
      totalNetSales += Calculations.netSales(s.sales, s.refunds, s.cancellations)
      totalOrders += s.orders

      if (s.platform) {
        const current = platformGrowth.get(s.platform.name) || 0
        platformGrowth.set(s.platform.name, current + s.sales)
      }
    }

    // Aggregate Affiliates
    for (const a of affiliateMetrics) {
      totalAffiliateGMV += a.sales
      totalAffiliateCommission += a.commission
    }

    // Aggregate Ads
    for (const a of adMetrics) {
      totalAdSpend += a.spend
      totalAdRevenue += a.attributed_revenue
    }

    const roas = Calculations.roas(totalAdRevenue, totalAdSpend)
    const affiliateContribution = Calculations.safeDiv(totalAffiliateGMV, totalGMV) * 100
    const profit = Calculations.profit(totalNetSales, totalNetSales * 0.3, totalNetSales * 0.05, totalAffiliateCommission, totalAdSpend, 0) // Mock COGS/fees for demo

    // Growth Data for Recharts
    const chartData = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      
      const daySales = salesMetrics.filter(m => m.date.toISOString().split('T')[0] === dateStr).reduce((a,b) => a+b.sales, 0)
      const dayOrders = salesMetrics.filter(m => m.date.toISOString().split('T')[0] === dateStr).reduce((a,b) => a+b.orders, 0)
      const dayAffGMV = affiliateMetrics.filter(m => m.date.toISOString().split('T')[0] === dateStr).reduce((a,b) => a+b.sales, 0)

      chartData.push({
        date: dateStr,
        gmv: daySales,
        orders: dayOrders,
        affiliateGmv: dayAffGMV
      })
    }

    return NextResponse.json({
      kpis: {
        totalGMV,
        totalNetSales,
        totalOrders,
        aov: Calculations.safeDiv(totalGMV, totalOrders),
        totalAdSpend,
        roas,
        totalAffiliateGMV,
        affiliateContribution,
        totalAffiliateCommission,
        profit
      },
      chartData,
      platformGrowth: Array.from(platformGrowth.entries()).map(([name, gmv]) => ({ name, gmv }))
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
