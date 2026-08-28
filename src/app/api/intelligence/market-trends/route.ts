import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getActiveMarketTrends } from '@/lib/intelligence/market-trends'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const category = searchParams.get('category') || undefined

  // Market trends are globally shared, no brand isolation needed for public trends
  const trends = await getActiveMarketTrends(category)

  return NextResponse.json({ trends })
}
