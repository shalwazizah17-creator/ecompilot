import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Menyiapkan data Theraskin...')

  const user = await prisma.user.findFirst()
  if (!user) throw new Error('No user found! Please register an account first.')
  
  const workspace = await prisma.workspace.findFirst({ where: { members: { some: { user_id: user.id } } } })
  if (!workspace) throw new Error('No workspace found!')

  let brand = await prisma.brand.findFirst({ where: { name: 'Theraskin', workspace_id: workspace.id } })
  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        name: 'Theraskin',
        industry: 'Beauty & Personal Care',
        workspace_id: workspace.id
      }
    })
  }

  const getOrCreatePlatform = async (name) => {
    let p = await prisma.platform.findFirst({ where: { name } })
    if (!p) {
      p = await prisma.platform.create({ data: { name } })
    }
    return p.id
  }

  const pShopee = await getOrCreatePlatform('Shopee')
  const pTiktok = await getOrCreatePlatform('TikTok')
  const pTokped = await getOrCreatePlatform('Tokopedia')
  const pMeta = await getOrCreatePlatform('Meta Ads')

  await prisma.dailyMetric.deleteMany({ where: { brand_id: brand.id } })
  await prisma.competitor.deleteMany({ where: { brand_id: brand.id } })
  await prisma.inventoryRecord.deleteMany({ where: { brand_id: brand.id } })
  await prisma.customerReview.deleteMany({ where: { brand_id: brand.id } })
  await prisma.marginRule.deleteMany({ where: { brand_id: brand.id } })

  console.log('Data lama dibersihkan')

  await prisma.marginRule.createMany({
    data: [
      { brand_id: brand.id, workspace_id: workspace.id, marketplace: 'shopee', marketplace_fee_percent: 8.5, payment_fee_percent: 1.8, affiliate_commission_percent: 5, voucher_cost_percent: 3, target_margin_percent: 25 },
      { brand_id: brand.id, workspace_id: workspace.id, marketplace: 'tiktok', marketplace_fee_percent: 5.5, payment_fee_percent: 1.5, affiliate_commission_percent: 10, voucher_cost_percent: 5, target_margin_percent: 20 },
      { brand_id: brand.id, workspace_id: workspace.id, marketplace: 'tokopedia', marketplace_fee_percent: 6.5, payment_fee_percent: 1.8, affiliate_commission_percent: 2, voucher_cost_percent: 2, target_margin_percent: 25 },
    ]
  })

  await prisma.inventoryRecord.createMany({
    data: [
      { brand_id: brand.id, workspace_id: workspace.id, sku: 'TH-ACNE-01', product_name: 'Theraskin Acne Wash', available_stock: 120, reserved_stock: 20, campaign_allocation: 50, avg_daily_sales_7d: 15, avg_daily_sales_30d: 12 },
      { brand_id: brand.id, workspace_id: workspace.id, sku: 'TH-GLOW-02', product_name: 'Theraskin Glowing Serum', available_stock: 45, reserved_stock: 10, campaign_allocation: 0, avg_daily_sales_7d: 25, avg_daily_sales_30d: 20 },
      { brand_id: brand.id, workspace_id: workspace.id, sku: 'TH-SUN-03', product_name: 'Theraskin Suncare', available_stock: 500, reserved_stock: 50, campaign_allocation: 100, avg_daily_sales_7d: 10, avg_daily_sales_30d: 11 },
      { brand_id: brand.id, workspace_id: workspace.id, sku: 'TH-NITE-04', product_name: 'Theraskin Night Cream', available_stock: 8, reserved_stock: 0, campaign_allocation: 0, avg_daily_sales_7d: 5, avg_daily_sales_30d: 4 }
    ]
  })

  const comp1 = await prisma.competitor.create({
    data: { brand_id: brand.id, workspace_id: workspace.id, name: 'Glad2Glow', marketplace: 'shopee', store_url: 'https://shopee.co.id/glad2glow' }
  })
  await prisma.competitorProduct.createMany({
    data: [
      { competitor_id: comp1.id, product_name: 'Glad2Glow Centella Acne Gel', current_price: 39000, stock_status: 'IN_STOCK' },
      { competitor_id: comp1.id, product_name: 'Glad2Glow Pomegranate Moisturizer', current_price: 49000, stock_status: 'IN_STOCK' }
    ]
  })

  const comp2 = await prisma.competitor.create({
    data: { brand_id: brand.id, workspace_id: workspace.id, name: 'Skintific', marketplace: 'tiktok', store_url: 'https://tiktok.com/@skintific' }
  })
  await prisma.competitorProduct.createMany({
    data: [
      { competitor_id: comp2.id, product_name: 'Skintific 5X Ceramide', current_price: 139000, stock_status: 'IN_STOCK' },
      { competitor_id: comp2.id, product_name: 'Skintific Mugwort Clay Mask', current_price: 89000, stock_status: 'OUT_OF_STOCK' }
    ]
  })

  await prisma.customerReview.createMany({
    data: [
      { brand_id: brand.id, workspace_id: workspace.id, sku: 'TH-GLOW-02', product_name: 'Theraskin Glowing Serum', rating: 5, review_text: 'Bagus banget bikin glowing parah dan ga lengket', sentiment: 'POSITIVE', complaint_topic: null },
      { brand_id: brand.id, workspace_id: workspace.id, sku: 'TH-GLOW-02', product_name: 'Theraskin Glowing Serum', rating: 5, review_text: 'Repeat order ke 3x karena emang sengefek itu di aku.', sentiment: 'POSITIVE', complaint_topic: null },
      { brand_id: brand.id, workspace_id: workspace.id, sku: 'TH-ACNE-01', product_name: 'Theraskin Acne Wash', rating: 1, review_text: 'Tutup botolnya rembes pas dateng, isinya tumpah ke kardus', sentiment: 'NEGATIVE', complaint_topic: 'Leakage' },
      { brand_id: brand.id, workspace_id: workspace.id, sku: 'TH-ACNE-01', product_name: 'Theraskin Acne Wash', rating: 2, review_text: 'Kemasan rusak dan agak bocor. Tolong perbaiki packingnya.', sentiment: 'NEGATIVE', complaint_topic: 'Packaging' },
      { brand_id: brand.id, workspace_id: workspace.id, sku: 'TH-SUN-03', product_name: 'Theraskin Suncare', rating: 3, review_text: 'Lumayan sih tapi agak whitecast di kulit sawo matang.', sentiment: 'NEUTRAL', complaint_topic: 'Quality' },
      { brand_id: brand.id, workspace_id: workspace.id, sku: 'TH-ACNE-01', product_name: 'Theraskin Acne Wash', rating: 1, review_text: 'Bocor bangett pas nyampe ampe abis isinya', sentiment: 'NEGATIVE', complaint_topic: 'Leakage' }
    ]
  })

  console.log('Men-generate data penjualan (30 hari terakhir)...')
  const metrics = []
  
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)

    const plats = [
      { id: pShopee, baseGMV: 15000000 },
      { id: pTiktok, baseGMV: 18000000 },
      { id: pTokped, baseGMV: 5000000 }
    ]

    for (const p of plats) {
      const variation = 0.8 + (Math.random() * 0.4)
      const gmv = Math.round(p.baseGMV * variation)
      const orders = Math.round(gmv / 65000)
      
      metrics.push({
        brand_id: brand.id,
        date: d,
        source_type: 'MARKETPLACE_SALES',
        platform_id: p.id,
        sales: gmv,
        orders: orders,
        cancellations: Math.round(gmv * 0.05),
        refunds: Math.round(gmv * 0.02)
      })
    }

    metrics.push({
      brand_id: brand.id,
      date: d,
      source_type: 'META_CAMPAIGN',
      platform_id: pMeta,
      spend: 1500000,
      attributed_revenue: Math.round(1500000 * (4 + Math.random())),
      impressions: 150000,
      clicks: 3000,
      purchases: 45
    })
    
    metrics.push({
      brand_id: brand.id,
      date: d,
      source_type: 'AD_PERFORMANCE',
      platform_id: pTiktok,
      spend: 2500000,
      attributed_revenue: Math.round(2500000 * (8 + Math.random() * 3)),
      impressions: 250000,
      clicks: 5000,
      purchases: 80
    })
  }

  await prisma.dailyMetric.createMany({ data: metrics })

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { active_brand_id: brand.id }
  })

  console.log('Selesai! Data dummy Theraskin berhasil di-inject ke database!')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
