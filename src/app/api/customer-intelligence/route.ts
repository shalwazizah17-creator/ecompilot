import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertBrandAccess } from '@/lib/auth/assert-brand-access'

// Deterministic keyword-based sentiment classification
function classifySentiment(rating: number, text: string): { sentiment: string; complaint_topic: string | null } {
  if (rating >= 4) return { sentiment: 'POSITIVE', complaint_topic: null }
  if (rating === 3) return { sentiment: 'NEUTRAL', complaint_topic: null }

  // Negative — detect topic
  const t = (text ?? '').toLowerCase()
  if (/kemasan|packaging|kotak|bungkus/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Packaging' }
  if (/bocor|tumpah|rusak|pecah|cacat|leakage/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Leakage' }
  if (/lambat|lama|telat|pengiriman|kurir|paket|kiriman|terlambat/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Shipping' }
  if (/salah varian|warna salah|ukuran salah|beda produk|not as described/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'WrongVariant' }
  if (/kualitas|jelek|buruk|tidak bagus|murahan|quality/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Quality' }
  if (/ukuran|size|kecil|besar|kebesaran|kekecilan/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Size' }
  if (/warna|color|pudar|berbeda/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Color' }
  if (/cs|customer service|respon|seller|penjual|slow response/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'CustomerService' }
  if (/mahal|harga|price|tidak worth|tidak sebanding/.test(t)) return { sentiment: 'NEGATIVE', complaint_topic: 'Price' }
  return { sentiment: 'NEGATIVE', complaint_topic: 'Other' }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const brandId = req.nextUrl.searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  const access = await assertBrandAccess(session.user.id, brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const reviews = await prisma.customerReview.findMany({
    where: { brand_id: brandId },
    orderBy: { review_date: 'desc' },
    take: 500,
  })

  // Aggregate stats
  const total = reviews.length
  const avgRating = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0
  const negative = reviews.filter(r => r.sentiment === 'NEGATIVE').length
  const positive = reviews.filter(r => r.sentiment === 'POSITIVE').length

  // Cluster complaints
  const topicCounts: Record<string, number> = {}
  for (const r of reviews.filter(r => r.sentiment === 'NEGATIVE' && r.complaint_topic)) {
    topicCounts[r.complaint_topic!] = (topicCounts[r.complaint_topic!] ?? 0) + 1
  }
  const complaintClusters = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count, pct: (count / Math.max(1, negative)) * 100 }))
    .sort((a, b) => b.count - a.count)

  // Rating distribution
  const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of reviews) { if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating]++ }

  return NextResponse.json({
    summary: { total, avgRating, negative, positive, negativePct: (negative / Math.max(1, total)) * 100 },
    complaintClusters,
    ratingDist,
    recentReviews: reviews.slice(0, 50),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { brandId, reviews: rawReviews } = body
  if (!brandId || !rawReviews?.length) return NextResponse.json({ error: 'brandId and reviews required' }, { status: 400 })

  const access = await assertBrandAccess(session.user.id, brandId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const brand = await prisma.brand.findFirst({ where: { id: brandId } })
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

  const processed = (rawReviews as any[]).map(r => {
    const classification = classifySentiment(Number(r.rating ?? 0), r.review_text ?? '')
    return {
      brand_id: brandId,
      workspace_id: brand.workspace_id,
      product_name: r.product_name ?? null,
      sku: r.sku ?? null,
      rating: Number(r.rating ?? 0),
      review_text: r.review_text ?? null,
      sentiment: classification.sentiment,
      complaint_topic: classification.complaint_topic,
      variant: r.variant ?? null,
      courier: r.courier ?? null,
      review_date: r.review_date ? new Date(r.review_date) : new Date(),
      source: 'CSV',
    }
  })

  await prisma.customerReview.createMany({ data: processed, skipDuplicates: false })

  return NextResponse.json({ created: processed.length })
}

