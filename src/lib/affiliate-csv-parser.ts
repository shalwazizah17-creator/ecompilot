import Papa from 'papaparse';
import prisma from './prisma';
import { ColumnMapping, SourceType, ALLOWED_SOURCE_TYPES } from './csv-parser';

interface ParsedAffiliateRow {
  date: Date;
  affiliateName: string | null;
  externalAffiliateId: string | null;
  sales: number;
  orders: number;
  clicks: number;
  commission: number;
  cvr: number;
}

function processAffiliateRow(row: any, mapping: ColumnMapping): ParsedAffiliateRow | null {
  const dateRaw = row[mapping.date];
  if (!dateRaw) return null;

  const date = new Date(dateRaw);
  if (isNaN(date.getTime())) return null;

  return {
    date,
    affiliateName: mapping.affiliate_name ? row[mapping.affiliate_name] : null,
    externalAffiliateId: mapping.external_affiliate_id ? row[mapping.external_affiliate_id] : null,
    sales: mapping.sales ? parseFloat(row[mapping.sales]) || 0 : 0,
    orders: mapping.orders ? parseInt(row[mapping.orders], 10) || 0 : 0,
    clicks: mapping.clicks ? parseInt(row[mapping.clicks], 10) || 0 : 0,
    commission: mapping.commission ? parseFloat(row[mapping.commission]) || 0 : 0,
    cvr: mapping.cvr ? parseFloat(row[mapping.cvr]) || 0 : 0,
  }
}

export async function importAffiliateData(
  fileContent: string,
  brandId: string,
  platformId: string,
  sourceType: SourceType,
  mapping: ColumnMapping,
  duplicateStrategy: 'SKIP' | 'REPLACE'
) {
  if (!sourceType.startsWith('AFFILIATE_')) {
    throw new Error(`Invalid affiliate source type: ${sourceType}`);
  }

  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          let importedCount = 0;
          let skippedCount = 0;
          let updatedCount = 0;
          let invalidRows = 0;

          const operations = [];
          const affiliateCache = new Map<string, string>();
          const processedMetrics = new Set<string>(); // Tracks duplicates within the same batch

          for (const row of data) {
            const parsed = processAffiliateRow(row, mapping);
            if (!parsed) {
              invalidRows++;
              continue;
            }

            // Must have some identifier
            if (!parsed.affiliateName && !parsed.externalAffiliateId) {
              invalidRows++;
              continue;
            }

            const cacheKey = parsed.externalAffiliateId || parsed.affiliateName!;
            let affiliateId = null;
            
            if (affiliateCache.has(cacheKey)) {
              affiliateId = affiliateCache.get(cacheKey);
            } else {
              let affiliate = null;
              
              if (parsed.externalAffiliateId) {
                affiliate = await prisma.affiliate.findFirst({
                  where: { brand_id: brandId, platform_id: platformId, external_id: parsed.externalAffiliateId }
                });
              }

              if (!affiliate && parsed.affiliateName && !parsed.externalAffiliateId) {
                // For fuzzy matching by name if no external ID
                const potentialExtId = parsed.affiliateName.toLowerCase().replace(/\s+/g, '_');
                affiliate = await prisma.affiliate.findFirst({
                  where: { brand_id: brandId, platform_id: platformId, username: parsed.affiliateName }
                });
              }

              if (!affiliate) {
                const generatedExtId = parsed.externalAffiliateId || parsed.affiliateName!.toLowerCase().replace(/\s+/g, '_');
                affiliate = await prisma.affiliate.create({
                  data: {
                    brand_id: brandId,
                    platform_id: platformId,
                    external_id: generatedExtId,
                    username: parsed.affiliateName || generatedExtId,
                    display_name: parsed.affiliateName || generatedExtId,
                    status: 'ACTIVE'
                  }
                });
              }
              
              affiliateCache.set(cacheKey, affiliate.id);
              affiliateId = affiliate.id;
            }

            if (!affiliateId) continue;

            const batchKey = `${affiliateId}_${parsed.date.toISOString()}`;
            if (processedMetrics.has(batchKey)) {
              if (duplicateStrategy === 'SKIP') {
                skippedCount++;
                continue;
              }
              // If REPLACE, we would need to merge or overwrite in the operations array.
              // For simplicity, we just skip it in the same batch.
            }
            
            processedMetrics.add(batchKey);

            const existing = await prisma.affiliateMetric.findFirst({
              where: {
                brand_id: brandId,
                platform_id: platformId,
                affiliate_id: affiliateId,
                date: parsed.date,
                source_type: sourceType
              }
            });

            if (existing) {
              if (duplicateStrategy === 'SKIP') {
                skippedCount++;
                continue;
              } else {
                operations.push(
                  prisma.affiliateMetric.update({
                    where: { id: existing.id },
                    data: {
                      sales: parsed.sales,
                      orders: parsed.orders,
                      clicks: parsed.clicks,
                      commission: parsed.commission,
                      commission_pct: parsed.sales > 0 ? (parsed.commission / parsed.sales) * 100 : 0
                    }
                  })
                );
                updatedCount++;
                continue;
              }
            }

            operations.push(
              prisma.affiliateMetric.create({
                data: {
                  brand_id: brandId,
                  platform_id: platformId,
                  affiliate_id: affiliateId,
                  date: parsed.date,
                  source_type: sourceType,
                  sales: parsed.sales,
                  orders: parsed.orders,
                  clicks: parsed.clicks,
                  commission: parsed.commission,
                  commission_pct: parsed.sales > 0 ? (parsed.commission / parsed.sales) * 100 : 0
                }
              })
            );
            importedCount++;
          }

          if (operations.length > 0) {
            await prisma.$transaction(operations);
          }

          resolve({ 
            success: true, 
            importedCount, 
            skippedCount, 
            updatedCount,
            invalidRows
          });
        } catch (error: any) {
          reject(error);
        }
      },
      error: (error: any) => reject(error)
    });
  });
}
