import { assertBrandAccess } from "@/lib/auth/assert-brand-access"
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
    
    
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden. You do not have access to this workspace/brand.' }, { status: 403 })
    
    const brandId = brand.id

    const actions = await prisma.actionItem.findMany({
      where: { brand_id: brandId, status: { not: 'DISMISSED' } },
      orderBy: { created_at: 'desc' },
      take: 20
    })

    return NextResponse.json({ actions })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
