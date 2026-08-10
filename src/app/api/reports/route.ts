import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')
    
    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

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
