import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')
    
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

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
