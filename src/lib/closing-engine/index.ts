/**
 * CLOSING CALCULATION ENGINE
 * Implements finance business rules for marketplace closing reconciliation.
 *
 * BUSINESS RULES:
 * 1. Urutan perhitungan WAJIB:
 *    TOTAL PESANAN -> keluarkan PESANAN BATAL -> dapatkan TOTAL PESANAN VALID
 *    -> cek apakah terdapat DISKON YANG SAMA dalam PERIODE YANG SAMA
 *    -> jika YA, TOTAL PESANAN VALID ÷ 2 -> hasil akhir menjadi QTY CLOSING.
 *    Rumus: (Total Orders - Cancelled) ÷ 2 = Final QTY.
 * 2. Cancelled/Batal orders TIDAK BOLEH dihitung untuk QTY closing (COUNT = 0),
 *    tetapi disimpan dalam audit history.
 * 3. Grouping Context: Bulan, Closing Period, Marketplace, Category, Promotion, SKU, Discount.
 * 4. Rule ID: DIVIDE_VALID_ORDERS_BY_2 (tidak di-hardcode di UI, dikelola di engine).
 */

export type ClosingPeriodType = 'PERIOD_1' | 'PERIOD_2'

export type ClosingRuleType = 'DIVIDE_VALID_ORDERS_BY_2' | 'STANDARD_NO_SPLIT'

export interface RawOrderTransaction {
  id: string
  orderNumber: string
  date: Date | string
  month: string
  period?: ClosingPeriodType
  marketplace: string
  promotionCategory: string
  promotionName: string
  sku: string
  price: number
  discountPercent?: number
  discountAmount: number
  quantity: number
  orderStatus: string // e.g., 'Selesai', 'Dibatalkan', 'Batal', 'Cancelled', 'Retur'
  customerUsername?: string
  rawNotes?: string
}

export interface ClosingGroupAudit {
  groupId: string
  month: string
  closingPeriod: ClosingPeriodType
  periodLabel: string
  marketplace: string
  promotionCategory: string
  promotionName: string
  sku: string
  price: number
  discountPercent: number
  discountAmount: number
  priceAfterDiscount: number
  
  // Mathematical breakdown for Finance transparency
  totalOrders: number
  cancelledOrders: number
  validOrders: number
  
  hasSameDiscountInPeriod: boolean
  appliedRule: ClosingRuleType
  formulaDescription: string
  finalClosingQty: number
  totalBiayaPromo: number

  // Audit trail
  transactions: RawOrderTransaction[]
}

export interface ClosingBatchResult {
  groups: ClosingGroupAudit[]
  summary: {
    totalRawOrders: number
    totalValidOrders: number
    totalCancelledOrders: number
    totalFinalClosingQty: number
    totalBiayaPromo: number
  }
}

export interface ClosingEngineConfig {
  defaultRule?: ClosingRuleType
  enableDivideBy2ForSameDiscount?: boolean
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
 * Determine Closing Period:
 * Period 1: Tanggal 1 - 15
 * Period 2: Tanggal 16 - akhir bulan (30 / 31)
 */
export function getClosingPeriod(dateInput: Date | string): ClosingPeriodType {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const day = d.getDate()
  if (isNaN(day)) return 'PERIOD_1'
  return day <= 15 ? 'PERIOD_1' : 'PERIOD_2'
}

export function getClosingPeriodLabel(period: ClosingPeriodType, monthName: string = ''): string {
  if (period === 'PERIOD_1') {
    return `Periode 1 (1–15 ${monthName})`.trim()
  }
  return `Periode 2 (16–akhir ${monthName})`.trim()
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
 * Minimal: Bulan, Closing Period, Marketplace, Promotion Category, Promotion, SKU, Discount
 */
export function buildGroupKey(
  month: string,
  period: ClosingPeriodType,
  marketplace: string,
  promoCategory: string,
  promotionName: string,
  sku: string,
  discountAmount: number
): string {
  const cleanMonth = (month || '').trim().toLowerCase()
  const cleanMarketplace = (marketplace || '').trim().toLowerCase()
  const cleanCat = (promoCategory || '').trim().toLowerCase()
  const cleanPromo = (promotionName || '').trim().toLowerCase()
  const cleanSku = (sku || '').trim().toLowerCase()
  const cleanDiscount = normalizeDiscount(discountAmount).toFixed(2)

  return `${cleanMonth}::${period}::${cleanMarketplace}::${cleanCat}::${cleanPromo}::${cleanSku}::${cleanDiscount}`
}

/**
 * Core calculation for a single group of transactions sharing identical
 * Month, Period, Marketplace, Category, Promo, SKU, and Discount Amount.
 */
export function calculateClosingGroup(
  transactions: RawOrderTransaction[],
  config?: ClosingEngineConfig
): ClosingGroupAudit {
  if (!transactions || transactions.length === 0) {
    throw new Error('Transactions array cannot be empty for group calculation')
  }

  const sample = transactions[0]
  const month = sample.month || 'September'
  const closingPeriod = sample.period || (sample.date ? getClosingPeriod(sample.date) : 'PERIOD_1')
  const marketplace = sample.marketplace || 'Shopee'
  const promotionCategory = sample.promotionCategory || 'Voucher Toko'
  const promotionName = sample.promotionName || 'Promo Diskon'
  const sku = sample.sku || 'All SKU'
  const discountAmount = normalizeDiscount(sample.discountAmount)
  const price = sample.price || 0
  const discountPercent = sample.discountPercent || (price > 0 && discountAmount > 0 ? Math.round((discountAmount / price) * 100) : 0)
  const priceAfterDiscount = Math.max(0, price - discountAmount)

  // 1. Calculate Total Orders & Filter Cancelled
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

  // 2. Check "Diskon yang sama dalam periode yang sama"
  // Transactions in this group strictly share the exact same discount and period
  const hasSameDiscountInPeriod = discountAmount > 0 && validOrdersCount > 0

  // 3. Determine Rule & Apply Formula
  // Rule DIVIDE_VALID_ORDERS_BY_2 applies when identical discount is present in the same period
  const shouldApplyDivideBy2 = config?.enableDivideBy2ForSameDiscount !== false && hasSameDiscountInPeriod
  const appliedRule: ClosingRuleType = shouldApplyDivideBy2 ? 'DIVIDE_VALID_ORDERS_BY_2' : 'STANDARD_NO_SPLIT'

  // 4. Calculate Final Closing QTY
  // Formula WAJIB: (Total Orders - Cancelled) ÷ 2 = Final QTY
  // Note: Mathematical precision: validOrders / 2
  const finalClosingQty = appliedRule === 'DIVIDE_VALID_ORDERS_BY_2'
    ? validOrdersCount / 2
    : validOrdersCount

  // 5. Calculate Total Biaya Promo
  const totalBiayaPromo = finalClosingQty * discountAmount

  // Formula description for Finance audit
  const formulaDescription = appliedRule === 'DIVIDE_VALID_ORDERS_BY_2'
    ? `(${totalOrdersCount} total - ${cancelledOrdersCount} batal) ÷ 2 = ${finalClosingQty}`
    : `(${totalOrdersCount} total - ${cancelledOrdersCount} batal) = ${finalClosingQty}`

  const groupId = buildGroupKey(month, closingPeriod, marketplace, promotionCategory, promotionName, sku, discountAmount)

  return {
    groupId,
    month,
    closingPeriod,
    periodLabel: getClosingPeriodLabel(closingPeriod, month),
    marketplace,
    promotionCategory,
    promotionName,
    sku,
    price,
    discountPercent,
    discountAmount,
    priceAfterDiscount,
    totalOrders: totalOrdersCount,
    cancelledOrders: cancelledOrdersCount,
    validOrders: validOrdersCount,
    hasSameDiscountInPeriod,
    appliedRule,
    formulaDescription,
    finalClosingQty,
    totalBiayaPromo,
    transactions
  }
}

/**
 * Main batch processor:
 * Takes raw order transactions, groups them strictly by context,
 * and computes closing QTY & Biaya with full audit history.
 */
export function processClosingTransactions(
  transactions: RawOrderTransaction[],
  config?: ClosingEngineConfig
): ClosingBatchResult {
  const groupMap = new Map<string, RawOrderTransaction[]>()

  transactions.forEach(tx => {
    const period = tx.period || (tx.date ? getClosingPeriod(tx.date) : 'PERIOD_1')
    const key = buildGroupKey(
      tx.month,
      period,
      tx.marketplace,
      tx.promotionCategory,
      tx.promotionName,
      tx.sku,
      tx.discountAmount
    )

    if (!groupMap.has(key)) {
      groupMap.set(key, [])
    }
    // Ensure tx has period set
    groupMap.get(key)!.push({ ...tx, period })
  })

  const groups: ClosingGroupAudit[] = []
  let totalRaw = 0
  let totalValid = 0
  let totalCancelled = 0
  let totalFinalQty = 0
  let totalBiaya = 0

  groupMap.forEach(groupTxList => {
    const groupResult = calculateClosingGroup(groupTxList, config)
    groups.push(groupResult)

    totalRaw += groupResult.totalOrders
    totalValid += groupResult.validOrders
    totalCancelled += groupResult.cancelledOrders
    totalFinalQty += groupResult.finalClosingQty
    totalBiaya += groupResult.totalBiayaPromo
  })

  return {
    groups,
    summary: {
      totalRawOrders: totalRaw,
      totalValidOrders: totalValid,
      totalCancelledOrders: totalCancelled,
      totalFinalClosingQty: totalFinalQty,
      totalBiayaPromo: totalBiaya
    }
  }
}
