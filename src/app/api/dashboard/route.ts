import { assertBrandAccess } from "@/lib/auth/assert-brand-access"
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    
    const brandIdParam = searchParams.get('brandId')
    
    
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden. You do not have access to this workspace/brand.' }, { status: 403 })
    
    const brandId = brand.id

    const marketplace = searchParams.get('marketplace') || 'ALL'
    const channel = searchParams.get('channel') || 'ALL'
    
    // In production, parse real dates. Here we just fetch last 30 days of data.
    const dateStart = new Date()
    dateStart.setDate(dateStart.getDate() - 30)

    const metrics = await prisma.dailyMetric.findMany({
      where: {
        brand_id: brandId,
        date: { gte: dateStart }
      }
    })

    // Filter by Marketplace & Channel logic
    // We separate sales metrics from ad metrics
    let totalSales = 0
    let totalSpend = 0
    let totalAttrRev = 0
    let totalOrders = 0
    let totalClicks = 0
    let totalPurchases = 0

    // Grouping by Date for Recharts
    const trendMap: Record<string, { revenue: number, spend: number }> = {}

    metrics.forEach(m => {
      const dateStr = m.date.toISOString().split('T')[0]
      if (!trendMap[dateStr]) trendMap[dateStr] = { revenue: 0, spend: 0 }

      const isMarketplaceSales = m.source_type === 'MARKETPLACE_SALES'
      const isAd = m.source_type !== 'MARKETPLACE_SALES'

      if (isMarketplaceSales) {
        if (marketplace === 'ALL' || m.platform_id === marketplace) {
          totalSales += m.sales
          totalOrders += m.orders
          trendMap[dateStr].revenue += m.sales
        }
      }

      if (isAd) {
        if (channel === 'ALL' || m.platform_id === channel) {
          totalSpend += m.spend
          totalAttrRev += m.attributed_revenue
          totalClicks += m.clicks
          totalPurchases += m.purchases
          trendMap[dateStr].spend += m.spend
        }
      }
    })

    // Convert map to array and sort
    const trendData = Object.keys(trendMap).sort().map(date => ({
      date,
      revenue: trendMap[date].revenue,
      spend: trendMap[date].spend
    }))

    const cpa = Calculations.cpa(totalSpend, totalPurchases)
    const roas = Calculations.roas(totalAttrRev, totalSpend)
    const profit = Calculations.profit(totalSales, 0, 0, 0, totalSpend, 0) // Simplified for MVP

    return NextResponse.json({
      kpis: {
        totalSales,
        totalSpend,
        totalAttrRev,
        totalOrders,
        cpa,
        roas,
        profit
      },
      trendData
    })

  } catch (error: any) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
