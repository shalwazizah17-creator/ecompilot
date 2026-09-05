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

    const recentEntries = salesMetrics.map(s => ({
      id: s.id,
      date: s.date.toISOString().split('T')[0],
      platform: s.platform?.name || 'Shopee',
      sales: s.sales,
      orders: s.orders,
      spend: s.spend,
      refunds: s.refunds,
      cancellations: s.cancellations,
    }))

    const hasData = totalGMV > 0 || totalOrders > 0 || recentEntries.length > 0

    return NextResponse.json({
      hasData,
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
      chartData: hasData ? chartData : [],
      platformGrowth: Array.from(platformGrowth.entries()).map(([name, gmv]) => ({ name, gmv })),
      recentEntries
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandIdParam = searchParams.get('brandId')
  
  const brand = await assertBrandAccess(brandIdParam)
  if (!brand) return NextResponse.json({ error: 'Forbidden. You do not have access to this workspace/brand.' }, { status: 403 })

  try {
    const body = await request.json()
    const { platformName, date, gmv, orders, spend, refunds, cancellations } = body

    const targetPlatformName = platformName || 'Shopee'
    let platform = await prisma.platform.findFirst({
      where: { name: { equals: targetPlatformName, mode: 'insensitive' } }
    })
    if (!platform) {
      platform = await prisma.platform.create({
        data: { name: targetPlatformName, is_marketplace: true }
      })
    }

    const metricDate = date ? new Date(date) : new Date()

    const created = await prisma.dailyMetric.create({
      data: {
        brand_id: brand.id,
        platform_id: platform.id,
        source_type: 'MARKETPLACE_SALES',
        date: metricDate,
        sales: Number(gmv) || 0,
        orders: Number(orders) || 0,
        spend: Number(spend) || 0,
        refunds: Number(refunds) || 0,
        cancellations: Number(cancellations) || 0,
      }
    })

    return NextResponse.json({ success: true, metric: created })
  } catch (error) {
    console.error('Error saving marketplace intelligence metric:', error)
    return NextResponse.json({ error: 'Gagal menyimpan data laporan' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandIdParam = searchParams.get('brandId')
  
  const brand = await assertBrandAccess(brandIdParam)
  if (!brand) return NextResponse.json({ error: 'Forbidden. You do not have access to this workspace/brand.' }, { status: 403 })

  try {
    const id = searchParams.get('id')
    const clearAll = searchParams.get('clearAll')

    if (clearAll === 'true') {
      await prisma.dailyMetric.deleteMany({
        where: { brand_id: brand.id }
      })
      return NextResponse.json({ success: true, message: 'Semua data laporan berhasil dibersihkan' })
    }

    if (id) {
      await prisma.dailyMetric.deleteMany({
        where: { id, brand_id: brand.id }
      })
      return NextResponse.json({ success: true, message: 'Data laporan berhasil dihapus' })
    }

    return NextResponse.json({ error: 'ID atau clearAll diperlukan' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting marketplace intelligence metric:', error)
    return NextResponse.json({ error: 'Gagal menghapus data laporan' }, { status: 500 })
  }
}
