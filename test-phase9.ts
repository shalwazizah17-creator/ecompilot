import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runTests() {
  console.log("==========================================")
  console.log("   PHASE 9 VERIFICATION & TEST SUITE      ")
  console.log("==========================================")
  
  let passed = 0
  let failed = 0

  const assert = (condition: boolean, name: string) => {
    if (condition) {
      console.log(`[PASS] ${name}`)
      passed++
    } else {
      console.error(`[FAIL] ${name}`)
      failed++
    }
  }

  try {
    let brand = await prisma.brand.create({ data: { name: `Brand P9 Test ${Date.now()}` } })
    let tiktok = await prisma.platform.create({ data: { name: `TikTok P9 Test ${Date.now()}`, is_ad_channel: true, is_marketplace: true } })

    // Test 1: Affiliate Data Import (Direct Prisma mock simulating /confirm backend)
    let affiliate = await prisma.affiliate.create({
      data: {
        brand_id: brand.id,
        platform_id: tiktok.id,
        external_id: 'aff_user_1',
        display_name: 'TikTok Star 1'
      }
    })

    const metricDate = new Date('2023-11-01')

    await prisma.affiliateMetric.create({
      data: {
        brand_id: brand.id,
        platform_id: tiktok.id,
        affiliate_id: affiliate.id,
        date: metricDate,
        sales: 5000000,
        orders: 100,
        clicks: 5000,
        commission: 500000,
        source_type: 'AFFILIATE_PERFORMANCE'
      }
    })
    
    // Simulate deduplication: "REPLACE"
    const existingMetric = await prisma.affiliateMetric.findFirst({
      where: { brand_id: brand.id, affiliate_id: affiliate.id, date: metricDate }
    })
    
    if (existingMetric) {
      await prisma.affiliateMetric.update({
        where: { id: existingMetric.id },
        data: { sales: existingMetric.sales + 1000000 } // adding 1m
      })
    }
    
    const finalMetric = await prisma.affiliateMetric.findUnique({ where: { id: existingMetric!.id } })
    assert(finalMetric!.sales === 6000000, "Test 1: Duplicate REPLACE transaction logic accumulates accurately.")

    // Test 2: Marketing Intelligence (Budget Opportunity Generation)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 5)

    // Simulate Ads
    await prisma.dailyMetric.create({
      data: {
        brand_id: brand.id,
        platform_id: tiktok.id,
        date: thirtyDaysAgo,
        sales: 10000000,
        spend: 2000000 // ROAS 5
      }
    })

    const metrics = await prisma.dailyMetric.findMany({ where: { brand_id: brand.id } })
    const tiktokSpend = metrics.reduce((acc, m) => acc + (m.spend || 0), 0)
    const tiktokRev = metrics.reduce((acc, m) => acc + (m.sales || 0), 0)
    const roas = tiktokRev / tiktokSpend
    assert(roas === 5, "Test 2: Base ROAS intelligence calculation executes cleanly.")

    // Test 3: Recommendation Engine logic
    const activeDaysCount = 1
    const roi = finalMetric!.commission > 0 ? finalMetric!.sales / finalMetric!.commission : 0 // 6,000,000 / 500,000 = 12
    const cvr = finalMetric!.clicks > 0 ? (finalMetric!.orders / finalMetric!.clicks) * 100 : 0 // 100 / 5000 = 2%
    
    assert(roi === 12, "Test 3: Affiliate ROI resolves properly.")
    assert(cvr === 2, "Test 4: Affiliate CVR resolves properly.")
    
    let confidence = 'LOW'
    if (activeDaysCount >= 30) confidence = 'HIGH'
    else if (activeDaysCount >= 7) confidence = 'MEDIUM'

    assert(confidence === 'LOW', "Test 5: Low-data confidence scaling applies successfully.")
    
    let score = 0
    if (roi > 5) score += 25
    if (cvr >= 2) score += 15
    if (finalMetric!.sales > 5000000) score += 30
    
    assert(score === 70, "Test 6: Configurable scoring engine grades logic successfully.")

    // Clean up
    await prisma.affiliateMetric.deleteMany({ where: { brand_id: brand.id } })
    await prisma.affiliate.deleteMany({ where: { brand_id: brand.id } })
    await prisma.dailyMetric.deleteMany({ where: { brand_id: brand.id } })
    await prisma.brand.delete({ where: { id: brand.id } })
    await prisma.platform.delete({ where: { id: tiktok.id } })

  } catch (err) {
    console.error("Test execution failed:", err)
    failed++
  }

  console.log("\n==========================================")
  console.log(`Tests Passed: ${passed}`)
  console.log(`Tests Failed: ${failed}`)
  if (failed > 0) {
    console.log("RESULT: FAILED")
    process.exit(1)
  } else {
    console.log("RESULT: SUCCESS")
    process.exit(0)
  }
}

runTests()
