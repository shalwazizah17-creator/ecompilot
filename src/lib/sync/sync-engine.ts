import prisma from '@/lib/prisma'
import { MetaProvider } from '../integrations/meta/provider'
import { ShopeeProvider } from '../integrations/shopee/provider'
import { TikTokProvider } from '../integrations/tiktok/provider'
import { TokopediaProvider } from '../integrations/tokopedia/provider'
import { EcommerceProvider, SyncParams, SyncResult } from '../integrations/provider-types'

export class SyncEngine {
  
  private getProvider(platformName: string): EcommerceProvider {
    const name = platformName.toLowerCase()
    if (name.includes('meta')) return new MetaProvider()
    if (name.includes('shopee')) return new ShopeeProvider()
    if (name.includes('tiktok')) return new TikTokProvider()
    if (name.includes('tokopedia')) return new TokopediaProvider()
    throw new Error(`No provider found for ${platformName}`)
  }

  async runSync(
    dataSourceId: string, 
    type: 'INCREMENTAL' | 'FULL' | 'MANUAL', 
    operation: () => Promise<any>
  ) {
    // Legacy fallback for CSV operations
    const ds = await prisma.dataSource.findUnique({ where: { id: dataSourceId } })
    if (!ds) throw new Error('Data Source not found')
      
    const job = await prisma.syncJob.create({
      data: {
        data_source_id: ds.id,
        brand_id: ds.brand_id,
        platform_id: ds.platform_id,
        source_type: ds.source_type,
        type,
        status: 'RUNNING',
        sync_start: new Date()
      }
    })

    try {
      const result = await operation()
      
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completed_at: new Date(),
          sync_end: new Date(),
          records_processed: result.recordsProcessed || 0,
          records_created: result.recordsCreated || 0,
          records_updated: result.recordsUpdated || 0,
          records_skipped: result.recordsSkipped || 0,
          records_failed: result.recordsFailed || 0
        }
      })

      await prisma.dataSource.update({
        where: { id: ds.id },
        data: { 
          last_sync: new Date(),
          last_successful_sync_at: new Date()
        }
      })

      await prisma.auditLog.create({
        data: {
          brand_id: ds.brand_id,
          platform_id: ds.platform_id,
          action: `SYNC_${type}_SUCCESS`,
          status: 'SUCCESS',
          metadata: JSON.stringify(result)
        }
      })

      return result
    } catch (err: any) {
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          completed_at: new Date(),
          sync_end: new Date(),
          errors: err.message || 'Unknown error',
          error_message: err.message
        }
      })

      await prisma.dataSource.update({
        where: { id: ds.id },
        data: { 
          error_message: err.message
        }
      })

      await prisma.auditLog.create({
        data: {
          brand_id: ds.brand_id,
          platform_id: ds.platform_id,
          action: `SYNC_${type}_FAILED`,
          status: 'FAILURE',
          metadata: err.message
        }
      })

      throw err
    }
  }

  async runProviderSync(brandId: string, platformId: string) {
    const platform = await prisma.platform.findUnique({ where: { id: platformId } })
    if (!platform) throw new Error('Platform not found')

    const ds = await prisma.dataSource.findFirst({
      where: { brand_id: brandId, platform_id: platformId }
    })
    
    if (!ds) throw new Error('DataSource not found')

    const provider = this.getProvider(platform.name)
    
    const params: SyncParams = {
      brandId,
      dataSourceId: ds.id,
      isIncremental: !!ds.last_successful_sync_at,
      startDate: ds.last_successful_sync_at || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days if fresh
    }

    return this.runSync(ds.id, params.isIncremental ? 'INCREMENTAL' : 'FULL', async () => {
      // In production, we execute in parallel and aggregate results
      const resOrders = await provider.syncOrders(params)
      const resAds = await provider.syncAds(params)
      const resProducts = await provider.syncProducts(params)
      const resAffiliates = await provider.syncAffiliates(params)

      const aggr = {
        recordsProcessed: resOrders.recordsProcessed + resAds.recordsProcessed + resProducts.recordsProcessed + resAffiliates.recordsProcessed,
        recordsCreated: resOrders.recordsCreated + resAds.recordsCreated + resProducts.recordsCreated + resAffiliates.recordsCreated,
        recordsUpdated: resOrders.recordsUpdated + resAds.recordsUpdated + resProducts.recordsUpdated + resAffiliates.recordsUpdated,
        recordsSkipped: resOrders.recordsSkipped + resAds.recordsSkipped + resProducts.recordsSkipped + resAffiliates.recordsSkipped,
        recordsFailed: resOrders.recordsFailed + resAds.recordsFailed + resProducts.recordsFailed + resAffiliates.recordsFailed,
      }
      return aggr
    })
  }
}

export const syncEngine = new SyncEngine()
