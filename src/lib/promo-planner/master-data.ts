export type CampaignStatus = 'Draft' | 'Scheduled' | 'Running' | 'Completed'

export type PromoMarketplace = 'Shopee' | 'TikTok Shop' | 'Lazada' | 'Tokopedia'

export type PromoCategory =
  | 'Campaign'
  | 'Toko'
  | 'Live Streaming'
  | 'Digital Marketing'
  | 'Brand Membership'

export type PromoChannel =
  | 'Toko'
  | 'Live Streaming'
  | 'Digital Marketing'
  | 'Brand Membership'
  | 'Campaign'

export type PromoType =
  | 'Campaign'
  | 'Voucher'
  | 'Paket Diskon'
  | 'Flash Sale'
  | 'Bundling'

export type MarginStatus = 'AMAN' | 'TIDAK AMAN' | 'DATA HARGA BELUM ADA'
export type DiscountValidationStatus = 'VALID' | 'TIDAK VALID'

export interface VoucherConfig {
  voucherName: string
  minOrder: number
  nominalDiscount: number
  maxDiscount: number
  quota: number
}

export interface PaketDiskonConfig {
  tier1: string // e.g. "Buy 3 Disc 3%"
  tier2: string // e.g. "Buy 4 Disc 4%"
  tier3: string // e.g. "Buy 5 Disc 5%"
  maxTierDiscountPercent: number // <= 5%
}

export interface BundleConfig {
  bundleSku: string
  bundleName: string
  components: string[]
  hargaNormalBundle: number
  hargaPromoBundle: number
}

/**
 * Struktur Master Data Promo (Kolom A s/d X)
 */
export interface PromoPlanItem {
  id: string
  // Kolom A - M (Struktur Utama Spreadsheet Promo)
  marketplace: PromoMarketplace // [A] Marketplace (Shopee, TikTok Shop, Lazada)
  kategori: PromoCategory // [B] Kategori (Campaign, Toko, Live Streaming, Digital Marketing, Brand Membership)
  subKategori: string // [C] Sub Kategori
  periode: string // [D] Periode (Payday Awal, Double Date, BAU, Payday Akhir, dll)
  tanggal: string // [E] Tanggal (e.g. "1 - 8 Oktober", "9 - 11 Oktober")
  sku: string // [F] SKU
  productName: string // [G] Product Name
  hargaBulanan: number // [H] Harga Bulanan
  diskonPercent: number // [I] Diskon (%, maksimal 5% untuk produk)
  totalDiskon: number // [J] Total Diskon (= Harga Bulanan * Diskon%)
  hargaPromo: number // [K] Harga Promo (= Harga Bulanan - Total Diskon)
  qty: number // [L] Qty (Target kuota promosi)
  totalPromosi: number // [M] Total Promosi (= Harga Promo * Qty)

  // Kolom N - X (Kolom Lengkap Master Sheet & Closing)
  qtyP1: number // [N] Total Qty 1-15
  biayaP1: number // [O] Biaya 1-15 (= Qty 1-15 * Total Diskon)
  qtyP2: number // [P] Total Qty 16-31
  biayaP2: number // [Q] Biaya 16-31 (= Qty 16-31 * Total Diskon)
  estimasiGmv: number // [R] GMV / Estimasi GMV (= Harga Promo * Qty)
  hargaOB: number // [S] Harga OB
  bottomPrice: number // [T] Bottom Price (= Harga OB * 97%)
  statusMargin: MarginStatus // [U] Status Margin (AMAN / TIDAK AMAN / DATA HARGA BELUM ADA)
  campaignName: string // [V] Campaign Name
  channel: PromoChannel // [W] Channel (Toko, Live Streaming, Digital Marketing, Brand Membership, Campaign)
  notes?: string // [X] Catatan

  // Metadata Reusable Bulanan & Validasi
  bulan: string // 'September' | 'Oktober' | 'November' | 'Desember' | 'Januari' | dst.
  tahun: number // e.g. 2026
  startDate?: string // ISO YYYY-MM-DD
  endDate?: string // ISO YYYY-MM-DD
  status: CampaignStatus
  closing: 'All' | 'Pusat' | 'Cabang'
  biayaPromo: number // Total Diskon * Qty (Biaya subsidi diskon yang ditanggung brand)
  discountStatus: DiscountValidationStatus
  promoType?: PromoType
  series?: string
  productGroup?: 'NPD' | 'BAU'
  voucherConfig?: VoucherConfig
  paketDiskonConfig?: PaketDiskonConfig
  bundleConfig?: BundleConfig
}

/**
 * Sub Kategori Dinamis Berdasarkan Kategori (Bagian 4 Spesifikasi)
 */
export const DEFAULT_SUB_CATEGORIES_BY_CATEGORY: Record<PromoCategory, string[]> = {
  'Campaign': [
    'Payday Awal',
    'Double Date',
    'BAU',
    'Payday Akhir',
    'Flash Sale',
    'Promo Flash Sale',
    'Super Flash Sale',
    'Campaign Marketplace lainnya'
  ],
  'Toko': [
    'Voucher',
    'Paket Diskon',
    'Paket Diskon NPD',
    'Flash Sale',
    'Promo Toko',
    'Paket Promo'
  ],
  'Live Streaming': [
    'Flash Sale',
    'Flash Sale Live',
    'Paket / Bundling',
    'Promo Live'
  ],
  'Digital Marketing': [
    'Voucher',
    'Promo Marketing'
  ],
  'Brand Membership': [
    'Voucher',
    'Voucher NPD',
    'Flash Sale'
  ]
}

export interface MasterProductCatalogItem {
  sku: string
  productName: string
  series:
    | 'C-Booster'
    | 'Age Revival'
    | 'Perfect Glow'
    | 'Advanced Acne'
    | 'CeraMoist'
    | 'Oil Control'
    | 'Best Seller'
    | 'Bundle / Paket'
  productGroup: 'NPD' | 'BAU'
  hargaBulanan: number
  hargaOB: number
  bottomPrice: number // Harga OB * 97%
  maxSafeDiscount: number // Maksimal 5% dan Harga Promo >= Bottom Price
  isBundle?: boolean
  bundleComponents?: string[]
}

/**
 * MASTER PRODUK & HARGA RESMI THERASKIN (Bagian 7, 10, 11, 12 Spesifikasi)
 * Seluruh SKU, Nama Produk, Harga Bulanan, Harga OB, dan Bottom Price (-3% OB)
 * bersumber langsung dari data master Theraskin di EcomPilot.
 */
export const THERASKIN_MASTER_CATALOG: MasterProductCatalogItem[] = [
  // ================= NPD: C-BOOSTER SERIES =================
  {
    sku: 'FVD01B0015C',
    productName: 'Theraskin Daily C-Booster Serum',
    series: 'C-Booster',
    productGroup: 'NPD',
    hargaBulanan: 58000,
    hargaOB: 52000,
    bottomPrice: 50440,
    maxSafeDiscount: 5
  },
  {
    sku: 'FVD02P0010G',
    productName: 'Theraskin Daily C-Booster Cream',
    series: 'C-Booster',
    productGroup: 'NPD',
    hargaBulanan: 39000,
    hargaOB: 35000,
    bottomPrice: 33950,
    maxSafeDiscount: 5
  },
  {
    sku: 'BUNDLING-CBOOSTERSERIES',
    productName: 'Theraskin Daily C-Booster Series (Serum + Cream)',
    series: 'C-Booster',
    productGroup: 'NPD',
    hargaBulanan: 97000,
    hargaOB: 88000,
    bottomPrice: 85360,
    maxSafeDiscount: 5,
    isBundle: true,
    bundleComponents: ['FVD01B0015C (Daily C-Booster Serum)', 'FVD02P0010G (Daily C-Booster Cream)']
  },
  {
    sku: 'CBOOSTERCREAM2PC',
    productName: 'Theraskin Daily C-Booster Cream (2 Pcs Twinpack)',
    series: 'C-Booster',
    productGroup: 'NPD',
    hargaBulanan: 78000,
    hargaOB: 70000,
    bottomPrice: 67900,
    maxSafeDiscount: 5,
    isBundle: true,
    bundleComponents: ['2x FVD02P0010G (Daily C-Booster Cream)']
  },

  // ================= NPD: AGE REVIVAL SERIES =================
  {
    sku: 'FAR01B0015CS',
    productName: 'THERASKIN Age Revival Intense Retinol Serum Botol 15 ml Shrink',
    series: 'Age Revival',
    productGroup: 'NPD',
    hargaBulanan: 64900,
    hargaOB: 59000,
    bottomPrice: 57230,
    maxSafeDiscount: 5
  },
  {
    sku: 'FAR03P0010GPES',
    productName: 'THERASKIN Age Revival Protection Day Cream Pot New 10 g Shrink',
    series: 'Age Revival',
    productGroup: 'NPD',
    hargaBulanan: 40200,
    hargaOB: 36000,
    bottomPrice: 34920,
    maxSafeDiscount: 5
  },
  {
    sku: 'FAR04P0010GPES',
    productName: 'THERASKIN Age Revival Moisture Lock Night Cream Pot 10 g Shrink',
    series: 'Age Revival',
    productGroup: 'NPD',
    hargaBulanan: 41500,
    hargaOB: 37000,
    bottomPrice: 35890,
    maxSafeDiscount: 5
  },
  {
    sku: 'PAK032T010C',
    productName: 'THERASKIN Age Revival Gentle Cleanser Tube 100 ml',
    series: 'Age Revival',
    productGroup: 'NPD',
    hargaBulanan: 41300,
    hargaOB: 37500,
    bottomPrice: 36375,
    maxSafeDiscount: 5
  },
  {
    sku: 'PAK036B100CS',
    productName: 'THERASKIN Age Revival Toner Essence Botol PET 100 ml Shrink',
    series: 'Age Revival',
    productGroup: 'NPD',
    hargaBulanan: 43700,
    hargaOB: 39500,
    bottomPrice: 38315,
    maxSafeDiscount: 5
  },
  {
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: 'Twinpack Sun Protector Age Revival Protection Day Cream',
    series: 'Age Revival',
    productGroup: 'NPD',
    hargaBulanan: 80400,
    hargaOB: 73000,
    bottomPrice: 70810,
    maxSafeDiscount: 5,
    isBundle: true,
    bundleComponents: ['2x FAR03P0010GPES (Age Revival Protection Day Cream 10g)']
  },
  {
    sku: 'TRIPLESUNAGERPROTECTIONDC',
    productName: 'Triplepack Sun Protector Age Revival Protection Day Cream',
    series: 'Age Revival',
    productGroup: 'NPD',
    hargaBulanan: 120600,
    hargaOB: 108000,
    bottomPrice: 104760,
    maxSafeDiscount: 5,
    isBundle: true,
    bundleComponents: ['3x FAR03P0010GPES (Age Revival Protection Day Cream 10g)']
  },
  {
    sku: 'GCAR2PC',
    productName: 'Twinpack Age Revival Gentle Cleanser Tube 100 ml',
    series: 'Age Revival',
    productGroup: 'NPD',
    hargaBulanan: 82600,
    hargaOB: 75000,
    bottomPrice: 72750,
    maxSafeDiscount: 5,
    isBundle: true,
    bundleComponents: ['2x PAK032T010C (Age Revival Gentle Cleanser 100ml)']
  },
  {
    sku: 'GCAR3PC',
    productName: 'Triplepack Age Revival Gentle Cleanser Tube 100 ml',
    series: 'Age Revival',
    productGroup: 'NPD',
    hargaBulanan: 123900,
    hargaOB: 110000,
    bottomPrice: 106700,
    maxSafeDiscount: 5,
    isBundle: true,
    bundleComponents: ['3x PAK032T010C (Age Revival Gentle Cleanser 100ml)']
  },
  {
    sku: 'FPK00000033',
    productName: 'Theraskin Age Revival Anti Aging Paket Lengkap',
    series: 'Age Revival',
    productGroup: 'NPD',
    hargaBulanan: 215000,
    hargaOB: 210000,
    bottomPrice: 203700,
    maxSafeDiscount: 4,
    isBundle: true,
    bundleComponents: [
      'PAK032T010C (Gentle Cleanser)',
      'PAK036B100CS (Toner Essence)',
      'FAR03P0010GPES (Protection Day Cream)',
      'FAR04P0010GPES (Moisture Lock Night Cream)',
      'FAR01B0015CS (Intense Retinol Serum)'
    ]
  },

  // ================= NPD: CERAMOIST SERIES =================
  {
    sku: 'FPK00000037',
    productName: 'Theraskin CeraMoist Series Paket Lengkap',
    series: 'CeraMoist',
    productGroup: 'NPD',
    hargaBulanan: 198000,
    hargaOB: 194500,
    bottomPrice: 188665,
    maxSafeDiscount: 4,
    isBundle: true,
    bundleComponents: ['CeraMoist Facial Wash', 'CeraMoist Toner', 'CeraMoist Day Cream', 'CeraMoist Night Cream']
  },

  // ================= NPD / BEST SELLER: MEN & MAKEUP =================
  {
    sku: 'FBD02B0030C',
    productName: 'Theraskin Blurry Cover Skin Tint Shade 02 Light to Medium',
    series: 'Best Seller',
    productGroup: 'NPD',
    hargaBulanan: 68200,
    hargaOB: 61000,
    bottomPrice: 59170,
    maxSafeDiscount: 5
  },
  {
    sku: 'FMM03B0015C',
    productName: 'Theraskin Men Multi Action Serum 15 mL',
    series: 'Best Seller',
    productGroup: 'NPD',
    hargaBulanan: 52000,
    hargaOB: 47000,
    bottomPrice: 45590,
    maxSafeDiscount: 5
  },

  // ================= BAU: PERFECT GLOW SERIES =================
  {
    sku: 'FFG01T0100C',
    productName: 'Theraskin Perfect Glow Facial Wash 100ml',
    series: 'Perfect Glow',
    productGroup: 'BAU',
    hargaBulanan: 41500,
    hargaOB: 38000,
    bottomPrice: 36860,
    maxSafeDiscount: 5
  },
  {
    sku: 'FPK037P0010CP0',
    productName: 'Theraskin Perfect Glow Face Cream',
    series: 'Perfect Glow',
    productGroup: 'BAU',
    hargaBulanan: 51200,
    hargaOB: 46500,
    bottomPrice: 45105,
    maxSafeDiscount: 5
  },
  {
    sku: 'FPK038P0010CP0',
    productName: 'Theraskin Perfect Glow Protection Day Cream',
    series: 'Perfect Glow',
    productGroup: 'BAU',
    hargaBulanan: 38500,
    hargaOB: 35000,
    bottomPrice: 33950,
    maxSafeDiscount: 5
  },
  {
    sku: 'FPK040T0010CS0',
    productName: 'Theraskin Perfect Glow Toner Essence',
    series: 'Perfect Glow',
    productGroup: 'BAU',
    hargaBulanan: 38200,
    hargaOB: 34800,
    bottomPrice: 33756,
    maxSafeDiscount: 5
  },
  {
    sku: 'FPK039S010CS0',
    productName: 'Theraskin Perfect Glow Brightening Serum',
    series: 'Perfect Glow',
    productGroup: 'BAU',
    hargaBulanan: 54500,
    hargaOB: 49500,
    bottomPrice: 48015,
    maxSafeDiscount: 5
  },
  {
    sku: 'FPK00000042',
    productName: 'Theraskin Perfect Glow Basic Skincare',
    series: 'Perfect Glow',
    productGroup: 'BAU',
    hargaBulanan: 159500,
    hargaOB: 142000,
    bottomPrice: 137740,
    maxSafeDiscount: 5,
    isBundle: true,
    bundleComponents: ['FFG01T0100C (Facial Wash)', 'FPK040T0010CS0 (Toner)', 'FPK038P0010CP0 (Day Cream)', 'FPK037P0010CP0 (Face Cream)']
  },
  {
    sku: 'FPK00000039',
    productName: 'Theraskin Perfect Glow Paket Lengkap',
    series: 'Perfect Glow',
    productGroup: 'BAU',
    hargaBulanan: 269900,
    hargaOB: 262500,
    bottomPrice: 254625,
    maxSafeDiscount: 4,
    isBundle: true,
    bundleComponents: ['FFG01T0100C (Facial Wash)', 'FPK040T0010CS0 (Toner)', 'FPK038P0010CP0 (Day Cream)', 'FPK037P0010CP0 (Face Cream)', 'FPK039S010CS0 (Brightening Serum)']
  },

  // ================= BAU: ADVANCED ACNE SERIES =================
  {
    sku: 'FAA05T0100C',
    productName: 'Advanced Acne Facial Wash 100ml',
    series: 'Advanced Acne',
    productGroup: 'BAU',
    hargaBulanan: 39200,
    hargaOB: 35500,
    bottomPrice: 34435,
    maxSafeDiscount: 5
  },
  {
    sku: 'ECOADVACNE',
    productName: 'Bundle Ekonomis Advanced Acne',
    series: 'Advanced Acne',
    productGroup: 'BAU',
    hargaBulanan: 75400,
    hargaOB: 68000,
    bottomPrice: 65960,
    maxSafeDiscount: 5,
    isBundle: true,
    bundleComponents: ['FAA05T0100C (Acne Facial Wash)', 'Acne Day Cream']
  },
  {
    sku: 'FPK00000040',
    productName: 'Theraskin Advanced Acne Paket Lengkap',
    series: 'Advanced Acne',
    productGroup: 'BAU',
    hargaBulanan: 244700,
    hargaOB: 243500,
    bottomPrice: 236195,
    maxSafeDiscount: 3,
    isBundle: true,
    bundleComponents: ['FAA05T0100C (Acne Wash)', 'Acne Toner', 'Acne Day Cream', 'Acne Night Cream', 'Acne Serum']
  },

  // ================= BAU: OIL CONTROL & PAKET BUNDLE =================
  {
    sku: 'FAW02L0010CG',
    productName: 'Theraskin AHA Cleanser 100ml (Oil Control)',
    series: 'Oil Control',
    productGroup: 'BAU',
    hargaBulanan: 39800,
    hargaOB: 36000,
    bottomPrice: 34920,
    maxSafeDiscount: 5
  },
  {
    sku: 'FNC02P0010CW',
    productName: 'Theraskin Niacinamide Cream Gel (Oil Control)',
    series: 'Oil Control',
    productGroup: 'BAU',
    hargaBulanan: 36700,
    hargaOB: 33500,
    bottomPrice: 32495,
    maxSafeDiscount: 5
  },
  {
    sku: 'FPK00000032',
    productName: 'Paket Theraskin AHA Glow White',
    series: 'Bundle / Paket',
    productGroup: 'BAU',
    hargaBulanan: 138500,
    hargaOB: 125000,
    bottomPrice: 121250,
    maxSafeDiscount: 5,
    isBundle: true,
    bundleComponents: ['FAW02L0010CG (AHA Cleanser)', 'AHA Toner', 'AHA Day Cream', 'AHA Night Cream']
  }
]

export const MONTH_LIST = [
  { name: 'September', index: 8, days: 30, doubleDateLabel: '9.9' },
  { name: 'Oktober', index: 9, days: 31, doubleDateLabel: '10.10' },
  { name: 'November', index: 10, days: 30, doubleDateLabel: '11.11' },
  { name: 'Desember', index: 11, days: 31, doubleDateLabel: '12.12' },
  { name: 'Januari', index: 0, days: 31, doubleDateLabel: '1.1' },
  { name: 'Februari', index: 1, days: 28, doubleDateLabel: '2.2' },
  { name: 'Maret', index: 2, days: 31, doubleDateLabel: '3.3' }
]

export function getMonthDaysCount(bulan: string, tahun: number = 2026): number {
  const m = MONTH_LIST.find(x => x.name.toLowerCase() === (bulan || '').toLowerCase())
  if (!m) return 30
  if (m.index === 1) {
    return new Date(tahun, 2, 0).getDate()
  }
  return m.days
}

/**
 * Sistem Periode Bulanan Reusable (Bagian 5 & 6 Spesifikasi)
 * Otomatis menyesuaikan tanggal sesuai Bulan & Tahun.
 */
export function getStandardMonthlyPeriods(bulan: string, tahun: number = 2026) {
  const endDay = getMonthDaysCount(bulan, tahun)
  const mInfo = MONTH_LIST.find(x => x.name.toLowerCase() === (bulan || '').toLowerCase())
  const monthNum = mInfo ? String(mInfo.index + 1).padStart(2, '0') : '10'

  return [
    {
      periode: 'Payday Awal',
      tanggal: `1 - 8 ${bulan}`,
      startDate: `${tahun}-${monthNum}-01`,
      endDate: `${tahun}-${monthNum}-08`,
      defaultSplitP1Ratio: 1.0 // 100% di periode 1-15
    },
    {
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      startDate: `${tahun}-${monthNum}-09`,
      endDate: `${tahun}-${monthNum}-11`,
      defaultSplitP1Ratio: 1.0 // 100% di periode 1-15
    },
    {
      periode: 'BAU',
      tanggal: `12 - 24 ${bulan}`,
      startDate: `${tahun}-${monthNum}-12`,
      endDate: `${tahun}-${monthNum}-24`,
      defaultSplitP1Ratio: 0.35 // 35% di 12-15, 65% di 16-24
    },
    {
      periode: 'Payday Akhir',
      tanggal: `25 - ${endDay} ${bulan}`,
      startDate: `${tahun}-${monthNum}-25`,
      endDate: `${tahun}-${monthNum}-${endDay}`,
      defaultSplitP1Ratio: 0.0 // 100% di periode 16-31
    },
    {
      periode: 'Full Month Regular',
      tanggal: `1 - ${endDay} ${bulan}`,
      startDate: `${tahun}-${monthNum}-01`,
      endDate: `${tahun}-${monthNum}-${endDay}`,
      defaultSplitP1Ratio: 0.5 // 50% di 1-15, 50% di 16-31
    }
  ]
}

/**
 * Kalkulasi Otomatis Kolom Harga, Diskon, Margin, GMV, dan Closing Split (Bagian 8, 9, 20, 29 Spesifikasi)
 */
export function recalculatePromoItem(raw: Partial<PromoPlanItem>): PromoPlanItem {
  const catalogMatch = THERASKIN_MASTER_CATALOG.find(
    c => c.sku.toLowerCase() === (raw.sku || '').trim().toLowerCase()
  )

  const hargaBulanan = Number(raw.hargaBulanan ?? catalogMatch?.hargaBulanan ?? 0)
  const hargaOB = Number(raw.hargaOB ?? catalogMatch?.hargaOB ?? 0)
  const bottomPrice = hargaOB > 0 ? Math.round(hargaOB * 0.97) : Number(raw.bottomPrice ?? 0)

  const diskonPercent = Number(raw.diskonPercent ?? 0)
  const totalDiskon = Math.round(hargaBulanan * (diskonPercent / 100))
  const hargaPromo = Math.max(0, hargaBulanan - totalDiskon)
  const qty = Math.max(0, Number(raw.qty ?? 0))

  // Sesuai Bagian 1, 20, 29:
  // Total Promosi = Harga Promo * Qty
  // Estimasi GMV = Harga Promo * Qty
  // Biaya Promo = Total Diskon * Qty
  const totalPromosi = hargaPromo * qty
  const estimasiGmv = hargaPromo * qty
  const biayaPromo = totalDiskon * qty

  // Hitung alokasi Qty 1-15 dan Qty 16-31 jika belum diisi manual
  const tanggalStr = raw.tanggal || ''
  let qtyP1 = raw.qtyP1
  let qtyP2 = raw.qtyP2

  if (qtyP1 === undefined || qtyP2 === undefined || (qtyP1 + qtyP2 !== qty && qty > 0)) {
    const rangeMatch = tanggalStr.match(/(\d+)\s*[-–]\s*(\d+)/)
    if (rangeMatch) {
      const sDay = parseInt(rangeMatch[1], 10)
      const eDay = parseInt(rangeMatch[2], 10)
      if (eDay <= 15) {
        qtyP1 = qty
        qtyP2 = 0
      } else if (sDay >= 16) {
        qtyP1 = 0
        qtyP2 = qty
      } else {
        qtyP1 = Math.round(qty * 0.5)
        qtyP2 = qty - qtyP1
      }
    } else {
      qtyP1 = Math.round(qty * 0.5)
      qtyP2 = qty - qtyP1
    }
  }

  const biayaP1 = (qtyP1 || 0) * totalDiskon
  const biayaP2 = (qtyP2 || 0) * totalDiskon

  // Validasi Margin & Diskon (Bagian 8 & 9)
  let statusMargin: MarginStatus = 'DATA HARGA BELUM ADA'
  if (hargaBulanan > 0 && hargaOB > 0 && bottomPrice > 0) {
    statusMargin = hargaPromo >= bottomPrice ? 'AMAN' : 'TIDAK AMAN'
  }

  const discountStatus: DiscountValidationStatus =
    diskonPercent >= 0 && diskonPercent <= 5 ? 'VALID' : 'TIDAK VALID'

  const kategori: PromoCategory = (raw.kategori as PromoCategory) || 'Campaign'
  const channel: PromoChannel = (raw.channel as PromoChannel) || kategori

  return {
    id: raw.id || `promo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    campaignName: raw.campaignName || `${raw.marketplace || 'Shopee'} ${raw.periode || 'Payday Awal'} - ${raw.productName || ''}`,
    status: raw.status || 'Scheduled',
    bulan: raw.bulan || 'Oktober',
    tahun: raw.tahun || 2026,
    marketplace: (raw.marketplace as PromoMarketplace) || 'Shopee',
    kategori,
    subKategori: raw.subKategori || 'Flash Sale',
    periode: raw.periode || 'Payday Awal',
    tanggal: raw.tanggal || `1 - 8 ${raw.bulan || 'Oktober'}`,
    closing: raw.closing || 'All',
    sku: raw.sku || '',
    productName: raw.productName || catalogMatch?.productName || '',
    hargaBulanan,
    diskonPercent,
    totalDiskon,
    hargaPromo,
    qty,
    totalPromosi,
    qtyP1: qtyP1 || 0,
    biayaP1,
    qtyP2: qtyP2 || 0,
    biayaP2,
    estimasiGmv,
    hargaOB,
    bottomPrice,
    statusMargin,
    channel,
    notes: raw.notes || '',
    biayaPromo,
    discountStatus,
    promoType: raw.promoType || (raw.subKategori?.toLowerCase().includes('voucher') ? 'Voucher' : raw.subKategori?.toLowerCase().includes('paket') ? 'Paket Diskon' : catalogMatch?.isBundle ? 'Bundling' : raw.kategori === 'Campaign' ? 'Campaign' : 'Flash Sale'),
    series: raw.series || catalogMatch?.series,
    productGroup: raw.productGroup || catalogMatch?.productGroup,
    voucherConfig: raw.voucherConfig,
    paketDiskonConfig: raw.paketDiskonConfig,
    bundleConfig: raw.bundleConfig || (catalogMatch?.isBundle ? {
      bundleSku: catalogMatch.sku,
      bundleName: catalogMatch.productName,
      components: catalogMatch.bundleComponents || [],
      hargaNormalBundle: hargaBulanan,
      hargaPromoBundle: hargaPromo
    } : undefined)
  }
}

/**
 * Validasi Sebelum Simpan (Bagian 27 Spesifikasi)
 */
export function validatePromoItemBeforeSave(item: Partial<PromoPlanItem>): {
  isValid: boolean
  errors: string[]
} {
  const calc = recalculatePromoItem(item)
  const errors: string[] = []

  if (!calc.sku || !calc.sku.trim()) {
    errors.push('SKU kosong (wajib pilih SKU dari Master Produk)')
  }
  if (!calc.productName || !calc.productName.trim()) {
    errors.push('Product Name kosong')
  }
  if (!calc.hargaBulanan || calc.hargaBulanan <= 0) {
    errors.push('Harga Bulanan kosong atau 0')
  }
  if (!calc.hargaOB || calc.hargaOB <= 0) {
    errors.push('Harga OB kosong atau 0')
  }
  if (!calc.bottomPrice || calc.bottomPrice <= 0) {
    errors.push('Bottom Price kosong atau 0')
  }
  if (calc.diskonPercent > 5) {
    errors.push(`Diskon ${calc.diskonPercent}% melebihi batas maksimal 5% (Aturan Maksimal Diskon = 5%)`)
  }
  if (calc.diskonPercent < 0) {
    errors.push('Diskon tidak boleh negatif')
  }
  if (calc.hargaBulanan > 0 && calc.bottomPrice > 0 && calc.hargaPromo < calc.bottomPrice) {
    errors.push(
      `Harga Promo (Rp ${calc.hargaPromo.toLocaleString('id-ID')}) di bawah Bottom Price Finance (Rp ${calc.bottomPrice.toLocaleString('id-ID')})`
    )
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generator Plan Bulanan Reusable (Bagian 5, 19, 31, 32 Spesifikasi)
 * Menghasilkan plan promo bulanan yang komprehensif untuk bulan & tahun manapun
 * mencakup Shopee, TikTok Shop, Lazada; 5 Kategori/Channel; 4 Periode; dan seluruh lini produk NPD + BAU.
 */
export function generateMonthlyPromoPlan(options: {
  bulan: string
  tahun: number
  marketplaces?: PromoMarketplace[]
  channels?: PromoCategory[]
  productMix?: 'ALL' | 'NPD' | 'BAU'
  defaultStatus?: CampaignStatus
}): PromoPlanItem[] {
  const {
    bulan,
    tahun,
    marketplaces = ['Shopee', 'TikTok Shop', 'Lazada'],
    channels = ['Campaign', 'Toko', 'Live Streaming', 'Digital Marketing', 'Brand Membership'],
    productMix = 'ALL',
    defaultStatus = bulan === 'September' ? 'Completed' : bulan === 'Oktober' ? 'Running' : 'Scheduled'
  } = options

  const endDay = getMonthDaysCount(bulan, tahun)
  const mInfo = MONTH_LIST.find(x => x.name.toLowerCase() === bulan.toLowerCase())
  const ddLabel = mInfo?.doubleDateLabel || 'Double Date'
  const prefix = `${bulan.slice(0, 3).toLowerCase()}-${tahun}`

  const blueprints: Array<{
    marketplace: PromoMarketplace
    kategori: PromoCategory
    channel: PromoChannel
    subKategori: string
    periode: string
    tanggal: string
    sku: string
    diskonPercent: number
    qty: number
    campaignName: string
    notes: string
    promoType?: PromoType
    voucherConfig?: VoucherConfig
    paketDiskonConfig?: PaketDiskonConfig
  }> = [
    // =====================================================================
    // 1. PERIODE PAYDAY AWAL (1 - 8 <Bulan>)
    // =====================================================================
    {
      marketplace: 'Shopee',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Payday Awal',
      periode: 'Payday Awal',
      tanggal: `1 - 8 ${bulan}`,
      sku: 'FVD01B0015C',
      diskonPercent: 4,
      qty: 100,
      campaignName: `Shopee Payday Awal ${bulan} - C-Booster Serum NPD`,
      notes: 'Hero NPD & BAU C-Booster Serum pada periode gajian awal bulan (1-8).'
    },
    {
      marketplace: 'Shopee',
      kategori: 'Toko',
      channel: 'Toko',
      subKategori: 'Flash Sale',
      periode: 'Payday Awal',
      tanggal: `1 - 8 ${bulan}`,
      sku: 'FFG01T0100C',
      diskonPercent: 5,
      qty: 120,
      campaignName: `Shopee Flash Sale Toko Payday Awal - Perfect Glow Wash`,
      notes: 'Traffic builder Best Seller Facial Wash di Flash Sale Toko.'
    },
    {
      marketplace: 'TikTok Shop',
      kategori: 'Live Streaming',
      channel: 'Live Streaming',
      subKategori: 'Flash Sale',
      periode: 'Payday Awal',
      tanggal: `1 - 8 ${bulan}`,
      sku: 'FAR01B0015CS',
      diskonPercent: 5,
      qty: 90,
      campaignName: `TikTok Live Payday Awal - Age Revival Retinol Serum`,
      notes: 'Pin keranjang kuning #1 Live Streaming sesi malam 19.00-23.00 WIB.'
    },
    {
      marketplace: 'Lazada',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Payday Awal',
      periode: 'Payday Awal',
      tanggal: `1 - 8 ${bulan}`,
      sku: 'FAR03P0010GPES',
      diskonPercent: 4,
      qty: 70,
      campaignName: `Lazada Payday Awal LazFlash - Age Revival Day Cream`,
      notes: 'Slot LazFlash Payday Awal untuk lini NPD Age Revival.'
    },
    {
      marketplace: 'Shopee',
      kategori: 'Digital Marketing',
      channel: 'Digital Marketing',
      subKategori: 'Voucher',
      periode: 'Payday Awal',
      tanggal: `1 - 8 ${bulan}`,
      sku: 'BUNDLING-CBOOSTERSERIES',
      diskonPercent: 4,
      qty: 80,
      campaignName: `Meta CPAS & Shopee Ads Voucher Payday Awal - C-Booster Series`,
      notes: 'Voucher khusus landing page iklan Digital Marketing (Max 4% min belanja Rp 97.000).',
      promoType: 'Voucher',
      voucherConfig: {
        voucherName: `VOU-DM-${bulan.slice(0, 3).toUpperCase()}`,
        minOrder: 97000,
        nominalDiscount: 3880,
        maxDiscount: 5000,
        quota: 80
      }
    },

    // =====================================================================
    // 2. PERIODE DOUBLE DATE (9 - 11 <Bulan>)
    // =====================================================================
    {
      marketplace: 'Shopee',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Double Date',
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      sku: 'TWINSUNAGERPROTECTIONDC',
      diskonPercent: 5,
      qty: 110,
      campaignName: `Shopee Mega Campaign ${ddLabel} - Twinpack Sun Protector Age Revival`,
      notes: `Slot utama Campaign ${ddLabel} Shopee Mall. Diskon 5% aman di atas Bottom Price.`
    },
    {
      marketplace: 'Shopee',
      kategori: 'Live Streaming',
      channel: 'Live Streaming',
      subKategori: 'Flash Sale',
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      sku: 'FAA05T0100C',
      diskonPercent: 5,
      qty: 150,
      campaignName: `Shopee Live ${ddLabel} Volume Wash Mega Deal`,
      notes: `Volume driver Advanced Acne Facial Wash saat puncak trafik ${ddLabel}.`
    },
    {
      marketplace: 'Shopee',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Double Date',
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      sku: 'FMM03B0015C',
      diskonPercent: 5,
      qty: 120,
      campaignName: `Shopee ${ddLabel} Campaign Flash Sale - Theraskin Men Serum`,
      notes: 'Official Campaign Flash Sale produk perawatan pria unggulan.'
    },
    {
      marketplace: 'Shopee',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Double Date',
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      sku: 'FBD02B0030C',
      diskonPercent: 5,
      qty: 85,
      campaignName: `Shopee ${ddLabel} Campaign - Blurry Cover Skin Tint Shade 02`,
      notes: 'Featured Base Makeup NPD Campaign Flash Sale di Shopee.'
    },
    {
      marketplace: 'TikTok Shop',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Double Date',
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      sku: 'BUNDLING-CBOOSTERSERIES',
      diskonPercent: 5,
      qty: 130,
      campaignName: `TikTok Shop ${ddLabel} Mega Campaign - Daily C-Booster Series`,
      notes: `Hero Bundling C-Booster (Serum + Cream) di TikTok Shop ${ddLabel}.`
    },
    {
      marketplace: 'TikTok Shop',
      kategori: 'Live Streaming',
      channel: 'Live Streaming',
      subKategori: 'Paket / Bundling',
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      sku: 'GCAR2PC',
      diskonPercent: 5,
      qty: 85,
      campaignName: `TikTok Live ${ddLabel} Keranjang Kuning - Twinpack Gentle Cleanser`,
      notes: 'Bundling Cleanser Age Revival khusus TikTok Live Marathon.'
    },
    {
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      channel: 'Toko',
      subKategori: 'Flash Sale',
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      sku: 'CBOOSTERCREAM2PC',
      diskonPercent: 4,
      qty: 80,
      campaignName: `TikTok Flash Sale Toko ${ddLabel} - Twinpack C-Booster Cream`,
      notes: 'Twinpack C-Booster Cream hemat ongkir & volume booster.'
    },
    {
      marketplace: 'Lazada',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Double Date',
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      sku: 'BUNDLING-CBOOSTERSERIES',
      diskonPercent: 3,
      qty: 90,
      campaignName: `Lazada ${ddLabel} Mega Campaign - C-Booster Series Bundling`,
      notes: 'Lazada Campaign Flash Sale paket lengkap Vitamin C.'
    },
    {
      marketplace: 'Lazada',
      kategori: 'Toko',
      channel: 'Toko',
      subKategori: 'Flash Sale',
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      sku: 'TWINSUNAGERPROTECTIONDC',
      diskonPercent: 4,
      qty: 90,
      campaignName: `Lazada Flash Sale Toko ${ddLabel} - Twinpack Sun Protector`,
      notes: 'Hero sunscreen anti-aging kembar di Lazada.'
    },
    {
      marketplace: 'Lazada',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Double Date',
      periode: 'Double Date',
      tanggal: `9 - 11 ${bulan}`,
      sku: 'FMM03B0015C',
      diskonPercent: 5,
      qty: 80,
      campaignName: `Lazada ${ddLabel} Mega LazFlash - Theraskin Men Serum`,
      notes: 'LazFlash Mega Deal slot utama skincare pria.'
    },

    // =====================================================================
    // 3. PERIODE BAU (12 - 24 <Bulan>)
    // =====================================================================
    {
      marketplace: 'Shopee',
      kategori: 'Toko',
      channel: 'Toko',
      subKategori: 'Paket Diskon',
      periode: 'BAU',
      tanggal: `12 - 24 ${bulan}`,
      sku: 'FPK039S010CS0',
      diskonPercent: 5,
      qty: 100,
      campaignName: `Shopee Paket Diskon BAU - Perfect Glow Brightening Serum`,
      notes: 'Paket Diskon bertingkat BAU (Beli 3 disc 3%, Beli 4 disc 4%, Beli 5 disc 5%).',
      promoType: 'Paket Diskon',
      paketDiskonConfig: {
        tier1: 'Buy 3 Disc 3%',
        tier2: 'Buy 4 Disc 4%',
        tier3: 'Buy 5 Disc 5%',
        maxTierDiscountPercent: 5
      }
    },
    {
      marketplace: 'Shopee',
      kategori: 'Toko',
      channel: 'Toko',
      subKategori: 'Flash Sale',
      periode: 'BAU',
      tanggal: `12 - 24 ${bulan}`,
      sku: 'FAW02L0010CG',
      diskonPercent: 5,
      qty: 95,
      campaignName: `Shopee BAU Daily Flash Sale - AHA Cleanser Oil Control`,
      notes: 'Penjaga trafik harian kategori Oil Control di periode BAU (12-24).'
    },
    {
      marketplace: 'TikTok Shop',
      kategori: 'Toko',
      channel: 'Toko',
      subKategori: 'Paket Diskon',
      periode: 'BAU',
      tanggal: `12 - 24 ${bulan}`,
      sku: 'FNC02P0010CW',
      diskonPercent: 4,
      qty: 85,
      campaignName: `TikTok Shop Paket Diskon BAU - Niacinamide Cream Gel Oil Control`,
      notes: 'Combo hemat harian Oil Control (Buy 3 Disc 3%, Buy 4 Disc 4%).',
      promoType: 'Paket Diskon',
      paketDiskonConfig: {
        tier1: 'Buy 3 Disc 3%',
        tier2: 'Buy 4 Disc 4%',
        tier3: 'Buy 5 Disc 4%',
        maxTierDiscountPercent: 4
      }
    },
    {
      marketplace: 'Lazada',
      kategori: 'Toko',
      channel: 'Toko',
      subKategori: 'Paket Diskon',
      periode: 'BAU',
      tanggal: `12 - 24 ${bulan}`,
      sku: 'ECOADVACNE',
      diskonPercent: 4,
      qty: 90,
      campaignName: `Lazada Paket Diskon BAU - Bundle Ekonomis Advanced Acne`,
      notes: 'Paket hemat jerawat harian di Lazada pada periode BAU.',
      promoType: 'Paket Diskon',
      paketDiskonConfig: {
        tier1: 'Buy 3 Disc 3%',
        tier2: 'Buy 4 Disc 4%',
        tier3: 'Buy 5 Disc 4%',
        maxTierDiscountPercent: 4
      }
    },
    {
      marketplace: 'TikTok Shop',
      kategori: 'Digital Marketing',
      channel: 'Digital Marketing',
      subKategori: 'Promo Marketing',
      periode: 'BAU',
      tanggal: `12 - 24 ${bulan}`,
      sku: 'FVD02P0010G',
      diskonPercent: 4,
      qty: 100,
      campaignName: `TikTok Ads Spark Video BAU - Daily C-Booster Cream`,
      notes: 'Kampanye konten video pendek & affiliate booster periode BAU.'
    },

    // =====================================================================
    // 4. PERIODE PAYDAY AKHIR (25 - <AkhirBulan> <Bulan>)
    // =====================================================================
    {
      marketplace: 'Shopee',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Payday Akhir',
      periode: 'Payday Akhir',
      tanggal: `25 - ${endDay} ${bulan}`,
      sku: 'FPK00000039',
      diskonPercent: 4,
      qty: 60,
      campaignName: `Shopee Payday Akhir ${bulan} - Perfect Glow Paket Lengkap`,
      notes: 'AOV Booster Payday Akhir Bulan + Free Face Sponge / Pouch.'
    },
    {
      marketplace: 'Shopee',
      kategori: 'Toko',
      channel: 'Toko',
      subKategori: 'Promo Toko',
      periode: 'Payday Akhir',
      tanggal: `25 - ${endDay} ${bulan}`,
      sku: 'FPK00000040',
      diskonPercent: 3,
      qty: 50,
      campaignName: `Shopee Payday Akhir - Advanced Acne Paket Lengkap`,
      notes: 'Paket lengkap jerawat saat gajian akhir bulan. Diskon 3% aman di atas Bottom Price.'
    },
    {
      marketplace: 'Shopee',
      kategori: 'Toko',
      channel: 'Toko',
      subKategori: 'Flash Sale',
      periode: 'Payday Akhir',
      tanggal: `25 - ${endDay} ${bulan}`,
      sku: 'FPK00000037',
      diskonPercent: 3,
      qty: 55,
      campaignName: `Shopee Payday Akhir - CeraMoist Skin Barrier Paket Lengkap`,
      notes: 'Hero NPD CeraMoist Series paket lengkap saat Payday Akhir.'
    },
    {
      marketplace: 'TikTok Shop',
      kategori: 'Live Streaming',
      channel: 'Live Streaming',
      subKategori: 'Flash Sale Live',
      periode: 'Payday Akhir',
      tanggal: `25 - ${endDay} ${bulan}`,
      sku: 'FPK00000033',
      diskonPercent: 3,
      qty: 45,
      campaignName: `TikTok Live Payday Akhir - Age Revival Anti Aging Paket Lengkap`,
      notes: 'Target audiens wanita usia 25-45 tahun saat periode gajian akhir bulan.'
    },
    {
      marketplace: 'Lazada',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Payday Akhir',
      periode: 'Payday Akhir',
      tanggal: `25 - ${endDay} ${bulan}`,
      sku: 'FAR04P0010GPES',
      diskonPercent: 5,
      qty: 75,
      campaignName: `Lazada Payday Akhir Mega Sale - Age Revival Night Cream`,
      notes: 'Penutup bulan di Lazada untuk seri anti-aging.'
    },

    // =====================================================================
    // 5. BRAND MEMBERSHIP & VOUCHER FULL MONTH (1 - <AkhirBulan> <Bulan>)
    // =====================================================================
    {
      marketplace: 'Shopee',
      kategori: 'Brand Membership',
      channel: 'Brand Membership',
      subKategori: 'Voucher NPD',
      periode: 'Payday Awal',
      tanggal: `1 - ${endDay} ${bulan}`,
      sku: 'FPK00000032',
      diskonPercent: 4,
      qty: 65,
      campaignName: `Brand Membership Voucher NPD ${bulan} - AHA Glow White`,
      notes: 'Voucher eksklusif member baru & repeat order Brand Membership.',
      promoType: 'Voucher',
      voucherConfig: {
        voucherName: `MBR-NPD-${bulan.slice(0, 3).toUpperCase()}`,
        minOrder: 138500,
        nominalDiscount: 5540,
        maxDiscount: 10000,
        quota: 65
      }
    },
    {
      marketplace: 'Shopee',
      kategori: 'Brand Membership',
      channel: 'Brand Membership',
      subKategori: 'Flash Sale',
      periode: 'Double Date',
      tanggal: `1 - ${endDay} ${bulan}`,
      sku: 'FPK00000042',
      diskonPercent: 5,
      qty: 60,
      campaignName: `Brand Membership Exclusive Deal ${bulan} - Perfect Glow Basic`,
      notes: 'Member Exclusive Flash Sale mingguan dengan ekstra poin.'
    }
  ]

  return blueprints
    .filter(bp => marketplaces.includes(bp.marketplace))
    .filter(bp => channels.includes(bp.kategori))
    .filter(bp => {
      if (productMix === 'ALL') return true
      const cat = THERASKIN_MASTER_CATALOG.find(c => c.sku === bp.sku)
      return cat ? cat.productGroup === productMix : true
    })
    .map((bp, idx) =>
      recalculatePromoItem({
        id: `${prefix}-${idx + 1}`,
        bulan,
        tahun,
        status: defaultStatus,
        closing: 'All',
        ...bp
      })
    )
}

/**
 * Duplikasi Plan Bulanan (Bagian 31 Spesifikasi)
 * Menyalin plan dari bulan sumber ke bulan tujuan dengan penyesuaian tanggal otomatis
 * dan kalkulasi ulang harga dari Master Produk.
 */
export function duplicateMonthlyPromoPlan(
  sourceItems: PromoPlanItem[],
  targetBulan: string,
  targetTahun: number = 2026
): PromoPlanItem[] {
  const endDay = getMonthDaysCount(targetBulan, targetTahun)
  const targetMInfo = MONTH_LIST.find(x => x.name.toLowerCase() === targetBulan.toLowerCase())
  const targetDdLabel = targetMInfo?.doubleDateLabel || 'Double Date'

  return sourceItems.map((item, idx) => {
    // Sesuaikan tanggal & periode ke bulan tujuan
    let newTanggal = item.tanggal
    if (item.periode === 'Payday Awal') {
      newTanggal = `1 - 8 ${targetBulan}`
    } else if (item.periode === 'Double Date' || item.periode.toLowerCase().includes('twindate')) {
      newTanggal = `9 - 11 ${targetBulan}`
    } else if (item.periode === 'BAU') {
      newTanggal = `12 - 24 ${targetBulan}`
    } else if (item.periode === 'Payday Akhir' || item.periode === 'Payday') {
      newTanggal = `25 - ${endDay} ${targetBulan}`
    } else {
      newTanggal = `1 - ${endDay} ${targetBulan}`
    }

    // Sesuaikan nama campaign agar menyebut bulan/double date baru
    let newCampaignName = item.campaignName
      .replace(/September|Oktober|November|Desember|Januari|Februari|Maret/gi, targetBulan)
      .replace(/9\.9|10\.10|11\.11|12\.12/g, targetDdLabel)

    return recalculatePromoItem({
      ...item,
      id: `dup-${targetBulan.slice(0, 3).toLowerCase()}-${targetTahun}-${Date.now()}-${idx}`,
      bulan: targetBulan,
      tahun: targetTahun,
      tanggal: newTanggal,
      campaignName: newCampaignName,
      status: 'Scheduled',
      diskonPercent: Math.min(5, item.diskonPercent) // Pastikan tetap <= 5%
    })
  })
}

/**
 * INITIAL SEED DATA: Mencakup September, Oktober, November, dan Desember 2026
 * Seluruh baris sudah diverifikasi:
 * - Diskon <= 5%
 * - Harga Promo >= Bottom Price (Status Margin = AMAN)
 * - Memiliki SKU, Product Name, Harga Bulanan, Harga OB, dan Bottom Price lengkap
 */
export const INITIAL_REUSABLE_PROMO_PLANS: PromoPlanItem[] = [
  ...generateMonthlyPromoPlan({ bulan: 'September', tahun: 2026, defaultStatus: 'Completed' }),
  ...generateMonthlyPromoPlan({ bulan: 'Oktober', tahun: 2026, defaultStatus: 'Running' }),
  ...generateMonthlyPromoPlan({ bulan: 'November', tahun: 2026, defaultStatus: 'Scheduled' }),
  ...generateMonthlyPromoPlan({ bulan: 'Desember', tahun: 2026, defaultStatus: 'Scheduled' })
]
