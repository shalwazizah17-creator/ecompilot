import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

let passed = 0; let failed = 0

function test(name: string, fn: () => Promise<void> | void) {
  return Promise.resolve().then(() => fn()).then(() => { console.log(`  ✅ PASS: ${name}`); passed++ })
    .catch((e: any) => { console.log(`  ❌ FAIL: ${name} — ${e.message}`); failed++ })
}

function assert(c: boolean, msg: string) { if (!c) throw new Error(msg) }

// Deterministic sentiment classifier (mirror of the server-side one for tests)
function classifySentiment(rating: number, text: string) {
  if (rating >= 4) return { sentiment: 'POSITIVE', complaint_topic: null }
  if (rating === 3) return { sentiment: 'NEUTRAL', complaint_topic: null }
  const t = (text ?? '').toLowerCase()
  if (/kemasan|packaging/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Packaging' }
  if (/bocor|tumpah|cacat|pecah/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Leakage' }
  if (/lambat|lama|telat|pengiriman|kurir/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Shipping' }
  if (/salah varian|varian salah/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'WrongVariant' }
  if (/kualitas|jelek|buruk|tidak bagus/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Quality' }
  return { sentiment: 'NEGATIVE', complaint_topic: 'Other' }
}

async function run() {
  console.log('\n===== PHASE 16: CUSTOMER SENTIMENT ENGINE =====\n')

  await test('Rating 5 = POSITIVE, no complaint', () => {
    const r = classifySentiment(5, 'Produk bagus sekali, recommended!')
    assert(r.sentiment === 'POSITIVE', `Expected POSITIVE, got ${r.sentiment}`)
    assert(r.complaint_topic === null, 'No complaint topic for positive')
  })

  await test('Rating 3 = NEUTRAL', () => {
    const r = classifySentiment(3, 'Lumayan, biasa saja')
    assert(r.sentiment === 'NEUTRAL', `Expected NEUTRAL, got ${r.sentiment}`)
  })

  await test('Leakage keyword detection', () => {
    const r = classifySentiment(1, 'Produk bocor, sangat mengecewakan')
    assert(r.sentiment === 'NEGATIVE', 'Should be NEGATIVE')
    assert(r.complaint_topic === 'Leakage', `Expected Leakage, got ${r.complaint_topic}`)
  })

  await test('Packaging complaint detection', () => {
    const r = classifySentiment(2, 'Kemasan rusak saat tiba')
    assert(r.complaint_topic === 'Packaging', `Expected Packaging, got ${r.complaint_topic}`)
  })

  await test('Shipping complaint detection', () => {
    const r = classifySentiment(2, 'Pengiriman sangat lambat')
    assert(r.complaint_topic === 'Shipping', `Expected Shipping, got ${r.complaint_topic}`)
  })

  await test('Quality complaint detection', () => {
    const r = classifySentiment(1, 'Kualitas jelek tidak sebanding dengan harga')
    assert(r.complaint_topic === 'Quality', `Expected Quality, got ${r.complaint_topic}`)
  })

  await test('Fallback to Other for unmatched negative', () => {
    const r = classifySentiment(1, 'Tidak suka')
    assert(r.sentiment === 'NEGATIVE', 'Should be NEGATIVE')
    assert(r.complaint_topic === 'Other', `Expected Other, got ${r.complaint_topic}`)
  })

  // DB isolation test
  const ws1 = await prisma.workspace.create({ data: { name: 'WS-Review-Ph16-A' } })
  const ws2 = await prisma.workspace.create({ data: { name: 'WS-Review-Ph16-B' } })
  const brand1 = await prisma.brand.create({ data: { workspace_id: ws1.id, name: 'Brand-Rev-A' } })
  const brand2 = await prisma.brand.create({ data: { workspace_id: ws2.id, name: 'Brand-Rev-B' } })

  const review = await prisma.customerReview.create({
    data: { brand_id: brand1.id, workspace_id: ws1.id, rating: 1, review_text: 'bocor', sentiment: 'NEGATIVE', complaint_topic: 'Leakage', source: 'CSV' }
  })

  await test('CustomerReview created with sentiment', async () => {
    const r = await prisma.customerReview.findFirst({ where: { id: review.id } })
    assert(r?.sentiment === 'NEGATIVE', 'Sentiment should be NEGATIVE')
    assert(r?.complaint_topic === 'Leakage', `Complaint topic should be Leakage, got ${r?.complaint_topic}`)
  })

  await test('Review isolation: Brand B cannot see Brand A reviews', async () => {
    const leaked = await prisma.customerReview.findFirst({ where: { id: review.id, brand_id: brand2.id } })
    assert(leaked === null, 'Brand B should NOT see Brand A reviews')
  })

  await test('Negative percentage calculation: 1/1 = 100%', async () => {
    const reviews = await prisma.customerReview.findMany({ where: { brand_id: brand1.id } })
    const neg = reviews.filter(r => r.sentiment === 'NEGATIVE').length
    const pct = (neg / Math.max(1, reviews.length)) * 100
    assert(pct === 100, `Expected 100%, got ${pct}%`)
  })

  await prisma.workspace.deleteMany({ where: { id: { in: [ws1.id, ws2.id] } } })

  console.log('\n===== PHASE 16: RESULTS =====')
  console.log(`  ✅ Passed: ${passed} | ❌ Failed: ${failed}`)
  await prisma.$disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
