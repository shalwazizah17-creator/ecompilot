import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'
import { calculateOpportunityScore } from '@/lib/campaign-opportunity-engine'

// Initial Seed Data for Theraskin Q4 2026 if none exists yet
const INITIAL_OPPORTUNITIES = [
  {
    marketplace: 'Shopee',
    campaign_name: 'Shopee 10.10 Brands Festival Mega Sale',
    campaign_type: 'Double Date',
    status: 'Recommended',
    start_date: new Date('2026-10-10T00:00:00Z'),
    end_date: new Date('2026-10-12T23:59:59Z'),
    registration_start: new Date('2026-09-01T00:00:00Z'),
    registration_end: new Date('2026-10-07T23:59:59Z'),
    product_type: 'Existing',
    description: 'Mega Campaign Double Date 10.10 di Shopee Mall. Traffic boost tinggi untuk kategori Beauty & Skincare.',
    source: 'Manual Marketplace Check',
    source_url: 'https://seller.shopee.co.id/portal/campaign',
    last_checked_at: new Date('2026-09-06T14:30:00Z'),
    data_status: 'Verified Manually',
    eligibility_status: 'Eligible',
    eligible_sku_count: 8,
    matched_sku_count: 8,
    required_discount: 5.0,
    minimum_stock: 500,
    estimated_orders: 450,
    estimated_gmv: 34500000,
    estimated_margin: 28.5,
    opportunity_score: 88,
    opportunity_level: 'High',
    recommendation: 'Recommended',
    recommendation_reason: 'Traffic multiplier tinggi pada event besar. Diskon 5% berada dalam batas aman proteksi bottom price Finance. 8 SKU cocok dan siap dialokasikan stok promosi.',
    notes: 'Prioritaskan alokasi slot Flash Sale kilat untuk Age Revival Twinpack & Facial Wash.'
  },
  {
    marketplace: 'TikTok Shop',
    campaign_name: 'TikTok Shop 10.10 Live Shopping Fiesta',
    campaign_type: 'Live Streaming',
    status: 'Recommended',
    start_date: new Date('2026-10-10T00:00:00Z'),
    end_date: new Date('2026-10-12T23:59:59Z'),
    registration_start: new Date('2026-09-05T00:00:00Z'),
    registration_end: new Date('2026-10-08T18:00:00Z'),
    product_type: 'Both',
    description: 'Program promosi keranjang kuning Live Stream Marathon 24 jam dengan subsidi voucher ekstra TikTok.',
    source: 'Manual Marketplace Check',
    source_url: 'https://seller-id.tiktok.com/campaign',
    last_checked_at: new Date('2026-09-06T14:35:00Z'),
    data_status: 'Verified Manually',
    eligibility_status: 'Eligible',
    eligible_sku_count: 6,
    matched_sku_count: 6,
    required_discount: 6.0,
    minimum_stock: 350,
    estimated_orders: 380,
    estimated_gmv: 36800000,
    estimated_margin: 26.0,
    opportunity_score: 85,
    opportunity_level: 'High',
    recommendation: 'Recommended',
    recommendation_reason: 'Konversi interaktif live streaming optimal untuk bundling. Diskon 6% berada dalam batas aman proteksi bottom price. Siapkan host dan slot keranjang nomor 1.',
    notes: 'Kombinasikan dengan komisi affiliate creator 12% untuk memaksimalkan GMV live.'
  },
  {
    marketplace: 'Shopee',
    campaign_name: 'Shopee New Product Spotlight: C-Booster Series & Theraskin Men',
    campaign_type: 'NPD',
    status: 'Recommended',
    start_date: new Date('2026-10-01T00:00:00Z'),
    end_date: new Date('2026-10-31T23:59:59Z'),
    registration_start: new Date('2026-09-10T00:00:00Z'),
    registration_end: new Date('2026-09-28T23:59:59Z'),
    product_type: 'NPD',
    description: 'Program showcase produk baru unggulan dengan penempatan banner eksklusif halaman utama Shopee.',
    source: 'Manual Marketplace Check',
    source_url: 'https://seller.shopee.co.id/portal/marketing',
    last_checked_at: new Date('2026-09-06T15:00:00Z'),
    data_status: 'Verified Manually',
    eligibility_status: 'Eligible',
    eligible_sku_count: 5,
    matched_sku_count: 5,
    required_discount: 4.0,
    minimum_stock: 200,
    estimated_orders: 220,
    estimated_gmv: 18500000,
    estimated_margin: 31.0,
    opportunity_score: 86,
    opportunity_level: 'High',
    recommendation: 'Recommended',
    recommendation_reason: 'Kesempatan penetrasi & exposure peluncuran produk baru (NPD). Diskon 4% sangat aman. 5 SKU C-Booster & Men terverifikasi.',
    notes: 'Voucher Member Baru 10% dan Repeat Order 13% dapat digabungkan dengan banner ini.'
  },
  {
    marketplace: 'Lazada',
    campaign_name: 'Lazada 10.10 Mega Campaign LazFlash Deal',
    campaign_type: 'Flash Sale',
    status: 'Opportunity',
    start_date: new Date('2026-10-10T00:00:00Z'),
    end_date: new Date('2026-10-12T23:59:59Z'),
    registration_start: new Date('2026-09-08T00:00:00Z'),
    registration_end: new Date('2026-10-06T23:59:59Z'),
    product_type: 'Both',
    description: 'Slot kilat LazFlash harga promo resmi untuk produk perawatan kulit pria dan bundling hemat.',
    source: 'Manual Marketplace Check',
    source_url: 'https://sellercenter.lazada.co.id/apps/campaign',
    last_checked_at: new Date('2026-09-06T15:10:00Z'),
    data_status: 'Verified Manually',
    eligibility_status: 'Eligible',
    eligible_sku_count: 4,
    matched_sku_count: 4,
    required_discount: 5.0,
    minimum_stock: 180,
    estimated_orders: 160,
    estimated_gmv: 11200000,
    estimated_margin: 29.0,
    opportunity_score: 82,
    opportunity_level: 'High',
    recommendation: 'Recommended',
    recommendation_reason: 'Traffic multiplier tinggi pada event besar. Diskon 5% sesuai dengan data master sheet Lazada row 642 & 660.',
    notes: 'Theraskin Men Multi Action Serum dan C-Booster Series Bundling siap didaftarkan.'
  },
  {
    marketplace: 'Shopee',
    campaign_name: 'Shopee Payday Super Sale Akhir Bulan',
    campaign_type: 'Payday',
    status: 'Opportunity',
    start_date: new Date('2026-10-25T00:00:00Z'),
    end_date: new Date('2026-10-31T23:59:59Z'),
    registration_start: new Date('2026-09-20T00:00:00Z'),
    registration_end: new Date('2026-10-22T23:59:59Z'),
    product_type: 'Existing',
    description: 'Campaign gajian bulanan dengan voucher cashback dan gratis ongkir minimal belanja Rp 0.',
    source: 'Manual Marketplace Check',
    source_url: 'https://seller.shopee.co.id/portal/campaign',
    last_checked_at: new Date('2026-09-06T15:20:00Z'),
    data_status: 'Verified Manually',
    eligibility_status: 'Eligible',
    eligible_sku_count: 10,
    matched_sku_count: 10,
    required_discount: 4.0,
    minimum_stock: 400,
    estimated_orders: 320,
    estimated_gmv: 24600000,
    estimated_margin: 30.5,
    opportunity_score: 78,
    opportunity_level: 'Medium',
    recommendation: 'Consider',
    recommendation_reason: 'Daya beli konsumen memuncak pada periode gajian. Diskon 4% berada dalam batas aman. Siapkan alokasi paket lengkap.',
    notes: 'Cocok untuk Theraskin Perfect Glow Paket Lengkap dan Advanced Acne Series.'
  },
  {
    marketplace: 'TikTok Shop',
    campaign_name: 'TikTok Shop BAU Flash Sale Toko Harian',
    campaign_type: 'BAU',
    status: 'Opportunity',
    start_date: new Date('2026-10-13T00:00:00Z'),
    end_date: new Date('2026-10-24T23:59:59Z'),
    registration_start: new Date('2026-10-01T00:00:00Z'),
    registration_end: new Date('2026-10-12T23:59:59Z'),
    product_type: 'Existing',
    description: 'Slot Flash Sale harian regular non-event untuk menjaga volume pesanan dan retensi pelanggan.',
    source: 'Manual Marketplace Check',
    source_url: 'https://seller-id.tiktok.com/promotions',
    last_checked_at: new Date('2026-09-06T15:30:00Z'),
    data_status: 'Verified Manually',
    eligibility_status: 'Eligible',
    eligible_sku_count: 5,
    matched_sku_count: 5,
    required_discount: 3.0,
    minimum_stock: 150,
    estimated_orders: 140,
    estimated_gmv: 8900000,
    estimated_margin: 33.0,
    opportunity_score: 68,
    opportunity_level: 'Medium',
    recommendation: 'Consider',
    recommendation_reason: 'Campaign harian reguler untuk menjaga kestabilan baseline GMV. Diskon 3% sangat aman untuk bottom price.',
    notes: 'Alokasikan kuota terbatas per hari agar margin tidak tertekan.'
  },
  {
    marketplace: 'Shopee',
    campaign_name: 'Shopee Super Brand Membership Exclusive',
    campaign_type: 'Brand Membership',
    status: 'Opportunity',
    start_date: new Date('2026-10-01T00:00:00Z'),
    end_date: new Date('2026-10-31T23:59:59Z'),
    registration_start: new Date('2026-09-15T00:00:00Z'),
    registration_end: new Date('2026-09-30T23:59:59Z'),
    product_type: 'Both',
    description: 'Program apresiasi pelanggan dan rekrutmen member toko baru dengan tiering poin dan voucher.',
    source: 'Manual Marketplace Check',
    source_url: 'https://seller.shopee.co.id/portal/membership',
    last_checked_at: new Date('2026-09-06T15:40:00Z'),
    data_status: 'Verified Manually',
    eligibility_status: 'Eligible',
    eligible_sku_count: 7,
    matched_sku_count: 7,
    required_discount: 4.0,
    minimum_stock: 250,
    estimated_orders: 180,
    estimated_gmv: 14200000,
    estimated_margin: 32.0,
    opportunity_score: 74,
    opportunity_level: 'Medium',
    recommendation: 'Consider',
    recommendation_reason: 'Meningkatkan repeat order dan LTV pelanggan setia Theraskin. Diskon 4% aman.',
    notes: 'Koneksikan dengan Voucher Member Baru NPD (10%) dan Repeat Order (13%).'
  }
]

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const brandIdParam = searchParams.get('brandId')
    
    // Resolve brand access
    let brand = await assertBrandAccess(brandIdParam)
    if (!brand) {
      // Fallback to first brand
      brand = await prisma.brand.findFirst()
    }
    if (!brand) return NextResponse.json({ error: 'No brand found' }, { status: 404 })

    // Check count of existing opportunities
    const count = await prisma.campaignOpportunity.count({
      where: { brand_id: brand.id }
    })

    // Seed if table is empty for this brand
    if (count === 0) {
      for (const opp of INITIAL_OPPORTUNITIES) {
        await prisma.campaignOpportunity.create({
          data: {
            ...opp,
            brand_id: brand.id
          }
        })
      }
    }

    // Fetch all opportunities
    const opportunities = await prisma.campaignOpportunity.findMany({
      where: { brand_id: brand.id },
      orderBy: [
        { opportunity_score: 'desc' },
        { start_date: 'asc' }
      ]
    })

    // Compute Summary Stats
    const now = new Date()
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

    const availableCount = opportunities.filter(o => o.status !== 'Expired' && o.status !== 'Skipped').length
    const recommendedCount = opportunities.filter(o => o.recommendation === 'Recommended' && o.status !== 'Expired').length
    const expiringSoonCount = opportunities.filter(o => {
      if (o.status === 'Expired' || o.status === 'Joined') return false
      if (!o.registration_end) return false
      const reg = new Date(o.registration_end)
      return reg >= now && reg <= fiveDaysFromNow
    }).length
    const highOpportunityCount = opportunities.filter(o => o.opportunity_score >= 80 && o.status !== 'Expired').length

    return NextResponse.json({
      opportunities,
      summary: {
        availableCount,
        recommendedCount,
        expiringSoonCount,
        highOpportunityCount,
        totalCount: opportunities.length
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch campaign opportunities:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const brandIdParam = body.brandId || req.nextUrl.searchParams.get('brandId')

    let brand = await assertBrandAccess(brandIdParam)
    if (!brand) {
      brand = await prisma.brand.findFirst()
    }
    if (!brand) return NextResponse.json({ error: 'No brand found' }, { status: 404 })

    // Validation
    const { campaign_name, marketplace, campaign_type, start_date, end_date } = body
    if (!campaign_name?.trim()) return NextResponse.json({ error: 'Nama campaign wajib diisi.' }, { status: 400 })
    if (!marketplace?.trim()) return NextResponse.json({ error: 'Marketplace wajib dipilih.' }, { status: 400 })
    if (!start_date || !end_date) return NextResponse.json({ error: 'Periode campaign (tanggal mulai & selesai) wajib diisi.' }, { status: 400 })

    // Calculate score using deterministic engine
    const scoreResult = calculateOpportunityScore({
      campaign_type: campaign_type || 'Other',
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      registration_end: body.registration_end ? new Date(body.registration_end) : null,
      required_discount: body.required_discount != null ? parseFloat(body.required_discount) : null,
      product_type: body.product_type || 'Existing',
      eligible_sku_count: body.eligible_sku_count != null ? parseInt(body.eligible_sku_count, 10) : 0,
      matched_sku_count: body.matched_sku_count != null ? parseInt(body.matched_sku_count, 10) : 0,
      estimated_gmv: body.estimated_gmv != null ? parseFloat(body.estimated_gmv) : null,
      estimated_margin: body.estimated_margin != null ? parseFloat(body.estimated_margin) : null
    })

    const created = await prisma.campaignOpportunity.create({
      data: {
        brand_id: brand.id,
        marketplace: body.marketplace,
        campaign_name: body.campaign_name.trim(),
        campaign_type: body.campaign_type || 'Other',
        status: body.status || 'Opportunity',
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        registration_start: body.registration_start ? new Date(body.registration_start) : null,
        registration_end: body.registration_end ? new Date(body.registration_end) : null,
        product_type: body.product_type || 'Existing',
        description: body.description || null,
        source: body.source || 'Manual Marketplace Check',
        source_url: body.source_url || null,
        last_checked_at: new Date(),
        data_status: 'Verified Manually',
        eligibility_status: body.eligibility_status || (body.eligible_sku_count > 0 ? 'Eligible' : 'Manual Check Required'),
        eligible_sku_count: body.eligible_sku_count ? parseInt(body.eligible_sku_count, 10) : 0,
        matched_sku_count: body.matched_sku_count ? parseInt(body.matched_sku_count, 10) : 0,
        required_discount: body.required_discount ? parseFloat(body.required_discount) : null,
        minimum_stock: body.minimum_stock ? parseInt(body.minimum_stock, 10) : null,
        estimated_orders: body.estimated_orders ? parseInt(body.estimated_orders, 10) : null,
        estimated_gmv: body.estimated_gmv ? parseFloat(body.estimated_gmv) : null,
        estimated_margin: body.estimated_margin ? parseFloat(body.estimated_margin) : null,
        opportunity_score: scoreResult.score,
        opportunity_level: scoreResult.level,
        recommendation: scoreResult.recommendation,
        recommendation_reason: scoreResult.reason,
        notes: body.notes || null
      }
    })

    return NextResponse.json({ success: true, opportunity: created })
  } catch (error: any) {
    console.error('Failed to create campaign opportunity:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { id, status, decisionReason } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const existing = await prisma.campaignOpportunity.findUnique({
      where: { id }
    })
    if (!existing) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })

    const updated = await prisma.campaignOpportunity.update({
      where: { id },
      data: {
        status: status || existing.status,
        last_checked_at: new Date(),
        ...(body.notes ? { notes: body.notes } : {}),
        ...(body.required_discount ? { required_discount: parseFloat(body.required_discount) } : {}),
        ...(body.estimated_gmv ? { estimated_gmv: parseFloat(body.estimated_gmv) } : {})
      }
    })

    // Log decision if status changed to Joined or Skipped
    if (status === 'Joined' || status === 'Skipped') {
      try {
        const brand = await prisma.brand.findUnique({ where: { id: existing.brand_id } })
        if (brand && session?.user?.id) {
          await prisma.decisionHistory.create({
            data: {
              workspace_id: brand.workspace_id,
              brand_id: brand.id,
              user_id: session.user.id,
              actionTaken: status === 'Joined' 
                ? `JOIN CAMPAIGN: ${existing.marketplace} - ${existing.campaign_name}` 
                : `SKIP CAMPAIGN: ${existing.marketplace} - ${existing.campaign_name}`,
              expectedOutcome: decisionReason || existing.recommendation_reason || `Opportunity score: ${existing.opportunity_score}/100`,
              status: 'EXECUTED'
            }
          })
        }
      } catch (logErr) {
        console.warn('Could not record to DecisionHistory:', logErr)
      }
    }

    return NextResponse.json({ success: true, opportunity: updated })
  } catch (error: any) {
    console.error('Failed to update campaign opportunity:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await prisma.campaignOpportunity.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete campaign opportunity:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
