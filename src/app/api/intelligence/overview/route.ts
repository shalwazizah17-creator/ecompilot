import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const brandId = searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Mocking the holistic Business Health Score calculation for the demo
  // In a real scenario, this would aggregate data from Sales, ROAS, Margin, etc.
  const healthScore = {
    total: 82,
    status: 'Healthy',
    components: [
      { name: 'Revenue Growth', score: 16, max: 20 },
      { name: 'ROAS Efficiency', score: 18, max: 20 },
      { name: 'Profitability', score: 15, max: 20 },
      { name: 'Marketplace Health', score: 13, max: 15 },
      { name: 'Marketing Health', score: 8, max: 10 },
      { name: 'Affiliate Health', score: 4, max: 5 },
      { name: 'Data Quality', score: 8, max: 10 },
    ]
  }

  const metrics = {
    gmv: { value: 125000000, trend: 12.4 },
    roas: { value: 4.2, trend: -5.1 },
    netSales: { value: 110000000, trend: 14.2 },
    profit: { value: 35000000, trend: 8.5 },
    margin: { value: 31.8, trend: -1.2 },
  }

  return NextResponse.json({
    role: session.user.role,
    healthScore,
    metrics
  })
}
