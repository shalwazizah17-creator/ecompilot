import { Calculations } from './src/lib/calculations'
import { CommandParser } from './src/lib/command-parser'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✅ PASS: ${name}`)
    passed++
  } catch (e: any) {
    console.log(`  ❌ FAIL: ${name} — ${e.message}`)
    failed++
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg)
}

function assertFinite(val: number, msg: string) {
  assert(isFinite(val) && !isNaN(val), `${msg} (got ${val})`)
}

console.log('\n===== PHASE 13: MARGIN CALCULATION ENGINE =====\n')

test('Zero revenue produces 0 margin', () => {
  const r = Calculations.skuMarginAnalysis({ sellingPrice: 0, units: 0, hpp: 50000, marketplaceFeePct: 5, paymentFeePct: 2, affiliateCommissionPct: 0, voucherPct: 0, adSpendPct: 0, otherCostsPct: 0, refundsPct: 0, cancellationsPct: 0 })
  assertFinite(r.marginPercent, 'margin at zero revenue')
  assert(r.grossSales === 0, 'Gross sales should be 0')
})

test('Zero HPP produces valid margin', () => {
  const r = Calculations.skuMarginAnalysis({ sellingPrice: 100000, units: 1, hpp: 0, marketplaceFeePct: 5, paymentFeePct: 2, affiliateCommissionPct: 0, voucherPct: 0, adSpendPct: 0, otherCostsPct: 0, refundsPct: 0, cancellationsPct: 0 })
  assertFinite(r.marginPercent, 'margin at zero HPP')
  assert(r.marginPercent > 0, `Margin should be positive, got ${r.marginPercent}`)
})

test('Zero fee produces no fee deduction', () => {
  const r = Calculations.skuMarginAnalysis({ sellingPrice: 100000, units: 1, hpp: 40000, marketplaceFeePct: 0, paymentFeePct: 0, affiliateCommissionPct: 0, voucherPct: 0, adSpendPct: 0, otherCostsPct: 0, refundsPct: 0, cancellationsPct: 0 })
  assert(r.marketplaceFee === 0, 'Marketplace fee should be 0')
})

test('High voucher correctly reduces net revenue', () => {
  const r = Calculations.skuMarginAnalysis({ sellingPrice: 100000, units: 1, hpp: 40000, marketplaceFeePct: 5, paymentFeePct: 2, affiliateCommissionPct: 0, voucherPct: 30, adSpendPct: 0, otherCostsPct: 0, refundsPct: 0, cancellationsPct: 0 })
  assertFinite(r.marginPercent, 'margin with high voucher')
  assert(r.voucherCost === 30000, `Voucher cost should be 30000, got ${r.voucherCost}`)
})

test('High affiliate commission reduces profit correctly', () => {
  const r = Calculations.skuMarginAnalysis({ sellingPrice: 100000, units: 1, hpp: 40000, marketplaceFeePct: 5, paymentFeePct: 2, affiliateCommissionPct: 25, voucherPct: 0, adSpendPct: 0, otherCostsPct: 0, refundsPct: 0, cancellationsPct: 0 })
  assertFinite(r.marginPercent, 'margin with high commission')
  assert(r.affiliateCommission === 25000, `Affiliate commission should be 25000, got ${r.affiliateCommission}`)
})

test('Negative profit detected correctly', () => {
  const r = Calculations.skuMarginAnalysis({ sellingPrice: 50000, units: 1, hpp: 60000, marketplaceFeePct: 10, paymentFeePct: 2, affiliateCommissionPct: 10, voucherPct: 10, adSpendPct: 5, otherCostsPct: 0, refundsPct: 0, cancellationsPct: 0 })
  assert(r.netProfit < 0, `Should have negative profit, got ${r.netProfit}`)
  assert(r.marginPercent < 0, `Should have negative margin, got ${r.marginPercent}`)
})

test('Minimum safe price is higher than loss-making HPP case', () => {
  const minPrice = Calculations.minimumSafePrice({ hpp: 40000, marketplaceFeePct: 5, paymentFeePct: 2, affiliateCommissionPct: 5, voucherPct: 5, adSpendPct: 3, otherCostsPct: 0, targetMarginPct: 20 })
  assertFinite(minPrice, 'minimum safe price')
  assert(minPrice > 40000, `Min safe price ${minPrice} should be > HPP 40000`)
})

test('Target margin calculation: SAFE status', () => {
  const margin = Calculations.marginPercent(25000, 100000)
  const status = Calculations.marginRiskStatus(margin, 20)
  assert(status === 'SAFE', `Expected SAFE, got ${status}`)
})

test('Target margin calculation: LOSS status', () => {
  const status = Calculations.marginRiskStatus(-5, 20)
  assert(status === 'LOSS', `Expected LOSS, got ${status}`)
})

test('NaN prevention: safeDiv 0/0', () => {
  const r = Calculations.safeDiv(0, 0)
  assertFinite(r, 'safeDiv 0/0')
  assert(r === 0, `safeDiv(0,0) should be 0, got ${r}`)
})

test('Infinity prevention: divide by near-zero', () => {
  const margin = Calculations.marginPercent(0, 0)
  assertFinite(margin, 'marginPercent with 0 revenue')
})

test('Max safe voucher does not exceed 50%', () => {
  const maxV = Calculations.maximumSafeVoucher({ sellingPrice: 100000, hpp: 40000, marketplaceFeePct: 5, paymentFeePct: 2, affiliateCommissionPct: 5, adSpendPct: 5, otherCostsPct: 0, targetMarginPct: 20 })
  assertFinite(maxV, 'max safe voucher')
  assert(maxV >= 0 && maxV <= 50, `Max voucher ${maxV} must be 0-50%`)
})

console.log('\n===== PHASE 13: COMMAND PARSER EXTENSIONS =====\n')

test('Margin intent: "produk rugi"', () => {
  const r = CommandParser.parse('produk mana yang rugi?')
  assert(r.intent === 'MARGIN_ANALYSIS', `Expected MARGIN_ANALYSIS, got ${r.intent}`)
})

test('Competitor intent', () => {
  const r = CommandParser.parse('kompetitor mana yang menurunkan harga?')
  assert(r.intent === 'COMPETITOR_ANALYSIS', `Expected COMPETITOR_ANALYSIS, got ${r.intent}`)
})

test('Inventory intent: "stok habis"', () => {
  const r = CommandParser.parse('produk mana yang stok hampir habis?')
  assert(r.intent === 'INVENTORY_RISK', `Expected INVENTORY_RISK, got ${r.intent}`)
})

test('Customer sentiment intent', () => {
  const r = CommandParser.parse('apa keluhan pelanggan terbanyak?')
  assert(r.intent === 'CUSTOMER_SENTIMENT', `Expected CUSTOMER_SENTIMENT, got ${r.intent}`)
})

test('Action priority intent', () => {
  const r = CommandParser.parse('apa yang harus saya lakukan hari ini?')
  assert(r.intent === 'ACTION_PRIORITY', `Expected ACTION_PRIORITY, got ${r.intent}`)
})

console.log('\n===== PHASE 15: INVENTORY CALCULATIONS =====\n')

test('Stock coverage days: normal', () => {
  const days = Calculations.stockCoverageDays(420, 55)
  assert(days === 7, `Expected 7 days, got ${days}`)
})

test('Stock coverage: zero daily sales = 999', () => {
  const days = Calculations.stockCoverageDays(100, 0)
  assert(days === 999, `Expected 999, got ${days}`)
})

test('Stock coverage: empty stock = 0', () => {
  const days = Calculations.stockCoverageDays(0, 50)
  assert(days === 0, `Expected 0, got ${days}`)
})

test('Stockout risk: 2 days = CRITICAL', () => {
  assert(Calculations.stockoutRisk(2) === 'CRITICAL', 'Expected CRITICAL')
})

test('Stockout risk: 10 days = MEDIUM', () => {
  assert(Calculations.stockoutRisk(10) === 'MEDIUM', 'Expected MEDIUM')
})

test('Campaign demand forecast', () => {
  const demand = Calculations.campaignDemandForecast(50, 3, 2)
  assert(demand === 300, `Expected 300, got ${demand}`)
})

async function runDatabaseTests() {
  console.log('\n===== PHASE 13-16: DATABASE ISOLATION TESTS =====\n')

  try {
    // Test that ProductCost, MarginRule, Competitor, InventoryRecord, CustomerReview tables exist
    const tables = ['ProductCost', 'MarginRule', 'Competitor', 'CompetitorProduct', 'CompetitorSnapshot', 'InventoryRecord', 'CustomerReview']
    
    for (const table of tables) {
      try {
        // @ts-ignore
        await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count()
        console.log(`  ✅ PASS: Table ${table} exists and is queryable`)
        passed++
      } catch (e: any) {
        console.log(`  ❌ FAIL: Table ${table} — ${e.message}`)
        failed++
      }
    }
  } catch (e: any) {
    console.log(`  ❌ DB Tests failed: ${e.message}`)
    failed++
  }

  await prisma.$disconnect()
}

runDatabaseTests().then(() => {
  console.log(`\n=================================`)
  console.log(`Phase 13-16 Test Results:`)
  console.log(`  ✅ Passed: ${passed}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  Total: ${passed + failed}`)
  console.log(`=================================\n`)
  process.exit(failed > 0 ? 1 : 0)
})
