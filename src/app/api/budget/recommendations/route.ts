import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  try {
    const end = new Date()
    const start30 = new Date(end)
    start30.setDate(start30.getDate() - 30)
    
    const start7 = new Date(end)
    start7.setDate(start7.getDate() - 7)

    const metrics30 = await prisma.dailyMetric.findMany({
      where: { brand_id: brandId, date: { gte: start30, lte: end } },
      include: { platform: true }
    })

    const targetRoas = 4.0 // Simplified global target, could be fetched from DB

    const channels = new Map()

    metrics30.forEach(m => {
      const pid = m.platform.id
      const pname = m.platform.name
      if (!channels.has(pid)) {
        channels.set(pid, {
          id: pid,
          name: pname,
          spend30: 0, rev30: 0,
          spend7: 0, rev7: 0,
          activeDays: new Set()
        })
      }
      const ch = channels.get(pid)
      ch.spend30 += (m.spend || 0)
      ch.rev30 += (m.attributed_revenue || m.sales || 0)
      ch.activeDays.add(m.date.toISOString().split('T')[0])
      
      if (m.date >= start7) {
        ch.spend7 += (m.spend || 0)
        ch.rev7 += (m.attributed_revenue || m.sales || 0)
      }
    })

    const recommendations = Array.from(channels.values()).map(ch => {
      const roas30 = ch.spend30 > 0 ? ch.rev30 / ch.spend30 : 0
      const roas7 = ch.spend7 > 0 ? ch.rev7 / ch.spend7 : 0

      let recommendation = 0 // % change
      let reason = ''
      let action = 'HOLD'

      if (ch.activeDays.size < 7) {
        reason = 'Insufficient data to recommend scaling.'
        action = 'HOLD'
      } else if (roas30 > targetRoas && roas7 > targetRoas) {
        recommendation = 15 // +15%
        action = 'INCREASE'
        reason = `30-day ROAS is ${roas30.toFixed(1)}x vs target ${targetRoas.toFixed(1)}x. ROAS is stable across 7-day and 30-day windows.`
      } else if (roas30 < targetRoas && roas7 < roas30) {
        recommendation = -15 // -15%
        action = 'DECREASE'
        reason = `30-day ROAS is ${roas30.toFixed(1)}x vs target ${targetRoas.toFixed(1)}x. Spend increased while conversion efficiency declined recently (7-day ROAS ${roas7.toFixed(1)}x).`
      } else if (roas30 < targetRoas) {
        recommendation = -10 // -10%
        action = 'DECREASE'
        reason = `30-day ROAS is ${roas30.toFixed(1)}x vs target ${targetRoas.toFixed(1)}x. Consider shifting budget to more efficient channels.`
      } else {
        reason = `Performance is tracking optimally at ${roas30.toFixed(1)}x ROAS. Maintain current allocation.`
        action = 'HOLD'
      }

      // Current allocation simulation (assuming average daily spend * 30 as monthly budget)
      const currentMonthlyBudget = (ch.spend30 / ch.activeDays.size) * 30 || 0
      const recommendedBudget = currentMonthlyBudget * (1 + (recommendation / 100))

      return {
        channel: ch.name,
        spend30: ch.spend30,
        roas30,
        roas7,
        targetRoas,
        action,
        recommendedChangePct: recommendation,
        currentMonthlyBudget,
        recommendedBudget,
        reason
      }
    })

    return NextResponse.json({ recommendations })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
