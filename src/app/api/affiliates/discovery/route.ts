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
    const mockAffiliates = [
      { id: '1', username: 'tasya_skincare', followers: 245000, engagement_rate: 4.8 },
      { id: '2', username: 'glowwithme_id', followers: 120000, engagement_rate: 6.2 },
      { id: '3', username: 'racun_shopee_beauty', followers: 890000, engagement_rate: 2.1 },
      { id: '4', username: 'dokter_kulit_ku', followers: 560000, engagement_rate: 5.5 },
      { id: '5', username: 'makeupby_sasa', followers: 45000, engagement_rate: 8.9 },
      { id: '6', username: 'skintific_addict', followers: 150000, engagement_rate: 4.2 },
    ]

    const results = mockAffiliates.map(aff => {
      const audienceMatch = Math.floor(Math.random() * (95 - 60) + 60)
      const performanceVolume = Math.floor(Math.random() * (95 - 40) + 40)
      const conversionRate = Math.floor(Math.random() * (12 - 2) + 2)
      const commissionPercent = 10
      const growthPotential = Math.floor(Math.random() * 100)
      const historicalStability = Math.floor(Math.random() * (90 - 50) + 50)
      const historicalROI = 4.5

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

    results.sort((a, b) => b.evaluation.score - a.evaluation.score)

    return NextResponse.json({ candidates: results })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
