import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  try {
    let profile = await prisma.brandAudienceProfile.findUnique({ where: { brand_id: brandId } })
    let target = await prisma.affiliateTarget.findFirst({ where: { brand_id: brandId } })

    if (!profile) {
      profile = await prisma.brandAudienceProfile.create({ data: { brand_id: brandId } })
    }
    if (!target) {
      target = await prisma.affiliateTarget.create({ data: { brand_id: brandId } })
    }

    return NextResponse.json({ profile, target })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { brandId, targetRoi, maxCommissionPct, minConversionPct, interests } = await request.json()
    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

    const target = await prisma.affiliateTarget.findFirst({ where: { brand_id: brandId } })
    if (target) {
      await prisma.affiliateTarget.update({
        where: { id: target.id },
        data: {
          target_roi: Number(targetRoi) || 5,
          max_commission_pct: Number(maxCommissionPct) || 15,
          min_conversion_pct: Number(minConversionPct) || 1
        }
      })
    }

    const profile = await prisma.brandAudienceProfile.findUnique({ where: { brand_id: brandId } })
    if (profile) {
      await prisma.brandAudienceProfile.update({
        where: { id: profile.id },
        data: { interests }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
