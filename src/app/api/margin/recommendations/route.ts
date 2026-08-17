import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const brandId = req.nextUrl.searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(session.user.id, brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Call our own analysis API to get product data
  const baseUrl = req.nextUrl.origin
  const analysisRes = await fetch(`${baseUrl}/api/margin/analysis?brandId=${brandId}`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
  })

  if (!analysisRes.ok) return NextResponse.json({ error: 'Failed to load analysis' }, { status: 500 })
  const { products } = await analysisRes.json()

  const recommendations: any[] = []

  for (const p of (products ?? [])) {
    if (!p) continue

    if (p.riskStatus === 'LOSS') {
      recommendations.push({
        severity: 'CRITICAL',
        sku: p.sku,
        name: p.name,
        title: `🔴 ${p.name} — Produk Merugi`,
        reason: `Margin saat ini ${p.marginPercent.toFixed(1)}% (di bawah nol). Setiap unit yang terjual membakar modal.`,
        recommendation: p.minSafePrice > p.sellingPrice
          ? `Naikkan harga jual minimal menjadi Rp ${Math.ceil(p.minSafePrice).toLocaleString('id-ID')} untuk mencapai target margin ${p.targetMarginPct}%.`
          : `Kurangi biaya variabel (voucher, komisi afiliasi, atau iklan) secara signifikan.`,
        expectedImpact: `Estimasi perbaikan margin: +${(p.targetMarginPct - p.marginPercent).toFixed(1)} poin persentase.`,
      })
    } else if (p.riskStatus === 'HIGH_RISK') {
      recommendations.push({
        severity: 'HIGH',
        sku: p.sku,
        name: p.name,
        title: `🟠 ${p.name} — Margin Sangat Rendah`,
        reason: `Margin ${p.marginPercent.toFixed(1)}% jauh di bawah target ${p.targetMarginPct}%. Berisiko rugi jika voucher atau komisi dinaikkan.`,
        recommendation: `Tinjau kombinasi voucher dan komisi afiliasi. Voucher aman maksimum: ${p.maxSafeVoucher.toFixed(1)}%.`,
        expectedImpact: `Harga jual minimum untuk target margin: Rp ${Math.ceil(p.minSafePrice).toLocaleString('id-ID')}.`,
      })
    } else if (p.riskStatus === 'LOW_MARGIN') {
      recommendations.push({
        severity: 'MEDIUM',
        sku: p.sku,
        name: p.name,
        title: `🟡 ${p.name} — Margin Di Bawah Target`,
        reason: `Margin ${p.marginPercent.toFixed(1)}% masih di bawah target ${p.targetMarginPct}% (kurang ${p.gapToTarget.toFixed(1)} poin).`,
        recommendation: `Pertimbangkan pengurangan voucher atau negosiasi ulang fee marketplace untuk meningkatkan margin.`,
        expectedImpact: `Potensi kenaikan margin hingga ${p.targetMarginPct}% jika biaya variabel dioptimalkan.`,
      })
    }
  }

  // Sort by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  recommendations.sort((a, b) => (severityOrder[a.severity as keyof typeof severityOrder] ?? 99) - (severityOrder[b.severity as keyof typeof severityOrder] ?? 99))

  return NextResponse.json({ recommendations })
}

