import { ConnectionStatus, EcommerceProvider, SyncParams, SyncResult } from './provider-types'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

export abstract class BaseProvider implements EcommerceProvider {
  protected providerName: string

  constructor(providerName: string) {
    this.providerName = providerName
  }

  protected async getCredentials(credentialId: string) {
    const cred = await prisma.integrationCredential.findUnique({
      where: { id: credentialId }
    })
    
    if (!cred) throw new Error('Credential not found')

    return {
      accessToken: decrypt(cred.access_token_encrypted),
      refreshToken: cred.refresh_token_encrypted ? decrypt(cred.refresh_token_encrypted) : null,
      externalAccountId: cred.external_account_id,
      expiresAt: cred.token_expires_at
    }
  }

  protected generateNotSupported(): SyncResult {
    return {
      status: 'NOT_SUPPORTED',
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      recordsFailed: 0
    }
  }

  abstract testConnection(brandId: string, credentialId: string): Promise<ConnectionStatus>
  abstract disconnect(credentialId: string): Promise<void>
  
  async syncOrders(params: SyncParams): Promise<SyncResult> {
    return this.generateNotSupported()
  }

  async syncProducts(params: SyncParams): Promise<SyncResult> {
    return this.generateNotSupported()
  }

  async syncAds(params: SyncParams): Promise<SyncResult> {
    return this.generateNotSupported()
  }

  async syncAffiliates(params: SyncParams): Promise<SyncResult> {
    return this.generateNotSupported()
  }
}
