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

  const competitors = await prisma.competitor.findMany({
    where: { brand_id: brandId },
    include: {
      products: {
        include: { snapshots: { orderBy: { captured_at: 'desc' }, take: 10 } }
      }
    },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ competitors })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { brandId, name, marketplace, store_url } = body
  if (!brandId || !name) return NextResponse.json({ error: 'brandId and name required' }, { status: 400 })

  const access = await assertBrandAccess(session.user.id, brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const brand = await prisma.brand.findFirst({ where: { id: brandId } })
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

  const competitor = await prisma.competitor.create({
    data: { brand_id: brandId, workspace_id: brand.workspace_id, name, marketplace: marketplace ?? 'shopee', store_url: store_url ?? null },
  })
  return NextResponse.json({ competitor }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  const brandId = req.nextUrl.searchParams.get('brandId')
  if (!id || !brandId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const access = await assertBrandAccess(session.user.id, brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.competitor.deleteMany({ where: { id, brand_id: brandId } })
  return NextResponse.json({ success: true })
}

