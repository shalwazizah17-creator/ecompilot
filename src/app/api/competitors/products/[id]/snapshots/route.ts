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
  const { brandId, price, notes } = body
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify product belongs to a competitor of this brand
  const product = await prisma.competitorProduct.findFirst({
    where: { id: params.id },
    include: { competitor: true }
  })
  if (!product || product.competitor.brand_id !== brandId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const snapshot = await prisma.competitorSnapshot.create({
    data: { competitor_product_id: params.id, price: price ?? 0, notes: notes ?? null }
  })

  // Update current price on product
  await prisma.competitorProduct.update({
    where: { id: params.id },
    data: { current_price: price ?? 0, last_checked_at: new Date() }
  })

  return NextResponse.json({ snapshot }, { status: 201 })
}
