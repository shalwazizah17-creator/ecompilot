import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  try {
    const dataSources = await prisma.dataSource.findMany({
      where: { brand_id: brandId },
      include: { platform: true }
    })

    if (dataSources.length === 0) {
      return NextResponse.json({
        score: 0,
        status: 'INSUFFICIENT DATA',
        checks: [
          { status: 'ERROR', message: 'Shopee Marketplace Not imported' },
          { status: 'ERROR', message: 'TikTok Shop Not imported' },
          { status: 'ERROR', message: 'Tokopedia Not imported' },
          { status: 'ERROR', message: 'Affiliate Not imported' },
          { status: 'ERROR', message: 'Meta Ads Not imported' },
        ]
      })
    }

    const healthChecks = []
    let score = 100

    let hasAffiliate = false
    let hasAds = false
    let hasMarketplace = false

    const now = new Date()

    dataSources.forEach(ds => {
      if (ds.platform.is_ad_channel) hasAds = true
      if (ds.platform.is_marketplace) hasMarketplace = true
      
      const daysSinceSync = ds.last_successful_sync_at 
        ? Math.floor((now.getTime() - new Date(ds.last_successful_sync_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      if (daysSinceSync === 999) {
        healthChecks.push({ status: 'ERROR', message: `${ds.platform.name} has never synced.` })
        score -= 10
      } else if (daysSinceSync > 3) {
        healthChecks.push({ status: 'WARNING', message: `${ds.platform.name} sync is ${daysSinceSync} days old.` })
        score -= 5
      } else {
        healthChecks.push({ status: 'OK', message: `${ds.platform.name} updated ${daysSinceSync} days ago.` })
      }
    })

    const affiliateCount = await prisma.affiliateMetric.count({ where: { brand_id: brandId } })
    if (affiliateCount > 0) {
      hasAffiliate = true
      healthChecks.push({ status: 'OK', message: 'Affiliate Data coverage active.' })
    } else {
      healthChecks.push({ status: 'WARNING', message: 'Affiliate Data missing. Import CSVs to unlock recommendations.' })
      score -= 5
    }

    if (!hasMarketplace) {
      healthChecks.push({ status: 'ERROR', message: 'No marketplace connection found. Forecasting disabled.' })
      score -= 20
    }
    if (!hasAds) {
      healthChecks.push({ status: 'WARNING', message: 'No advertising connection found. Budget engine disabled.' })
      score -= 10
    }

    return NextResponse.json({
      score: Math.max(0, score),
      status: score >= 90 ? 'Healthy' : score >= 70 ? 'Warning' : 'Critical',
      checks: healthChecks
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
