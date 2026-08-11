import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from "@/lib/auth/assert-brand-access"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandIdParam = searchParams.get('brandId')
  
  
  const brand = await assertBrandAccess(brandIdParam)
  if (!brand) return NextResponse.json({ error: 'Forbidden. You do not have access to this workspace/brand.' }, { status: 403 })
  
  const brandId = brand.id

  try {
    const target = await prisma.affiliateTarget.findFirst({ where: { brand_id: brandId } })
    const targetRoi = target?.target_roi || 5
    const maxComm = target?.max_commission_pct || 15

    const metrics = await prisma.affiliateMetric.findMany({
      where: { brand_id: brandId },
      include: { affiliate: true, platform: true },
      orderBy: { date: 'desc' }
    })

    const affStats = new Map()

    metrics.forEach(m => {
      if (!affStats.has(m.affiliate_id)) {
        affStats.set(m.affiliate_id, {
          affiliate: m.affiliate,
          platform: m.platform,
          daysActive: new Set(),
          sales: 0,
          orders: 0,
          commission: 0,
          clicks: 0
        })
      }
      const st = affStats.get(m.affiliate_id)
      st.sales += (m.sales || 0)
      st.orders += (m.orders || 0)
      st.commission += (m.commission || 0)
      st.clicks += (m.clicks || 0)
      st.daysActive.add(m.date.toISOString().split('T')[0])
    })

    const recommendations = Array.from(affStats.values()).map(st => {
      const activeDaysCount = st.daysActive.size
      let confidence = 'LOW MATCH'
      if (activeDaysCount >= 30) confidence = 'HIGH MATCH'
      else if (activeDaysCount >= 7) confidence = 'MEDIUM MATCH'

      const roi = st.commission > 0 ? (st.sales / st.commission) : 0
      const cvr = st.clicks > 0 ? (st.orders / st.clicks) * 100 : 0
      const commPct = st.sales > 0 ? (st.commission / st.sales) * 100 : 0

      let score = 0
      const reasons: string[] = []

      // 1. Performance Volume (25%)
      if (st.sales > 10000000) {
        score += 25
        reasons.push('High performance volume (GMV)')
      } else if (st.sales > 1000000) {
        score += 15
      }

      // 2. ROI (25%)
      if (roi >= targetRoi) {
        score += 25
        reasons.push('ROAS exceeds target')
      } else if (roi >= targetRoi * 0.7) {
        score += 15
      }

      // 3. Conversion (15%)
      if (cvr >= 2.0) {
        score += 15
        reasons.push('Strong conversion rate')
      } else if (cvr >= 1.0) {
        score += 8
      }

      // 4. Audience Match (15% - Mocked as 15 for demo since we don't have real ML tagging yet)
      score += 15
      reasons.push('Strong audience overlap')

      // 5. Stability (10%)
      if (activeDaysCount >= 14) {
        score += 10
        reasons.push(`Stable ${activeDaysCount}-day performance`)
      } else if (activeDaysCount >= 7) {
        score += 5
      }

      // 6. Commission Efficiency (5%)
      if (commPct <= maxComm && commPct > 0) {
        score += 5
        reasons.push('Commission within configured limit')
      }

      // 7. Growth (5%)
      score += 5 // Assuming stable growth for active affiliates in MVP

      let finalScore = Math.min(100, Math.round(score))
      
      let recommendationTag = 'STABLE'
      if (finalScore >= 80) recommendationTag = 'STAR'
      else if (finalScore >= 60) recommendationTag = 'HIGH POTENTIAL'
      else if (finalScore < 40) recommendationTag = 'RISK'

      return {
        affiliate: st.affiliate.display_name || st.affiliate.username || st.affiliate.external_id,
        platform: st.platform.name,
        score: finalScore,
        confidence,
        recommendation: recommendationTag,
        reasons,
        metrics: {
          gmv: st.sales,
          commission: st.commission,
          roas: roi,
          cvr,
          commPct
        }
      }
    })

    const topRecs = recommendations
      .sort((a, b) => b.score - a.score)

    return NextResponse.json({ recommendations: topRecs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
