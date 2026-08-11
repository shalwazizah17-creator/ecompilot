import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from "@/lib/auth/assert-brand-access"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandIdParam = searchParams.get('brandId')
  
  const brand = await assertBrandAccess(brandIdParam)
  if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const allocations = await prisma.budgetAllocation.findMany({
      where: { brand_id: brand.id },
      include: { platform: true },
      orderBy: { month: 'desc' }
    })

    // Group by month
    const grouped = allocations.reduce((acc: any, curr) => {
      const monthKey = curr.month.toISOString()
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: curr.month,
          created_at: curr.created_at,
          notes: curr.notes,
          allocations: []
        }
      }
      acc[monthKey].allocations.push({
        channel: curr.platform.name,
        amount: curr.amount
      })
      // Use the latest created_at as the approval date for that month group
      if (new Date(curr.created_at) > new Date(acc[monthKey].created_at)) {
        acc[monthKey].created_at = curr.created_at
        acc[monthKey].notes = curr.notes
      }
      return acc
    }, {})

    const archive = Object.values(grouped).sort((a: any, b: any) => 
      new Date(b.month).getTime() - new Date(a.month).getTime()
    )

    return NextResponse.json({ archive })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
