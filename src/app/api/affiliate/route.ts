import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  try {
    const metrics = await prisma.affiliateMetric.findMany({
      where: { brand_id: brandId },
      include: { affiliate: true, platform: true }
    })

    // Aggregate KPIs
    let totalGmv = 0
    let totalOrders = 0
    let totalCommission = 0
    let affiliateStats = new Map()

    metrics.forEach(m => {
      totalGmv += m.sales
      totalOrders += m.orders
      totalCommission += m.commission

      if (!affiliateStats.has(m.affiliate_id)) {
        affiliateStats.set(m.affiliate_id, {
          affiliate: m.affiliate,
          platform: m.platform,
          sales: 0,
          orders: 0,
          commission: 0,
          clicks: 0
        })
      }
      const st = affiliateStats.get(m.affiliate_id)
      st.sales += m.sales
      st.orders += m.orders
      st.commission += m.commission
      st.clicks += m.clicks
    })

    const roas = totalCommission > 0 ? totalGmv / totalCommission : 0

    // Affiliates Table format
    const tableData = Array.from(affiliateStats.values()).map(a => {
      const roi = a.commission > 0 ? (a.sales / a.commission) * 100 : 0
      const cvr = a.clicks > 0 ? (a.orders / a.clicks) * 100 : 0
      
      let recommendation = 'STABLE'
      if (roi > 500 && cvr > 3) recommendation = 'STAR'
      else if (roi > 300) recommendation = 'HIGH POTENTIAL'
      else if (roi < 100) recommendation = 'RISK'

      return {
        id: a.affiliate.id,
        name: a.affiliate.display_name || a.affiliate.username || a.affiliate.external_id,
        platform: a.platform.name,
        gmv: a.sales,
        orders: a.orders,
        commission: a.commission,
        roi,
        cvr,
        recommendation
      }
    })

    return NextResponse.json({
      kpis: {
        totalGmv,
        totalOrders,
        totalCommission,
        roas,
        activeAffiliates: affiliateStats.size
      },
      table: tableData
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
