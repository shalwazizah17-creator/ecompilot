import { CommandParser } from './src/lib/command-parser'

let passed = 0; let failed = 0

function test(name: string, fn: () => void) {
  try { fn(); console.log(`  ✅ PASS: ${name}`); passed++ }
  catch (e: any) { console.log(`  ❌ FAIL: ${name} — ${e.message}`); failed++ }
}

function assert(c: boolean, msg: string) { if (!c) throw new Error(msg) }

console.log('\n===== PHASE 17: SPECIALIST COPILOT COMMAND PARSER =====\n')

test('"Why did GMV drop?" → TREND_ANALYSIS', () => {
  const r = CommandParser.parse('Why did GMV drop last week?')
  assert(r.intent === 'TREND_ANALYSIS', `Expected TREND_ANALYSIS, got ${r.intent}`)
})

test('"Which marketplace grew the most?" → MARKETPLACE_COMPARISON', () => {
  const r = CommandParser.parse('Which marketplace grew the most this month?')
  assert(r.intent === 'MARKETPLACE_COMPARISON', `Expected MARKETPLACE_COMPARISON, got ${r.intent}`)
})

test('"Which products are losing money?" → MARGIN_ANALYSIS with FIND_LOSS', () => {
  const r = CommandParser.parse('Which products are losing money?')
  assert(r.intent === 'MARGIN_ANALYSIS', `Expected MARGIN_ANALYSIS, got ${r.intent}`)
  assert(r.action === 'FIND_LOSS', `Expected FIND_LOSS, got ${r.action}`)
})

test('"Which ads should I reduce?" → ADS_OPTIMIZATION with REDUCE', () => {
  const r = CommandParser.parse('Which ads should I reduce?')
  assert(r.intent === 'ADS_OPTIMIZATION', `Expected ADS_OPTIMIZATION, got ${r.intent}`)
  assert(r.action === 'REDUCE', `Expected REDUCE, got ${r.action}`)
})

test('"Which ads should I scale?" → ADS_OPTIMIZATION with SCALE', () => {
  const r = CommandParser.parse('Which ads should I scale up?')
  assert(r.intent === 'ADS_OPTIMIZATION', `Expected ADS_OPTIMIZATION, got ${r.intent}`)
  assert(r.action === 'SCALE', `Expected SCALE, got ${r.action}`)
})

test('"Which affiliate should I contact?" → AFFILIATE_DISCOVERY', () => {
  const r = CommandParser.parse('Which affiliate should I contact?')
  assert(r.intent === 'AFFILIATE_DISCOVERY', `Expected AFFILIATE_DISCOVERY, got ${r.intent}`)
})

test('"Which competitor changed price?" → COMPETITOR_ANALYSIS', () => {
  const r = CommandParser.parse('Which competitor changed price?')
  assert(r.intent === 'COMPETITOR_ANALYSIS', `Expected COMPETITOR_ANALYSIS, got ${r.intent}`)
})

test('"Which products are at stockout risk?" → INVENTORY_RISK', () => {
  const r = CommandParser.parse('Which products are at stockout risk?')
  assert(r.intent === 'INVENTORY_RISK', `Expected INVENTORY_RISK, got ${r.intent}`)
})

test('"What are customers complaining about?" → CUSTOMER_SENTIMENT', () => {
  const r = CommandParser.parse('What are customers complaining about?')
  assert(r.intent === 'CUSTOMER_SENTIMENT', `Expected CUSTOMER_SENTIMENT, got ${r.intent}`)
})

test('"What should I do today?" → ACTION_PRIORITY', () => {
  const r = CommandParser.parse('What should I do today?')
  assert(r.intent === 'ACTION_PRIORITY', `Expected ACTION_PRIORITY, got ${r.intent}`)
})

test('Indonesian: "kenapa GMV turun?" → TREND_ANALYSIS', () => {
  const r = CommandParser.parse('kenapa GMV turun minggu ini?')
  assert(r.intent === 'TREND_ANALYSIS', `Expected TREND_ANALYSIS, got ${r.intent}`)
})

test('Indonesian: "stok hampir habis?" → INVENTORY_RISK', () => {
  const r = CommandParser.parse('produk mana yang stok hampir habis?')
  assert(r.intent === 'INVENTORY_RISK', `Expected INVENTORY_RISK, got ${r.intent}`)
})

test('Indonesian: "apa yang harus saya lakukan hari ini?" → ACTION_PRIORITY', () => {
  const r = CommandParser.parse('apa yang harus saya lakukan hari ini?')
  assert(r.intent === 'ACTION_PRIORITY', `Expected ACTION_PRIORITY, got ${r.intent}`)
})

test('Unknown query returns low confidence', () => {
  const r = CommandParser.parse('ajkdhasjkdhajksd')
  assert(r.intent === 'UNKNOWN', `Expected UNKNOWN, got ${r.intent}`)
  assert(r.confidence === 0, `Expected confidence 0, got ${r.confidence}`)
})

test('All valid intents have confidence > 0', () => {
  const queries = [
    'Why did GMV drop?', 'Which marketplace grew the most?', 'Products losing money?',
    'Which ads should I reduce?', 'Which affiliate should I contact?', 'kompetitor harga berubah?',
    'stok habis?', 'keluhan pelanggan?', 'hari ini apa prioritas?'
  ]
  for (const q of queries) {
    const r = CommandParser.parse(q)
    assert(r.confidence > 0, `Query "${q}" should have confidence > 0, got ${r.confidence} (intent: ${r.intent})`)
  }
})

console.log(`\n=================================`)
console.log(`Phase 17 Test Results:`)
console.log(`  ✅ Passed: ${passed}`)
console.log(`  ❌ Failed: ${failed}`)
console.log(`  Total: ${passed + failed}`)
console.log(`=================================\n`)
process.exit(failed > 0 ? 1 : 0)
