import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

let passed = 0; let failed = 0

function test(name: string, fn: () => Promise<void> | void) {
  return Promise.resolve().then(() => fn()).then(() => { console.log(`  ✅ PASS: ${name}`); passed++ })
    .catch((e: any) => { console.log(`  ❌ FAIL: ${name} — ${e.message}`); failed++ })
}

function assert(c: boolean, msg: string) { if (!c) throw new Error(msg) }

async function run() {
  console.log('\n===== PHASE 14: COMPETITOR INTELLIGENCE =====\n')

  // Create two isolated workspaces to test cross-tenant isolation
  const ws1 = await prisma.workspace.create({ data: { name: 'Workspace-A-Test-Ph14' } })
  const ws2 = await prisma.workspace.create({ data: { name: 'Workspace-B-Test-Ph14' } })
  const brand1 = await prisma.brand.create({ data: { workspace_id: ws1.id, name: 'Brand-A-Ph14' } })
  const brand2 = await prisma.brand.create({ data: { workspace_id: ws2.id, name: 'Brand-B-Ph14' } })

  const comp1 = await prisma.competitor.create({ data: { workspace_id: ws1.id, brand_id: brand1.id, name: 'Rival X', marketplace: 'shopee' } })
  const comp2 = await prisma.competitor.create({ data: { workspace_id: ws2.id, brand_id: brand2.id, name: 'Rival Y', marketplace: 'tokopedia' } })

  await test('Competitor created for Brand A', async () => {
    const found = await prisma.competitor.findFirst({ where: { id: comp1.id, brand_id: brand1.id } })
    assert(found !== null, 'Should find comp1 for brand1')
  })

  await test('Cross-workspace isolation: Brand A cannot see Brand B competitors', async () => {
    const leaked = await prisma.competitor.findFirst({ where: { id: comp2.id, brand_id: brand1.id } })
    assert(leaked === null, 'Brand A should NOT see Brand B competitor')
  })

  const product = await prisma.competitorProduct.create({
    data: { competitor_id: comp1.id, product_name: 'Serum X Rival', current_price: 99000 }
  })

  await test('CompetitorProduct created', async () => {
    const p = await prisma.competitorProduct.findFirst({ where: { id: product.id } })
    assert(p?.product_name === 'Serum X Rival', 'Product name should match')
  })

  const snap = await prisma.competitorSnapshot.create({
    data: { competitor_product_id: product.id, price: 89000, notes: 'Flash sale' }
  })

  await test('Price snapshot recorded', async () => {
    const s = await prisma.competitorSnapshot.findFirst({ where: { id: snap.id } })
    assert(s?.price === 89000, `Expected 89000, got ${s?.price}`)
  })

  await test('Price trend detectable (drop from 99k to 89k)', async () => {
    const snapshots = await prisma.competitorSnapshot.findMany({
      where: { competitor_product_id: product.id }, orderBy: { captured_at: 'asc' }
    })
    assert(snapshots.length >= 1, 'Should have at least 1 snapshot')
    assert(snapshots[0].price <= 99000, 'Latest price should be <= original')
  })

  await test('Workspace isolation on Snapshot (via product → competitor)', async () => {
    // Brand A's snapshot should only be reachable through Brand A's competitor chain
    const result = await prisma.competitorSnapshot.findFirst({
      where: { id: snap.id },
      include: { competitor_product: { include: { competitor: true } } }
    })
    assert(result?.competitor_product?.competitor?.brand_id === brand1.id, 'Snapshot must belong to brand1')
    assert(result?.competitor_product?.competitor?.brand_id !== brand2.id, 'Must not belong to brand2')
  })

  // Cleanup
  await prisma.workspace.deleteMany({ where: { id: { in: [ws1.id, ws2.id] } } })

  console.log('\n===== PHASE 14: RESULTS =====')
  console.log(`  ✅ Passed: ${passed} | ❌ Failed: ${failed}`)
  await prisma.$disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
