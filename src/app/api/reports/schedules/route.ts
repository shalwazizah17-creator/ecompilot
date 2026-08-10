import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  try {
    const schedules = await prisma.reportSchedule.findMany({
      where: { brand_id: brandId },
      orderBy: { created_at: 'desc' }
    })
    return NextResponse.json({ schedules })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { brandId, reportType, frequency } = await request.json()
    if (!brandId || !reportType || !frequency) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const schedule = await prisma.reportSchedule.create({
      data: {
        brand_id: brandId,
        report_type: reportType,
        frequency,
        active: true
      }
    })

    return NextResponse.json({ success: true, schedule })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await prisma.reportSchedule.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
