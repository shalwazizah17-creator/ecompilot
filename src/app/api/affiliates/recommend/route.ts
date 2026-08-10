import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      brandId, 
      targetROI, 
      budget, 
      minCommission, 
      maxCommission,
      sellingPrice = 100000,
      cogs = 30000,
      marketplaceFeePct = 5,
      otherCosts = 0
    } = body

    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

    const marketplaceFee = sellingPrice * (marketplaceFeePct / 100)
    
    // Calculate the absolute Maximum Sustainable Commission for the Deal Simulator
    const maxSustainable = Calculations.maximumSustainableCommission(
      sellingPrice,
      cogs,
      marketplaceFee,
      otherCosts,
      targetROI
    )

    const breakEven = Calculations.breakEvenCommission(
      sellingPrice,
      cogs,
      marketplaceFee,
      otherCosts
    )

    // Find the best affiliate match (Mock logic using best potential score)
    const brandProfile = await prisma.brandAudienceProfile.findUnique({ where: { brand_id: brandId } })
    const affiliates = await prisma.affiliate.findMany({ where: { brand_id: brandId } })
    
    // Evaluate scenarios across the min/max range
    const step = (maxCommission - minCommission) / 3 || 1
    const scenarios = []
    
    for (let pct = minCommission; pct <= maxCommission; pct += step) {
      const commissionCost = sellingPrice * (pct / 100)
      const netContribution = Calculations.affiliateNetContribution(
        sellingPrice, 0, 0, cogs, marketplaceFee, commissionCost, otherCosts
      )
      const projectedROI = Calculations.affiliateROI(netContribution, commissionCost)
      
      let status = 'HEALTHY'
      if (pct > maxSustainable) status = 'BELOW TARGET'
      if (pct > breakEven) status = 'LOSS'

      scenarios.push({
        commissionPct: pct,
        projectedROI,
        commissionCost,
        netContribution,
        status
      })
    }

    return NextResponse.json({ 
      maxSustainableCommission: maxSustainable,
      breakEvenCommission: breakEven,
      scenarios,
      recommendedCommission: Math.min(maxSustainable, maxCommission),
      confidence: affiliates.length > 0 ? 'HIGH' : 'LOW'
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
