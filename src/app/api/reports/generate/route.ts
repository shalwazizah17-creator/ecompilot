import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Calculations } from '@/lib/calculations'

export async function POST(req: Request) {
  try {
    const { brandId, periodStart, periodEnd, type = 'CUSTOM' } = await req.json()
    if (!brandId || !periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const start = new Date(periodStart)
    const end = new Date(periodEnd)
    
    // 1. Comparison Period Logic
    let prevStart = new Date(start)
    let prevEnd = new Date(end)

    if (type === 'DAILY') {
      prevStart.setDate(start.getDate() - 1)
      prevEnd.setDate(end.getDate() - 1)
    } else if (type === 'WEEKLY') {
      prevStart.setDate(start.getDate() - 7)
      prevEnd.setDate(end.getDate() - 7)
    } else if (type === 'MONTHLY') {
      prevStart.setMonth(start.getMonth() - 1)
      prevEnd.setMonth(end.getMonth() - 1)
    } else if (type === 'YEARLY') {
      prevStart.setFullYear(start.getFullYear() - 1)
      prevEnd.setFullYear(end.getFullYear() - 1)
    } else {
      // CUSTOM: same duration offset backwards
      const duration = end.getTime() - start.getTime()
      prevStart = new Date(start.getTime() - duration - 1000)
      prevEnd = new Date(start.getTime() - 1000)
    }

    // Fetch Brand
    const brand = await prisma.brand.findUnique({ where: { id: brandId } })
    if (!brand) throw new Error('Brand not found')

    // Fetch Metrics
    const [currentMetrics, prevMetrics, currAffMetrics, prevAffMetrics] = await Promise.all([
      prisma.dailyMetric.findMany({
        where: { brand_id: brandId, date: { gte: start, lte: end } },
        include: { platform: true, campaign: true, product: true, ad_set: true }
      }),
      prisma.dailyMetric.findMany({
        where: { brand_id: brandId, date: { gte: prevStart, lte: prevEnd } }
      }),
      prisma.affiliateMetric.findMany({
        where: { brand_id: brandId, date: { gte: start, lte: end } },
        include: { affiliate: true }
      }),
      prisma.affiliateMetric.findMany({
        where: { brand_id: brandId, date: { gte: prevStart, lte: prevEnd } }
      })
    ])

    // Targets
    const targets = await prisma.target.findMany({ where: { brand_id: brandId } })
    const targetRoas = targets.find(t => t.type === 'ROAS')?.value || 5.0
    const targetGmv = targets.find(t => t.type === 'GMV')?.value || 100000000

    // Helper: Aggregations
    const aggregate = (metrics: any[]) => {
      let gmv = 0, spend = 0, attrRev = 0, orders = 0, refunds = 0, cancellations = 0
      for (const m of metrics) {
        if (m.source_type === 'MARKETPLACE_SALES') {
          gmv += m.sales; orders += m.orders; refunds += m.refunds; cancellations += m.cancellations
        } else {
          spend += m.spend; attrRev += m.attributed_revenue
        }
      }
      const netSales = Calculations.netSales(gmv, refunds, cancellations)
      const profit = Calculations.profit(netSales, 0, 0, 0, spend, 0)
      return { gmv, spend, attrRev, orders, netSales, profit }
    }

    const curr = aggregate(currentMetrics)
    const prev = aggregate(prevMetrics)

    // Aggregate Affiliates
    const aggAffiliates = (metrics: any[]) => {
      let gmv = 0, commission = 0, orders = 0
      for (const m of metrics) {
        gmv += m.sales; commission += m.commission; orders += m.orders
      }
      return { gmv, commission, orders }
    }
    const currAff = aggAffiliates(currAffMetrics)
    const prevAff = aggAffiliates(prevAffMetrics)

    // PCT Change helper
    const pctChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const kpis = {
      gmv: { value: curr.gmv, prev: prev.gmv, pct: pctChange(curr.gmv, prev.gmv) },
      orders: { value: curr.orders, prev: prev.orders, pct: pctChange(curr.orders, prev.orders) },
      spend: { value: curr.spend, prev: prev.spend, pct: pctChange(curr.spend, prev.spend) },
      netSales: { value: curr.netSales, prev: prev.netSales, pct: pctChange(curr.netSales, prev.netSales) },
      profit: { value: curr.profit, prev: prev.profit, pct: pctChange(curr.profit, prev.profit) },
      roas: { 
        value: Calculations.roas(curr.attrRev, curr.spend), 
        prev: Calculations.roas(prev.attrRev, prev.spend),
        pct: pctChange(Calculations.roas(curr.attrRev, curr.spend), Calculations.roas(prev.attrRev, prev.spend))
      },
      margin: {
        value: Calculations.profitMargin(curr.profit, curr.netSales),
        prev: Calculations.profitMargin(prev.profit, prev.netSales),
        pct: Calculations.profitMargin(curr.profit, curr.netSales) - Calculations.profitMargin(prev.profit, prev.netSales)
      },
      affiliateGmv: { value: currAff.gmv, prev: prevAff.gmv, pct: pctChange(currAff.gmv, prevAff.gmv) },
      affiliateCommission: { value: currAff.commission, prev: prevAff.commission, pct: pctChange(currAff.commission, prevAff.commission) },
      affiliateRoi: { 
        value: Calculations.affiliateROI(currAff.gmv - currAff.commission, currAff.commission), 
        prev: Calculations.affiliateROI(prevAff.gmv - prevAff.commission, prevAff.commission),
        pct: pctChange(Calculations.affiliateROI(currAff.gmv - currAff.commission, currAff.commission), Calculations.affiliateROI(prevAff.gmv - prevAff.commission, prevAff.commission))
      }
    }

    // 2. Data Quality / Sources
    const availableSources = new Set<string>()
    const expectedSources = ['MARKETPLACE_SALES', 'AD_PERFORMANCE', 'META_CAMPAIGN'] // simplified expectations
    currentMetrics.forEach(m => availableSources.add(m.source_type))
    
    const missingSources = expectedSources.filter(s => !availableSources.has(s))
    const dataCoverage = ((availableSources.size / Math.max(expectedSources.length, 1)) * 100)
    const reportStatus = dataCoverage < 100 ? 'PARTIAL_DATA' : 'COMPLETE'

    // 3. Trends
    const trendMap = new Map<string, any>()
    currentMetrics.forEach(m => {
      const dateStr = m.date.toISOString().split('T')[0]
      if (!trendMap.has(dateStr)) trendMap.set(dateStr, { date: dateStr, gmv: 0, spend: 0, attrRev: 0, orders: 0, netSales: 0 })
      const t = trendMap.get(dateStr)
      if (m.source_type === 'MARKETPLACE_SALES') {
        t.gmv += m.sales; t.orders += m.orders; t.netSales += Calculations.netSales(m.sales, m.refunds, m.cancellations)
      } else {
        t.spend += m.spend; t.attrRev += m.attributed_revenue
      }
    })
    const trendData = Array.from(trendMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(t => ({ ...t, roas: Calculations.roas(t.attrRev, t.spend), profit: Calculations.profit(t.netSales, 0, 0, 0, t.spend, 0) }))

    // 4. Platforms & Channels
    const platformMap = new Map<string, any>()
    currentMetrics.forEach(m => {
      const pName = m.platform?.name || 'Unknown'
      if (!platformMap.has(pName)) platformMap.set(pName, { name: pName, gmv: 0, spend: 0, attrRev: 0, orders: 0, netSales: 0 })
      const t = platformMap.get(pName)
      if (m.source_type === 'MARKETPLACE_SALES') {
        t.gmv += m.sales; t.orders += m.orders; t.netSales += Calculations.netSales(m.sales, m.refunds, m.cancellations)
      } else {
        t.spend += m.spend; t.attrRev += m.attributed_revenue
      }
    })
    const platforms = Array.from(platformMap.values()).map(p => ({
      ...p, roas: Calculations.roas(p.attrRev, p.spend), profit: Calculations.profit(p.netSales, 0, 0, 0, p.spend, 0)
    }))

    // 5. Products & Meta
    const productMap = new Map<string, any>()
    currentMetrics.filter(m => m.product).forEach(m => {
      const pid = m.product!.name
      if (!productMap.has(pid)) productMap.set(pid, { name: pid, sku: m.product!.sku, gmv: 0, spend: 0, attrRev: 0, orders: 0, netSales: 0 })
      const t = productMap.get(pid)
      if (m.source_type === 'MARKETPLACE_SALES') {
        t.gmv += m.sales; t.orders += m.orders; t.netSales += Calculations.netSales(m.sales, m.refunds, m.cancellations)
      } else {
        t.spend += m.spend; t.attrRev += m.attributed_revenue
      }
    })
    const products = Array.from(productMap.values()).map(p => {
      const profit = Calculations.profit(p.netSales, 0, 0, 0, p.spend, 0)
      return { ...p, profit, roas: Calculations.roas(p.attrRev, p.spend), margin: Calculations.profitMargin(profit, p.netSales) }
    }).sort((a, b) => b.gmv - a.gmv).slice(0, 50)

    const metaMap = new Map<string, any>()
    currentMetrics.filter(m => m.campaign && m.source_type === 'META_CAMPAIGN').forEach(m => {
      const c = m.campaign!.name
      if (!metaMap.has(c)) metaMap.set(c, { name: c, spend: 0, attrRev: 0, purchases: 0, clicks: 0, impressions: 0 })
      const t = metaMap.get(c)
      t.spend += m.spend; t.attrRev += m.attributed_revenue; t.purchases += m.purchases; t.clicks += m.clicks; t.impressions += m.impressions
    })
    const metaCampaigns = Array.from(metaMap.values()).map(c => ({
      ...c, roas: Calculations.roas(c.attrRev, c.spend), cpa: Calculations.cpa(c.spend, c.purchases), ctr: Calculations.ctr(c.clicks, c.impressions)
    })).sort((a, b) => b.spend - a.spend)

    // 5.b Affiliates
    const affiliateMap = new Map<string, any>()
    const affMetrics = currAffMetrics || []
    affMetrics.forEach((m: any) => {
      if (!m.affiliate) return
      const username = m.affiliate.username
      if (!affiliateMap.has(username)) affiliateMap.set(username, { username, gmv: 0, commission: 0, orders: 0, clicks: 0 })
      const t = affiliateMap.get(username)
      t.gmv += m.sales; t.commission += m.commission; t.orders += m.orders; t.clicks += m.clicks
    })
    const affiliates = Array.from(affiliateMap.values()).map(a => ({
      ...a, roi: Calculations.affiliateROI(a.gmv - a.commission, a.commission), cvr: Calculations.cvr(a.orders, a.clicks)
    })).sort((a, b) => b.gmv - a.gmv).slice(0, 10)

    // 6. Forecast
    const forecastDays = 7
    const last7Gmv = trendData.slice(-7).reduce((acc, t) => acc + t.gmv, 0)
    const smaGmv = Calculations.safeDiv(last7Gmv, Math.min(trendData.length, 7))
    const projectedEnd = curr.gmv + (smaGmv * forecastDays)
    const forecast = {
      method: '7-day / 30-day Simple Moving Average',
      actual: curr.gmv,
      projected: projectedEnd,
      target: targetGmv,
      variance: projectedEnd - targetGmv
    }

    // 7. Executive Summary & Insights
    const insights = []
    
    // What Happened
    let whatHappened = ''
    if (kpis.gmv.pct > 0) whatHappened = `GMV increased ${kpis.gmv.pct.toFixed(1)}% to Rp ${(kpis.gmv.value/1000000).toFixed(1)}M. `
    else whatHappened = `GMV declined ${Math.abs(kpis.gmv.pct).toFixed(1)}% to Rp ${(kpis.gmv.value/1000000).toFixed(1)}M. `
    
    // Why
    let why = ''
    if (kpis.spend.pct > 0 && kpis.gmv.pct > 0) why = `This growth was driven by a ${kpis.spend.pct.toFixed(1)}% increase in advertising spend.`
    else if (kpis.spend.pct <= 0 && kpis.gmv.pct > 0) why = `This growth occurred despite advertising spend decreasing by ${Math.abs(kpis.spend.pct).toFixed(1)}%, indicating high organic momentum.`
    else why = `Performance shifted in tandem with advertising spend scaling.`

    // Attention & Recommend
    let attention = ''
    let recommend = ''
    if (kpis.margin.value < 15) {
      attention = `Overall profitability is critically low at ${kpis.margin.value.toFixed(1)}%. `
      recommend = `Review high-spend Meta campaigns and cut negative-margin products.`
      insights.push({ severity: 'CRITICAL', metric: 'Profitability', title: `Profit margin dropped to ${kpis.margin.value.toFixed(1)}%`, recommendation: 'Review high-spend channels pulling down overall net profitability.' })
    } else {
      attention = `ROAS remains stable at ${kpis.roas.value.toFixed(2)}x.`
      recommend = `Maintain current allocation but explore scaling high-CTR Meta campaigns.`
      insights.push({ severity: 'POSITIVE', metric: 'Efficiency', title: `ROAS maintained at ${kpis.roas.value.toFixed(2)}x`, recommendation: 'Advertising efficiency is healthy.' })
    }

    const executiveSummary = { whatHappened, why, attention, recommend }

    // Assemble Immutable Snapshot
    const reportSnapshot = {
      metadata: {
        snapshotVersion: "1.0",
        reportType: type,
        brandName: brand.name,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        generatedAt: new Date().toISOString(),
        dataCoverage,
        status: reportStatus,
        missingSources
      },
      targets: { roas: targetRoas, gmv: targetGmv },
      kpis,
      executiveSummary,
      trendData,
      platforms,
      products,
      metaCampaigns,
      affiliates,
      forecast,
      insights
    }

    // Save to DB
    const report = await prisma.report.create({
      data: {
        brand_id: brandId,
        type: type,
        status: reportStatus,
        data_coverage: dataCoverage,
        name: `${brand.name} ${type} Report`,
        period_start: start,
        period_end: end,
        content: JSON.stringify(reportSnapshot)
      }
    })

    return NextResponse.json({ success: true, reportId: report.id })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
