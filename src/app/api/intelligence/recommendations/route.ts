import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'
import { generateRecommendation } from '@/lib/intelligence/recommendation-engine'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const brandId = searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch or generate recommendations
  // For Phase 13, we demonstrate the engine dynamically generating recommendations
  // In a full background-worker setup, these would be pre-calculated and saved in the DB.
  
  const rec1 = generateRecommendation({
    category: 'Meta Ads',
    metric: 'ROAS',
    currentValue: 2.1,
    targetValue: 4.0,
    previousValue: 2.5,
    dataCoverage: 100,
    observationDays: 7,
    volume: 5000000,
    trendStability: 0.8,
    missingPlatforms: 0,
    anomaliesDetected: 0,
    businessImpact: 'Estimasi kerugian profit: Rp12,4 juta bulan ini.'
  });

  const rec2 = generateRecommendation({
    category: 'TikTok Ads',
    metric: 'ROAS',
    currentValue: 5.4,
    targetValue: 4.0,
    previousValue: 5.0,
    dataCoverage: 100,
    observationDays: 14,
    volume: 12000000,
    trendStability: 0.9,
    missingPlatforms: 0,
    anomaliesDetected: 0,
    businessImpact: 'Potensi penambahan revenue Rp25 juta jika budget dinaikkan.'
  });

  const rec3 = generateRecommendation({
    category: 'Shopee Affiliate',
    metric: 'Conversion Rate',
    currentValue: 2.5,
    targetValue: 5.0,
    dataCoverage: 60,
    observationDays: 3, // <7 days will trigger INSUFFICIENT DATA / LOW CONFIDENCE
    volume: 100,
    trendStability: 0.4,
    missingPlatforms: 0,
    anomaliesDetected: 0,
  });

  const recommendations = [rec1, rec2, rec3];

  // Optionally save them to the DB here if needed
  // ...

  return NextResponse.json({ recommendations })
}
