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
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 30)
    
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - 30)

    const currMetrics = await prisma.dailyMetric.findMany({
      where: { brand_id: brandId, date: { gte: start, lte: end } },
      include: { platform: true }
    })
    
    const prevMetrics = await prisma.dailyMetric.findMany({
      where: { brand_id: brandId, date: { gte: prevStart, lt: start } },
      include: { platform: true }
    })

    const currAffMetrics = await prisma.affiliateMetric.findMany({
      where: { brand_id: brandId, date: { gte: start, lte: end } }
    })

    const dataSources = await prisma.dataSource.findMany({
      where: { brand_id: brandId }
    })

    // Safe Aggregations (prevent NaN/Infinity)
    const currGmv = currMetrics.reduce((sum, m) => sum + (Number(m.sales) || 0), 0)
    const prevGmv = prevMetrics.reduce((sum, m) => sum + (Number(m.sales) || 0), 0)
    
    const currSpend = currMetrics.reduce((sum, m) => sum + (Number(m.spend) || 0), 0)
    const prevSpend = prevMetrics.reduce((sum, m) => sum + (Number(m.spend) || 0), 0)

    const currOrders = currMetrics.reduce((sum, m) => sum + (Number(m.orders) || 0), 0)
    const prevOrders = prevMetrics.reduce((sum, m) => sum + (Number(m.orders) || 0), 0)

    const currRefunds = currMetrics.reduce((sum, m) => sum + (Number(m.refunds) || 0), 0)
    const currNetSales = Math.max(0, currGmv - currRefunds)

    const currAffGmv = currAffMetrics.reduce((sum, m) => sum + (Number(m.sales) || 0), 0)

    const currRoas = Calculations.roas(currGmv, currSpend)
    
    // Growth
    const gmvGrowth = prevGmv > 0 ? ((currGmv - prevGmv) / prevGmv) * 100 : 0
    const spendGrowth = prevSpend > 0 ? ((currSpend - prevSpend) / prevSpend) * 100 : 0

    // Profit Est
    const estProfit = Math.max(0, currNetSales * 0.15) // Simplified 15% net margin
    const margin = currGmv > 0 ? (estProfit / currGmv) * 100 : 0

    // Health Score Weighting
    // GMV Growth (20%), ROAS (20%), Profit Margin (20%), Budget Eff (15%), CVR (10%), Refund (5%), Data Health (5%), Aff (5%)
    let score = 0
    
    // GMV Growth (20 points max)
    if (gmvGrowth >= 10) score += 20
    else if (gmvGrowth >= 0) score += 15
    else if (gmvGrowth >= -10) score += 10
    else score += 0

    // ROAS (20 points max)
    if (currRoas >= 4.0) score += 20
    else if (currRoas >= 2.5) score += 15
    else if (currRoas >= 1.5) score += 10
    else score += 0

    // Profit Margin (20 points max)
    if (margin >= 15) score += 20
    else if (margin >= 10) score += 15
    else if (margin >= 5) score += 10
    else score += 0

    // Budget Eff (15 points max)
    if (currSpend > 0) score += 15
    else score += 10 // Neutral if no spend

    // Conversion (10 points max)
    score += 10 // Simplified

    // Refunds (5 points max)
    const refundRate = currGmv > 0 ? (currRefunds / currGmv) * 100 : 0
    if (refundRate <= 2) score += 5
    else if (refundRate <= 5) score += 3
    else score += 0

    // Affiliate (5 points max)
    if (currAffGmv > 0) score += 5

    // Data Health (5 points max)
    let dataHealthPct = 100
    if (dataSources.length === 0) dataHealthPct = 0
    else {
      let staleCount = 0
      dataSources.forEach(ds => {
        if (!ds.last_successful_sync_at) staleCount++
      })
      dataHealthPct = Math.max(0, 100 - (staleCount * 20))
    }
    score += Math.round((dataHealthPct / 100) * 5)

    score = Math.min(100, Math.max(0, Math.round(score)))
    
    let healthStatus = 'SANGAT BAIK'
    if (score <= 39) healthStatus = 'KRITIS'
    else if (score <= 59) healthStatus = 'BUTUH PERHATIAN'
    else if (score <= 79) healthStatus = 'SEHAT'

    // Risks & Opportunities
    const risks = []
    const opportunities = []

    if (currRoas < 4.0 && currSpend > 0) {
      risks.push({
        severity: 'HIGH',
        metric: 'ROAS Iklan',
        change: `${currRoas.toFixed(2)}x`,
        target: '4.0x',
        title: 'ROAS di Bawah Target',
        reason: 'Efisiensi iklan turun di bawah target, berpotensi mengurangi profit bersih.',
        action: 'Kurangi budget pada kampanye dengan performa terburuk sebesar 15%.',
        impact: `Potensi penghematan Rp ${((currSpend * 0.15)).toLocaleString()}/bulan`
      })
    }

    if (gmvGrowth < 0) {
      risks.push({
        severity: 'HIGH',
        metric: 'Total GMV',
        change: `${gmvGrowth.toFixed(1)}%`,
        target: '> 0%',
        title: 'Penurunan GMV',
        reason: 'Terjadi penurunan pendapatan yang signifikan dibanding 30 hari sebelumnya.',
        action: 'Periksa performa iklan atau masalah pada halaman toko di marketplace.',
        impact: 'N/A'
      })
    }

    if (currRoas > 5.0 && currSpend > 0) {
      opportunities.push({
        opportunity: 'Efisiensi Iklan Sangat Baik',
        metrics: `ROAS saat ini ${currRoas.toFixed(2)}x (Target: 4.0x)`,
        impact: `Proyeksi tambahan pendapatan: Rp ${((currSpend * 0.1) * currRoas).toLocaleString()}`,
        action: 'Naikkan batas budget harian sebesar 10% pada kampanye terbaik.'
      })
    }

    if (risks.length === 0) {
      risks.push({ severity: 'LOW', metric: 'Stabilitas', change: 'Stabil', target: 'Stabil', title: 'Tidak ada risiko serius', reason: 'Tidak terdeteksi adanya risiko kritis pada seluruh saluran penjualan.', action: 'Lanjutkan pemantauan standar.', impact: 'N/A' })
    }

    if (opportunities.length === 0) {
      opportunities.push({ opportunity: 'Operasional Stabil', metrics: 'Metrik berjalan normal.', impact: 'Bisnis dalam kondisi stabil.', action: 'Fokus pada A/B testing konten kreatif iklan.' })
    }

    // Finalize score and empty states
    let finalStatus = 'Sehat'
    if (score >= 80) finalStatus = 'Sangat Baik'
    else if (score >= 60) finalStatus = 'Sehat'
    else if (score >= 40) finalStatus = 'Butuh Perhatian'
    else finalStatus = 'Kritis'

    const hasData = dataSources.length > 0 || currGmv > 0 || currSpend > 0 || currOrders > 0

    if (!hasData) {
      score = 0
      finalStatus = 'DATA TIDAK CUKUP'
      dataHealthPct = 0
    }

    return NextResponse.json({
      score,
      healthStatus: finalStatus,
      dataHealthPct,
      hasData,
      lastUpdated: dataSources[0]?.last_successful_sync_at || new Date().toISOString(),
      metrics: {
        currGmv: currGmv || 0, 
        prevGmv: prevGmv || 0, 
        gmvGrowth: isNaN(gmvGrowth) ? 0 : gmvGrowth,
        currSpend: currSpend || 0, 
        prevSpend: prevSpend || 0, 
        spendGrowth: isNaN(spendGrowth) ? 0 : spendGrowth,
        currOrders: currOrders || 0, 
        prevOrders: prevOrders || 0,
        currNetSales: currNetSales || 0,
        currAffGmv: currAffGmv || 0,
        estProfit: estProfit || 0,
        margin: isNaN(margin) ? 0 : margin,
        currRoas: isNaN(currRoas) ? 0 : currRoas
      },
      risks,
      opportunities
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
