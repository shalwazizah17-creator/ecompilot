import { Calculations } from './src/lib/calculations'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

let passed = 0; let failed = 0

function test(name: string, fn: () => Promise<void> | void) {
  return Promise.resolve().then(() => fn()).then(() => { console.log(`  ✅ PASS: ${name}`); passed++ })
    .catch((e: any) => { console.log(`  ❌ FAIL: ${name} — ${e.message}`); failed++ })
}

function assert(c: boolean, msg: string) { if (!c) throw new Error(msg) }
function assertFinite(v: number, msg: string) { if (!isFinite(v) || isNaN(v)) throw new Error(`${msg} (got ${v})`) }

async function run() {
  console.log('\n===== PHASE 15: INVENTORY INTELLIGENCE =====\n')

  await test('Coverage 7.6 days = HIGH risk', () => {
    const days = Calculations.stockCoverageDays(420, 55)
    const risk = Calculations.stockoutRisk(days)
    assert(risk === 'HIGH', `Expected HIGH, got ${risk} (days=${days})`)
  })

  await test('Coverage 30+ days = LOW risk', () => {
    const days = Calculations.stockCoverageDays(1500, 30)
    const risk = Calculations.stockoutRisk(days)
    assert(risk === 'LOW', `Expected LOW, got ${risk}`)
  })

  await test('Zero stock = CRITICAL risk', () => {
    const days = Calculations.stockCoverageDays(0, 30)
    const risk = Calculations.stockoutRisk(days)
    assert(risk === 'CRITICAL', `Expected CRITICAL, got ${risk}`)
  })

  await test('Campaign demand: 50/day × 3 days × 2x = 300 units', () => {
    const demand = Calculations.campaignDemandForecast(50, 3, 2)
    assert(demand === 300, `Expected 300, got ${demand}`)
  })

  await test('Campaign demand: no uplift (1x) = normal rate', () => {
    const demand = Calculations.campaignDemandForecast(50, 7, 1)
    assert(demand === 350, `Expected 350, got ${demand}`)
  })

  // DB tests
  const ws = await prisma.workspace.create({ data: { name: 'WS-Inventory-Ph15' } })
  const brand = await prisma.brand.create({ data: { workspace_id: ws.id, name: 'Brand-Inv-Ph15' } })
  const brand2 = await prisma.brand.create({ data: { workspace_id: ws.id, name: 'Brand-Inv2-Ph15' } })

  const record = await prisma.inventoryRecord.create({
    data: { brand_id: brand.id, workspace_id: ws.id, sku: 'SKU-TEST', product_name: 'Serum Test', available_stock: 420, avg_daily_sales_7d: 55 }
  })

  await test('InventoryRecord created', async () => {
    const r = await prisma.inventoryRecord.findFirst({ where: { id: record.id } })
    assert(r?.available_stock === 420, 'Stock should be 420')
  })

  await test('Inventory isolation: Brand B cannot see Brand A inventory', async () => {
    const leaked = await prisma.inventoryRecord.findFirst({ where: { id: record.id, brand_id: brand2.id } })
    assert(leaked === null, 'Should not find inventory with wrong brand')
  })

  await test('Inventory forecast calculation is finite', () => {
    const days = Calculations.stockCoverageDays(record.available_stock, record.avg_daily_sales_7d)
    assertFinite(days, 'coverage days')
  })

  await prisma.workspace.deleteMany({ where: { id: ws.id } })

  console.log('\n===== PHASE 15: RESULTS =====')
  console.log(`  ✅ Passed: ${passed} | ❌ Failed: ${failed}`)
  await prisma.$disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
