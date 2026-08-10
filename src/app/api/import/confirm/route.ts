import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { brandId, platformId, reportType, rows, duplicateAction, savedMappings } = await request.json()

    if (!brandId || !platformId || !reportType) {
      return NextResponse.json({ error: 'Missing required routing parameters' }, { status: 400 })
    }

    // Process mapping memory saves
    if (savedMappings && savedMappings.length > 0) {
      for (const m of savedMappings) {
        await prisma.importMappingMemory.upsert({
          where: {
            brand_id_platform_id_report_type_source_column: {
              brand_id: brandId,
              platform_id: platformId,
              report_type: reportType,
              source_column: m.source
            }
          },
          update: { mapped_field: m.target },
          create: {
            brand_id: brandId,
            platform_id: platformId,
            report_type: reportType,
            source_column: m.source,
            mapped_field: m.target
          }
        })
      }
    }

    // Deduplication Engine (Skip/Replace using Interactive Transaction)
    let processed = 0
    let created = 0
    let updated = 0
    let skipped = 0

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        processed++
        const rowDate = new Date(row.date)

        if (reportType.includes('SALES')) {
          const externalId = row.order_id || `${brandId}-${platformId}-${rowDate.getTime()}-${Math.random()}`
          
          const existing = await tx.dailyMetric.findFirst({
            where: { brand_id: brandId, platform_id: platformId, date: rowDate } // simplified identity logic for DailyMetric
          })

          if (existing) {
            if (duplicateAction === 'SKIP') {
              skipped++
              continue
            } else {
              await tx.dailyMetric.update({
                where: { id: existing.id },
                data: {
                  sales: (Number(existing.sales) || 0) + (Number(row.sales) || 0),
                  orders: (existing.orders || 0) + (Number(row.orders) || 0)
                }
              })
              updated++
            }
          } else {
            await tx.dailyMetric.create({
              data: {
                brand_id: brandId,
                platform_id: platformId,
                date: rowDate,
                sales: Number(row.sales) || 0,
                orders: Number(row.orders) || 0
              }
            })
            created++
          }
        } else if (reportType.includes('AFFILIATE')) {
          // Identify Affiliate
          let affiliate = await tx.affiliate.findFirst({
            where: { brand_id: brandId, platform_id: platformId, external_id: row.affiliate_id || row.username || 'UNKNOWN' }
          })
          if (!affiliate) {
            affiliate = await tx.affiliate.create({
              data: {
                brand_id: brandId,
                platform_id: platformId,
                external_id: row.affiliate_id || row.username || 'UNKNOWN',
                username: row.username,
                display_name: row.affiliate_name
              }
            })
          }

          const existingMetric = await tx.affiliateMetric.findFirst({
            where: { brand_id: brandId, platform_id: platformId, affiliate_id: affiliate.id, date: rowDate }
          })

          if (existingMetric) {
            if (duplicateAction === 'SKIP') {
              skipped++
            } else {
              await tx.affiliateMetric.update({
                where: { id: existingMetric.id },
                data: {
                  sales: (existingMetric.sales || 0) + (Number(row.sales) || 0),
                  orders: (existingMetric.orders || 0) + (Number(row.orders) || 0),
                  commission: (existingMetric.commission || 0) + (Number(row.commission) || 0),
                  clicks: (existingMetric.clicks || 0) + (Number(row.clicks) || 0)
                }
              })
              updated++
            }
          } else {
            await tx.affiliateMetric.create({
              data: {
                brand_id: brandId,
                platform_id: platformId,
                affiliate_id: affiliate.id,
                date: rowDate,
                sales: Number(row.sales) || 0,
                orders: Number(row.orders) || 0,
                commission: Number(row.commission) || 0,
                clicks: Number(row.clicks) || 0,
                source_type: 'AFFILIATE_PERFORMANCE'
              }
            })
            created++
          }
        }
      }
    }, {
      maxWait: 15000,
      timeout: 30000
    })

    return NextResponse.json({
      success: true,
      summary: { processed, created, updated, skipped }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
