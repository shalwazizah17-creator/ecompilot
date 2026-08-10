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

    // Usually filter by dates, category, marketplace...
    // For MVP we just fetch all product metrics for the brand
    const metrics = await prisma.dailyMetric.findMany({
      where: { brand_id: brandId, product_id: { not: null } },
      include: { product: true }
    })

    const productMap = new Map<string, any>()

    for (const m of metrics) {
      if (!m.product) continue
      
      const pid = m.product.id
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          id: pid,
          sku: m.product.sku,
          name: m.product.name,
          category: m.product.category,
          price: m.product.price,
          cogs: m.product.cogs,
          sales: 0,
          orders: 0,
          spend: 0,
          attrRev: 0,
          refunds: 0,
          cancellations: 0,
        })
      }

      const entry = productMap.get(pid)
      if (m.source_type === 'MARKETPLACE_SALES') {
        entry.sales += m.sales
        entry.orders += m.orders
        entry.refunds += m.refunds
        entry.cancellations += m.cancellations
      } else {
        entry.spend += m.spend
        entry.attrRev += m.attributed_revenue
      }
    }

    const products = Array.from(productMap.values()).map(p => {
      const netSales = Calculations.netSales(p.sales, p.refunds, p.cancellations)
      const profit = Calculations.profit(netSales, p.cogs * p.orders, 0, 0, p.spend, 0) // Mock fees
      const margin = Calculations.profitMargin(profit, netSales)
      const roas = Calculations.roas(p.attrRev, p.spend)

      return {
        ...p,
        netSales,
        profit,
        margin,
        roas
      }
    })

    return NextResponse.json({ products })

  } catch (error: any) {
    console.error('Products API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
