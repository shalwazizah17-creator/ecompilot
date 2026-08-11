import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { assertBrandAccess } from "@/lib/auth/assert-brand-access"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')
  const brandIdParam = searchParams.get('brandId')
  
  if (!platform || !brandIdParam) {
    return NextResponse.json({ error: 'Missing platform or brandId' }, { status: 400 })
  }

  const brand = await assertBrandAccess(brandIdParam)
  if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const brandId = brand.id

  // Generate CSRF State
  const state = crypto.randomBytes(16).toString('hex')
  const encodedState = Buffer.from(JSON.stringify({ state, brandId, platform })).toString('base64')

  let authUrl = ''
  const callbackUri = new URL('/api/oauth/callback', request.url).toString()
    
  if (platform === 'META') {
    authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID || 'mock_app_id'}&redirect_uri=${encodeURIComponent(callbackUri)}&state=${encodedState}&scope=ads_read,read_insights`
  } else if (platform === 'SHOPEE') {
    // Shopee requires HMAC signature in production, simplified here
    authUrl = `https://partner.shopeemobile.com/api/v2/shop/auth_partner?partner_id=${process.env.SHOPEE_CLIENT_ID || 'mock_client'}&redirect=${encodeURIComponent(callbackUri)}&state=${encodedState}`
  } else {
    // Mock flow for others
    authUrl = `${callbackUri}?code=mock_auth_code_for_${platform}&state=${encodedState}`
  }

  return NextResponse.redirect(authUrl)
}
