import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const brandId = req.nextUrl.searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(session.user.id, brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const records = await prisma.inventoryRecord.findMany({
    where: { brand_id: brandId },
    orderBy: { available_stock: 'asc' },
  })

  const withRisk = records.map(r => {
    const coverageDays = r.avg_daily_sales_7d > 0
      ? Math.floor(r.available_stock / r.avg_daily_sales_7d)
      : 999
    const risk = coverageDays <= 3 ? 'CRITICAL' : coverageDays <= 7 ? 'HIGH' : coverageDays <= 14 ? 'MEDIUM' : 'LOW'
    return { ...r, coverageDays, stockoutRisk: risk }
  })

  return NextResponse.json({ records: withRisk })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { brandId, ...data } = body
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(session.user.id, brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const brand = await prisma.brand.findFirst({ where: { id: brandId } })
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

  const record = await prisma.inventoryRecord.upsert({
    where: { id: data.id ?? 'new' },
    create: { ...data, brand_id: brandId, workspace_id: brand.workspace_id },
    update: data,
  })

  return NextResponse.json({ record })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  const brandId = req.nextUrl.searchParams.get('brandId')
  if (!id || !brandId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const access = await assertBrandAccess(session.user.id, brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.inventoryRecord.deleteMany({ where: { id, brand_id: brandId } })
  return NextResponse.json({ success: true })
}

