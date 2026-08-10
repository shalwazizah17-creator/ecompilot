import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  try {
    const brandProfile = await prisma.brandAudienceProfile.findUnique({
      where: { brand_id: brandId }
    })

    const affiliates = await prisma.affiliate.findMany({
      where: { brand_id: brandId },
      include: { metrics: true }
    })

    const results = affiliates.map(aff => {
      // Base historical metrics
      const totalSales = aff.metrics.reduce((acc, m) => acc + m.sales, 0)
      const totalCommission = aff.metrics.reduce((acc, m) => acc + m.commission, 0)
      const historicalROI = Calculations.affiliateROI(totalSales - totalCommission, totalCommission)

      // Brand vs Affiliate Match
      let audienceMatch = 100 // Default if no profile
      if (brandProfile) {
        audienceMatch = Calculations.audienceMatchScore(
          brandProfile.primary_age_min || 18, 
          brandProfile.primary_age_max || 65, 
          brandProfile.gender || 'ALL',
          aff.audience_age_min || 18, 
          aff.audience_age_max || 65, 
          aff.audience_gender || 'ALL'
        )
      }

      const potentialScore = Calculations.affiliatePotentialScore(
        audienceMatch,
        aff.engagement_rate,
        historicalROI,
        true // categoryMatch assumed true for MVP mock
      )

      let recommendationLabel = 'LOW PRIORITY'
      if (audienceMatch >= 85 && potentialScore >= 85) recommendationLabel = 'HIGH POTENTIAL'
      else if (audienceMatch >= 75 && potentialScore >= 75) recommendationLabel = 'GOOD FIT'
      else if (audienceMatch >= 60) recommendationLabel = 'TEST'

      return {
        id: aff.id,
        username: aff.username,
        followers: aff.followers,
        engagement_rate: aff.engagement_rate,
        historicalROI,
        audienceMatch,
        potentialScore,
        recommendationLabel,
        reasoning: `Matched ${audienceMatch}% with target audience. Potential score ${potentialScore}/100.`
      }
    })

    // Sort by potential
    results.sort((a, b) => b.potentialScore - a.potentialScore)

    return NextResponse.json({ candidates: results })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
