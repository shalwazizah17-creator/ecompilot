import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

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
