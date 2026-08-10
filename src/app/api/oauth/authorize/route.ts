import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')
  const brandId = searchParams.get('brandId')
  
  if (!platform || !brandId) {
    return NextResponse.json({ error: 'Missing platform or brandId' }, { status: 400 })
  }

  // Generate CSRF State
  const state = crypto.randomBytes(16).toString('hex')
  const encodedState = Buffer.from(JSON.stringify({ state, brandId, platform })).toString('base64')

  let authUrl = ''

  // For testing purposes we'll mock the URL redirects. 
  // In production, these would use process.env.META_APP_ID etc.
  switch (platform.toLowerCase()) {
    case 'meta':
      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID || 'mock_app_id'}&redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL || 'http://localhost:3000')}/api/oauth/callback&state=${encodedState}&scope=ads_read,read_insights`
      break
    case 'shopee':
      authUrl = `https://partner.shopeemobile.com/api/v2/shop/auth_partner?partner_id=${process.env.SHOPEE_CLIENT_ID || 'mock_client'}&redirect=${encodeURIComponent(process.env.NEXTAUTH_URL || 'http://localhost:3000')}/api/oauth/callback&state=${encodedState}`
      break
    default:
      // If we don't have real API access for this platform yet, we simulate a direct callback redirect for the mock framework.
      authUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/oauth/callback?code=mock_auth_code_for_${platform}&state=${encodedState}`
      break
  }

  return NextResponse.redirect(authUrl)
}
