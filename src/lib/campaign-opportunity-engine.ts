/**
 * Campaign Opportunity Scoring & Recommendation Engine
 * Factual, deterministic scoring (0-100) based strictly on verified inputs:
 * - Timing & Deadline (Preparation buffer before registration close)
 * - Discount & Margin Feasibility (Safe discount vs severe bottom-price erosion)
 * - Product Eligibility & SKU match
 * - Campaign Type Impact (Traffic multiplier from Double Date / Flash Sale / Payday vs BAU)
 */

export interface OpportunityInput {
  campaign_type: string
  start_date: Date | string
  end_date: Date | string
  registration_end?: Date | string | null
  required_discount?: number | null // percentage, e.g. 4 for 4%
  product_type: string // 'Existing', 'NPD', 'Both'
  eligible_sku_count?: number | null
  matched_sku_count?: number | null
  estimated_gmv?: number | null
  estimated_margin?: number | null
}

export interface OpportunityResult {
  score: number // 0 - 100
  level: 'High' | 'Medium' | 'Low'
  recommendation: 'Recommended' | 'Consider' | 'Low Priority' | 'Skip'
  reason: string
}

export function calculateOpportunityScore(input: OpportunityInput): OpportunityResult {
  let score = 50 // Base median score
  const reasons: string[] = []

  // 1. Campaign Type Multiplier & Relevance (up to +20 or -10)
  const type = (input.campaign_type || '').toLowerCase()
  if (type.includes('double date') || type.includes('flash sale')) {
    score += 15
    reasons.push('Traffic multiplier tinggi pada event besar')
  } else if (type.includes('payday')) {
    score += 12
    reasons.push('Daya beli konsumen memuncak pada periode gajian')
  } else if (type.includes('npd') || input.product_type === 'NPD') {
    score += 14
    reasons.push('Kesempatan penetrasi & exposure peluncuran produk baru (NPD)')
  } else if (type.includes('live streaming')) {
    score += 10
    reasons.push('Konversi interaktif live streaming optimal untuk bundling')
  } else if (type.includes('bau')) {
    score += 4
    reasons.push('Campaign harian reguler untuk menjaga kestabilan baseline GMV')
  }

  // 2. Discount & Margin Safety (up to +15 or -25)
  const discount = input.required_discount != null ? input.required_discount : 4
  if (discount > 0 && discount <= 6) {
    score += 12
    reasons.push(`Diskon ${discount}% berada dalam batas aman proteksi bottom price Finance`)
  } else if (discount > 6 && discount <= 10) {
    score += 2
    reasons.push(`Diskon ${discount}% memerlukan pemantauan margin ekstra`)
  } else if (discount > 10) {
    score -= 18
    reasons.push(`Ketentuan diskon tinggi (${discount}%) berisiko menekan margin di bawah target`)
  }

  // 3. Eligibility & Matched SKUs (up to +15 or -10)
  const eligible = input.eligible_sku_count || 0
  const matched = input.matched_sku_count != null ? input.matched_sku_count : eligible
  if (matched >= 5) {
    score += 14
    reasons.push(`${matched} SKU cocok dan siap dialokasikan stok promosi`)
  } else if (matched >= 2) {
    score += 8
    reasons.push(`${matched} SKU terverifikasi siap ikut serta`)
  } else if (matched === 1) {
    score += 4
    reasons.push('1 SKU hero produk teridentifikasi')
  } else {
    score -= 6
    reasons.push('Pengecekan eligibility SKU manual masih diperlukan')
  }

  // 4. Registration Timeline Buffer (up to +10 or -15)
  if (input.registration_end) {
    const regEnd = new Date(input.registration_end).getTime()
    const now = new Date().getTime()
    const diffDays = Math.ceil((regEnd - now) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      // Already expired
      return {
        score: 0,
        level: 'Low',
        recommendation: 'Skip',
        reason: 'Pendaftaran campaign ini sudah ditutup (expired).'
      }
    } else if (diffDays <= 2) {
      score += 2
      reasons.push(`Pendaftaran segera ditutup (${diffDays} hari lagi) - aksi cepat diperlukan`)
    } else if (diffDays <= 7) {
      score += 8
      reasons.push(`Waktu pendaftaran ideal (${diffDays} hari) untuk persiapan alokasi stok`)
    } else {
      score += 6
      reasons.push('Jendela waktu pendaftaran masih panjang')
    }
  }

  // Clamp score strictly between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)))

  // Determine Level & Recommendation
  let level: 'High' | 'Medium' | 'Low' = 'Medium'
  let recommendation: 'Recommended' | 'Consider' | 'Low Priority' | 'Skip' = 'Consider'

  if (score >= 80) {
    level = 'High'
    recommendation = 'Recommended'
  } else if (score >= 60) {
    level = 'Medium'
    recommendation = 'Consider'
  } else if (score >= 40) {
    level = 'Low'
    recommendation = 'Low Priority'
  } else {
    level = 'Low'
    recommendation = 'Skip'
  }

  // Combine top reasons into a coherent explanation
  const reasonText = reasons.length > 0 
    ? reasons.slice(0, 3).join('. ') + '.'
    : 'Evaluasi kelayakan campaign berdasarkan ketentuan pasar dan profil produk.'

  return {
    score,
    level,
    recommendation,
    reason: reasonText
  }
}
