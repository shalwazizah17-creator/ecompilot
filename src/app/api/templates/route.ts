import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'affiliate'

  let csvContent = ''
  let filename = ''

  if (type === 'affiliate') {
    csvContent = 'date,affiliate_id,affiliate_name,sales,orders,commission,clicks\n2023-10-01,USER123,BeautyCreator,1500000,5,150000,100'
    filename = 'EcomPilot_Affiliate_Template.csv'
  } else if (type === 'sales') {
    csvContent = 'date,order_id,sales,orders,refunds\n2023-10-01,ORD-123,500000,1,0'
    filename = 'EcomPilot_Marketplace_Sales_Template.csv'
  } else if (type === 'ads') {
    csvContent = 'date,campaign,ad_set,ad,spend,impressions,clicks,purchases\n2023-10-01,Campaign A,AdSet B,Ad C,100000,5000,50,2'
    filename = 'EcomPilot_Ads_Template.csv'
  } else {
    // Default to a master template instruction file
    csvContent = 'type,description\nSales,Use columns: date, order_id, sales, orders\nAds,Use columns: date, campaign, spend, impressions\nAffiliate,Use columns: date, affiliate_id, sales, commission'
    filename = 'EcomPilot_Template_Guide.csv'
  }

  const response = new NextResponse(csvContent)
  response.headers.set('Content-Type', 'text/csv')
  response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)

  return response
}
