/**
 * CLOSING CALCULATION ENGINE
 * Dedicated Working Closing Tool for Finance Reconciliation.
 *
 * SCOPE & BUSINESS RULES:
 * 1. NOT a replacement for Master Closing. Master Closing remains the final report.
 *    This engine processes raw marketplace order data + reference promo data to produce
 *    precise Quantity + Biaya for Master Closing entry.
 * 2. Shopee Multi-Cabang:
 *    - Hanya Shopee yang memiliki cabang:
 *        Shopee Pusat, Shopee Semarang, Shopee Bali, Shopee Surabaya
 *    - TikTok Shop dan Lazada TIDAK memiliki cabang.
 * 3. Closingan Reguler vs Closingan Campaign:
 *    - Produk dengan harga promo campaign dipisahkan ke dalam kelompok CAMPAIGN.
 *    - Produk dengan promo voucher toko/diskon reguler masuk ke REGULER.
 *    - Grouping key memisahkan closingType sehingga harga & kuantitas campaign tidak tertukar.
 * 4. Period Split:
 *    - Periode 1: Tanggal 1 – 15
 *    - Periode 2: Tanggal 16 – akhir bulan (dynamically computed: 28, 29, 30, or 31).
 * 5. Cancelled Orders Excluded:
 *    - Pesanan batal/cancelled/retur TIDAK dihitung (COUNT = 0).
 *    - Formula: Valid Orders = Total Orders - Cancelled Orders.
 * 6. Duplicate Discount Rule:
 *    - JANGAN membagi semua pesanan dengan 2.
 *    - Jika ditemukan diskon/promo yang sama dalam periode closing yang sama:
 *        Final QTY = Valid QTY ÷ 2
 *    - Jika tidak ada diskon yang sama (unik):
 *        Final QTY = Valid QTY
 * 7. Formula Biaya:
 *    - BIAYA = Final QTY × Harga Setelah Diskon.
 * 8. Master Closing Copy Format (Tab-Separated):
 *    Platform \t Kode Promosi \t Nama Promosi \t SKU \t Quantity \t Biaya
 */

export type ClosingPeriodType = 'PERIOD_1' | 'PERIOD_2'

export type ClosingRuleType = 'DIVIDE_VALID_ORDERS_BY_2' | 'STANDARD_NO_SPLIT'

export type ClosingStatus = 'Draft' | 'Data Imported' | 'Under Review' | 'Ready for Finance' | 'Closed'

export type ClosingType = 'REGULER' | 'CAMPAIGN'

export type ShopeeBranch = 'Shopee Pusat' | 'Shopee Semarang' | 'Shopee Bali' | 'Shopee Surabaya'

export type MarketplacePlatform = ShopeeBranch | 'TikTok Shop' | 'Lazada'

export const SHOPEE_BRANCHES: ShopeeBranch[] = [
  'Shopee Pusat',
  'Shopee Semarang',
  'Shopee Bali',
  'Shopee Surabaya'
]

export const ALL_PLATFORMS: MarketplacePlatform[] = [
  'Shopee Pusat',
  'Shopee Semarang',
  'Shopee Bali',
  'Shopee Surabaya',
  'TikTok Shop',
  'Lazada'
]

export function isShopeePlatform(platform: string): boolean {
  return (platform || '').toLowerCase().includes('shopee')
}

/**
 * Classify whether an order/promo belongs to Campaign Closing or Regular Promo Closing.
 * Campaign typically has campaign keywords (Mega, Flash Sale, 9.9, Payday) or deeper campaign prices.
 */
export function classifyClosingType(
  promoCategory: string,
  promoName: string,
  price?: number,
  discountAmount?: number
): ClosingType {
  const text = `${promoCategory || ''} ${promoName || ''}`.toLowerCase()
  
  const campaignKeywords = [
    'campaign',
    'mega',
    'flash sale',
    'payday',
    'gajian',
    '9.9',
    '10.10',
    '11.11',
    '12.12',
    'brand day',
    'super brand',
    'tanggal kembar',
    'promo puncak',
    'big ramadhan',
    'shopee live mega'
  ]

  if (campaignKeywords.some(k => text.includes(k))) {
    return 'CAMPAIGN'
  }

  if (price && discountAmount && price > 0) {
    const discountRate = discountAmount / price
    if (discountRate >= 0.20 && text.includes('sale')) {
      return 'CAMPAIGN'
    }
  }

  return 'REGULER'
}

export interface RawOrderTransaction {
  id: string
  orderNumber: string
  date: Date | string
  month: string
  period?: ClosingPeriodType
  marketplace: string
  closingType?: ClosingType
  branchCity?: string
  promotionCategory: string
  promotionName: string
  sku: string
  productName?: string
  price: number
  discountPercent?: number
  discountAmount: number
  quantity: number
  orderStatus: string // 'Selesai', 'Dibatalkan', 'Batal', 'Cancelled', 'Retur'
  customerUsername?: string
  isDuplicatePromo?: boolean
  rawNotes?: string
}

export interface ClosingGroupAudit {
  groupId: string
  month: string
  year?: number
  closingPeriod: ClosingPeriodType
  periodLabel: string
  periodDateRange?: string
  marketplace: string
  closingType: ClosingType // 'REGULER' | 'CAMPAIGN'
  branchCity?: string // 'Pusat' | 'Semarang' | 'Bali' | 'Surabaya'
  isShopeeBranch?: boolean
  promotionCategory: string
  subCategory?: string
  promotionName: string
  sku: string
  productName?: string
  price: number // Harga Normal / Bulanan
  discountPercent: number
  discountAmount: number // Total Diskon
  priceAfterDiscount: number // Harga Setelah Diskon / Harga Promo (Beda saat Campaign)
  
  // Mathematical breakdown for Finance audit
  totalOrders: number
  cancelledOrders: number
  validOrders: number
  
  hasSameDiscountInPeriod: boolean
  isDuplicatePromo?: boolean
  appliedRule: ClosingRuleType
  formulaDescription: string
  finalClosingQty: number // Final QTY
  biaya: number // Final QTY × Harga Setelah Diskon
  totalBiayaPromo: number // Backward compatibility: Final QTY × Diskon

  // Validation & Paket Diskon flags
  isPaketDiskon?: boolean
  bundleComponents?: string[]
  needsReview?: boolean
  reviewReasons?: string[]

  // Source Audit Trail
  transactions: RawOrderTransaction[]
}

export type ClosingSummaryRow = ClosingGroupAudit

export interface ClosingBatchResult {
  groups: ClosingGroupAudit[]
  summary: {
    totalRawOrders: number
    totalValidOrders: number
    totalCancelledOrders: number
    totalFinalClosingQty: number
    totalBiaya: number
    totalBiayaPromo: number
    totalRegulerBiaya: number
    totalCampaignBiaya: number
    needsReviewCount: number
  }
}

export interface ClosingEngineConfig {
  defaultRule?: ClosingRuleType
  enableDivideBy2ForSameDiscount?: boolean
  hasDuplicateInPeriod?: boolean
  cancelledStatusKeywords?: string[]
}

const DEFAULT_CANCELLED_KEYWORDS = [
  'batal',
  'dibatalkan',
  'cancel',
  'cancelled',
  'canceled',
  'retur',
  'refund',
  'pengembalian'
]

/**
 * Dynamic Month Calculation: Get days in month accounting for leap years
 */
export function getDaysInMonth(year: number, monthName: string): number {
  const monthMap: Record<string, number> = {
    januari: 0, january: 0, jan: 0,
    februari: 1, february: 1, feb: 1,
    maret: 2, march: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, june: 5, jun: 5,
    juli: 6, july: 6, jul: 6,
    agustus: 7, august: 7, agu: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    oktober: 9, october: 9, okt: 9, oct: 9,
    november: 10, nov: 10,
    desember: 11, december: 11, des: 11, dec: 11
  }

  const clean = (monthName || '').trim().toLowerCase()
  const idx = monthMap[clean] ?? 8 // default September
  return new Date(year, idx + 1, 0).getDate()
}

/**
 * Get dynamic period labels and headers based on Month & Year
 */
export function getDynamicPeriodLabels(year: number, monthName: string) {
  const lastDay = getDaysInMonth(year, monthName)
  const shortMonth = monthName.slice(0, 3)

  return {
    lastDay,
    p1Label: `Periode 1 (1–15 ${shortMonth})`,
    p2Label: `Periode 2 (16–${lastDay} ${shortMonth})`,
    p1DateRange: `1 - 15 ${shortMonth} ${year}`,
    p2DateRange: `16 - ${lastDay} ${shortMonth} ${year}`,
    p1Header: `QTY 1-15 ${shortMonth}`,
    p2Header: `QTY 16-${lastDay} ${shortMonth}`,
    p1BiayaHeader: `BIAYA 1-15 ${shortMonth}`,
    p2BiayaHeader: `BIAYA 16-${lastDay} ${shortMonth}`
  }
}

/**
 * Determine Closing Period:
 * Period 1: Tanggal 1 - 15
 * Period 2: Tanggal 16 - akhir bulan (28, 29, 30, 31)
 */
export function getClosingPeriod(dateInput: Date | string): ClosingPeriodType {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const day = d.getDate()
  if (isNaN(day)) return 'PERIOD_1'
  return day <= 15 ? 'PERIOD_1' : 'PERIOD_2'
}

export function getClosingPeriodLabel(period: ClosingPeriodType, monthName: string = '', year: number = 2026): string {
  const lastDay = getDaysInMonth(year, monthName || 'September')
  if (period === 'PERIOD_1') {
    return `Periode 1 (1–15 ${monthName})`.trim()
  }
  return `Periode 2 (16–${lastDay} ${monthName})`.trim()
}

/**
 * Check whether an order is cancelled or non-valid
 */
export function isOrderCancelled(status: string, customKeywords?: string[]): boolean {
  if (!status) return false
  const s = status.toString().trim().toLowerCase()
  const keywords = customKeywords || DEFAULT_CANCELLED_KEYWORDS
  return keywords.some(k => s.includes(k.toLowerCase()))
}

/**
 * Normalizes discount amount to positive float
 */
export function normalizeDiscount(val: number | string): number {
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val
  return isNaN(num) ? 0 : Math.max(0, num)
}

/**
 * Generate unique grouping key based on strict Finance rules:
 * Context: Month, Closing Period, Marketplace, ClosingType (Reguler vs Campaign), Category, Promotion, SKU, Discount
 */
export function buildGroupKey(
  month: string,
  period: ClosingPeriodType,
  marketplace: string,
  closingType: ClosingType = 'REGULER',
  promoCategory: string = '',
  promotionName: string = '',
  sku: string = '',
  discountAmount: number = 0
): string {
  const cleanMonth = (month || '').trim().toLowerCase()
  const cleanMarketplace = (marketplace || '').trim().toLowerCase()
  const cleanType = (closingType || 'REGULER').trim().toLowerCase()
  const cleanCat = (promoCategory || '').trim().toLowerCase()
  const cleanPromo = (promotionName || '').trim().toLowerCase()
  const cleanSku = (sku || '').trim().toLowerCase()
  const cleanDiscount = normalizeDiscount(discountAmount).toFixed(2)

  return `${cleanMonth}::${period}::${cleanMarketplace}::${cleanType}::${cleanCat}::${cleanPromo}::${cleanSku}::${cleanDiscount}`
}

/**
 * Core calculation for a single group of transactions sharing identical
 * Month, Period, Marketplace, ClosingType, Category, Promo, SKU, and Discount Amount.
 */
export function calculateClosingGroup(
  transactions: RawOrderTransaction[],
  config?: ClosingEngineConfig,
  forceIsDuplicate?: boolean
): ClosingGroupAudit {
  if (!transactions || transactions.length === 0) {
    throw new Error('Transactions array cannot be empty for group calculation')
  }

  const sample = transactions[0]
  const month = sample.month || 'September'
  const year = 2026
  const closingPeriod = sample.period || (sample.date ? getClosingPeriod(sample.date) : 'PERIOD_1')
  const marketplace = sample.marketplace || 'Shopee Pusat'
  const promotionCategory = sample.promotionCategory || 'Voucher Toko'
  const promotionName = sample.promotionName || 'Promo Diskon'
  const sku = sample.sku || 'All SKU'
  const productName = sample.productName || 'Produk Theraskin'
  const discountAmount = normalizeDiscount(sample.discountAmount)
  const price = sample.price || 0
  const discountPercent = sample.discountPercent || (price > 0 && discountAmount > 0 ? Math.round((discountAmount / price) * 100) : 0)
  const priceAfterDiscount = Math.max(0, price - discountAmount)

  // Determine Closing Type: Reguler vs Campaign
  const closingType: ClosingType = sample.closingType || classifyClosingType(promotionCategory, promotionName, price, discountAmount)

  // Branch Info
  const isShopee = isShopeePlatform(marketplace)
  let branchCity: string | undefined = undefined
  if (isShopee) {
    if (marketplace.includes('Semarang')) branchCity = 'Semarang'
    else if (marketplace.includes('Bali')) branchCity = 'Bali'
    else if (marketplace.includes('Surabaya')) branchCity = 'Surabaya'
    else branchCity = 'Pusat'
  }

  // 1. Calculate Total Orders & Filter Cancelled (COUNT = 0)
  let totalOrdersCount = 0
  let cancelledOrdersCount = 0
  let validOrdersCount = 0

  transactions.forEach(tx => {
    const qty = tx.quantity || 1
    totalOrdersCount += qty

    if (isOrderCancelled(tx.orderStatus, config?.cancelledStatusKeywords)) {
      cancelledOrdersCount += qty
    } else {
      validOrdersCount += qty
    }
  })

  // 2. Duplicate Discount Rule Determination
  // Rule:
  // Jika ditemukan diskon/promo yang sama dalam periode closing yang sama:
  //   Final QTY = Valid QTY ÷ 2
  // Jika tidak ada diskon yang sama (unik):
  //   Final QTY = Valid QTY
  let isDuplicate = false
  if (forceIsDuplicate !== undefined) {
    isDuplicate = forceIsDuplicate
  } else if (config?.hasDuplicateInPeriod !== undefined) {
    isDuplicate = config.hasDuplicateInPeriod
  } else if (transactions.some(tx => tx.isDuplicatePromo === true)) {
    isDuplicate = true
  } else if (transactions.some(tx => tx.isDuplicatePromo === false)) {
    isDuplicate = false
  } else {
    isDuplicate = config?.enableDivideBy2ForSameDiscount !== false && discountAmount > 0 && validOrdersCount > 0
  }

  const appliedRule: ClosingRuleType = isDuplicate ? 'DIVIDE_VALID_ORDERS_BY_2' : 'STANDARD_NO_SPLIT'

  // 3. Calculate Final Closing QTY
  const finalClosingQty = appliedRule === 'DIVIDE_VALID_ORDERS_BY_2'
    ? validOrdersCount / 2
    : validOrdersCount

  // 4. Calculate Biaya
  // Finance Formula: BIAYA = Final QTY × Harga Setelah Diskon (Harga Promo Net)
  const effectivePriceAfterDiscount = priceAfterDiscount > 0 ? priceAfterDiscount : price
  const biaya = finalClosingQty * effectivePriceAfterDiscount

  // Backward compatibility: totalBiayaPromo as discount subsidy
  const totalBiayaPromo = finalClosingQty * discountAmount

  // Formula description for Finance audit transparency
  const formulaDescription = appliedRule === 'DIVIDE_VALID_ORDERS_BY_2'
    ? `(${totalOrdersCount} total - ${cancelledOrdersCount} batal) ÷ 2 = ${finalClosingQty}`
    : `(${totalOrdersCount} total - ${cancelledOrdersCount} batal) = ${finalClosingQty}`

  // Paket Diskon & Review Checks
  const isPaketDiskon = promotionCategory.toLowerCase().includes('paket') || promotionName.toLowerCase().includes('paket')
  const reviewReasons: string[] = []
  if (isDuplicate) reviewReasons.push('DUPLICATE_PROMO')
  if (isPaketDiskon) reviewReasons.push('PAKET_DISKON')
  if (!sku || sku === 'All SKU' || sku === 'SKU-Umum') reviewReasons.push('MISSING_SKU')
  if (price <= 0 || priceAfterDiscount <= 0) reviewReasons.push('INVALID_PRICE')

  const periodLabels = getDynamicPeriodLabels(year, month)
  const periodDateRange = closingPeriod === 'PERIOD_1' ? periodLabels.p1DateRange : periodLabels.p2DateRange
  const groupId = buildGroupKey(month, closingPeriod, marketplace, closingType, promotionCategory, promotionName, sku, discountAmount)

  return {
    groupId,
    month,
    year,
    closingPeriod,
    periodLabel: getClosingPeriodLabel(closingPeriod, month, year),
    periodDateRange,
    marketplace,
    closingType,
    branchCity,
    isShopeeBranch: isShopee,
    promotionCategory,
    subCategory: sample.promotionCategory || 'Promo Reguler',
    promotionName,
    sku,
    productName,
    price,
    discountPercent,
    discountAmount,
    priceAfterDiscount: effectivePriceAfterDiscount,
    totalOrders: totalOrdersCount,
    cancelledOrders: cancelledOrdersCount,
    validOrders: validOrdersCount,
    hasSameDiscountInPeriod: isDuplicate,
    isDuplicatePromo: isDuplicate,
    appliedRule,
    formulaDescription,
    finalClosingQty,
    biaya,
    totalBiayaPromo,
    isPaketDiskon,
    needsReview: reviewReasons.length > 0,
    reviewReasons,
    transactions
  }
}

/**
 * Main batch processor:
 * Takes raw order transactions, groups them strictly by context including ClosingType (Reguler vs Campaign),
 * detects duplicate promo occurrences in the same period,
 * and computes closing QTY & Biaya with full audit history.
 */
export function processClosingTransactions(
  transactions: RawOrderTransaction[],
  config?: ClosingEngineConfig
): ClosingBatchResult {
  // Pass 1: Count occurrences of promo within (marketplace, period, closingType, promoName/discount)
  const promoPeriodCount = new Map<string, number>()
  transactions.forEach(tx => {
    const period = tx.period || (tx.date ? getClosingPeriod(tx.date) : 'PERIOD_1')
    const closingType = tx.closingType || classifyClosingType(tx.promotionCategory, tx.promotionName, tx.price, tx.discountAmount)
    const promoKey = `${tx.marketplace}::${period}::${closingType}::${tx.promotionName}`
    promoPeriodCount.set(promoKey, (promoPeriodCount.get(promoKey) || 0) + 1)
  })

  // Pass 2: Group by strict Finance context
  const groupMap = new Map<string, RawOrderTransaction[]>()
  transactions.forEach(tx => {
    const period = tx.period || (tx.date ? getClosingPeriod(tx.date) : 'PERIOD_1')
    const closingType = tx.closingType || classifyClosingType(tx.promotionCategory, tx.promotionName, tx.price, tx.discountAmount)
    const key = buildGroupKey(
      tx.month,
      period,
      tx.marketplace,
      closingType,
      tx.promotionCategory,
      tx.promotionName,
      tx.sku,
      tx.discountAmount
    )

    if (!groupMap.has(key)) {
      groupMap.set(key, [])
    }
    groupMap.get(key)!.push({ ...tx, period, closingType })
  })

  const groups: ClosingGroupAudit[] = []
  let totalRaw = 0
  let totalValid = 0
  let totalCancelled = 0
  let totalFinalQty = 0
  let totalBiaya = 0
  let totalBiayaPromo = 0
  let totalRegulerBiaya = 0
  let totalCampaignBiaya = 0
  let needsReviewCount = 0

  groupMap.forEach(groupTxList => {
    const sample = groupTxList[0]
    const period = sample.period || 'PERIOD_1'
    const closingType = sample.closingType || 'REGULER'
    const promoKey = `${sample.marketplace}::${period}::${closingType}::${sample.promotionName}`
    const promoCount = promoPeriodCount.get(promoKey) || 1

    // If explicit config or duplicate flagged in transactions or promo occurred multiple times
    const hasDuplicate = sample.isDuplicatePromo !== undefined
      ? sample.isDuplicatePromo
      : (config?.hasDuplicateInPeriod !== undefined ? config.hasDuplicateInPeriod : (promoCount > 1 || groupTxList.length > 1))

    const groupResult = calculateClosingGroup(groupTxList, config, hasDuplicate)
    groups.push(groupResult)

    totalRaw += groupResult.totalOrders
    totalValid += groupResult.validOrders
    totalCancelled += groupResult.cancelledOrders
    totalFinalQty += groupResult.finalClosingQty
    totalBiaya += groupResult.biaya
    totalBiayaPromo += groupResult.totalBiayaPromo

    if (groupResult.closingType === 'CAMPAIGN') {
      totalCampaignBiaya += groupResult.biaya
    } else {
      totalRegulerBiaya += groupResult.biaya
    }

    if (groupResult.needsReview) needsReviewCount++
  })

  return {
    groups,
    summary: {
      totalRawOrders: totalRaw,
      totalValidOrders: totalValid,
      totalCancelledOrders: totalCancelled,
      totalFinalClosingQty: totalFinalQty,
      totalBiaya,
      totalBiayaPromo,
      totalRegulerBiaya,
      totalCampaignBiaya,
      needsReviewCount
    }
  }
}

/**
 * 1-Click COPY HASIL CLOSING (6 Columns Format):
 * Format tab-separated agar bisa langsung di-paste ke Master Closing:
 * Platform \t Kode Promosi \t Nama Promosi \t SKU \t Quantity \t Biaya
 * Optionally filters by closingType ('REGULER' | 'CAMPAIGN').
 */
export function generateMasterClosingTSV(
  rows: ClosingGroupAudit[],
  closingTypeFilter?: ClosingType
): string {
  const filtered = closingTypeFilter ? rows.filter(r => r.closingType === closingTypeFilter) : rows

  const lines = filtered.map(r => {
    const platform = r.marketplace || ''
    const kodePromosi = r.promotionCategory || ''
    const namaPromosi = r.promotionName || ''
    const sku = r.sku || ''
    const quantity = r.finalClosingQty
    const biaya = Math.round(r.biaya || r.totalBiayaPromo || 0)

    return `${platform}\t${kodePromosi}\t${namaPromosi}\t${sku}\t${quantity}\t${biaya}`
  })

  return lines.join('\n')
}

/**
 * Standard 11-column Master Closing format with headers
 */
export function generateStandardMasterClosingTSV(
  rows: ClosingGroupAudit[],
  closingTypeFilter?: ClosingType
): string {
  const filtered = closingTypeFilter ? rows.filter(r => r.closingType === closingTypeFilter) : rows

  const header = [
    'Bulan',
    'Platform',
    'Tipe',
    'Kode Promosi',
    'Nama Promosi',
    'Kode SKU',
    'Harga',
    'Diskon',
    'Total Diskon',
    'Harga Setelah Diskon',
    'Quantity',
    'Biaya'
  ].join('\t')

  const lines = filtered.map(r => [
    r.month,
    r.marketplace,
    r.closingType,
    r.promotionCategory,
    r.promotionName,
    r.sku,
    r.price > 0 ? r.price : '',
    r.discountPercent > 0 ? `${r.discountPercent}%` : '',
    r.discountAmount > 0 ? r.discountAmount : '',
    r.priceAfterDiscount > 0 ? r.priceAfterDiscount : '',
    r.finalClosingQty,
    Math.round(r.biaya || r.totalBiayaPromo || 0)
  ].join('\t'))

  return `${header}\n${lines.join('\n')}`
}

/**
 * Full Audit TSV for complete reconciliation check
 */
export function generateFullAuditTSV(rows: ClosingGroupAudit[]): string {
  const header = [
    'Bulan',
    'Periode',
    'Platform',
    'Cabang',
    'Tipe Closing',
    'Kategori Promosi',
    'Nama Promosi',
    'Kode SKU',
    'Nama Produk',
    'Harga Normal',
    'Diskon',
    'Harga Promo Net',
    'Total Orders',
    'Pesanan Batal',
    'Pesanan Valid',
    'Duplicate Rule',
    'Final QTY Closing',
    'Biaya Closing',
    'Formula Perhitungan'
  ].join('\t')

  const lines = rows.map(r => [
    r.month,
    r.periodLabel,
    r.marketplace,
    r.branchCity || '-',
    r.closingType,
    r.promotionCategory,
    r.promotionName,
    r.sku,
    r.productName || '',
    r.price,
    r.discountAmount,
    r.priceAfterDiscount,
    r.totalOrders,
    r.cancelledOrders,
    r.validOrders,
    r.hasSameDiscountInPeriod ? 'Ya (÷2)' : 'Tidak',
    r.finalClosingQty,
    Math.round(r.biaya),
    r.formulaDescription
  ].join('\t'))

  return `${header}\n${lines.join('\n')}`
}

/**
 * Initial Rich Seed Data for Theraskin Closing Reconciliation
 * Covers Shopee Pusat, Shopee Semarang, Shopee Bali, Shopee Surabaya, TikTok Shop, and Lazada.
 * Accurately demonstrates different pricing between Regular Promo and Campaign Closing!
 */
export function generateTheraskinClosingSeed(month: string = 'September', year: number = 2026): ClosingGroupAudit[] {
  const mockRows: Array<{
    period: ClosingPeriodType
    platform: string
    closingType: ClosingType
    category: string
    subCategory: string
    promoName: string
    sku: string
    productName: string
    price: number
    discountAmount: number
    totalOrders: number
    cancelledOrders: number
    isDuplicatePromo: boolean
    isPaketDiskon?: boolean
    bundleComponents?: string[]
  }> = [
    // ==========================================
    // 1. SHOPEE PUSAT
    // ==========================================
    // Shopee Pusat - Period 1 - REGULER
    {
      period: 'PERIOD_1',
      platform: 'Shopee Pusat',
      closingType: 'REGULER',
      category: 'Voucher Toko',
      subCategory: 'Voucher Pengikut Baru',
      promoName: 'Voucher Toko Diskon 5K',
      sku: 'FPK00000033',
      productName: 'Theraskin Perfect Glow Serum 20ml',
      price: 85000,
      discountAmount: 5000, // Net: 80,000
      totalOrders: 100,
      cancelledOrders: 10,
      isDuplicatePromo: true // (100-10)/2 = 45
    },
    // Shopee Pusat - Period 1 - CAMPAIGN (BEDA HARGA!)
    {
      period: 'PERIOD_1',
      platform: 'Shopee Pusat',
      closingType: 'CAMPAIGN',
      category: 'Promo Flash Sale',
      subCategory: 'Mega Campaign 9.9 Shopee',
      promoName: 'Mega 9.9 Flash Sale Glow Serum (Campaign Price)',
      sku: 'FPK00000033',
      productName: 'Theraskin Perfect Glow Serum 20ml',
      price: 85000,
      discountAmount: 17000, // Net Campaign: 68,000 (Harga Spesial Campaign!)
      totalOrders: 220,
      cancelledOrders: 20,
      isDuplicatePromo: false // Unique campaign tier -> (220-20) = 200
    },
    // Shopee Pusat - Period 1 - Paket Diskon Reguler
    {
      period: 'PERIOD_1',
      platform: 'Shopee Pusat',
      closingType: 'REGULER',
      category: 'Paket Diskon',
      subCategory: 'Combo Hemat 2pcs',
      promoName: 'Paket Hemat Glowing Day & Night',
      sku: 'FPK00000099',
      productName: 'Paket Glowing Series Theraskin (Day + Night)',
      price: 155000,
      discountAmount: 20000,
      totalOrders: 50,
      cancelledOrders: 2,
      isDuplicatePromo: true, // (50-2)/2 = 24
      isPaketDiskon: true,
      bundleComponents: ['FPK00000033 (Serum)', 'FPK00000078 (Sunscreen)']
    },
    // Shopee Pusat - Period 2 - CAMPAIGN Payday
    {
      period: 'PERIOD_2',
      platform: 'Shopee Pusat',
      closingType: 'CAMPAIGN',
      category: 'Promo Flash Sale',
      subCategory: 'Shopee Payday Campaign',
      promoName: 'Payday Flash Sale Sunscreen 15K',
      sku: 'FPK00000078',
      productName: 'Theraskin Sunscreen Protector SPF 50 30g',
      price: 68000,
      discountAmount: 15000, // Net Campaign: 53,000
      totalOrders: 140,
      cancelledOrders: 10,
      isDuplicatePromo: false // (140-10) = 130
    },

    // ==========================================
    // 2. SHOPEE SEMARANG
    // ==========================================
    // Shopee Semarang - Period 1 - REGULER
    {
      period: 'PERIOD_1',
      platform: 'Shopee Semarang',
      closingType: 'REGULER',
      category: 'Voucher Toko',
      subCategory: 'Voucher Diskon Reguler',
      promoName: 'Voucher Toko Semarang 5K',
      sku: 'FPK00000012',
      productName: 'Theraskin Oil Control Toner 100ml',
      price: 40000,
      discountAmount: 5000, // Net: 35,000
      totalOrders: 60,
      cancelledOrders: 6,
      isDuplicatePromo: true // (60-6)/2 = 27
    },
    // Shopee Semarang - Period 1 - CAMPAIGN (BEDA HARGA!)
    {
      period: 'PERIOD_1',
      platform: 'Shopee Semarang',
      closingType: 'CAMPAIGN',
      category: 'Promo Flash Sale',
      subCategory: 'Campaign Shopee Mantul Semarang',
      promoName: 'Flash Sale Mantul Acne Spot 10K (Campaign Price)',
      sku: 'FPK00000045',
      productName: 'Theraskin Acne Spot Gel 15g',
      price: 52000,
      discountAmount: 12000, // Net Campaign: 40,000
      totalOrders: 90,
      cancelledOrders: 8,
      isDuplicatePromo: false // (90-8) = 82
    },
    // Shopee Semarang - Period 2 - REGULER Payday
    {
      period: 'PERIOD_2',
      platform: 'Shopee Semarang',
      closingType: 'REGULER',
      category: 'Voucher Toko',
      subCategory: 'Voucher Payday Semarang',
      promoName: 'Voucher Toko Payday Semarang 5K',
      sku: 'FPK00000056',
      productName: 'Theraskin Brightening Facial Wash 100ml',
      price: 45000,
      discountAmount: 5000,
      totalOrders: 50,
      cancelledOrders: 6,
      isDuplicatePromo: true // (50-6)/2 = 22
    },

    // ==========================================
    // 3. SHOPEE BALI
    // ==========================================
    // Shopee Bali - Period 1 - REGULER
    {
      period: 'PERIOD_1',
      platform: 'Shopee Bali',
      closingType: 'REGULER',
      category: 'Voucher Toko',
      subCategory: 'Voucher Diskon Toko Bali',
      promoName: 'Voucher Diskon Toko Bali 5K',
      sku: 'FPK00000078',
      productName: 'Theraskin Sunscreen Protector SPF 50 30g',
      price: 68000,
      discountAmount: 5000, // Net: 63,000
      totalOrders: 40,
      cancelledOrders: 4,
      isDuplicatePromo: true // (40-4)/2 = 18
    },
    // Shopee Bali - Period 1 - CAMPAIGN (BEDA HARGA!)
    {
      period: 'PERIOD_1',
      platform: 'Shopee Bali',
      closingType: 'CAMPAIGN',
      category: 'Promo Flash Sale',
      subCategory: 'Super Brand Day Bali 9.9',
      promoName: 'Super Brand Day Bali Glow Serum (Campaign Price)',
      sku: 'FPK00000033',
      productName: 'Theraskin Perfect Glow Serum 20ml',
      price: 85000,
      discountAmount: 16000, // Net Campaign: 69,000
      totalOrders: 75,
      cancelledOrders: 5,
      isDuplicatePromo: false // (75-5) = 70
    },
    // Shopee Bali - Period 2 - CAMPAIGN Payday Bali
    {
      period: 'PERIOD_2',
      platform: 'Shopee Bali',
      closingType: 'CAMPAIGN',
      category: 'Promo Flash Sale',
      subCategory: 'Payday Flash Sale Bali',
      promoName: 'Payday Flash Sale Bali Sunscreen 12K',
      sku: 'FPK00000078',
      productName: 'Theraskin Sunscreen Protector SPF 50 30g',
      price: 68000,
      discountAmount: 12000, // Net Campaign: 56,000
      totalOrders: 65,
      cancelledOrders: 5,
      isDuplicatePromo: false // (65-5) = 60
    },

    // ==========================================
    // 4. SHOPEE SURABAYA
    // ==========================================
    // Shopee Surabaya - Period 1 - REGULER
    {
      period: 'PERIOD_1',
      platform: 'Shopee Surabaya',
      closingType: 'REGULER',
      category: 'Voucher Toko',
      subCategory: 'Voucher Toko Surabaya Reguler',
      promoName: 'Voucher Toko Surabaya 5K',
      sku: 'FPK00000056',
      productName: 'Theraskin Brightening Facial Wash 100ml',
      price: 45000,
      discountAmount: 5000, // Net: 40,000
      totalOrders: 55,
      cancelledOrders: 5,
      isDuplicatePromo: true // (55-5)/2 = 25
    },
    // Shopee Surabaya - Period 1 - CAMPAIGN (BEDA HARGA!)
    {
      period: 'PERIOD_1',
      platform: 'Shopee Surabaya',
      closingType: 'CAMPAIGN',
      category: 'Promo Flash Sale',
      subCategory: 'Mega 9.9 Surabaya Campaign',
      promoName: 'Flash Sale Surabaya Toner 9K (Campaign Price)',
      sku: 'FPK00000012',
      productName: 'Theraskin Oil Control Toner 100ml',
      price: 40000,
      discountAmount: 9000, // Net Campaign: 31,000
      totalOrders: 85,
      cancelledOrders: 5,
      isDuplicatePromo: false // (85-5) = 80
    },
    // Shopee Surabaya - Period 2 - REGULER
    {
      period: 'PERIOD_2',
      platform: 'Shopee Surabaya',
      closingType: 'REGULER',
      category: 'Paket Diskon',
      subCategory: 'Bundle Acne Care Surabaya',
      promoName: 'Paket Duo Acne Care Surabaya',
      sku: 'FPK00000045',
      productName: 'Theraskin Acne Spot Gel + Toner',
      price: 92000,
      discountAmount: 15000,
      totalOrders: 48,
      cancelledOrders: 4,
      isDuplicatePromo: true, // (48-4)/2 = 22
      isPaketDiskon: true,
      bundleComponents: ['FPK00000045 (Acne Spot)', 'FPK00000012 (Toner)']
    },

    // ==========================================
    // 5. TIKTOK SHOP (TIDAK ADA CABANG)
    // ==========================================
    // TikTok Shop - Period 1 - REGULER
    {
      period: 'PERIOD_1',
      platform: 'TikTok Shop',
      closingType: 'REGULER',
      category: 'Voucher Toko',
      subCategory: 'Voucher Toko TikTok',
      promoName: 'Voucher Toko TikTok Diskon 5K',
      sku: 'FPK00000033',
      productName: 'Theraskin Perfect Glow Serum 20ml',
      price: 85000,
      discountAmount: 5000,
      totalOrders: 80,
      cancelledOrders: 8,
      isDuplicatePromo: true // (80-8)/2 = 36
    },
    // TikTok Shop - Period 1 - CAMPAIGN
    {
      period: 'PERIOD_1',
      platform: 'TikTok Shop',
      closingType: 'CAMPAIGN',
      category: 'Voucher Live / Video',
      subCategory: 'TikTok Mega 9.9 Live Stream',
      promoName: 'Mega 9.9 TikTok Live Stream Glow Serum (Campaign)',
      sku: 'FPK00000033',
      productName: 'Theraskin Perfect Glow Serum 20ml',
      price: 85000,
      discountAmount: 18000, // Net Campaign: 67,000
      totalOrders: 160,
      cancelledOrders: 16,
      isDuplicatePromo: false // (160-16) = 144
    },
    // TikTok Shop - Period 2 - CAMPAIGN Payday
    {
      period: 'PERIOD_2',
      platform: 'TikTok Shop',
      closingType: 'CAMPAIGN',
      category: 'Voucher Live / Video',
      subCategory: 'TikTok Payday Live Mega',
      promoName: 'Voucher Live Mega Payday 15K',
      sku: 'FPK00000033',
      productName: 'Theraskin Perfect Glow Serum 20ml',
      price: 85000,
      discountAmount: 15000,
      totalOrders: 180,
      cancelledOrders: 18,
      isDuplicatePromo: true // (180-18)/2 = 81
    },

    // ==========================================
    // 6. LAZADA (TIDAK ADA CABANG)
    // ==========================================
    // Lazada - Period 1 - REGULER
    {
      period: 'PERIOD_1',
      platform: 'Lazada',
      closingType: 'REGULER',
      category: 'Voucher Toko',
      subCategory: 'Voucher Flexi Combo',
      promoName: 'Voucher LazMall Theraskin 8K',
      sku: 'FPK00000078',
      productName: 'Theraskin Sunscreen Protector SPF 50 30g',
      price: 68000,
      discountAmount: 8000,
      totalOrders: 45,
      cancelledOrders: 5,
      isDuplicatePromo: false // (45-5) = 40
    },
    // Lazada - Period 1 - CAMPAIGN (9.9 Mega Campaign)
    {
      period: 'PERIOD_1',
      platform: 'Lazada',
      closingType: 'CAMPAIGN',
      category: 'Promo Flash Sale',
      subCategory: 'Lazada 9.9 Mega Brand Day',
      promoName: 'Lazada 9.9 Mega Flash Sale Sunscreen (Campaign Price)',
      sku: 'FPK00000078',
      productName: 'Theraskin Sunscreen Protector SPF 50 30g',
      price: 68000,
      discountAmount: 14000, // Net Campaign: 54,000
      totalOrders: 80,
      cancelledOrders: 6,
      isDuplicatePromo: false // (80-6) = 74
    },
    // Lazada - Period 2 - CAMPAIGN Payday
    {
      period: 'PERIOD_2',
      platform: 'Lazada',
      closingType: 'CAMPAIGN',
      category: 'Voucher Toko',
      subCategory: 'LazMall Mega Payday',
      promoName: 'Voucher Payday LazMall 10K',
      sku: 'FPK00000078',
      productName: 'Theraskin Sunscreen Protector SPF 50 30g',
      price: 68000,
      discountAmount: 10000,
      totalOrders: 55,
      cancelledOrders: 5,
      isDuplicatePromo: false // 50
    }
  ]

  return mockRows.map((item, idx) => {
    const validOrders = item.totalOrders - item.cancelledOrders
    const txs: RawOrderTransaction[] = [
      ...Array.from({ length: validOrders }).map((_, i) => ({
        id: `tx-v-${idx}-${i}`,
        orderNumber: `ORD-${item.platform.replace(/\s+/g, '').slice(0, 5).toUpperCase()}-${item.period === 'PERIOD_1' ? '01' : '02'}-${1000 + i}`,
        date: item.period === 'PERIOD_1' ? `${year}-09-08` : `${year}-09-22`,
        month,
        period: item.period,
        marketplace: item.platform,
        closingType: item.closingType,
        promotionCategory: item.category,
        promotionName: item.promoName,
        sku: item.sku,
        productName: item.productName,
        price: item.price,
        discountAmount: item.discountAmount,
        quantity: 1,
        orderStatus: 'Selesai',
        isDuplicatePromo: item.isDuplicatePromo
      })),
      ...Array.from({ length: item.cancelledOrders }).map((_, i) => ({
        id: `tx-c-${idx}-${i}`,
        orderNumber: `ORD-${item.platform.replace(/\s+/g, '').slice(0, 5).toUpperCase()}-C-${1000 + i}`,
        date: item.period === 'PERIOD_1' ? `${year}-09-09` : `${year}-09-23`,
        month,
        period: item.period,
        marketplace: item.platform,
        closingType: item.closingType,
        promotionCategory: item.category,
        promotionName: item.promoName,
        sku: item.sku,
        productName: item.productName,
        price: item.price,
        discountAmount: item.discountAmount,
        quantity: 1,
        orderStatus: i % 2 === 0 ? 'Dibatalkan' : 'Retur',
        isDuplicatePromo: item.isDuplicatePromo
      }))
    ]

    const group = calculateClosingGroup(txs, undefined, item.isDuplicatePromo)
    group.subCategory = item.subCategory
    group.productName = item.productName
    group.isPaketDiskon = item.isPaketDiskon
    group.bundleComponents = item.bundleComponents

    return group
  })
}
