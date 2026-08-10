import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'

export async function POST(request: Request) {
  try {
    const { brandId, metaBudgetChangePct, affiliateCommissionPct } = await request.json()
    
    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 30)

    // Baseline historical calculation (30 days)
    const metrics = await prisma.dailyMetric.findMany({
      where: { brand_id: brandId, date: { gte: start, lte: end } }
    })
    
    let baseGmv = 0, baseSpend = 0, baseOrders = 0, baseCogs = 0
    metrics.forEach(m => {
      baseGmv += m.sales
      baseSpend += m.spend
      baseOrders += m.orders
    })

    // Simplistic extraction of Meta vs other based on data availability (Mocked distribution for simulation)
    // Assume Meta represents 70% of spend and 60% of GMV
    let metaSpend = baseSpend * 0.70
    let metaGmv = baseGmv * 0.60
    
    // Applying simulations
    const newMetaSpend = metaSpend * (1 + (metaBudgetChangePct / 100))
    // Diminishing returns: 20% budget increase = ~15% GMV increase
    const newMetaGmv = metaGmv * (1 + (metaBudgetChangePct * 0.75 / 100))

    const newTotalSpend = baseSpend - metaSpend + newMetaSpend
    const newTotalGmv = baseGmv - metaGmv + newMetaGmv
    
    // Affiliate Commission simulation
    // Assume Affiliate GMV is 20% of total GMV
    const affiliateGmv = newTotalGmv * 0.20
    const projectedAffiliateCost = affiliateGmv * (affiliateCommissionPct / 100)

    const projectedCogs = newTotalGmv * 0.40 // 40% margin assumption
    const projectedMarketplaceFees = newTotalGmv * 0.06 // 6%

    const projectedProfit = newTotalGmv - newTotalSpend - projectedAffiliateCost - projectedCogs - projectedMarketplaceFees
    const projectedRoas = Calculations.roas(newTotalGmv, newTotalSpend)

    return NextResponse.json({
      baseline: {
        spend: baseSpend,
        gmv: baseGmv,
        profit: baseGmv - baseSpend - (baseGmv * 0.40) - (baseGmv * 0.06) - (baseGmv * 0.20 * 0.10), // Base 10% comm
        roas: Calculations.roas(baseGmv, baseSpend)
      },
      projected: {
        spend: newTotalSpend,
        gmv: newTotalGmv,
        profit: projectedProfit,
        roas: projectedRoas,
        affiliateCost: projectedAffiliateCost
      }
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
