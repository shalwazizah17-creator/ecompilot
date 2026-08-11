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
    const notifications = await prisma.notification.findMany({
      where: { brand_id: brandId },
      orderBy: { created_at: 'desc' },
      take: 50
    })

    // Mock generation if empty to demonstrate functionality
    if (notifications.length === 0) {
      await prisma.notification.createMany({
        data: [
          { brand_id: brandId, severity: 'HIGH', type: 'ROAS_ALERT', title: 'Critical ROAS Drop', message: 'Shopee Ads ROAS dropped below 2.5x over the last 3 days.' },
          { brand_id: brandId, severity: 'MEDIUM', type: 'DATA_HEALTH', title: 'Delayed Sync', message: 'TikTok Shop has not synced for 18 hours.' },
          { brand_id: brandId, severity: 'INFO', type: 'OPPORTUNITY', title: 'Affiliate Opportunity', message: '3 new creators matched your target audience.' },
          { brand_id: brandId, severity: 'LOW', type: 'REPORT_READY', title: 'Weekly Report Generated', message: 'Your automated weekly report is ready to view.' },
        ]
      })

      const generated = await prisma.notification.findMany({
        where: { brand_id: brandId },
        orderBy: { created_at: 'desc' },
        take: 50
      })
      return NextResponse.json({ notifications: generated })
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, action } = await request.json()
    if (!id || !action) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

    await prisma.notification.update({
      where: { id },
      data: { status: action === 'ARCHIVE' ? 'ARCHIVED' : 'READ' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
