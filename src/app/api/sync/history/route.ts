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
    const history = await prisma.syncJob.findMany({
      where: {
        data_source: { brand_id: brandId }
      },
      include: {
        data_source: {
          include: { platform: true }
        }
      },
      orderBy: { started_at: 'desc' },
      take: 50
    })

    const formatted = history.map(job => ({
      id: job.id,
      date: job.started_at,
      source: job.data_source.platform.name,
      type: job.type,
      records: job.records_processed,
      created: job.records_created,
      updated: job.records_updated,
      errors: job.errors,
      status: job.status
    }))

    return NextResponse.json({ history: formatted })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
