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
        reason = 'Data tidak cukup untuk merekomendasikan penambahan anggaran.'
        action = 'TAHAN'
      } else if (roas30 > targetRoas && roas7 > targetRoas) {
        recommendation = 15 // +15%
        action = 'TAMBAH'
        reason = `ROAS 30 hari adalah ${roas30.toFixed(1)}x vs target ${targetRoas.toFixed(1)}x. ROAS stabil pada periode 7 dan 30 hari.`
      } else if (roas30 < targetRoas && roas7 < roas30) {
        recommendation = -15 // -15%
        action = 'KURANGI'
        reason = `ROAS 30 hari adalah ${roas30.toFixed(1)}x vs target ${targetRoas.toFixed(1)}x. Pengeluaran meningkat namun efisiensi konversi menurun baru-baru ini (ROAS 7 hari ${roas7.toFixed(1)}x).`
      } else if (roas30 < targetRoas) {
        recommendation = -10 // -10%
        action = 'KURANGI'
        reason = `ROAS 30 hari adalah ${roas30.toFixed(1)}x vs target ${targetRoas.toFixed(1)}x. Pertimbangkan untuk memindahkan anggaran ke saluran yang lebih efisien.`
      } else {
        reason = `Performa berjalan optimal di ROAS ${roas30.toFixed(1)}x. Pertahankan alokasi saat ini.`
        action = 'TAHAN'
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
    const current = recommendations.map(r => ({ channel: r.channel, spend: r.currentMonthlyBudget, roas: r.roas30 }))
    const recommended = recommendations.map(r => ({ channel: r.channel, spend: r.recommendedBudget }))
    const insights = recommendations.map(r => r.reason)

    return NextResponse.json({ current, recommended, insights })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
