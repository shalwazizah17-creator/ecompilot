import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  try {
    const affiliates = await prisma.affiliate.findMany({
      where: { brand_id: brandId },
      include: {
        metrics: {
          orderBy: { date: 'desc' }
        }
      }
    })

    const results = affiliates.map(aff => {
      const totalSales = aff.metrics.reduce((acc, m) => acc + m.sales, 0)
      const totalCommission = aff.metrics.reduce((acc, m) => acc + m.commission, 0)
      const totalOrders = aff.metrics.reduce((acc, m) => acc + m.orders, 0)
      const totalClicks = aff.metrics.reduce((acc, m) => acc + m.clicks, 0)
      const roi = Calculations.affiliateROI(totalSales - totalCommission, totalCommission)

      return {
        id: aff.id,
        username: aff.username,
        followers: aff.followers,
        category: aff.category,
        totalSales,
        totalCommission,
        totalOrders,
        roi,
        cvr: Calculations.cvr(totalOrders, totalClicks)
      }
    })

    return NextResponse.json({ affiliates: results })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
