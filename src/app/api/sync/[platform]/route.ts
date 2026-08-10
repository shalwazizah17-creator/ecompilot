import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { syncEngine } from '@/lib/sync/sync-engine'

export async function POST(request: Request, context: any) {
  try {
    const { brandId } = await request.json()
    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

    const { platform } = await context.params
    const platformRecord = await prisma.platform.findUnique({ where: { name: platform } })
    if (!platformRecord) return NextResponse.json({ error: 'Platform not found' }, { status: 404 })

    const result = await syncEngine.runProviderSync(brandId, platformRecord.id)

    // Automatically calculate data quality / health issues here in production.
    
    return NextResponse.json({
      status: 'COMPLETED',
      ...result
    })
  } catch (error: any) {
    console.error('API Sync Error:', error)
    return NextResponse.json({ 
      error: 'The platform temporarily failed to respond. The sync will remain available for retry.' 
    }, { status: 500 })
  }
}
