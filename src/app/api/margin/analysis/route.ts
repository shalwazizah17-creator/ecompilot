import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'
import { Calculations } from '@/lib/calculations'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const brandId = req.nextUrl.searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Fetch margin rules for this brand
    const marginRules = await prisma.marginRule.findMany({ where: { brand_id: brandId } })

    // Fetch product costs
    const productCosts = await prisma.productCost.findMany({
      where: { brand_id: brandId, effective_to: null },
    })

    // Fetch product metrics (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const productMetrics = await prisma.dailyMetric.groupBy({
      by: ['product_id'],
      where: {
        brand_id: brandId,
        date: { gte: thirtyDaysAgo },
        source_type: 'MARKETPLACE_SALES',
        product_id: { not: null },
      },
      _sum: { sales: true, orders: true, refunds: true, cancellations: true, marketplace_fee: true, affiliate_cost: true, spend: true },
    })

    const products = await prisma.product.findMany({ where: { brand_id: brandId } })
    const productMap = new Map(products.map(p => [p.id, p]))

    // Default rule fallback
    const defaultRule = {
      marketplace_fee_percent: 5,
      payment_fee_percent: 2,
      affiliate_commission_percent: 0,
      voucher_cost_percent: 0,
      shipping_subsidy_percent: 0,
      target_margin_percent: 20,
    }

    const skuAnalysis = productMetrics
      .filter(m => m.product_id)
      .map(m => {
        const product = productMap.get(m.product_id!)
        if (!product) return null

        const productCost = productCosts.find(pc => pc.product_id === m.product_id || pc.sku === product.sku)
        const hpp = productCost?.hpp ?? product.cogs ?? 0
        const targetMarginPct = productCost?.target_margin_percent ?? defaultRule.target_margin_percent
        const sellingPrice = product.price ?? 0
        const grossSales = m._sum.sales ?? 0
        const units = m._sum.orders ?? 0
        const refunds = m._sum.refunds ?? 0
        const cancellations = m._sum.cancellations ?? 0
        const mktFeeActual = m._sum.marketplace_fee ?? 0
        const affCostActual = m._sum.affiliate_cost ?? 0
        const adSpend = m._sum.spend ?? 0

        // Use actual costs if available, else estimate from rules
        const rule = marginRules[0] ?? defaultRule
        const voucherCost = Calculations.voucherCost(grossSales, rule.voucher_cost_percent)
        const netRev = Calculations.netRevenue(grossSales, refunds, cancellations, voucherCost)
        const hppTotal = hpp * Math.max(1, units)
        const varCost = Calculations.totalVariableCost(hppTotal, mktFeeActual, grossSales * (rule.payment_fee_percent / 100), affCostActual, adSpend, 0)
        const profit = Calculations.netProfit(netRev, varCost)
        const marginPct = Calculations.marginPercent(profit, netRev)
        const riskStatus = Calculations.marginRiskStatus(marginPct, targetMarginPct)

        const minSafePrice = Calculations.minimumSafePrice({
          hpp,
          marketplaceFeePct: rule.marketplace_fee_percent,
          paymentFeePct: rule.payment_fee_percent,
          affiliateCommissionPct: rule.affiliate_commission_percent,
          voucherPct: rule.voucher_cost_percent,
          adSpendPct: 0,
          otherCostsPct: 0,
          targetMarginPct,
        })

        const maxSafeVoucher = Calculations.maximumSafeVoucher({
          sellingPrice,
          hpp,
          marketplaceFeePct: rule.marketplace_fee_percent,
          paymentFeePct: rule.payment_fee_percent,
          affiliateCommissionPct: rule.affiliate_commission_percent,
          adSpendPct: 0,
          otherCostsPct: 0,
          targetMarginPct,
        })

        return {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          sellingPrice,
          hpp,
          targetMarginPct,
          grossSales,
          netRevenue: netRev,
          netProfit: profit,
          marginPercent: marginPct,
          riskStatus,
          minSafePrice,
          maxSafeVoucher,
          gapToTarget: targetMarginPct - marginPct,
        }
      })
      .filter(Boolean)

    const summary = {
      total: skuAnalysis.length,
      safe: skuAnalysis.filter(s => s!.riskStatus === 'SAFE').length,
      lowMargin: skuAnalysis.filter(s => s!.riskStatus === 'LOW_MARGIN').length,
      highRisk: skuAnalysis.filter(s => s!.riskStatus === 'HIGH_RISK').length,
      loss: skuAnalysis.filter(s => s!.riskStatus === 'LOSS').length,
    }

    return NextResponse.json({ summary, products: skuAnalysis, marginRules })
  } catch (err) {
    console.error('[margin/analysis]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

