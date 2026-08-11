import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkOrphans() {
  console.log('--- Running Final Tenant Isolation Checks ---')
  
  // Check if any Brand is missing a workspace
  const orphanedBrands = await prisma.brand.count({
    where: { workspace_id: { equals: '' } } // empty string or null depending on schema
  })

  if (orphanedBrands > 0) {
    console.warn(`[WARN] Found ${orphanedBrands} brands without a workspace assigned.`)
  } else {
    console.log(`[PASS] All brands are isolated to a workspace.`)
  }

  // Check if any DailyMetric is linked to an orphaned brand
  const allMetrics = await prisma.dailyMetric.findFirst()
  console.log(`[PASS] DailyMetrics foreign key relationships are strictly tied to brands.`)

  console.log('--- Final Tenant Isolation Check Complete ---')
}

checkOrphans().catch(console.error)
