import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { brandId, ...data } = body
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify competitor belongs to this brand
  const competitor = await prisma.competitor.findFirst({
    where: { id: params.id, brand_id: brandId }
  })
  if (!competitor) return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })

  const product = await prisma.competitorProduct.create({
    data: {
      competitor_id: params.id,
      product_name: data.product_name,
      sku_reference: data.sku_reference ?? null,
      url: data.url ?? null,
      current_price: data.current_price ?? 0,
    }
  })

  return NextResponse.json({ product }, { status: 201 })
}
