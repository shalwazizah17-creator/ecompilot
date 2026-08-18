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

  const access = await assertBrandAccess(brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rules = await prisma.marginRule.findMany({ where: { brand_id: brandId }, orderBy: { marketplace: 'asc' } })
  return NextResponse.json({ rules })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { brandId, ...data } = body
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const brand = await prisma.brand.findFirst({ where: { id: brandId } })
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

  const rule = await prisma.marginRule.upsert({
    where: { brand_id_marketplace: { brand_id: brandId, marketplace: data.marketplace } },
    create: { ...data, brand_id: brandId, workspace_id: brand.workspace_id },
    update: data,
  })
  return NextResponse.json({ rule })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  const brandId = req.nextUrl.searchParams.get('brandId')
  if (!id || !brandId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const access = await assertBrandAccess(brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.marginRule.deleteMany({ where: { id, brand_id: brandId } })
  return NextResponse.json({ success: true })
}

