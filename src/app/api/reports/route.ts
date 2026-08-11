import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from "@/lib/auth/assert-brand-access"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandIdParam = searchParams.get('brandId')
  
  
  const brand = await assertBrandAccess(brandIdParam)
  if (!brand) return NextResponse.json({ error: 'Forbidden. You do not have access to this workspace/brand.' }, { status: 403 })
  
  const brandId = brand.id

    const reports = await prisma.report.findMany({
      where: { brand_id: brandId },
      orderBy: { generated_date: 'desc' },
      select: { id: true, type: true, period_start: true, period_end: true, generated_date: true }
    })

    return NextResponse.json({ reports })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
