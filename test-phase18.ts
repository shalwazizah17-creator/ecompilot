import * as fs from 'fs'

let passed = 0; let failed = 0

function test(name: string, fn: () => void) {
  try { fn(); console.log(`  ✅ PASS: ${name}`); passed++ }
  catch (e: any) { console.log(`  ❌ FAIL: ${name} — ${e.message}`); failed++ }
}

function assert(c: boolean, msg: string) { if (!c) throw new Error(msg) }

console.log('\n===== PHASE 18: PWA PRODUCTIZATION =====\n')

test('manifest.json exists', () => {
  assert(fs.existsSync('public/manifest.json'), 'manifest.json not found')
})

test('manifest.json has required fields', () => {
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf-8'))
  assert(manifest.name === 'EcomPilot', `name should be EcomPilot, got ${manifest.name}`)
  assert(manifest.display === 'standalone', `display should be standalone, got ${manifest.display}`)
  assert(manifest.start_url === '/', `start_url should be /, got ${manifest.start_url}`)
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'Should have at least 2 icons')
})

test('service worker file exists', () => {
  assert(fs.existsSync('public/sw.js'), 'sw.js not found')
})

test('service worker has install, activate, fetch handlers', () => {
  const sw = fs.readFileSync('public/sw.js', 'utf-8')
  assert(sw.includes("addEventListener('install'"), 'Missing install handler')
  assert(sw.includes("addEventListener('activate'"), 'Missing activate handler')
  assert(sw.includes("addEventListener('fetch'"), 'Missing fetch handler')
})

test('layout.tsx has PWA viewport export', () => {
  const layout = fs.readFileSync('src/app/layout.tsx', 'utf-8')
  assert(layout.includes('export const viewport'), 'Missing viewport export')
  assert(layout.includes('themeColor'), 'Missing themeColor')
})

test('layout.tsx registers service worker', () => {
  const layout = fs.readFileSync('src/app/layout.tsx', 'utf-8')
  assert(layout.includes("serviceWorker.register('/sw.js')"), 'Missing SW registration')
})

test('layout.tsx has apple-touch-icon links', () => {
  const layout = fs.readFileSync('src/app/layout.tsx', 'utf-8')
  assert(layout.includes('apple-touch-icon'), 'Missing apple-touch-icon')
})

test('layout.tsx has apple-mobile-web-app-capable meta', () => {
  const layout = fs.readFileSync('src/app/layout.tsx', 'utf-8')
  assert(layout.includes('apple-mobile-web-app-capable'), 'Missing apple-mobile-web-app-capable')
})

test('Sidebar has all Phase 13-16 navigation items', () => {
  const sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8')
  assert(sidebar.includes('/margin-protection'), 'Missing margin-protection link')
  assert(sidebar.includes('/competitors'), 'Missing competitors link')
  assert(sidebar.includes('/inventory-intelligence'), 'Missing inventory-intelligence link')
  assert(sidebar.includes('/customer-intelligence'), 'Missing customer-intelligence link')
})

test('All Phase 13-16 page files exist', () => {
  const pages = [
    'src/app/(dashboard)/margin-protection/page.tsx',
    'src/app/(dashboard)/competitors/page.tsx',
    'src/app/(dashboard)/inventory-intelligence/page.tsx',
    'src/app/(dashboard)/customer-intelligence/page.tsx',
  ]
  for (const p of pages) {
    assert(fs.existsSync(p), `Missing page: ${p}`)
  }
})

test('All Phase 13-16 API route files exist', () => {
  const routes = [
    'src/app/api/margin/analysis/route.ts',
    'src/app/api/margin/recommendations/route.ts',
    'src/app/api/margin/rules/route.ts',
    'src/app/api/competitors/route.ts',
    'src/app/api/inventory/route.ts',
    'src/app/api/customer-intelligence/route.ts',
  ]
  for (const r of routes) {
    assert(fs.existsSync(r), `Missing route: ${r}`)
  }
})

test('No { prisma } named imports in new routes (must use default)', () => {
  const routeFiles = [
    'src/app/api/margin/analysis/route.ts',
    'src/app/api/margin/rules/route.ts',
    'src/app/api/competitors/route.ts',
    'src/app/api/inventory/route.ts',
    'src/app/api/customer-intelligence/route.ts',
  ]
  for (const f of routeFiles) {
    const content = fs.readFileSync(f, 'utf-8')
    assert(!content.includes("import { prisma }"), `File ${f} still uses named prisma import`)
  }
})

test('MarginSimulator.tsx exists and is a client component', () => {
  const content = fs.readFileSync('src/components/MarginSimulator.tsx', 'utf-8')
  assert(content.includes("'use client'"), 'MarginSimulator must be a client component')
  assert(content.includes('marginPercent'), 'Must use marginPercent')
})

console.log(`\n=================================`)
console.log(`Phase 18 Test Results:`)
console.log(`  ✅ Passed: ${passed}`)
console.log(`  ❌ Failed: ${failed}`)
console.log(`  Total: ${passed + failed}`)
console.log(`=================================\n`)
process.exit(failed > 0 ? 1 : 0)
