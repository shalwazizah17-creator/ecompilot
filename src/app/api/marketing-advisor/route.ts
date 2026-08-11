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
    if (gmvGrowth > 5) whatHappened = `Total GMV grew by ${gmvGrowth.toFixed(1)}% compared to the previous period.`
    else if (gmvGrowth < -5) whatHappened = `Total GMV declined by ${Math.abs(gmvGrowth).toFixed(1)}% compared to the previous period.`
    else whatHappened = `Total GMV remained stable with a ${gmvGrowth.toFixed(1)}% variance.`

    let why = []
    if (roas > 5) why.push(`Meta Ads performed exceptionally well with a ${roas.toFixed(1)}x ROAS, driving strong acquisition.`)
    else if (roas > 0 && roas < 3) why.push(`Meta Ads underperformed at ${roas.toFixed(1)}x ROAS, dragging down blended profitability.`)

    if (curAffGMV > curGMV * 0.15) why.push(`Affiliates contributed significantly, driving ${((curAffGMV/curGMV)*100).toFixed(1)}% of total sales.`)
    else if (curAffGMV > 0) why.push(`Affiliate contribution remains low at ${((curAffGMV/curGMV)*100).toFixed(1)}%, representing an untapped growth lever.`)

    let whatNeedsAttention = []
    if (roas < 3) whatNeedsAttention.push({ issue: 'Advertising Efficiency', detail: 'ROAS is below the standard 3x threshold. Review creatives and targeting.', priority: 'HIGH' })
    if (affROI > 0 && affROI < 4) whatNeedsAttention.push({ issue: 'Affiliate Margin', detail: 'Affiliate ROI is poor. Ensure commission structures are tied to target margins.', priority: 'MEDIUM' })
    if (curAffGMV === 0) whatNeedsAttention.push({ issue: 'Affiliate Discovery', detail: 'No affiliate sales recorded. Check the Discovery Engine to find creators.', priority: 'OPPORTUNITY' })

    let whatShouldWeDo = []
    if (roas > 5) whatShouldWeDo.push('Scale Meta Ads budget by 15-20% on winning campaigns while ROAS is high.')
    if (affROI > 5) whatShouldWeDo.push('Increase product allocations to top-performing affiliates.')

    if (why.length === 0) why.push('Growth is primarily organic with stable baseline conversion rates.')
    if (whatShouldWeDo.length === 0) whatShouldWeDo.push('Maintain current budgets and monitor daily run rates closely.')

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
