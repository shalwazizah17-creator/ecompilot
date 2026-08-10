export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'SYNCING' | 'ERROR' | 'EXPIRED' | 'CONNECTION_REQUIRED'

export interface SyncResult {
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'NOT_SUPPORTED'
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsSkipped: number
  recordsFailed: number
  errors?: string[]
}

export interface SyncParams {
  brandId: string
  dataSourceId: string
  startDate?: Date
  endDate?: Date
  isIncremental: boolean
}

export interface EcommerceProvider {
  /** Tests token validity and remote accessibility */
  testConnection(brandId: string, credentialId: string): Promise<ConnectionStatus>
  
  /** OAuth disconnect or internal revoke */
  disconnect(credentialId: string): Promise<void>
  
  /** Ingestion capabilities */
  syncOrders(params: SyncParams): Promise<SyncResult>
  syncProducts(params: SyncParams): Promise<SyncResult>
  syncAds(params: SyncParams): Promise<SyncResult>
  syncAffiliates(params: SyncParams): Promise<SyncResult>
}
