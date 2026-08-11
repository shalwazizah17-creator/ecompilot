import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'
import { assertBrandAccess } from "@/lib/auth/assert-brand-access"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandIdParam = searchParams.get('brandId')
  
  
  const brand = await assertBrandAccess(brandIdParam)
  if (!brand) return NextResponse.json({ error: 'Forbidden. You do not have access to this workspace/brand.' }, { status: 403 })
  
  const brandId = brand.id

  try {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(today.getDate() - 60)

    // Current 30 Days
    const currentSales = await prisma.dailyMetric.findMany({ where: { brand_id: brandId, date: { gte: thirtyDaysAgo }, source_type: 'MARKETPLACE_SALES' } })
    const currentAffiliates = await prisma.affiliateMetric.findMany({ where: { brand_id: brandId, date: { gte: thirtyDaysAgo } } })
    const currentAds = await prisma.dailyMetric.findMany({ where: { brand_id: brandId, date: { gte: thirtyDaysAgo }, source_type: 'META_CAMPAIGN' } })
    
    // Previous 30 Days (for WoW / MoM growth comparison)
    const prevSales = await prisma.dailyMetric.findMany({ where: { brand_id: brandId, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, source_type: 'MARKETPLACE_SALES' } })

    const curGMV = currentSales.reduce((a,b) => a+b.sales, 0)
    const prevGMV = prevSales.reduce((a,b) => a+b.sales, 0)
    const gmvGrowth = prevGMV === 0 ? 0 : ((curGMV - prevGMV) / prevGMV) * 100

    const curAdSpend = currentAds.reduce((a,b) => a+b.spend, 0)
    const curAdRev = currentAds.reduce((a,b) => a+b.attributed_revenue, 0)
    const roas = Calculations.roas(curAdRev, curAdSpend)

    const curAffGMV = currentAffiliates.reduce((a,b) => a+b.sales, 0)
    const curAffComm = currentAffiliates.reduce((a,b) => a+b.commission, 0)
    const affROI = Calculations.affiliateROI(curAffGMV - curAffComm, curAffComm)
    
    // Build the AI-like response using heuristics
    let whatHappened = ''
    if (gmvGrowth > 5) whatHappened = `Total GMV tumbuh sebesar ${gmvGrowth.toFixed(1)}% dibandingkan periode sebelumnya.`
    else if (gmvGrowth < -5) whatHappened = `Total GMV turun sebesar ${Math.abs(gmvGrowth).toFixed(1)}% dibandingkan periode sebelumnya.`
    else whatHappened = `Total GMV stabil dengan selisih ${gmvGrowth.toFixed(1)}%.`

    let why: string[] = []
    if (roas > 5) why.push(`Iklan Meta berkinerja sangat baik dengan ROAS ${roas.toFixed(1)}x, mendorong akuisisi yang kuat.`)
    else if (roas > 0 && roas < 3) why.push(`Iklan Meta berkinerja di bawah target dengan ROAS ${roas.toFixed(1)}x, menurunkan profitabilitas gabungan.`)

    if (curAffGMV > curGMV * 0.15) why.push(`Afiliasi berkontribusi signifikan, menyumbang ${((curAffGMV/curGMV)*100).toFixed(1)}% dari total penjualan.`)
    else if (curAffGMV > 0) why.push(`Kontribusi afiliasi masih rendah di ${((curAffGMV/curGMV)*100).toFixed(1)}%, mewakili peluang pertumbuhan yang belum dimanfaatkan.`)

    let whatNeedsAttention: { issue: string; detail: string; priority: string }[] = []
    if (roas < 3) whatNeedsAttention.push({ issue: 'Efisiensi Periklanan', detail: 'ROAS berada di bawah batas standar 3x. Tinjau materi iklan dan penargetan.', priority: 'HIGH' })
    if (affROI > 0 && affROI < 4) whatNeedsAttention.push({ issue: 'Margin Afiliasi', detail: 'ROI afiliasi buruk. Pastikan struktur komisi terkait dengan target margin.', priority: 'MEDIUM' })
    if (curAffGMV === 0) whatNeedsAttention.push({ issue: 'Penemuan Afiliasi', detail: 'Tidak ada penjualan afiliasi tercatat. Periksa Mesin Penemuan untuk menemukan kreator.', priority: 'OPPORTUNITY' })

    let whatShouldWeDo: string[] = []
    if (roas > 5) whatShouldWeDo.push('Tingkatkan anggaran Iklan Meta sebesar 15-20% pada kampanye yang berhasil selama ROAS tinggi.')
    if (affROI > 5) whatShouldWeDo.push('Tingkatkan alokasi produk untuk afiliasi dengan performa terbaik.')

    if (why.length === 0) why.push('Pertumbuhan utamanya organik dengan tingkat konversi dasar yang stabil.')
    if (whatShouldWeDo.length === 0) whatShouldWeDo.push('Pertahankan anggaran saat ini dan pantau perkiraan harian dengan ketat.')

    return NextResponse.json({
      advisor: {
        whatHappened,
        why: why.join(' '),
        whatNeedsAttention,
        whatShouldWeDo
      }
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
