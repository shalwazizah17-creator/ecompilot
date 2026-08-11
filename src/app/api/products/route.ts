import { assertBrandAccess } from "@/lib/auth/assert-brand-access"
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const rawProducts = await prisma.product.findMany({
      where: { brand_id: brand.id },
      include: { daily_metrics: true },
      orderBy: { name: 'asc' }
    })

    const products = rawProducts.map(p => {
      let sales = 0, orders = 0, refunds = 0, cancellations = 0, spend = 0, attrRev = 0

      for (const m of p.daily_metrics) {
        if (m.source_type === 'MARKETPLACE_SALES') {
          sales += m.sales
          orders += m.orders
          refunds += m.refunds
          cancellations += m.cancellations
        } else {
          spend += m.spend
          attrRev += m.attributed_revenue
        }
      }

      const netSales = Calculations.netSales(sales, refunds, cancellations)
      const profit = Calculations.profit(netSales, p.cogs * orders, 0, 0, spend, 0)
      const margin = Calculations.profitMargin(profit, netSales)
      const roas = Calculations.roas(attrRev, spend)

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        price: p.price,
        cogs: p.cogs,
        sales, orders, spend, attrRev, refunds, cancellations,
        netSales, profit, margin, roas
      }
    })

    return NextResponse.json({ products })

  } catch (error: any) {
    console.error('Products API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, sku, name, category, price, cogs } = await req.json()

    if (id) {
      // Update existing
      const updated = await prisma.product.update({
        where: { id, brand_id: brand.id },
        data: { sku, name, category, price: Number(price), cogs: Number(cogs) }
      })
      return NextResponse.json(updated)
    } else {
      // Create new
      const created = await prisma.product.create({
        data: {
          brand_id: brand.id,
          sku, name, category,
          price: Number(price), cogs: Number(cogs)
        }
      })
      return NextResponse.json(created)
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    await prisma.product.delete({
      where: { id, brand_id: brand.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
