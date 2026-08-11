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
    const dataSources = await prisma.dataSource.findMany({
      where: { brand_id: brandId },
      include: { platform: true }
    })
    return NextResponse.json({ dataSources })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
