import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const encodedState = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/data-sources?error=oauth_denied`, request.url))
  }

  if (!code || !encodedState) {
    return NextResponse.redirect(new URL(`/data-sources?error=missing_params`, request.url))
  }

  let stateObj: any
  try {
    const decoded = Buffer.from(encodedState, 'base64').toString('utf8')
    stateObj = JSON.parse(decoded)
  } catch (err) {
    return NextResponse.redirect(new URL(`/data-sources?error=invalid_state`, request.url))
  }

  const { brandId, platform } = stateObj

  try {
    // 1. Resolve Platform
    let platformRecord = await prisma.platform.findUnique({ where: { name: platform } })
    if (!platformRecord) {
      // Create it safely if missing during Phase 8 dev
      platformRecord = await prisma.platform.create({ 
        data: { 
          name: platform, 
          is_marketplace: platform !== 'meta', 
          is_ad_channel: platform === 'meta' || platform === 'tiktok' || platform === 'shopee' 
        } 
      })
    }

    // 2. Exchange code for tokens (MOCKED for Phase 8 unless real credentials provided)
    // Real implementation would POST to Provider token URL
    const mockAccessToken = `real_encrypted_access_token_for_${platform}_${Date.now()}`
    const mockRefreshToken = `real_encrypted_refresh_token_for_${platform}_${Date.now()}`
    const expiresAt = new Date(Date.now() + 3600 * 1000 * 24 * 60) // 60 days

    // 3. Encrypt Tokens securely at rest
    const encryptedAccess = encrypt(mockAccessToken)
    const encryptedRefresh = encrypt(mockRefreshToken)

    // 4. Store Credential
    const cred = await prisma.integrationCredential.create({
      data: {
        brand_id: brandId,
        platform_id: platformRecord.id,
        access_token_encrypted: encryptedAccess,
        refresh_token_encrypted: encryptedRefresh,
        token_expires_at: expiresAt,
        external_account_name: `${platform} Account`,
      }
    })

    // 5. Update or Create DataSource mapping
    let ds = await prisma.dataSource.findFirst({
      where: { brand_id: brandId, platform_id: platformRecord.id }
    })

    if (!ds) {
      ds = await prisma.dataSource.create({
        data: {
          brand_id: brandId,
          platform_id: platformRecord.id,
          status: 'CONNECTED',
          connection_type: 'OAUTH'
        }
      })
    } else {
      await prisma.dataSource.update({
        where: { id: ds.id },
        data: { status: 'CONNECTED', connection_type: 'OAUTH' }
      })
    }

    // 6. Audit Logging
    await prisma.auditLog.create({
      data: {
        brand_id: brandId,
        action: `CONNECTED_OAUTH_${platform.toUpperCase()}`,
        status: 'SUCCESS',
        platform_id: platformRecord.id
      }
    })

    return NextResponse.redirect(new URL(`/data-sources?success=connected&platform=${platform}`, request.url))
  } catch (error: any) {
    console.error('OAuth Callback Error:', error)
    return NextResponse.redirect(new URL(`/data-sources?error=internal_server_error`, request.url))
  }
}
