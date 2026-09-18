/**
 * CLOSING CALCULATION ENGINE
 * Dedicated Working Closing Tool for Finance Reconciliation.
 * Synchronized with Google Sheet Patokan: '2026_Promo Theraskin' (September & September Cabang).
 *
 * SCOPE & BUSINESS RULES:
 * 1. Patokan Sheet Format (Kolom B s/d T):
 *    Marketplace | Kategori | Sub Kategori | Periode | Tanggal | SKU | Product Name |
 *    HARGA Bulanan | Diskon | Total Diskon | Harga Promo | Qty | Total Promosi |
 *    Qty 1-15 Sep | Biaya 1-15 Sep | Qty 16-30 Sep | Biaya 16-30 Sep |
 *    GRAND TOTAL QTY TERJUAL | GRAND TOTAL BIAYA PROMOSI
 * 2. Formula Biaya Promosi Brand (Subsidi Diskon):
 *    - Biaya 1-15 = Qty 1-15 × Total Diskon
 *    - Biaya 16-30 = Qty 16-30 × Total Diskon
 *    - Grand Total Biaya Promosi = Biaya 1-15 + Biaya 16-30
 * 3. Smart Price-to-Promo Matching Engine:
 *    - Dari data mentah marketplace, sistem menghitung:
 *        Harga Setelah Diskon (Net) = Harga Asli - Diskon
 *    - Sistem otomatis mencocokkan Net Price ke 'Harga Promo' pada baris katalog aktif.
 * 4. Shopee Multi-Cabang:
 *    - Shopee Pusat (Tab 'September')
 *    - Shopee Semarang, Shopee Bali, Shopee Surabaya (Tab 'September Cabang')
 *    - TikTok Shop dan Lazada TIDAK memiliki cabang.
 * 5. Cancelled Orders Excluded:
 *    - Pesanan batal/cancelled/retur TIDAK dihitung (COUNT = 0).
 *    - Valid Orders = Total Orders - Cancelled Orders.
 * 6. Duplicate Discount Rule:
 *    - Jika promo/diskon terindikasi sama dalam periode yang sama:
 *        Final QTY = Valid QTY ÷ 2
 *    - Jika promo unik:
 *        Final QTY = Valid QTY
 * 7. 1-Click Copy Kolom O s/d T:
 *    - Salin cepat nilai Qty & Biaya (Kolom O sampai T) untuk langsung di-paste di cell O2 Google Sheet.
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

/**
 * ROW STRUCTURE: 100% Identik dengan Format Google Sheet Patokan (Kolom B s/d T)
 */
export interface PatokanClosingRow {
  id: string
  groupId: string // Compatibility key
  sheetTab: 'September' | 'September Cabang' | string
  
  // Kolom B s/d H: Informasi Produk & Promo
  marketplace: string // Kolom B (e.g. 'Lazada', 'Shopee Semarang', 'Shopee Pusat')
  kategori: string // Kolom C (e.g. 'Toko')
  subKategori: string // Kolom D (e.g. 'Voucher', 'Paket diskon', 'Flash Sale')
  periodeBadge: string // Kolom E (e.g. 'DD & Payday', 'DD', 'BAU')
  tanggal: string // Kolom F (e.g. '1-7 Sep & 25-30 Sep', '0-30 September')
  sku: string // Kolom G (e.g. 'TWINSUNAGEPROTECTIONCC', 'All SKU')
  productName: string // Kolom H (Nama Produk Lengkap)

  // Kolom I s/d N: Harga & Target Promo
  hargaBulanan: number // Kolom I: HARGA Bulanan
  diskonPersen: number // Kolom J: Diskon (%)
  totalDiskon: number // Kolom K: Total Diskon (Diskon satuan yang ditanggung brand)
  hargaPromo: number // Kolom L: Harga Promo (Kuning: Harga setelah diskon = HARGA Bulanan - Total Diskon)
  targetQty: number // Kolom M: Qty kuota
  totalPromosi: number // Kolom N: Total Promosi

  // Kolom O s/d R: Hasil Closing Periode 1 & Periode 2 (Yang diisi dari data mentah)
  qtyP1: number // Kolom O: Qty 1-15 Sep (Kuning)
  biayaP1: number // Kolom P: Biaya 1-15 Sep (= Qty 1-15 × Total Diskon)
  qtyP2: number // Kolom Q: Qty 16-30 Sep
  biayaP2: number // Kolom R: Biaya 16-30 Sep (= Qty 16-30 × Total Diskon)

  // Kolom S & T: Grand Total
  grandTotalQty: number // Kolom S: GRAND TOTAL QTY TERJUAL (= Qty 1-15 + Qty 16-30)
  grandTotalBiaya: number // Kolom T: GRAND TOTAL BIAYA PROMOSI (= Biaya 1-15 + Biaya 16-30)

  // Meta & Compatibility
  month: string
  year?: number
  closingType: ClosingType // 'REGULER' | 'CAMPAIGN'
  branchCity?: string
  isShopeeBranch?: boolean
  isPaketDiskon?: boolean
  bundleComponents?: string[]
  isDuplicateP1?: boolean
  isDuplicateP2?: boolean
  
  // Mathematical audit details
  totalOrdersP1: number
  cancelledOrdersP1: number
  validOrdersP1: number
  totalOrdersP2: number
  cancelledOrdersP2: number
  validOrdersP2: number

  // Compatibility aliases for legacy views & tests
  finalClosingQty: number // = grandTotalQty
  biaya: number // = grandTotalBiaya
  totalBiayaPromo: number // = grandTotalBiaya
  price: number // = hargaBulanan
  discountAmount: number // = totalDiskon
  priceAfterDiscount: number // = hargaPromo
  discountPercent: number // = diskonPersen
  promotionCategory: string // = subKategori
  promotionName: string // = productName
  closingPeriod: ClosingPeriodType
  periodLabel: string
  periodDateRange?: string
  totalOrders: number
  cancelledOrders: number
  validOrders: number
  appliedRule: ClosingRuleType
  formulaDescription: string
  hasSameDiscountInPeriod: boolean
  isDuplicatePromo?: boolean
  needsReview?: boolean
  reviewReasons?: string[]
  transactions: RawOrderTransaction[]
}

export type ClosingGroupAudit = PatokanClosingRow
export type ClosingSummaryRow = PatokanClosingRow

export interface ClosingBatchResult {
  groups: PatokanClosingRow[]
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
 * Parse date strings flexibly supporting DD/MM/YYYY, DD-MM-YYYY, and ISO formats
 */
export function parseDateFlexible(dateInput: Date | string): Date | null {
  if (!dateInput) return null
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput
  const str = String(dateInput).trim()
  
  // Format DD/MM/YYYY or DD-MM-YYYY (e.g. 14/09/2026 or 14/09/2026 23:47:20)
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/)
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10)
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1
    const year = parseInt(ddmmyyyyMatch[3], 10)
    const hour = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 0
    const minute = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0
    const second = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0
    const parsed = new Date(year, month, day, hour, minute, second)
    if (!isNaN(parsed.getTime())) return parsed
  }

  // Standard ISO or format parseable by new Date()
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Determine Closing Period:
 * Period 1: Tanggal 1 - 15 (e.g. data mentah 1-14 September yang ditarik sebelum tgl 15 berakhir)
 * Period 2: Tanggal 16 - akhir bulan (28, 29, 30, 31)
 */
export function getClosingPeriod(dateInput: Date | string): ClosingPeriodType {
  const d = parseDateFlexible(dateInput)
  if (!d) return 'PERIOD_1'
  const day = d.getDate()
  return day <= 15 ? 'PERIOD_1' : 'PERIOD_2'
}

export function getClosingPeriodLabel(period: ClosingPeriodType, monthName: string = '', year: number = 2026): string {
  const lastDay = getDaysInMonth(year, monthName || 'September')
  if (period === 'PERIOD_1') {
    return `Periode 1 (1–15 ${monthName})`.trim()
  }
  return `Periode 2 (16–${lastDay} ${monthName})`.trim()
}

export function isOrderCancelled(status: string, customKeywords?: string[]): boolean {
  if (!status) return false
  const s = status.toString().trim().toLowerCase()
  const keywords = customKeywords || DEFAULT_CANCELLED_KEYWORDS
  return keywords.some(k => s.includes(k.toLowerCase()))
}

export function normalizeDiscount(val: number | string): number {
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val
  return isNaN(num) ? 0 : Math.max(0, num)
}

export type DetectedMarketplace = 'TIKTOK' | 'SHOPEE' | 'LAZADA' | 'UNKNOWN'

export interface PlatformDetectionResult {
  platform: DetectedMarketplace
  platformLabel: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  detectedHeaders: string[]
  suggestedTargetMarketplace: MarketplacePlatform
  description: string
}

export interface NormalizedRawOrder {
  rawId: string
  orderNumber: string
  platform: 'Shopee' | 'TikTok Shop' | 'Lazada'
  branchCity?: string
  dateRaw: string
  period: ClosingPeriodType // 'PERIOD_1' (1-15 Sep) vs 'PERIOD_2' (16-30/31 Sep)
  sku: string
  productName: string
  variation?: string
  quantity: number
  unitOriginalPrice: number
  unitDiscount: number
  netPricePerUnit: number // Harga Setelah Diskon per pcs (to match Kolom L)
  netPriceTotal: number
  orderStatus: string
  isCancelled: boolean
  rawRow: Record<string, any>
}

/**
 * Helper to safely extract numeric values, supporting Indonesian dots/commas and currency formatting
 */
export function cleanNumeric(val: any): number {
  if (val === undefined || val === null || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  let s = String(val).trim()
  
  // Remove currency labels like 'Rp', 'IDR', spaces
  s = s.replace(/^[^\d-]+/, '').trim()
  
  // Detect Indonesian format with '.' as thousands separator: e.g. "151.524" or "1.500.000" or "40.200,00"
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(s)) {
    // US format with comma separator: "151,524" -> "151524"
    s = s.replace(/,/g, '')
  } else if (s.includes(',') && !s.includes('.')) {
    // Single comma decimal: "151524,50" -> "151524.50"
    s = s.replace(',', '.')
  }
  
  const cleaned = s.replace(/[^0-9.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Automatic Marketplace Signature Detector:
 * Inspects column headers to distinguish between TikTok Shop, Shopee, and Lazada
 */
export function detectMarketplacePlatform(
  sampleRow: Record<string, any>,
  filename: string = '',
  sheetName: string = ''
): PlatformDetectionResult {
  const keys = Object.keys(sampleRow || {})
  const keysLower = keys.map(k => k.toLowerCase())
  const fn = (filename || '').toLowerCase()
  const sn = (sheetName || '').toLowerCase()

  // 1. TikTok Shop signatures
  const tiktokKeys = [
    'sku subtotal after discount',
    'sku platform discount',
    'sku seller discount',
    'sku quantity returned',
    'sku unit original price',
    'order substatus',
    'orderskulist'
  ]
  const matchedTikTokKeys = keys.filter(k => tiktokKeys.includes(k.toLowerCase()))
  const isTikTok = matchedTikTokKeys.length >= 2 || 
                   keysLower.includes('sku subtotal after discount') || 
                   sn.includes('orderskulist') || 
                   fn.includes('tiktok')

  if (isTikTok) {
    return {
      platform: 'TIKTOK',
      platformLabel: 'TikTok Shop',
      confidence: matchedTikTokKeys.length >= 2 ? 'HIGH' : 'MEDIUM',
      detectedHeaders: matchedTikTokKeys,
      suggestedTargetMarketplace: 'TikTok Shop',
      description: 'Format terdeteksi: TikTok Shop Seller Center (OrderSKUList). Menggunakan kolom SKU Subtotal After Discount dan Created Time.'
    }
  }

  // 2. Shopee signatures
  const shopeeKeys = [
    'no. pesanan',
    'nomor referensi sku',
    'sku induk',
    'waktu pesanan dibuat',
    'harga setelah diskon',
    'potongan penjual',
    'diskon dari penjual',
    'total pembayaran',
    'perkiraan pendapatan bersih',
    'opsi pengiriman'
  ]
  const matchedShopeeKeys = keys.filter(k => shopeeKeys.includes(k.toLowerCase()))
  const isShopee = matchedShopeeKeys.length >= 2 || 
                   keysLower.includes('nomor referensi sku') || 
                   keysLower.includes('waktu pesanan dibuat') || 
                   fn.includes('shopee')

  if (isShopee) {
    let targetBranch: ShopeeBranch = 'Shopee Semarang'
    if (fn.includes('semarang') || fn.includes('smg')) targetBranch = 'Shopee Semarang'
    else if (fn.includes('bali') || fn.includes('dps')) targetBranch = 'Shopee Bali'
    else if (fn.includes('surabaya') || fn.includes('sby')) targetBranch = 'Shopee Surabaya'
    else if (fn.includes('pusat') || fn.includes('jakarta') || fn.includes('jkt')) targetBranch = 'Shopee Pusat'

    return {
      platform: 'SHOPEE',
      platformLabel: 'Shopee',
      confidence: matchedShopeeKeys.length >= 2 ? 'HIGH' : 'MEDIUM',
      detectedHeaders: matchedShopeeKeys,
      suggestedTargetMarketplace: targetBranch,
      description: `Format terdeteksi: Shopee Seller Centre (${targetBranch}). Menggunakan kolom Nomor Referensi SKU, Harga Setelah Diskon, dan Waktu Pesanan Dibuat.`
    }
  }

  // 3. Lazada signatures
  const lazadaKeys = [
    'orderitemid',
    'paidprice',
    'sellersku',
    'ordernumber',
    'unitprice',
    'createtime',
    'voucherseller'
  ]
  const matchedLazadaKeys = keys.filter(k => lazadaKeys.includes(k.toLowerCase()))
  const isLazada = matchedLazadaKeys.length >= 2 || 
                   keysLower.includes('paidprice') || 
                   keysLower.includes('orderitemid') || 
                   fn.includes('lazada')

  if (isLazada) {
    return {
      platform: 'LAZADA',
      platformLabel: 'Lazada',
      confidence: matchedLazadaKeys.length >= 2 ? 'HIGH' : 'MEDIUM',
      detectedHeaders: matchedLazadaKeys,
      suggestedTargetMarketplace: 'Lazada',
      description: 'Format terdeteksi: Lazada Seller Center. Menggunakan kolom sellerSku, paidPrice, dan createTime.'
    }
  }

  // Fallback
  return {
    platform: 'UNKNOWN',
    platformLabel: 'Format Belum Dikenali',
    confidence: 'LOW',
    detectedHeaders: [],
    suggestedTargetMarketplace: 'Shopee Semarang',
    description: 'Header kolom tidak cocok otomatis dengan Shopee, TikTok, atau Lazada. Silakan periksa kolom atau pilih target manual.'
  }
}

/**
 * Specialized Normalizer for Each Marketplace:
 * Accurately extracts SKU, net price, order date, and cancellation status
 */
export function normalizeRawOrder(
  row: Record<string, any>,
  platform: DetectedMarketplace,
  targetMarketplaceOverride?: MarketplacePlatform
): NormalizedRawOrder {
  let orderNumber = ''
  let sku = ''
  let productName = ''
  let variation = ''
  let quantity = 1
  let unitOriginalPrice = 0
  let unitDiscount = 0
  let netPricePerUnit = 0
  let netPriceTotal = 0
  let dateRaw = ''
  let orderStatus = 'Selesai'
  let isCancelled = false
  let resolvedPlatform: 'Shopee' | 'TikTok Shop' | 'Lazada' = 'Shopee'
  let branchCity: string | undefined = undefined

  if (platform === 'TIKTOK') {
    resolvedPlatform = 'TikTok Shop'
    orderNumber = String(row['Order ID'] || row['Order id'] || row['order_id'] || '').trim()
    orderStatus = String(row['Order Status'] || row['order_status'] || 'Dikirim').trim()
    isCancelled = isOrderCancelled(orderStatus)
    dateRaw = String(row['Created Time'] || row['Order created time'] || row['Paid Time'] || '').trim()
    sku = String(row['Seller SKU'] || row['SKU ID'] || row['seller_sku'] || '').trim()
    productName = String(row['Product Name'] || row['product_name'] || '').trim()
    variation = String(row['Variation'] || row['variation'] || '').trim()
    quantity = Math.max(1, parseInt(String(row['Quantity'] || row['quantity'] || '1')) || 1)

    // Net Price in TikTok: SKU Subtotal After Discount
    const rawSubtotal = cleanNumeric(row['SKU Subtotal After Discount'] || row['sku_subtotal_after_discount'] || row['Subtotal After Discount'])
    const rawUnitOri = cleanNumeric(row['SKU Unit Original Price'] || row['sku_unit_original_price'])
    const rawSellerDisc = cleanNumeric(row['SKU Seller Discount'] || row['sku_seller_discount'])

    if (rawSubtotal > 0) {
      netPriceTotal = rawSubtotal
      netPricePerUnit = quantity > 0 ? Math.round(rawSubtotal / quantity) : rawSubtotal
      unitOriginalPrice = rawUnitOri > 0 ? rawUnitOri : netPricePerUnit
      unitDiscount = rawSellerDisc > 0 ? rawSellerDisc : Math.max(0, unitOriginalPrice - netPricePerUnit)
    } else {
      unitOriginalPrice = rawUnitOri
      unitDiscount = rawSellerDisc
      netPricePerUnit = Math.max(0, unitOriginalPrice - unitDiscount)
      netPriceTotal = netPricePerUnit * quantity
    }

  } else if (platform === 'LAZADA') {
    resolvedPlatform = 'Lazada'
    orderNumber = String(row['orderNumber'] || row['Order Number'] || row['orderItemId'] || row['Order Item Id'] || '').trim()
    orderStatus = String(row['status'] || row['Status'] || 'delivered').trim()
    isCancelled = isOrderCancelled(orderStatus)
    dateRaw = String(row['createTime'] || row['Create Time'] || row['updateTime'] || '').trim()
    sku = String(row['sellerSku'] || row['Seller SKU'] || row['sku'] || '').trim()
    productName = String(row['itemName'] || row['Item Name'] || row['productName'] || '').trim()
    variation = String(row['variation'] || row['Variation'] || '').trim()
    quantity = Math.max(1, parseInt(String(row['quantity'] || row['Quantity'] || '1')) || 1)

    // Net Price in Lazada: paidPrice
    const rawPaid = cleanNumeric(row['paidPrice'] || row['Paid Price'] || row['itemPrice'])
    const rawUnit = cleanNumeric(row['unitPrice'] || row['Unit Price'])
    const rawVoucher = cleanNumeric(row['voucherSeller'] || row['Voucher Seller'])

    if (rawPaid > 0) {
      netPricePerUnit = rawPaid
      netPriceTotal = rawPaid * quantity
      unitOriginalPrice = rawUnit > 0 ? rawUnit : rawPaid
      unitDiscount = rawVoucher > 0 ? rawVoucher : Math.max(0, unitOriginalPrice - netPricePerUnit)
    } else {
      unitOriginalPrice = rawUnit
      unitDiscount = rawVoucher
      netPricePerUnit = Math.max(0, unitOriginalPrice - unitDiscount)
      netPriceTotal = netPricePerUnit * quantity
    }

  } else {
    // SHOPEE
    resolvedPlatform = 'Shopee'
    orderNumber = String(row['No. Pesanan'] || row['Order ID'] || row['no_pesanan'] || '').trim()
    orderStatus = String(row['Status Pesanan'] || row['status_pesanan'] || 'Selesai').trim()
    isCancelled = isOrderCancelled(orderStatus)
    dateRaw = String(row['Waktu Pesanan Dibuat'] || row['Waktu Pembayaran Dilakukan'] || row['Tanggal'] || '').trim()
    sku = String(row['Nomor Referensi SKU'] || row['SKU Induk'] || row['SKU'] || '').trim()
    productName = String(row['Nama Produk'] || row['nama_produk'] || '').trim()
    variation = String(row['Nama Variasi'] || row['nama_variasi'] || '').trim()
    quantity = Math.max(1, parseInt(String(row['Jumlah'] || row['Quantity'] || '1')) || 1)

    // Net Price in Shopee: Harga Setelah Diskon or Harga Awal - Potongan Penjual
    const rawHargaSetelah = cleanNumeric(row['Harga Setelah Diskon'] || row['Harga Kesepakatan'])
    const rawHargaAwal = cleanNumeric(row['Harga Awal'] || row['Harga Produk'])
    const rawDiskon = cleanNumeric(row['Potongan Penjual'] || row['Diskon Dari Penjual'] || row['Total Diskon'])
    const rawTotalProduk = cleanNumeric(row['Total Harga Produk'])

    if (rawHargaSetelah > 0) {
      netPricePerUnit = rawHargaSetelah
      netPriceTotal = rawHargaSetelah * quantity
      unitOriginalPrice = rawHargaAwal > 0 ? rawHargaAwal : rawHargaSetelah
      unitDiscount = rawDiskon > 0 ? rawDiskon : Math.max(0, unitOriginalPrice - netPricePerUnit)
    } else if (rawTotalProduk > 0 && rawHargaAwal > 0) {
      netPricePerUnit = Math.round(rawTotalProduk / quantity)
      netPriceTotal = rawTotalProduk
      unitOriginalPrice = rawHargaAwal
      unitDiscount = Math.max(0, unitOriginalPrice - netPricePerUnit)
    } else {
      unitOriginalPrice = rawHargaAwal
      unitDiscount = rawDiskon
      netPricePerUnit = Math.max(0, unitOriginalPrice - unitDiscount)
      netPriceTotal = netPricePerUnit * quantity
    }

    if (targetMarketplaceOverride && targetMarketplaceOverride.includes('Semarang')) branchCity = 'Semarang'
    else if (targetMarketplaceOverride && targetMarketplaceOverride.includes('Bali')) branchCity = 'Bali'
    else if (targetMarketplaceOverride && targetMarketplaceOverride.includes('Surabaya')) branchCity = 'Surabaya'
    else branchCity = 'Pusat'
  }

  const period = getClosingPeriod(dateRaw)

  return {
    rawId: `${resolvedPlatform}-${orderNumber || Math.random().toString(36).slice(2, 8)}`,
    orderNumber,
    platform: resolvedPlatform,
    branchCity,
    dateRaw,
    period,
    sku,
    productName,
    variation,
    quantity,
    unitOriginalPrice,
    unitDiscount,
    netPricePerUnit,
    netPriceTotal,
    orderStatus,
    isCancelled,
    rawRow: row
  }
}

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
 * Core calculation for a single group/row
 */
export function calculateClosingGroup(
  transactions: RawOrderTransaction[],
  config?: ClosingEngineConfig,
  forceIsDuplicate?: boolean
): PatokanClosingRow {
  if (!transactions || transactions.length === 0) {
    throw new Error('Transactions array cannot be empty for group calculation')
  }

  const sample = transactions[0]
  const month = sample.month || 'September'
  const year = 2026
  const closingPeriod = sample.period || (sample.date ? getClosingPeriod(sample.date) : 'PERIOD_1')
  const marketplace = sample.marketplace || 'Shopee Pusat'
  const subKategori = sample.promotionCategory || 'Voucher Toko'
  const promoName = sample.promotionName || 'Promo Diskon'
  const sku = sample.sku || 'All SKU'
  const productName = sample.productName || promoName
  const totalDiskon = normalizeDiscount(sample.discountAmount)
  const hargaBulanan = sample.price || 0
  const diskonPersen = sample.discountPercent || (hargaBulanan > 0 && totalDiskon > 0 ? Math.round((totalDiskon / hargaBulanan) * 100) : 0)
  const hargaPromo = Math.max(0, hargaBulanan - totalDiskon)

  const closingType: ClosingType = sample.closingType || classifyClosingType(subKategori, promoName, hargaBulanan, totalDiskon)

  const isShopee = isShopeePlatform(marketplace)
  let branchCity: string | undefined = undefined
  if (isShopee) {
    if (marketplace.includes('Semarang')) branchCity = 'Semarang'
    else if (marketplace.includes('Bali')) branchCity = 'Bali'
    else if (marketplace.includes('Surabaya')) branchCity = 'Surabaya'
    else branchCity = 'Pusat'
  }

  // Count orders per period
  let totalP1 = 0, cancelledP1 = 0, validP1 = 0
  let totalP2 = 0, cancelledP2 = 0, validP2 = 0

  transactions.forEach(tx => {
    const qty = tx.quantity || 1
    const p = tx.period || (tx.date ? getClosingPeriod(tx.date) : 'PERIOD_1')
    const isCancel = isOrderCancelled(tx.orderStatus, config?.cancelledStatusKeywords)

    if (p === 'PERIOD_1') {
      totalP1 += qty
      if (isCancel) cancelledP1 += qty
      else validP1 += qty
    } else {
      totalP2 += qty
      if (isCancel) cancelledP2 += qty
      else validP2 += qty
    }
  })

  // Duplicate promo rule
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
    isDuplicate = config?.enableDivideBy2ForSameDiscount !== false && totalDiskon > 0 && (validP1 > 0 || validP2 > 0)
  }

  const appliedRule: ClosingRuleType = isDuplicate ? 'DIVIDE_VALID_ORDERS_BY_2' : 'STANDARD_NO_SPLIT'

  // Final Qty calculations per period
  const qtyP1 = appliedRule === 'DIVIDE_VALID_ORDERS_BY_2' ? validP1 / 2 : validP1
  const qtyP2 = appliedRule === 'DIVIDE_VALID_ORDERS_BY_2' ? validP2 / 2 : validP2

  // Formula Biaya Resmi Patokan: Biaya = Qty × Total Diskon
  const biayaP1 = qtyP1 * totalDiskon
  const biayaP2 = qtyP2 * totalDiskon
  const grandTotalQty = qtyP1 + qtyP2
  const grandTotalBiaya = biayaP1 + biayaP2

  const isPaketDiskon = subKategori.toLowerCase().includes('paket') || promoName.toLowerCase().includes('paket')
  const reviewReasons: string[] = []
  if (isDuplicate) reviewReasons.push('DUPLICATE_PROMO')
  if (isPaketDiskon) reviewReasons.push('PAKET_DISKON')

  const totalOrdersCount = totalP1 + totalP2
  const cancelledOrdersCount = cancelledP1 + cancelledP2
  const validOrdersCount = validP1 + validP2

  const formulaDescription = appliedRule === 'DIVIDE_VALID_ORDERS_BY_2'
    ? `(${totalOrdersCount} total - ${cancelledOrdersCount} batal) ÷ 2 = ${grandTotalQty}`
    : `(${totalOrdersCount} total - ${cancelledOrdersCount} batal) = ${grandTotalQty}`

  const periodLabels = getDynamicPeriodLabels(year, month)
  const periodDateRange = closingPeriod === 'PERIOD_1' ? periodLabels.p1DateRange : periodLabels.p2DateRange
  const groupId = buildGroupKey(month, closingPeriod, marketplace, closingType, subKategori, promoName, sku, totalDiskon)

  return {
    id: `row-${groupId}`,
    groupId,
    sheetTab: isShopee && branchCity !== 'Pusat' ? 'September Cabang' : 'September',
    marketplace,
    kategori: 'Toko',
    subKategori,
    periodeBadge: closingType === 'CAMPAIGN' ? 'DD & Payday' : 'BAU',
    tanggal: closingPeriod === 'PERIOD_1' ? '1-15 September' : '16-30 September',
    sku,
    productName,
    hargaBulanan,
    diskonPersen,
    totalDiskon,
    hargaPromo,
    targetQty: 100,
    totalPromosi: 10,
    qtyP1,
    biayaP1,
    qtyP2,
    biayaP2,
    grandTotalQty,
    grandTotalBiaya,
    month,
    year,
    closingType,
    branchCity,
    isShopeeBranch: isShopee,
    isPaketDiskon,
    isDuplicateP1: isDuplicate,
    isDuplicateP2: isDuplicate,
    totalOrdersP1: totalP1,
    cancelledOrdersP1: cancelledP1,
    validOrdersP1: validP1,
    totalOrdersP2: totalP2,
    cancelledOrdersP2: cancelledP2,
    validOrdersP2: validP2,
    finalClosingQty: grandTotalQty > 0 ? grandTotalQty : (closingPeriod === 'PERIOD_1' ? qtyP1 : qtyP2),
    biaya: grandTotalBiaya > 0 ? grandTotalBiaya : (closingPeriod === 'PERIOD_1' ? biayaP1 : biayaP2),
    totalBiayaPromo: grandTotalBiaya > 0 ? grandTotalBiaya : (closingPeriod === 'PERIOD_1' ? biayaP1 : biayaP2),
    price: hargaBulanan,
    discountAmount: totalDiskon,
    priceAfterDiscount: hargaPromo,
    discountPercent: diskonPersen,
    promotionCategory: subKategori,
    promotionName: promoName,
    closingPeriod,
    periodLabel: getClosingPeriodLabel(closingPeriod, month, year),
    periodDateRange,
    totalOrders: totalOrdersCount,
    cancelledOrders: cancelledOrdersCount,
    validOrders: validOrdersCount,
    appliedRule,
    formulaDescription,
    hasSameDiscountInPeriod: isDuplicate,
    isDuplicatePromo: isDuplicate,
    needsReview: reviewReasons.length > 0,
    reviewReasons,
    transactions
  }
}

/**
 * Main batch processor
 */
export function processClosingTransactions(
  transactions: RawOrderTransaction[],
  config?: ClosingEngineConfig
): ClosingBatchResult {
  const promoPeriodCount = new Map<string, number>()
  transactions.forEach(tx => {
    const period = tx.period || (tx.date ? getClosingPeriod(tx.date) : 'PERIOD_1')
    const closingType = tx.closingType || classifyClosingType(tx.promotionCategory, tx.promotionName, tx.price, tx.discountAmount)
    const promoKey = `${tx.marketplace}::${period}::${closingType}::${tx.promotionName}`
    promoPeriodCount.set(promoKey, (promoPeriodCount.get(promoKey) || 0) + 1)
  })

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

  const groups: PatokanClosingRow[] = []
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
 * 1-Click COPY KHUSUS KOLOM O s/d T (Qty 1-15, Biaya 1-15, Qty 16-30, Biaya 16-30, Grand Total Qty, Grand Total Biaya)
 * Langsung siap di-paste di cell O2 Google Sheet patokan!
 */
export function generatePatokanValuesTSV(rows: PatokanClosingRow[]): string {
  const lines = rows.map(r => {
    return [
      r.qtyP1 || 0,
      Math.round(r.biayaP1 || 0),
      r.qtyP2 || 0,
      Math.round(r.biayaP2 || 0),
      r.grandTotalQty || 0,
      Math.round(r.grandTotalBiaya || 0)
    ].join('\t')
  })

  return lines.join('\n')
}

/**
 * 1-Click COPY SELURUH SPREADSHEET PATOKAN (Kolom B s/d T) dengan Header
 */
export function generateFullPatokanTSV(rows: PatokanClosingRow[]): string {
  const header = [
    'Marketplace',
    'Kategori',
    'Sub Kategori',
    'Periode',
    'Tanggal',
    'SKU',
    'Product Name',
    'HARGA Bulanan',
    'Diskon',
    'Total Diskon',
    'Harga Promo',
    'Qty',
    'Total Promosi',
    'Qty 1-15 Sep',
    'Biaya 1-15 Sep',
    'Qty 16-30 Sep',
    'Biaya 16-30 Sep',
    'GRAND TOTAL QTY TERJUAL',
    'GRAND TOTAL BIAYA PROMOSI'
  ].join('\t')

  const lines = rows.map(r => [
    r.marketplace,
    r.kategori,
    r.subKategori,
    r.periodeBadge,
    r.tanggal,
    r.sku,
    r.productName,
    r.hargaBulanan,
    r.diskonPersen > 0 ? `${r.diskonPersen}%` : '',
    r.totalDiskon,
    r.hargaPromo,
    r.targetQty,
    r.totalPromosi,
    r.qtyP1 || 0,
    Math.round(r.biayaP1 || 0),
    r.qtyP2 || 0,
    Math.round(r.biayaP2 || 0),
    r.grandTotalQty || 0,
    Math.round(r.grandTotalBiaya || 0)
  ].join('\t'))

  return `${header}\n${lines.join('\n')}`
}

/**
 * Master Closing TSV (6 Kolom: Platform \t Kode Promosi \t Nama Promosi \t SKU \t Quantity \t Biaya)
 */
export function generateMasterClosingTSV(
  rows: PatokanClosingRow[],
  closingTypeFilter?: ClosingType
): string {
  const filtered = closingTypeFilter ? rows.filter(r => r.closingType === closingTypeFilter) : rows

  const lines = filtered.map(r => {
    const platform = r.marketplace || ''
    const kodePromosi = r.subKategori || r.promotionCategory || ''
    const namaPromosi = r.productName || r.promotionName || ''
    const sku = r.sku || ''
    const quantity = r.grandTotalQty || r.finalClosingQty || 0
    const biaya = Math.round(r.grandTotalBiaya || r.biaya || 0)

    return `${platform}\t${kodePromosi}\t${namaPromosi}\t${sku}\t${quantity}\t${biaya}`
  })

  return lines.join('\n')
}

export function generateStandardMasterClosingTSV(
  rows: PatokanClosingRow[],
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
    r.subKategori,
    r.productName,
    r.sku,
    r.hargaBulanan,
    r.diskonPersen > 0 ? `${r.diskonPersen}%` : '',
    r.totalDiskon,
    r.hargaPromo,
    r.grandTotalQty,
    Math.round(r.grandTotalBiaya)
  ].join('\t'))

  return `${header}\n${lines.join('\n')}`
}

export function generateFullAuditTSV(rows: PatokanClosingRow[]): string {
  return generateFullPatokanTSV(rows)
}

/**
 * SEED DATA: 100% Mengikuti Data Screenshot Asli '2026_Promo Theraskin'
 * Mencakup Tab 'September' dan Tab 'September Cabang' (Shopee Semarang, Bali, Surabaya, Pusat, TikTok, Lazada)
 */
export function generateTheraskinClosingSeed(month: string = 'September', year: number = 2026): PatokanClosingRow[] {
  const mockMasterData: Array<{
    sheetTab: 'September' | 'September Cabang'
    marketplace: string
    kategori: string
    subKategori: string
    periodeBadge: string
    tanggal: string
    sku: string
    productName: string
    hargaBulanan: number
    diskonPersen: number
    totalDiskon: number
    targetQty: number
    totalPromosi: number
    ordersP1: number
    cancelP1: number
    ordersP2: number
    cancelP2: number
    isDuplicate: boolean
    closingType: ClosingType
  }> = [
    // =========================================================================
    // 1. DATA ASLI DARI SCREENSHOT (Lazada / Shopee Pusat - Tab 'September')
    // =========================================================================
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Voucher',
      periodeBadge: 'DD & Payday',
      tanggal: '0-30 September',
      sku: 'All SKU',
      productName: 'Vou. max 5k min belanja 100K',
      hargaBulanan: 100000,
      diskonPersen: 5,
      totalDiskon: 5000,
      targetQty: 100,
      totalPromosi: 10,
      ordersP1: 30,
      cancelP1: 2, // 28 valid -> (28) = 28 pcs, Biaya P1 = 28 * 5.000 = 140.000
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'REGULER'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Voucher',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 September & 25-30 September',
      sku: 'C Booster',
      productName: 'Co Founded voucher max 10K min order 120k',
      hargaBulanan: 120000,
      diskonPersen: 8,
      totalDiskon: 10000,
      targetQty: 100,
      totalPromosi: 10,
      ordersP1: 0,
      cancelP1: 0,
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'REGULER'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Voucher',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 September & 25-30 September',
      sku: 'All SKU',
      productName: 'Voucher max 10K min order 150K',
      hargaBulanan: 150000,
      diskonPersen: 7,
      totalDiskon: 10000,
      targetQty: 100,
      totalPromosi: 10,
      ordersP1: 2,
      cancelP1: 0, // 2 valid -> Biaya P1 = 2 * 10.000 = 20.000
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'REGULER'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'PAK033POT010PCS',
      productName: 'THERASKIN Age Revival Protection Day Cream Pot New Mould 10 g Shrink',
      hargaBulanan: 40200,
      diskonPersen: 4,
      totalDiskon: 1608,
      targetQty: 10,
      totalPromosi: 10,
      ordersP1: 3,
      cancelP1: 0, // 3 valid -> Biaya P1 = 3 * 1.608 = 4.824
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'PAK032T010C',
      productName: 'THERASKIN Age Revival Gentle Cleanser Tube 100 ml',
      hargaBulanan: 41300,
      diskonPersen: 4,
      totalDiskon: 1652,
      targetQty: 10,
      totalPromosi: 10,
      ordersP1: 2,
      cancelP1: 0, // 2 valid -> Biaya P1 = 2 * 1.652 = 3.304
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'PAK034POT010CS',
      productName: 'THERASKIN Age Revival Moisture Lock Night Cream Pot New Mould 10 g Shrink',
      hargaBulanan: 41500,
      diskonPersen: 4,
      totalDiskon: 1660,
      targetQty: 10,
      totalPromosi: 10,
      ordersP1: 2,
      cancelP1: 0, // 2 valid -> Biaya P1 = 2 * 1.660 = 3.320
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'PAK036B100CS',
      productName: 'THERASKIN Age Revival Toner Essence Botol PET 100 ml Shrink',
      hargaBulanan: 43700,
      diskonPersen: 4,
      totalDiskon: 1748,
      targetQty: 10,
      totalPromosi: 10,
      ordersP1: 1,
      cancelP1: 0, // 1 valid -> Biaya P1 = 1 * 1.748 = 1.748
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'PAK035S010CS',
      productName: 'THERASKIN Age Revival Intense Retinol Serum Botol 15 ml Shrink',
      hargaBulanan: 65400,
      diskonPersen: 4,
      totalDiskon: 2616,
      targetQty: 10,
      totalPromosi: 10,
      ordersP1: 1,
      cancelP1: 0, // 1 valid -> Biaya P1 = 1 * 2.616 = 2.616
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FPK037P0010CP0',
      productName: 'Theraskin Perfect Glow Face Cream',
      hargaBulanan: 51200,
      diskonPersen: 3,
      totalDiskon: 1536,
      targetQty: 10,
      totalPromosi: 10,
      ordersP1: 3,
      cancelP1: 0, // 3 valid -> Biaya P1 = 3 * 1.536 = 4.608
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FPK038P0010CP0',
      productName: 'Theraskin Perfect Glow Protection Day Cream',
      hargaBulanan: 38500,
      diskonPersen: 4,
      totalDiskon: 1480,
      targetQty: 10,
      totalPromosi: 10,
      ordersP1: 0,
      cancelP1: 0,
      ordersP2: 2,
      cancelP2: 0, // 2 valid -> Biaya P2 = 2 * 1.480 = 2.960
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FPK040T0010CS0',
      productName: 'Theraskin Perfect Glow Toner Essence',
      hargaBulanan: 38200,
      diskonPersen: 4,
      totalDiskon: 1448,
      targetQty: 10,
      totalPromosi: 10,
      ordersP1: 2,
      cancelP1: 0, // 2 valid -> Biaya P1 = 2 * 1.448 = 2.896
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'Lazada',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FPK039S010CS0',
      productName: 'Theraskin Perfect Glow Brightening Serum',
      hargaBulanan: 54500,
      diskonPersen: 5,
      totalDiskon: 2530,
      targetQty: 10,
      totalPromosi: 10,
      ordersP1: 2,
      cancelP1: 0, // 2 valid -> Biaya P1 = 2 * 2.530 = 5.060
      ordersP2: 0,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },

    // =========================================================================
    // 2. SHOPEE SEMARANG (Tab 'September Cabang')
    // =========================================================================
    {
      sheetTab: 'September Cabang',
      marketplace: 'Shopee Semarang',
      kategori: 'Toko',
      subKategori: 'Voucher',
      periodeBadge: 'DD & Payday',
      tanggal: '0-30 September',
      sku: 'All SKU',
      productName: 'Voucher Toko Semarang Diskon 5K min 100K',
      hargaBulanan: 100000,
      diskonPersen: 5,
      totalDiskon: 5000,
      targetQty: 50,
      totalPromosi: 10,
      ordersP1: 20,
      cancelP1: 2, // (20-2)/2 = 9 (Duplikat promo di periode 1)
      ordersP2: 12,
      cancelP2: 0, // (12)/2 = 6
      isDuplicate: true,
      closingType: 'REGULER'
    },
    {
      sheetTab: 'September Cabang',
      marketplace: 'Shopee Semarang',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'PAK033POT010PCS',
      productName: 'THERASKIN Age Revival Protection Day Cream 10g (Semarang)',
      hargaBulanan: 40200,
      diskonPersen: 4,
      totalDiskon: 1608,
      targetQty: 20,
      totalPromosi: 10,
      ordersP1: 15,
      cancelP1: 1, // 14 valid
      ordersP2: 10,
      cancelP2: 0, // 10 valid
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September Cabang',
      marketplace: 'Shopee Semarang',
      kategori: 'Toko',
      subKategori: 'Paket diskon',
      periodeBadge: 'BAU',
      tanggal: '10-24 Sep',
      sku: 'BUNDLEPERFECTGLOW',
      productName: 'Theraskin Perfect Glow Complete Series Bundle',
      hargaBulanan: 138800,
      diskonPersen: 6,
      totalDiskon: 8328,
      targetQty: 20,
      totalPromosi: 5,
      ordersP1: 10,
      cancelP1: 0,
      ordersP2: 8,
      cancelP2: 1,
      isDuplicate: false,
      closingType: 'REGULER'
    },

    // =========================================================================
    // 3. SHOPEE BALI (Tab 'September Cabang')
    // =========================================================================
    {
      sheetTab: 'September Cabang',
      marketplace: 'Shopee Bali',
      kategori: 'Toko',
      subKategori: 'Voucher',
      periodeBadge: 'DD & Payday',
      tanggal: '0-30 September',
      sku: 'All SKU',
      productName: 'Voucher Toko Bali 5K min 100K',
      hargaBulanan: 100000,
      diskonPersen: 5,
      totalDiskon: 5000,
      targetQty: 50,
      totalPromosi: 10,
      ordersP1: 16,
      cancelP1: 0, // 16 valid / 2 = 8
      ordersP2: 10,
      cancelP2: 2, // 8 valid / 2 = 4
      isDuplicate: true,
      closingType: 'REGULER'
    },
    {
      sheetTab: 'September Cabang',
      marketplace: 'Shopee Bali',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'TWINSUNAGEPROTECTIONCC',
      productName: 'Twinpack Sun Protector Age Revival Protection Day Cream (Bali)',
      hargaBulanan: 80400,
      diskonPersen: 4,
      totalDiskon: 3216,
      targetQty: 20,
      totalPromosi: 10,
      ordersP1: 8,
      cancelP1: 0, // 8 valid
      ordersP2: 6,
      cancelP2: 0, // 6 valid
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },

    // =========================================================================
    // 4. SHOPEE SURABAYA (Tab 'September Cabang')
    // =========================================================================
    {
      sheetTab: 'September Cabang',
      marketplace: 'Shopee Surabaya',
      kategori: 'Toko',
      subKategori: 'Voucher',
      periodeBadge: 'DD & Payday',
      tanggal: '0-30 September',
      sku: 'All SKU',
      productName: 'Voucher Toko Surabaya 5K min 100K',
      hargaBulanan: 100000,
      diskonPersen: 5,
      totalDiskon: 5000,
      targetQty: 50,
      totalPromosi: 10,
      ordersP1: 22,
      cancelP1: 2, // 20 / 2 = 10
      ordersP2: 14,
      cancelP2: 0, // 14 / 2 = 7
      isDuplicate: true,
      closingType: 'REGULER'
    },
    {
      sheetTab: 'September Cabang',
      marketplace: 'Shopee Surabaya',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'PAK036B100CS',
      productName: 'THERASKIN Age Revival Toner Essence Botol 100 ml (Surabaya)',
      hargaBulanan: 43700,
      diskonPersen: 4,
      totalDiskon: 1748,
      targetQty: 15,
      totalPromosi: 10,
      ordersP1: 12,
      cancelP1: 0,
      ordersP2: 10,
      cancelP2: 1,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },

    // =========================================================================
    // 5. SHOPEE PUSAT (Tab 'September')
    // =========================================================================
    {
      sheetTab: 'September',
      marketplace: 'Shopee Pusat',
      kategori: 'Toko',
      subKategori: 'Voucher',
      periodeBadge: 'DD & Payday',
      tanggal: '0-30 September',
      sku: 'All SKU',
      productName: 'Voucher Toko Pusat Diskon 5K min 100K',
      hargaBulanan: 100000,
      diskonPersen: 5,
      totalDiskon: 5000,
      targetQty: 100,
      totalPromosi: 10,
      ordersP1: 50,
      cancelP1: 2, // (48)/2 = 24
      ordersP2: 40,
      cancelP2: 4, // (36)/2 = 18
      isDuplicate: true,
      closingType: 'REGULER'
    },
    {
      sheetTab: 'September',
      marketplace: 'Shopee Pusat',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FPK039S010CS0',
      productName: 'Theraskin Perfect Glow Brightening Serum (Pusat)',
      hargaBulanan: 54500,
      diskonPersen: 5,
      totalDiskon: 2530,
      targetQty: 50,
      totalPromosi: 10,
      ordersP1: 35,
      cancelP1: 1, // 34 valid
      ordersP2: 30,
      cancelP2: 0, // 30 valid
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },

    // =========================================================================
    // 6. TIKTOK SHOP (Tab 'September')
    // Sesuai data mentah TikTok Shop OrderSKUList dan patokan Google Sheet
    // =========================================================================
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Voucher Live / Video',
      periodeBadge: 'DD & Payday',
      tanggal: '0-30 September',
      sku: 'All SKU',
      productName: 'Voucher Live TikTok Diskon 5K min 100K',
      hargaBulanan: 100000,
      diskonPersen: 5,
      totalDiskon: 5000,
      targetQty: 100,
      totalPromosi: 10,
      ordersP1: 40,
      cancelP1: 2,
      ordersP2: 30,
      cancelP2: 1,
      isDuplicate: false,
      closingType: 'REGULER'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Paket diskon',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FPK00000042',
      productName: 'Theraskin Perfect Glow Basic Skin',
      hargaBulanan: 231000,
      diskonPersen: 34,
      totalDiskon: 79476,
      targetQty: 50,
      totalPromosi: 10,
      ordersP1: 15,
      cancelP1: 1,
      ordersP2: 12,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FAW02L0010CG',
      productName: 'Theraskin AHA Cleanser 100ml -',
      hargaBulanan: 39800,
      diskonPersen: 5,
      totalDiskon: 1990,
      targetQty: 60,
      totalPromosi: 10,
      ordersP1: 20,
      cancelP1: 0,
      ordersP2: 15,
      cancelP2: 1,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FNC02P0010CW',
      productName: 'Theraskin Niacinamide Cream Gel',
      hargaBulanan: 36700,
      diskonPersen: 33,
      totalDiskon: 12000,
      targetQty: 50,
      totalPromosi: 10,
      ordersP1: 18,
      cancelP1: 0,
      ordersP2: 10,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FD02C0010G',
      productName: 'Theraskin Daily C-Booster Cream 1',
      hargaBulanan: 71000,
      diskonPersen: 48,
      totalDiskon: 33950,
      targetQty: 50,
      totalPromosi: 10,
      ordersP1: 14,
      cancelP1: 1,
      ordersP2: 11,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FFG02B010CS',
      productName: 'Theraskin Perfect glow toner essence',
      hargaBulanan: 49500,
      diskonPersen: 34,
      totalDiskon: 16830,
      targetQty: 50,
      totalPromosi: 10,
      ordersP1: 16,
      cancelP1: 0,
      ordersP2: 12,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Paket diskon',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FPK00000043',
      productName: 'Theraskin Advanced Acne Basic Sk',
      hargaBulanan: 209000,
      diskonPersen: 40,
      totalDiskon: 83100,
      targetQty: 40,
      totalPromosi: 10,
      ordersP1: 12,
      cancelP1: 0,
      ordersP2: 9,
      cancelP2: 1,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Paket diskon',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FPK00000032',
      productName: 'Paket Theraskin AHA Glow White -',
      hargaBulanan: 147700,
      diskonPersen: 13,
      totalDiskon: 19701,
      targetQty: 40,
      totalPromosi: 10,
      ordersP1: 10,
      cancelP1: 0,
      ordersP2: 8,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Paket diskon',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'TWINSUNAGEPROTECTIONDC',
      productName: 'Twinpack Sun Protector Age Revival Protection Day Cream',
      hargaBulanan: 145000,
      diskonPersen: 47,
      totalDiskon: 67816,
      targetQty: 50,
      totalPromosi: 10,
      ordersP1: 22,
      cancelP1: 1,
      ordersP2: 16,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'PAK034POT010CS',
      productName: 'THERASKIN Age Revival Moisture Lock Night Cream Pot New Mould 10 g Shrink',
      hargaBulanan: 41500,
      diskonPersen: 4,
      totalDiskon: 1660,
      targetQty: 40,
      totalPromosi: 10,
      ordersP1: 14,
      cancelP1: 0,
      ordersP2: 12,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'PAK033POT010PCS',
      productName: 'THERASKIN Age Revival Protection Day Cream Pot New 10 g Shrink',
      hargaBulanan: 40200,
      diskonPersen: 4,
      totalDiskon: 1608,
      targetQty: 40,
      totalPromosi: 10,
      ordersP1: 15,
      cancelP1: 0,
      ordersP2: 10,
      cancelP2: 1,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'PAK032T010C',
      productName: 'THERASKIN Age Revival Gentle Cleanser Tube 100 ml',
      hargaBulanan: 41300,
      diskonPersen: 4,
      totalDiskon: 1652,
      targetQty: 40,
      totalPromosi: 10,
      ordersP1: 12,
      cancelP1: 0,
      ordersP2: 8,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FTC00000030CS',
      productName: 'Theraskin Perfect Glow Face Cream',
      hargaBulanan: 51200,
      diskonPersen: 3,
      totalDiskon: 1536,
      targetQty: 40,
      totalPromosi: 10,
      ordersP1: 25,
      cancelP1: 1, // 24 valid
      ordersP2: 20,
      cancelP2: 0, // 20 valid
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    },
    {
      sheetTab: 'September',
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      subKategori: 'Flash Sale',
      periodeBadge: 'DD & Payday',
      tanggal: '1-7 Sep & 25-30 Sep',
      sku: 'FTC00000015CI',
      productName: 'Theraskin Perfect Glow Brightening Serum',
      hargaBulanan: 65400,
      diskonPersen: 5,
      totalDiskon: 3480,
      targetQty: 40,
      totalPromosi: 10,
      ordersP1: 18,
      cancelP1: 0,
      ordersP2: 14,
      cancelP2: 0,
      isDuplicate: false,
      closingType: 'CAMPAIGN'
    }
  ]

  return mockMasterData.map((item, idx) => {
    const hargaPromo = Math.max(0, item.hargaBulanan - item.totalDiskon)
    const validP1 = item.ordersP1 - item.cancelP1
    const validP2 = item.ordersP2 - item.cancelP2

    const qtyP1 = item.isDuplicate ? validP1 / 2 : validP1
    const qtyP2 = item.isDuplicate ? validP2 / 2 : validP2

    // Biaya = Qty × Total Diskon
    const biayaP1 = qtyP1 * item.totalDiskon
    const biayaP2 = qtyP2 * item.totalDiskon
    const grandTotalQty = qtyP1 + qtyP2
    const grandTotalBiaya = biayaP1 + biayaP2

    const totalOrders = item.ordersP1 + item.ordersP2
    const cancelledOrders = item.cancelP1 + item.cancelP2
    const validOrders = validP1 + validP2

    const isShopee = isShopeePlatform(item.marketplace)
    let branchCity: string | undefined = undefined
    if (isShopee) {
      if (item.marketplace.includes('Semarang')) branchCity = 'Semarang'
      else if (item.marketplace.includes('Bali')) branchCity = 'Bali'
      else if (item.marketplace.includes('Surabaya')) branchCity = 'Surabaya'
      else branchCity = 'Pusat'
    }

    const appliedRule: ClosingRuleType = item.isDuplicate ? 'DIVIDE_VALID_ORDERS_BY_2' : 'STANDARD_NO_SPLIT'
    const groupId = buildGroupKey(month, 'PERIOD_1', item.marketplace, item.closingType, item.subKategori, item.productName, item.sku, item.totalDiskon)

    // Generate mock transactions
    const txs: RawOrderTransaction[] = [
      ...Array.from({ length: validP1 }).map((_, i) => ({
        id: `tx-v1-${idx}-${i}`,
        orderNumber: `ORD-${item.marketplace.replace(/\s+/g, '').slice(0, 5).toUpperCase()}-P1-${1000 + i}`,
        date: `${year}-09-08`,
        month,
        period: 'PERIOD_1' as const,
        marketplace: item.marketplace,
        closingType: item.closingType,
        promotionCategory: item.subKategori,
        promotionName: item.productName,
        sku: item.sku,
        productName: item.productName,
        price: item.hargaBulanan,
        discountAmount: item.totalDiskon,
        quantity: 1,
        orderStatus: 'Selesai',
        isDuplicatePromo: item.isDuplicate
      })),
      ...Array.from({ length: item.cancelP1 }).map((_, i) => ({
        id: `tx-c1-${idx}-${i}`,
        orderNumber: `ORD-${item.marketplace.replace(/\s+/g, '').slice(0, 5).toUpperCase()}-C1-${1000 + i}`,
        date: `${year}-09-09`,
        month,
        period: 'PERIOD_1' as const,
        marketplace: item.marketplace,
        closingType: item.closingType,
        promotionCategory: item.subKategori,
        promotionName: item.productName,
        sku: item.sku,
        productName: item.productName,
        price: item.hargaBulanan,
        discountAmount: item.totalDiskon,
        quantity: 1,
        orderStatus: 'Dibatalkan',
        isDuplicatePromo: item.isDuplicate
      })),
      ...Array.from({ length: validP2 }).map((_, i) => ({
        id: `tx-v2-${idx}-${i}`,
        orderNumber: `ORD-${item.marketplace.replace(/\s+/g, '').slice(0, 5).toUpperCase()}-P2-${2000 + i}`,
        date: `${year}-09-22`,
        month,
        period: 'PERIOD_2' as const,
        marketplace: item.marketplace,
        closingType: item.closingType,
        promotionCategory: item.subKategori,
        promotionName: item.productName,
        sku: item.sku,
        productName: item.productName,
        price: item.hargaBulanan,
        discountAmount: item.totalDiskon,
        quantity: 1,
        orderStatus: 'Selesai',
        isDuplicatePromo: item.isDuplicate
      }))
    ]

    return {
      id: `row-${groupId}`,
      groupId,
      sheetTab: item.sheetTab,
      marketplace: item.marketplace,
      kategori: item.kategori,
      subKategori: item.subKategori,
      periodeBadge: item.periodeBadge,
      tanggal: item.tanggal,
      sku: item.sku,
      productName: item.productName,
      hargaBulanan: item.hargaBulanan,
      diskonPersen: item.diskonPersen,
      totalDiskon: item.totalDiskon,
      hargaPromo,
      targetQty: item.targetQty,
      totalPromosi: item.totalPromosi,
      qtyP1,
      biayaP1,
      qtyP2,
      biayaP2,
      grandTotalQty,
      grandTotalBiaya,
      month,
      year,
      closingType: item.closingType,
      branchCity,
      isShopeeBranch: isShopee,
      isPaketDiskon: item.subKategori.toLowerCase().includes('paket'),
      isDuplicateP1: item.isDuplicate,
      isDuplicateP2: item.isDuplicate,
      totalOrdersP1: item.ordersP1,
      cancelledOrdersP1: item.cancelP1,
      validOrdersP1: validP1,
      totalOrdersP2: item.ordersP2,
      cancelledOrdersP2: item.cancelP2,
      validOrdersP2: validP2,
      finalClosingQty: grandTotalQty,
      biaya: grandTotalBiaya,
      totalBiayaPromo: grandTotalBiaya,
      price: item.hargaBulanan,
      discountAmount: item.totalDiskon,
      priceAfterDiscount: hargaPromo,
      discountPercent: item.diskonPersen,
      promotionCategory: item.subKategori,
      promotionName: item.productName,
      closingPeriod: 'PERIOD_1',
      periodLabel: `Periode 1 (1–15 ${month})`,
      periodDateRange: `1 - 15 ${month} ${year}`,
      totalOrders,
      cancelledOrders,
      validOrders,
      appliedRule,
      formulaDescription: item.isDuplicate ? `(${totalOrders} total - ${cancelledOrders} batal) ÷ 2 = ${grandTotalQty}` : `(${totalOrders} total - ${cancelledOrders} batal) = ${grandTotalQty}`,
      hasSameDiscountInPeriod: item.isDuplicate,
      isDuplicatePromo: item.isDuplicate,
      transactions: txs
    }
  })
}
