import { validateAndCheckDuplicates, importData, SourceType } from './src/lib/csv-parser'
import prisma from './src/lib/prisma'

const csvContent = `Date,Total Sales,Ad Spend,Orders
2024-08-01,1000000,50000,5
2024-08-02,1500000,75000,8
2024-08-03,2000000,100000,10`

const mapping = {
  date: 'Date',
  sales: 'Total Sales',
  spend: 'Ad Spend',
  orders: 'Orders'
}

async function runTest() {
  console.log('--- STARTING CSV DEDUPLICATION TEST ---')
  
  // Create dummy brand and platform if needed
  let brand = await prisma.brand.findFirst()
  if (!brand) brand = await prisma.brand.create({ data: { name: 'Test Brand' } })
  
  let platform = await prisma.platform.findFirst({ where: { name: 'Shopee' } })
  if (!platform) platform = await prisma.platform.create({ data: { name: 'Shopee', is_marketplace: true } })

  const brandId = brand.id
  const platformId = platform.id
  const sourceType: SourceType = 'MARKETPLACE_SALES'

  // Clear existing metrics for clean test
  await prisma.dailyMetric.deleteMany({})

  console.log('1. First Import')
  const val1: any = await validateAndCheckDuplicates(csvContent, brandId, platformId, sourceType, mapping)
  console.log(`Validation 1: Total: ${val1.totalRows}, Valid: ${val1.validRows}, Duplicates: ${val1.duplicateRows}`)
  
  const imp1: any = await importData(csvContent, brandId, platformId, sourceType, mapping, 'SKIP')
  console.log(`Import 1: Imported: ${imp1.importedCount}, Skipped: ${imp1.skippedCount}, Updated: ${imp1.updatedCount}`)

  console.log('\n2. Second Import (Testing SKIP)')
  const val2: any = await validateAndCheckDuplicates(csvContent, brandId, platformId, sourceType, mapping)
  console.log(`Validation 2: Total: ${val2.totalRows}, Valid: ${val2.validRows}, Duplicates: ${val2.duplicateRows}`)
  if (val2.duplicateRows !== val2.validRows) throw new Error('Duplicate count mismatch!')

  const imp2: any = await importData(csvContent, brandId, platformId, sourceType, mapping, 'SKIP')
  console.log(`Import 2 (SKIP): Imported: ${imp2.importedCount}, Skipped: ${imp2.skippedCount}, Updated: ${imp2.updatedCount}`)
  if (imp2.skippedCount !== val2.validRows) throw new Error('Failed to skip duplicates!')

  console.log('\n3. Third Import (Testing REPLACE)')
  const imp3: any = await importData(csvContent, brandId, platformId, sourceType, mapping, 'REPLACE')
  console.log(`Import 3 (REPLACE): Imported: ${imp3.importedCount}, Skipped: ${imp3.skippedCount}, Updated: ${imp3.updatedCount}`)
  if (imp3.updatedCount !== val2.validRows) throw new Error('Failed to replace duplicates!')

  const finalCount = await prisma.dailyMetric.count()
  console.log(`\nFinal Database Record Count: ${finalCount} (Should be 3)`)
  if (finalCount !== 3) throw new Error('Database contains duplicate rows despite deduplication logic!')

  console.log('--- TEST PASSED ---')
}

runTest().catch(console.error).finally(() => process.exit(0))
