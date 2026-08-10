import Papa from 'papaparse';
import prisma from './prisma';

export interface ColumnMapping {
  date: string;
  external_campaign_id?: string;
  campaign_name?: string;
  external_ad_set_id?: string;
  ad_set_name?: string;
  external_ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  sales?: string; // GMV
  orders?: string;
  purchases?: string;
  attributed_revenue?: string;

  // Phase 6 Affiliate Expansion
  affiliate_name?: string;
  external_affiliate_id?: string;
  commission?: string;
  cvr?: string;
}

export const ALLOWED_SOURCE_TYPES = [
  'MARKETPLACE_SALES',
  'AD_PERFORMANCE',
  'META_CAMPAIGN',
  'META_AD_SET',
  'META_AD',
  'AFFILIATE_PERFORMANCE',
  'AFFILIATE_ORDERS'
] as const;

export type SourceType = typeof ALLOWED_SOURCE_TYPES[number];

interface ParsedRowData {
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  sales: number;
  orders: number;
  purchases: number;
  attributed_revenue: number;
  externalCampaignId: string | null;
  campaignName: string | null;
  externalAdSetId: string | null;
  adSetName: string | null;
  externalAdId: string | null;
  adName: string | null;

  affiliateName: string | null;
  externalAffiliateId: string | null;
  commission: number;
  cvr: number;
}

function processRow(row: any, mapping: ColumnMapping): ParsedRowData | null {
  const dateRaw = row[mapping.date];
  if (!dateRaw) return null;

  const date = new Date(dateRaw);
  if (isNaN(date.getTime())) return null;

  return {
    date,
    spend: mapping.spend ? parseFloat(row[mapping.spend]) || 0 : 0,
    impressions: mapping.impressions ? parseInt(row[mapping.impressions], 10) || 0 : 0,
    clicks: mapping.clicks ? parseInt(row[mapping.clicks], 10) || 0 : 0,
    sales: mapping.sales ? parseFloat(row[mapping.sales]) || 0 : 0,
    orders: mapping.orders ? parseInt(row[mapping.orders], 10) || 0 : 0,
    purchases: mapping.purchases ? parseInt(row[mapping.purchases], 10) || 0 : 0,
    attributed_revenue: mapping.attributed_revenue ? parseFloat(row[mapping.attributed_revenue]) || 0 : 0,
    externalCampaignId: mapping.external_campaign_id ? row[mapping.external_campaign_id] : null,
    campaignName: mapping.campaign_name ? row[mapping.campaign_name] : null,
    externalAdSetId: mapping.external_ad_set_id ? row[mapping.external_ad_set_id] : null,
    adSetName: mapping.ad_set_name ? row[mapping.ad_set_name] : null,
    externalAdId: mapping.external_ad_id ? row[mapping.external_ad_id] : null,
    adName: mapping.ad_name ? row[mapping.ad_name] : null,
    affiliateName: mapping.affiliate_name ? row[mapping.affiliate_name] : null,
    externalAffiliateId: mapping.external_affiliate_id ? row[mapping.external_affiliate_id] : null,
    commission: mapping.commission ? parseFloat(row[mapping.commission]) || 0 : 0,
    cvr: mapping.cvr ? parseFloat(row[mapping.cvr]) || 0 : 0,
  }
}

export async function validateAndCheckDuplicates(
  fileContent: string,
  brandId: string,
  platformId: string,
  sourceType: SourceType,
  mapping: ColumnMapping
) {
  if (!ALLOWED_SOURCE_TYPES.includes(sourceType)) {
    throw new Error(`Invalid source type: ${sourceType}`);
  }

  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          let validRows = 0;
          let invalidRows = 0;
          let duplicateRows = 0;

          const parsedRows: ParsedRowData[] = [];

          for (const row of data) {
            const parsed = processRow(row, mapping);
            if (!parsed) {
              invalidRows++;
              continue;
            }
            validRows++;
            parsedRows.push(parsed);
          }

          if (parsedRows.length === 0) {
            return resolve({ totalRows: data.length, validRows, invalidRows, duplicateRows });
          }

          const dateStart = new Date(Math.min(...parsedRows.map(r => r.date.getTime())));
          const dateEnd = new Date(Math.max(...parsedRows.map(r => r.date.getTime())));

          // Fetch existing dates for this brand, platform, and source type
          const existingMetrics = await prisma.dailyMetric.findMany({
            where: {
              brand_id: brandId,
              platform_id: platformId,
              source_type: sourceType,
              date: { gte: dateStart, lte: dateEnd }
            },
            include: {
              campaign: { select: { external_id: true, name: true } },
              ad_set: { select: { external_id: true, name: true } },
              ad: { select: { external_id: true, name: true } }
            }
          });

          // Accurate duplicate check using external ID or name resolution
          for (const pr of parsedRows) {
            const hasDupe = existingMetrics.some(em => {
              if (em.date.getTime() !== pr.date.getTime()) return false;
              
              // Validate Campaign Level Identity
              if (pr.externalCampaignId || pr.campaignName) {
                if (!em.campaign) return false;
                const matchExternal = pr.externalCampaignId && em.campaign.external_id === pr.externalCampaignId;
                const matchName = !pr.externalCampaignId && pr.campaignName && em.campaign.name === pr.campaignName;
                if (!matchExternal && !matchName) return false;
              }
              
              // Validate AdSet Level Identity
              if (pr.externalAdSetId || pr.adSetName) {
                if (!em.ad_set) return false;
                const matchExternal = pr.externalAdSetId && em.ad_set.external_id === pr.externalAdSetId;
                const matchName = !pr.externalAdSetId && pr.adSetName && em.ad_set.name === pr.adSetName;
                if (!matchExternal && !matchName) return false;
              }
              
              // Validate Ad Level Identity
              if (pr.externalAdId || pr.adName) {
                if (!em.ad) return false;
                const matchExternal = pr.externalAdId && em.ad.external_id === pr.externalAdId;
                const matchName = !pr.externalAdId && pr.adName && em.ad.name === pr.adName;
                if (!matchExternal && !matchName) return false;
              }

              return true;
            });

            if (hasDupe) {
              duplicateRows++;
            }
          }

          resolve({
            totalRows: data.length,
            validRows,
            invalidRows,
            duplicateRows
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error: any) => reject(error)
    });
  });
}

export async function importData(
  fileContent: string,
  brandId: string,
  platformId: string,
  sourceType: SourceType,
  mapping: ColumnMapping,
  duplicateStrategy: 'SKIP' | 'REPLACE'
) {
  if (!ALLOWED_SOURCE_TYPES.includes(sourceType)) {
    throw new Error(`Invalid source type: ${sourceType}`);
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

          // Local entity resolution caches
          const campaignCache = new Map<string, string>();
          const adSetCache = new Map<string, string>();
          const adCache = new Map<string, string>();

          for (const row of data) {
            const parsed = processRow(row, mapping);
            if (!parsed) {
              invalidRows++;
              continue;
            }

            // 1. Resolve Campaign
            let campaignId = null;
            if (parsed.externalCampaignId || parsed.campaignName) {
              const cacheKey = parsed.externalCampaignId || parsed.campaignName!;
              if (campaignCache.has(cacheKey)) {
                campaignId = campaignCache.get(cacheKey);
              } else {
                let campaign = null;
                
                if (parsed.externalCampaignId) {
                  campaign = await prisma.campaign.findFirst({ where: { brand_id: brandId, platform_id: platformId, external_id: parsed.externalCampaignId } });
                }
                
                if (!campaign && parsed.campaignName && !parsed.externalCampaignId) {
                  campaign = await prisma.campaign.findFirst({ where: { brand_id: brandId, platform_id: platformId, name: parsed.campaignName } });
                }

                if (!campaign) {
                  campaign = await prisma.campaign.create({
                    data: {
                      brand_id: brandId,
                      platform_id: platformId,
                      external_id: parsed.externalCampaignId || null,
                      name: parsed.campaignName || parsed.externalCampaignId || 'Unnamed Campaign',
                      type: 'IMPORTED',
                      status: 'ACTIVE'
                    }
                  });
                }
                campaignCache.set(cacheKey, campaign.id);
                campaignId = campaign.id;
              }
            }

            // 2. Resolve Ad Set
            let adSetId = null;
            if (campaignId && (parsed.externalAdSetId || parsed.adSetName)) {
              const cacheKey = parsed.externalAdSetId || parsed.adSetName!;
              if (adSetCache.has(cacheKey)) {
                adSetId = adSetCache.get(cacheKey);
              } else {
                let adSet = null;
                if (parsed.externalAdSetId) {
                  adSet = await prisma.adSet.findFirst({ where: { campaign: { brand_id: brandId }, external_id: parsed.externalAdSetId } });
                }
                if (!adSet && parsed.adSetName && !parsed.externalAdSetId) {
                  adSet = await prisma.adSet.findFirst({ where: { campaign_id: campaignId, name: parsed.adSetName } });
                }
                if (!adSet) {
                  adSet = await prisma.adSet.create({
                    data: {
                      campaign_id: campaignId,
                      external_id: parsed.externalAdSetId || null,
                      name: parsed.adSetName || parsed.externalAdSetId || 'Unnamed Ad Set'
                    }
                  });
                }
                adSetCache.set(cacheKey, adSet.id);
                adSetId = adSet.id;
              }
            }

            // 3. Resolve Ad
            let adId = null;
            if (adSetId && (parsed.externalAdId || parsed.adName)) {
              const cacheKey = parsed.externalAdId || parsed.adName!;
              if (adCache.has(cacheKey)) {
                adId = adCache.get(cacheKey);
              } else {
                let ad = null;
                if (parsed.externalAdId) {
                  ad = await prisma.ad.findFirst({ where: { ad_set: { campaign: { brand_id: brandId } }, external_id: parsed.externalAdId } });
                }
                if (!ad && parsed.adName && !parsed.externalAdId) {
                  ad = await prisma.ad.findFirst({ where: { ad_set_id: adSetId, name: parsed.adName } });
                }
                if (!ad) {
                  ad = await prisma.ad.create({
                    data: {
                      ad_set_id: adSetId,
                      external_id: parsed.externalAdId || null,
                      name: parsed.adName || parsed.externalAdId || 'Unnamed Ad'
                    }
                  });
                }
                adCache.set(cacheKey, ad.id);
                adId = ad.id;
              }
            }

            // 4. Find if Duplicate Metric Exists
            const existing = await prisma.dailyMetric.findFirst({
              where: {
                brand_id: brandId,
                platform_id: platformId,
                source_type: sourceType,
                date: parsed.date,
                campaign_id: campaignId,
                ad_set_id: adSetId,
                ad_id: adId
              }
            });

            if (existing) {
              if (duplicateStrategy === 'SKIP') {
                skippedCount++;
                continue;
              } else {
                // REPLACE inside a transaction block
                operations.push(
                  prisma.dailyMetric.update({
                    where: { id: existing.id },
                    data: {
                      spend: parsed.spend,
                      impressions: parsed.impressions,
                      clicks: parsed.clicks,
                      sales: parsed.sales,
                      orders: parsed.orders,
                      purchases: parsed.purchases,
                      attributed_revenue: parsed.attributed_revenue
                    }
                  })
                );
                updatedCount++;
                continue;
              }
            }

            // CREATE NEW
            operations.push(
              prisma.dailyMetric.create({
                data: {
                  brand_id: brandId,
                  platform_id: platformId,
                  source_type: sourceType,
                  date: parsed.date,
                  campaign_id: campaignId,
                  ad_set_id: adSetId,
                  ad_id: adId,
                  spend: parsed.spend,
                  impressions: parsed.impressions,
                  clicks: parsed.clicks,
                  sales: parsed.sales,
                  orders: parsed.orders,
                  purchases: parsed.purchases,
                  attributed_revenue: parsed.attributed_revenue
                }
              })
            );
            importedCount++;
          }

          // Execute all metric operations atomically
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
        } catch (error) {
          reject(error);
        }
      },
      error: (error: any) => reject(error)
    });
  });
}
