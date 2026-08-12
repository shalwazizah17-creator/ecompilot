import { assertBrandAccess } from "@/lib/auth/assert-brand-access"
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const campaigns = await prisma.campaign.findMany({
      where: { brand_id: brand.id },
      include: { platform: true },
      orderBy: { name: 'asc' }
    })

    const formatted = campaigns.map(c => ({
      id: c.id,
      name: c.name,
      platformName: c.platform.name,
      type: c.type,
      objective: c.objective || '',
      status: c.status
    }))

    return NextResponse.json({ campaigns: formatted })
  } catch (error: any) {
    console.error('Campaign API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, name, platformName, type, objective, status } = await req.json()

    // Resolve Platform
    let platform = await prisma.platform.findUnique({ where: { name: platformName } })
    if (!platform) {
      platform = await prisma.platform.create({ data: { name: platformName, is_ad_channel: true } })
    }

    if (id) {
      const updated = await prisma.campaign.update({
        where: { id, brand_id: brand.id },
        data: { name, platform_id: platform.id, type, objective, status }
      })
      return NextResponse.json(updated)
    } else {
      const created = await prisma.campaign.create({
        data: {
          brand_id: brand.id,
          platform_id: platform.id,
          name, type, objective, status
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

    await prisma.campaign.delete({
      where: { id, brand_id: brand.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
