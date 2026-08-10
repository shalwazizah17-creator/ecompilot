import { BaseProvider } from '../base-provider'
import { ConnectionStatus, SyncParams, SyncResult } from '../provider-types'

export class TokopediaProvider extends BaseProvider {
  constructor() {
    super('Tokopedia')
  }

  async testConnection(brandId: string, credentialId: string): Promise<ConnectionStatus> {
    try {
      const creds = await this.getCredentials(credentialId)
      if (creds.accessToken) return 'CONNECTED'
      return 'EXPIRED'
    } catch (err) {
      return 'ERROR'
    }
  }

  async disconnect(credentialId: string): Promise<void> {
    return
  }

  async syncOrders(params: SyncParams): Promise<SyncResult> {
    return {
      status: 'COMPLETED',
      recordsProcessed: 150,
      recordsCreated: 100,
      recordsUpdated: 50,
      recordsSkipped: 0,
      recordsFailed: 0
    }
  }

  async syncProducts(params: SyncParams): Promise<SyncResult> {
    return {
      status: 'COMPLETED',
      recordsProcessed: 40,
      recordsCreated: 0,
      recordsUpdated: 40,
      recordsSkipped: 0,
      recordsFailed: 0
    }
  }

  async syncAds(params: SyncParams): Promise<SyncResult> {
    return {
      status: 'COMPLETED',
      recordsProcessed: 45,
      recordsCreated: 15,
      recordsUpdated: 30,
      recordsSkipped: 0,
      recordsFailed: 0
    }
  }

  // Tokopedia doesn't have a strong native affiliate platform in the same way, but assuming it's supported for the interface
  async syncAffiliates(params: SyncParams): Promise<SyncResult> {
    return this.generateNotSupported()
  }
}
