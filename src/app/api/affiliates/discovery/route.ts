import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from "@/lib/auth/assert-brand-access"
import { evaluateAffiliate } from '@/lib/intelligence/affiliate-engine'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandIdParam = searchParams.get('brandId')
  
  const brand = await assertBrandAccess(brandIdParam)
  if (!brand) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  try {
    const affiliates = await prisma.affiliate.findMany({
      where: { brand_id: brand.id },
      include: { metrics: true }
    })

    // Mocking public creator pool + existing affiliates for discovery
    // In production, this would query a global database of creators
    const results = affiliates.map(aff => {
      // Mock metrics for discovery matching
      const audienceMatch = Math.floor(Math.random() * (95 - 60) + 60)
      const performanceVolume = Math.floor(Math.random() * (95 - 40) + 40)
      const conversionRate = Math.floor(Math.random() * (12 - 2) + 2)
      const commissionPercent = 10
      const growthPotential = Math.floor(Math.random() * 100)
      const historicalStability = Math.floor(Math.random() * (90 - 50) + 50)
      
      const totalSales = aff.metrics.reduce((acc, m) => acc + m.sales, 0)
      const totalCommission = aff.metrics.reduce((acc, m) => acc + m.commission, 0)
      const historicalROI = totalCommission > 0 ? ((totalSales - totalCommission) / totalCommission) : 4.5

      const evaluation = evaluateAffiliate({
        audienceMatch,
        performanceVolume,
        historicalROI,
        targetROI: 4.0,
        conversionRate,
        commissionPercent,
        growthPotential,
        historicalStability
      })

      return {
        id: aff.id,
        username: aff.username,
        platform: 'TikTok',
        category: 'Beauty',
        followers: aff.followers,
        engagement_rate: aff.engagement_rate,
        audienceMatch,
        evaluation,
        updatedAt: new Date().toISOString()
      }
    })

    // Sort by final score
    results.sort((a, b) => b.evaluation.score - a.evaluation.score)

    return NextResponse.json({ candidates: results })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
