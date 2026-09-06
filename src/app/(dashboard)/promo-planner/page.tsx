'use client'

import { useState, useMemo } from 'react'
import { 
  Calendar, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  Filter, 
  Tag, 
  Store, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Gift, 
  ShoppingBag, 
  Trash2, 
  ExternalLink,
  Sparkles,
  Info,
  CalendarDays,
  Search,
  Grid,
  List,
  Layers,
  HelpCircle,
  BadgePercent,
  Percent,
  Eye
} from 'lucide-react'
import * as xlsx from 'xlsx'

export interface PromoPlanItem {
  id: string
  bulan: 'Oktober' | 'November' | 'Desember'
  marketplace: 'Shopee' | 'TikTok Shop'
  kategori: 'Live Streaming' | 'Toko' | 'Campaign' | 'Brand Membership'
  subKategori: string // Flash Sale, Paket diskon, Voucher NPD, Promo Flash Sale, Diskon Toko
  periode: string // Twindate 10.10, Payday, Twindate 11.11, Harbolnas 12.12, Full Month Regular, DD & Payday, BAU
  tanggal: string // e.g. "1 - 31 Oktober", "10-12 Okt 2026", "25-31 Okt 2026"
  closing: 'All' | 'Pusat' | 'Cabang'
  sku: string
  productName: string // Matches "Product Name" column
  hargaBulanan: number // Matches "HARGA Bulanan" column (Harga normal/acuan)
  diskonPercent: number
  totalDiskon: number // Matches "Total Diskon" column (nominal diskon dlm Rp)
  hargaPromo: number // Matches "Harga Promo" column
  qty: number // Matches "Qty" column (Alokasi stok/target promosi)
  totalPromosi: number // Matches "Total Promosi" column (Qty * Total Diskon)
  hargaOB: number
  bottomPrice: number // OB - 3%
  notes?: string
}

// Master Pre-loaded Recommendations for Theraskin Q4 2026 (Extracted from Master Sheet & Pricing Rules)
const INITIAL_PROMO_PLANS: PromoPlanItem[] = [
  // ================= OKTOBER 2026 =================
  {
    id: 'okt-1',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: 'Twinpack Sun Protector Age Revival Protection Day Cream',
    hargaBulanan: 80400,
    diskonPercent: 6,
    totalDiskon: 4824,
    hargaPromo: 75576,
    qty: 50,
    totalPromosi: 241200,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: 'Hero Live Streaming Twindate 10.10. Pin keranjang kuning slot 12.00 & 19.00'
  },
  {
    id: 'okt-2',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FAA05T0100C',
    productName: 'Advanced Acne Facial Wash 100ml',
    hargaBulanan: 39200,
    diskonPercent: 6,
    totalDiskon: 2352,
    hargaPromo: 36848,
    qty: 120,
    totalPromosi: 282240,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: 'Volume driver acne series. Slot Flash Sale kilat 10.10'
  },
  {
    id: 'okt-3',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Promo Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FAR01B0015CS',
    productName: 'THERASKIN Age Revival Intense Retinol Serum Botol 15 ml Shrink',
    hargaBulanan: 64900,
    diskonPercent: 5,
    totalDiskon: 3245,
    hargaPromo: 61655,
    qty: 60,
    totalPromosi: 194700,
    hargaOB: 59000,
    bottomPrice: 57230,
    notes: 'Midnight Sale 00.00 - 02.00 WIB. Margin tinggi & repeat purchase kuat'
  },
  {
    id: 'okt-4',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'GCAR2PC',
    productName: 'Twinpack Age Revival Gentle Cleanser Tube 100 ml',
    hargaBulanan: 82600,
    diskonPercent: 6,
    totalDiskon: 4956,
    hargaPromo: 77644,
    qty: 40,
    totalPromosi: 198240,
    hargaOB: 75000,
    bottomPrice: 72750,
    notes: 'Bundling cleanser double volume 10.10'
  },
  {
    id: 'okt-5',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FAR03P0010GPES',
    productName: 'THERASKIN Age Revival Protection Day Cream Pot New 10 g Shrink',
    hargaBulanan: 40200,
    diskonPercent: 6,
    totalDiskon: 2412,
    hargaPromo: 37788,
    qty: 80,
    totalPromosi: 192960,
    hargaOB: 36000,
    bottomPrice: 34920,
    notes: 'Highlight TikTok Live Shop. Komisi affiliate creator 12%'
  },
  {
    id: 'okt-6',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Paket Promo',
    periode: 'Payday',
    tanggal: '25 - 31 Oktober',
    closing: 'All',
    sku: 'FPK00000040',
    productName: 'Theraskin Advanced Acne Paket Lengkap',
    hargaBulanan: 244700,
    diskonPercent: 3,
    totalDiskon: 7341,
    hargaPromo: 237359,
    qty: 35,
    totalPromosi: 256935,
    hargaOB: 243500,
    bottomPrice: 236195,
    notes: 'Paket Gajian + GWP Free Pouch Exclusive Theraskin'
  },
  {
    id: 'okt-7',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Paket Promo',
    periode: 'Payday',
    tanggal: '25 - 31 Oktober',
    closing: 'All',
    sku: 'FPK00000039',
    productName: 'Theraskin Perfect Glow Paket Lengkap',
    hargaBulanan: 269900,
    diskonPercent: 4,
    totalDiskon: 10796,
    hargaPromo: 259104,
    qty: 40,
    totalPromosi: 431840,
    hargaOB: 262500,
    bottomPrice: 254625,
    notes: 'AOV Booster Payday Oktober + Free Face Sponge / Brush'
  },
  {
    id: 'okt-8',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale Live',
    periode: 'Payday',
    tanggal: '25 - 31 Oktober',
    closing: 'All',
    sku: 'FPK00000033',
    productName: 'Theraskin Age Revival Anti Aging Paket Lengkap',
    hargaBulanan: 215000,
    diskonPercent: 3,
    totalDiskon: 6450,
    hargaPromo: 208550,
    qty: 30,
    totalPromosi: 193500,
    hargaOB: 210000,
    bottomPrice: 203700,
    notes: 'Target audiens wanita usia 25-45 tahun saat gajian'
  },
  {
    id: 'okt-9',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Brand Membership',
    subKategori: 'Voucher NPD',
    periode: 'Full Month Regular',
    tanggal: '1 - 31 Oktober',
    closing: 'All',
    sku: 'FPK00000032',
    productName: 'Paket Theraskin AHA Glow White',
    hargaBulanan: 138500,
    diskonPercent: 4,
    totalDiskon: 5540,
    hargaPromo: 132960,
    qty: 50,
    totalPromosi: 277000,
    hargaOB: 125000,
    bottomPrice: 121250,
    notes: 'Voucher khusus member baru toko & repeat order'
  },
  {
    id: 'okt-10',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Brand Membership',
    subKategori: 'Flash Sale',
    periode: 'Full Month Regular',
    tanggal: '1 - 31 Oktober',
    closing: 'All',
    sku: 'FPK00000042',
    productName: 'Theraskin Perfect Glow Basic Skincare',
    hargaBulanan: 159500,
    diskonPercent: 6,
    totalDiskon: 9570,
    hargaPromo: 149930,
    qty: 45,
    totalPromosi: 430650,
    hargaOB: 142000,
    bottomPrice: 137740,
    notes: 'Member Exclusive Flash Sale mingguan'
  },

  // ================= NOVEMBER 2026 =================
  {
    id: 'nov-1',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Super Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FAA05T0100C',
    productName: 'Advanced Acne Facial Wash 100ml',
    hargaBulanan: 39200,
    diskonPercent: 6,
    totalDiskon: 2352,
    hargaPromo: 36848,
    qty: 250,
    totalPromosi: 588000,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: 'Puncak Mega 11.11 Volume Terbesar Nasional'
  },
  {
    id: 'nov-2',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Super Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'TRIPLESUNAGERPROTECTIONDC',
    productName: 'Triplepack Sun Protector Age Revival Protection Day Cream',
    hargaBulanan: 120600,
    diskonPercent: 6,
    totalDiskon: 7236,
    hargaPromo: 113364,
    qty: 70,
    totalPromosi: 506520,
    hargaOB: 108000,
    bottomPrice: 104760,
    notes: 'Bundling Triplepack Sunscreen Super Deal 11.11'
  },
  {
    id: 'nov-3',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Super Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FAR01B0015CS',
    productName: 'THERASKIN Age Revival Intense Retinol Serum Botol 15 ml Shrink',
    hargaBulanan: 64900,
    diskonPercent: 5,
    totalDiskon: 3245,
    hargaPromo: 61655,
    qty: 100,
    totalPromosi: 324500,
    hargaOB: 59000,
    bottomPrice: 57230,
    notes: 'Super Brand Day 11.11 Flash Sale Utama'
  },
  {
    id: 'nov-4',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Mega 11.11 Live',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FPK00000039',
    productName: 'Theraskin Perfect Glow Paket Lengkap',
    hargaBulanan: 269900,
    diskonPercent: 4,
    totalDiskon: 10796,
    hargaPromo: 259104,
    qty: 60,
    totalPromosi: 647760,
    hargaOB: 262500,
    bottomPrice: 254625,
    notes: 'Live Streaming 24 Jam Nonstop kolaborasi Top Affiliate'
  },
  {
    id: 'nov-5',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'GCAR3PC',
    productName: 'Triplepack Age Revival Gentle Cleanser Tube 100 ml',
    hargaBulanan: 123900,
    diskonPercent: 6,
    totalDiskon: 7434,
    hargaPromo: 116466,
    qty: 50,
    totalPromosi: 371700,
    hargaOB: 110000,
    bottomPrice: 106700,
    notes: 'Hero Cleanser Bundling 11.11'
  },
  {
    id: 'nov-6',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Payday Sale',
    periode: 'Payday',
    tanggal: '25 - 30 November',
    closing: 'All',
    sku: 'FPK00000040',
    productName: 'Theraskin Advanced Acne Paket Lengkap',
    hargaBulanan: 244700,
    diskonPercent: 3,
    totalDiskon: 7341,
    hargaPromo: 237359,
    qty: 45,
    totalPromosi: 330345,
    hargaOB: 243500,
    bottomPrice: 236195,
    notes: 'Payday November & Black Friday Weekend'
  },
  {
    id: 'nov-7',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Payday Sale',
    periode: 'Payday',
    tanggal: '25 - 30 November',
    closing: 'All',
    sku: 'FPK00000037',
    productName: 'Theraskin CeraMoist Series Paket Lengkap',
    hargaBulanan: 198000,
    diskonPercent: 3,
    totalDiskon: 5940,
    hargaPromo: 192060,
    qty: 40,
    totalPromosi: 237600,
    hargaOB: 194500,
    bottomPrice: 188665,
    notes: 'Skin Barrier Hero Campaign + Free Pouch'
  },

  // ================= DESEMBER 2026 =================
  {
    id: 'des-1',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Harbolnas 12.12',
    periode: 'Harbolnas 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FAA05T0100C',
    productName: 'Advanced Acne Facial Wash 100ml',
    hargaBulanan: 39200,
    diskonPercent: 6,
    totalDiskon: 2352,
    hargaPromo: 36848,
    qty: 300,
    totalPromosi: 705600,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: 'Puncak Harbolnas 12.12 Nasional. Alokasi stok terbesar Q4'
  },
  {
    id: 'des-2',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Harbolnas 12.12',
    periode: 'Harbolnas 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FFG01T0100C',
    productName: 'Theraskin Perfect Glow Facial Wash 100ml',
    hargaBulanan: 41500,
    diskonPercent: 5,
    totalDiskon: 2075,
    hargaPromo: 39425,
    qty: 180,
    totalPromosi: 373500,
    hargaOB: 38000,
    bottomPrice: 36860,
    notes: 'Best Seller Glow Facial Wash 12.12'
  },
  {
    id: 'des-3',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Harbolnas 12.12',
    periode: 'Harbolnas 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FAR04P0010GPES',
    productName: 'THERASKIN Age Revival Moisture Lock Night Cream Pot 10 g Shrink',
    hargaBulanan: 41500,
    diskonPercent: 6,
    totalDiskon: 2490,
    hargaPromo: 39010,
    qty: 90,
    totalPromosi: 224100,
    hargaOB: 37000,
    bottomPrice: 35890,
    notes: 'Live Streaming 12.12 Special Host Deal'
  },
  {
    id: 'des-4',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Harbolnas 12.12',
    periode: 'Harbolnas 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FPK00000033',
    productName: 'Theraskin Age Revival Anti Aging Paket Lengkap',
    hargaBulanan: 215000,
    diskonPercent: 3,
    totalDiskon: 6450,
    hargaPromo: 208550,
    qty: 50,
    totalPromosi: 322500,
    hargaOB: 210000,
    bottomPrice: 203700,
    notes: 'Hero Anti-Aging Paket Harbolnas 12.12'
  },
  {
    id: 'des-5',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Year-End Sale',
    periode: 'Payday',
    tanggal: '25 - 31 Desember',
    closing: 'All',
    sku: 'FPK00000040',
    productName: 'Theraskin Advanced Acne Paket Lengkap',
    hargaBulanan: 244700,
    diskonPercent: 3,
    totalDiskon: 7341,
    hargaPromo: 237359,
    qty: 60,
    totalPromosi: 440460,
    hargaOB: 243500,
    bottomPrice: 236195,
    notes: 'Cuci Gudang Akhir Tahun 2026 + Free Pouch'
  },
  {
    id: 'des-6',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Year-End Sale',
    periode: 'Payday',
    tanggal: '25 - 31 Desember',
    closing: 'All',
    sku: 'FPK00000039',
    productName: 'Theraskin Perfect Glow Paket Lengkap',
    hargaBulanan: 269900,
    diskonPercent: 4,
    totalDiskon: 10796,
    hargaPromo: 259104,
    qty: 60,
    totalPromosi: 647760,
    hargaOB: 262500,
    bottomPrice: 254625,
    notes: 'Year-End Glowing Gift Set for New Year Eve'
  }
]

export default function PromoPlannerPage() {
  const [promoList, setPromoList] = useState<PromoPlanItem[]>(INITIAL_PROMO_PLANS)
  
  // Tab View Modes:
  // 'table' -> Format Persis Sheet September (Exact Columns)
  // 'calendar' -> Visual Weekly/Monthly Matrix (Persis Tab Kalender Promo September)
  // 'vouchers' -> Strategi Voucher, Tiered Bundling & GWP
  const [activeView, setActiveView] = useState<'table' | 'calendar' | 'vouchers'>('table')

  // Filter states
  const [filterBulan, setFilterBulan] = useState<string>('ALL') // ALL, Oktober, November, Desember
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL') // ALL, Shopee, TikTok Shop
  const [filterKategori, setFilterKategori] = useState<string>('ALL') // ALL, Live Streaming, Toko, Campaign, Brand Membership
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Calendar specific state
  const [calendarMonth, setCalendarMonth] = useState<'Oktober' | 'November' | 'Desember'>('Oktober')

  // Clipboard copy state
  const [copied, setCopied] = useState(false)

  // Modal State for custom promo
  const [showModal, setShowModal] = useState(false)
  const [newPromo, setNewPromo] = useState<Partial<PromoPlanItem>>({
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FAA05T0100C',
    productName: 'Advanced Acne Facial Wash 100ml',
    hargaBulanan: 39200,
    diskonPercent: 6,
    totalDiskon: 2352,
    hargaPromo: 36848,
    qty: 50,
    totalPromosi: 117600,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: ''
  })

  // Filtered list
  const filteredList = useMemo(() => {
    return promoList.filter(item => {
      const matchBulan = filterBulan === 'ALL' || item.bulan === filterBulan
      const matchPlatform = filterPlatform === 'ALL' || item.marketplace === filterPlatform
      const matchKategori = filterKategori === 'ALL' || item.kategori === filterKategori
      const matchSearch = !searchQuery.trim() || 
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.periode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchBulan && matchPlatform && matchKategori && matchSearch
    })
  }, [promoList, filterBulan, filterPlatform, filterKategori, searchQuery])

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalPromos = filteredList.length
    const totalTargetQty = filteredList.reduce((acc, curr) => acc + curr.qty, 0)
    const totalPromoCost = filteredList.reduce((acc, curr) => acc + curr.totalPromosi, 0)
    const safeCount = filteredList.filter(i => i.hargaPromo >= i.bottomPrice).length
    const isAllSafe = safeCount === totalPromos

    return { totalPromos, totalTargetQty, totalPromoCost, safeCount, isAllSafe }
  }, [filteredList])

  // 1-Click Copy Format for Google Sheets (Matches Tab September 1:1)
  // Headers match: Marketplace, Kategori, Sub Kategori, Periode, Tanggal, Closing, SKU, Product Name, HARGA Bulanan, Diskon, Total Diskon, Harga Promo, Qty, Total Promosi, Harga OB, Bottom Price, Status Margin
  const handleCopyToGoogleSheet = () => {
    const headers = [
      'Marketplace',
      'Kategori',
      'Sub Kategori',
      'Periode',
      'Tanggal',
      'Closing',
      'SKU',
      'Product Name',
      'HARGA Bulanan',
      'Diskon',
      'Total Diskon',
      'Harga Promo',
      'Qty',
      'Total Promosi',
      'Harga OB',
      'Bottom Price',
      'Status Margin',
      'Catatan'
    ].join('\t')

    const rows = filteredList.map(item => {
      const isSafe = item.hargaPromo >= item.bottomPrice ? 'AMAN' : 'BAHAYA'
      return [
        item.marketplace,
        item.kategori,
        item.subKategori,
        item.periode,
        item.tanggal,
        item.closing,
        item.sku,
        item.productName,
        item.hargaBulanan,
        `${item.diskonPercent}%`,
        item.totalDiskon,
        item.hargaPromo,
        item.qty,
        item.totalPromosi,
        item.hargaOB,
        item.bottomPrice,
        isSafe,
        item.notes || ''
      ].join('\t')
    }).join('\n')

    const fullText = `${headers}\n${rows}`
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 3500)
  }

  // Export to Real Excel .xlsx file with exact sheet column headers
  const handleExportExcel = () => {
    const dataForSheet = filteredList.map(item => ({
      'Marketplace': item.marketplace,
      'Kategori': item.kategori,
      'Sub Kategori': item.subKategori,
      'Periode': item.periode,
      'Tanggal': item.tanggal,
      'Closing': item.closing,
      'SKU': item.sku,
      'Product Name': item.productName,
      'HARGA Bulanan': item.hargaBulanan,
      'Diskon': `${item.diskonPercent}%`,
      'Total Diskon': item.totalDiskon,
      'Harga Promo': item.hargaPromo,
      'Qty': item.qty,
      'Total Promosi': item.totalPromosi,
      'Harga OB': item.hargaOB,
      'Bottom Price (-3% dr OB)': item.bottomPrice,
      'Status Margin': item.hargaPromo >= item.bottomPrice ? 'AMAN' : 'BAHAYA',
      'Catatan': item.notes || ''
    }))

    const worksheet = xlsx.utils.json_to_sheet(dataForSheet)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Plan Promo Q4')
    xlsx.writeFile(workbook, `Plan_Promo_Theraskin_Format_September_Q4.xlsx`)
  }

  const handleDeleteItem = (id: string) => {
    if (!confirm('Hapus baris promo ini dari plan?')) return
    setPromoList(prev => prev.filter(p => p.id !== id))
  }

  const handleAddCustomPromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPromo.sku || !newPromo.productName) return

    const hrgBulanan = Number(newPromo.hargaBulanan) || 0
    const diskonPct = Number(newPromo.diskonPercent) || 0
    const totDiskon = Number(newPromo.totalDiskon) || Math.round(hrgBulanan * (diskonPct / 100))
    const hrgPromo = Number(newPromo.hargaPromo) || (hrgBulanan - totDiskon)
    const qtyVal = Number(newPromo.qty) || 10
    const totPromo = Number(newPromo.totalPromosi) || (totDiskon * qtyVal)
    const hrgOB = Number(newPromo.hargaOB) || 0
    const btmPrice = Number(newPromo.bottomPrice) || Math.round(hrgOB * 0.97)

    const itemToAdd: PromoPlanItem = {
      id: `custom-${Date.now()}`,
      bulan: newPromo.bulan as any || 'Oktober',
      marketplace: newPromo.marketplace as any || 'Shopee',
      kategori: newPromo.kategori as any || 'Live Streaming',
      subKategori: newPromo.subKategori || 'Flash Sale',
      periode: newPromo.periode || 'Twindate 10.10',
      tanggal: newPromo.tanggal || '10 - 12 Oktober',
      closing: newPromo.closing as any || 'All',
      sku: newPromo.sku,
      productName: newPromo.productName,
      hargaBulanan: hrgBulanan,
      diskonPercent: diskonPct,
      totalDiskon: totDiskon,
      hargaPromo: hrgPromo,
      qty: qtyVal,
      totalPromosi: totPromo,
      hargaOB: hrgOB,
      bottomPrice: btmPrice,
      notes: newPromo.notes || 'Custom Promo'
    }

    setPromoList(prev => [itemToAdd, ...prev])
    setShowModal(false)
  }

  // Recalculate modal price helper
  const handleModalBulananChange = (val: number) => {
    const pct = newPromo.diskonPercent || 0
    const totDisc = Math.round(val * (pct / 100))
    const promoPrice = val - totDisc
    const qty = newPromo.qty || 10
    setNewPromo(prev => ({
      ...prev,
      hargaBulanan: val,
      totalDiskon: totDisc,
      hargaPromo: promoPrice,
      totalPromosi: totDisc * qty
    }))
  }

  const handleModalDiscountChange = (pct: number) => {
    const bulanan = newPromo.hargaBulanan || 0
    const totDisc = Math.round(bulanan * (pct / 100))
    const promoPrice = bulanan - totDisc
    const qty = newPromo.qty || 10
    setNewPromo(prev => ({
      ...prev,
      diskonPercent: pct,
      totalDiskon: totDisc,
      hargaPromo: promoPrice,
      totalPromosi: totDisc * qty
    }))
  }

  const handleModalOBChange = (obVal: number) => {
    setNewPromo(prev => ({
      ...prev,
      hargaOB: obVal,
      bottomPrice: Math.round(obVal * 0.97)
    }))
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Plan &amp; Kalender Promo Marketplace
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
              Format Sheet September 1:1
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Master draft promosi Q4 Theraskin: nama kolom identik dengan template sheet September, proteksi Bottom Price (-3% dr OB), &amp; kalender visual matriks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }} className="no-print">
          {/* 1-CLICK COPY TO SPREADSHEET (PRIMARY STAR FEATURE) */}
          <button 
            onClick={handleCopyToGoogleSheet} 
            className="btn-primary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              backgroundColor: copied ? '#059669' : 'var(--primary)',
              borderColor: copied ? '#059669' : 'var(--primary)',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            title="Klik untuk menyalin format tabel siap paste (Ctrl + V) ke Google Sheets"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Tersalin ke Clipboard! 🎉' : '📋 1-Click Copy ke Spreadsheet'}
          </button>

          {/* DOWNLOAD EXCEL */}
          <button 
            onClick={handleExportExcel} 
            className="btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <Download size={15} /> Download .xlsx
          </button>

          {/* TAMBAH PROMO CUSTOM */}
          <button 
            onClick={() => setShowModal(true)} 
            className="btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <Plus size={15} /> Tambah Promo
          </button>
        </div>
      </div>

      {/* COPIED ALERT NOTIFICATION */}
      {copied && (
        <div style={{ 
          padding: '14px 20px', 
          borderRadius: '10px', 
          backgroundColor: '#ecfdf5', 
          border: '1px solid #a7f3d0', 
          color: '#065f46', 
          fontSize: '0.875rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
        }}>
          <Check size={20} color="#059669" />
          <div>
            <strong>Tabel Berhasil Disalin!</strong> Format kolom (<em>Marketplace, Kategori, Sub Kategori, Periode, Tanggal, Closing, SKU, Product Name, HARGA Bulanan, Diskon, Total Diskon, Harga Promo, Qty, Total Promosi, Harga OB, Bottom Price, Status Margin</em>) siap dipaste ke Google Sheet. Cukup tekan <strong>Ctrl + V</strong> di sel tujuan!
          </div>
        </div>
      )}

      {/* STRATEGIC SUMMARY BADGES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '6px' }}>
            <CalendarDays size={16} color="var(--primary)" />
            <span>Total Promo Terjadwal</span>
          </div>
          <h2 className="stat-value" style={{ fontSize: '1.5rem', margin: 0 }}>{metrics.totalPromos} Item</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Oktober, November, Desember</p>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '6px' }}>
            <ShoppingBag size={16} color="#f97316" />
            <span>Target Alokasi Qty</span>
          </div>
          <h2 className="stat-value" style={{ fontSize: '1.5rem', margin: 0, color: '#f97316' }}>{metrics.totalTargetQty.toLocaleString('id-ID')} Pcs</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Estimasi stok promo flash sale &amp; toko</p>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '6px' }}>
            <BadgePercent size={16} color="#8b5cf6" />
            <span>Est. Total Biaya Promosi</span>
          </div>
          <h2 className="stat-value" style={{ fontSize: '1.5rem', margin: 0, color: '#8b5cf6' }}>Rp {metrics.totalPromoCost.toLocaleString('id-ID')}</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Investasi diskon (Qty × Total Diskon)</p>
        </div>

        <div className="stat-card" style={{ padding: '16px', backgroundColor: metrics.isAllSafe ? 'var(--success-light)' : 'var(--danger-light)', borderColor: metrics.isAllSafe ? 'var(--success-border)' : 'var(--danger-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: metrics.isAllSafe ? 'var(--success)' : 'var(--danger)', fontSize: '0.8125rem', marginBottom: '6px' }}>
            {metrics.isAllSafe ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
            <span>Proteksi Bottom Price</span>
          </div>
          <h2 className="stat-value" style={{ fontSize: '1.5rem', margin: 0, color: metrics.isAllSafe ? 'var(--success)' : 'var(--danger)' }}>
            {metrics.isAllSafe ? '100% AMAN' : 'PERIKSA MARGIN'}
          </h2>
          <p style={{ fontSize: '0.75rem', color: metrics.isAllSafe ? 'var(--success)' : 'var(--danger)', margin: '4px 0 0' }}>
            {metrics.safeCount}/{metrics.totalPromos} item di atas Bottom Price (-3% dr OB)
          </p>
        </div>
      </div>

      {/* VIEW SWITCHER TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveView('table')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            border: 'none',
            backgroundColor: activeView === 'table' ? 'var(--surface)' : 'transparent',
            color: activeView === 'table' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeView === 'table' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <List size={16} /> 📋 Tabel Format Sheet (Persis Sheet September)
        </button>

        <button
          onClick={() => setActiveView('calendar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            border: 'none',
            backgroundColor: activeView === 'calendar' ? 'var(--surface)' : 'transparent',
            color: activeView === 'calendar' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeView === 'calendar' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Grid size={16} /> 📅 Kalender Visual Promo (Persis Tab Kalender September)
        </button>

        <button
          onClick={() => setActiveView('vouchers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            border: 'none',
            backgroundColor: activeView === 'vouchers' ? 'var(--surface)' : 'transparent',
            color: activeView === 'vouchers' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeView === 'vouchers' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Gift size={16} /> 🎁 Mekanisme Voucher, Tiered Bundling &amp; GWP
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: TABLE FORMAT (PERSIS GOOGLE SHEET SEPTEMBER) */}
      {/* ========================================================================= */}
      {activeView === 'table' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* SEARCH & FILTER BAR */}
          <div className="card-flat no-print" style={{ padding: '14px 20px', display: 'flex', gap: '14px', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '10px', flexWrap: 'wrap' }}>
            
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '220px', position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
              <input
                type="text"
                placeholder="Cari SKU, Nama Produk, atau Periode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '34px', fontSize: '0.8125rem', width: '100%' }}
              />
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--surface-border)' }}></div>

            {/* Filter Bulan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <select 
                value={filterBulan} 
                onChange={(e) => setFilterBulan(e.target.value)}
                className="filter-select"
                style={{ minWidth: '125px', fontSize: '0.8125rem' }}
              >
                <option value="ALL">Semua Bulan</option>
                <option value="Oktober">Oktober 2026</option>
                <option value="November">November 2026</option>
                <option value="Desember">Desember 2026</option>
              </select>
            </div>

            {/* Filter Marketplace */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Store size={14} color="var(--text-muted)" />
              <select 
                value={filterPlatform} 
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="filter-select"
                style={{ minWidth: '130px', fontSize: '0.8125rem' }}
              >
                <option value="ALL">Semua Marketplace</option>
                <option value="Shopee">Shopee</option>
                <option value="TikTok Shop">TikTok Shop</option>
              </select>
            </div>

            {/* Filter Kategori */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} color="var(--text-muted)" />
              <select 
                value={filterKategori} 
                onChange={(e) => setFilterKategori(e.target.value)}
                className="filter-select"
                style={{ minWidth: '135px', fontSize: '0.8125rem' }}
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Live Streaming">Live Streaming</option>
                <option value="Toko">Toko</option>
                <option value="Campaign">Campaign</option>
                <option value="Brand Membership">Brand Membership</option>
              </select>
            </div>

            <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Menampilkan <strong>{filteredList.length}</strong> promo
            </span>
          </div>

          {/* TABLE CONTAINER */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Matriks Promosi Produk — Format Kolom Sheet September
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Urutan dan nama kolom: <code>Marketplace</code>, <code>Kategori</code>, <code>Sub Kategori</code>, <code>Periode</code>, <code>Tanggal</code>, <code>Closing</code>, <code>SKU</code>, <code>Product Name</code>, <code>HARGA Bulanan</code>, <code>Diskon</code>, <code>Total Diskon</code>, <code>Harga Promo</code>, <code>Qty</code>, <code>Total Promosi</code>.
                </p>
              </div>
              <button 
                onClick={handleCopyToGoogleSheet} 
                className="btn-outline" 
                style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />} Salin Kolom Sheet
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem', minWidth: '1300px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 700, borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '10px 12px' }}>Marketplace</th>
                    <th style={{ padding: '10px 12px' }}>Kategori</th>
                    <th style={{ padding: '10px 12px' }}>Sub Kategori</th>
                    <th style={{ padding: '10px 12px' }}>Periode</th>
                    <th style={{ padding: '10px 12px' }}>Tanggal</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Closing</th>
                    <th style={{ padding: '10px 12px' }}>SKU</th>
                    <th style={{ padding: '10px 12px', minWidth: '220px' }}>Product Name</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>HARGA Bulanan</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Diskon</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Diskon</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Harga Promo</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Promosi</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#e2e8f0' }}>Bottom Price</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', backgroundColor: '#e2e8f0' }}>Status Margin</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={17} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Tidak ada promo yang cocok dengan filter atau pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => {
                      const isSafe = item.hargaPromo >= item.bottomPrice
                      const diffToBottom = item.hargaPromo - item.bottomPrice

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background-color 0.15s' }}>
                          {/* 1. Marketplace */}
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.72rem', 
                              fontWeight: 700,
                              backgroundColor: item.marketplace === 'Shopee' ? '#fff1ee' : '#f1f5f9',
                              color: item.marketplace === 'Shopee' ? '#ee4d2d' : '#0f172a',
                              border: `1px solid ${item.marketplace === 'Shopee' ? '#fed7aa' : '#cbd5e1'}`
                            }}>
                              {item.marketplace}
                            </span>
                          </td>

                          {/* 2. Kategori */}
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.kategori}
                          </td>

                          {/* 3. Sub Kategori */}
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                            {item.subKategori}
                          </td>

                          {/* 4. Periode */}
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '0.72rem', 
                              fontWeight: 600,
                              backgroundColor: item.periode.includes('10.10') || item.periode.includes('11.11') || item.periode.includes('12.12') ? '#fef3c7' : item.periode.includes('Payday') ? '#ecfdf5' : '#f8fafc',
                              color: item.periode.includes('10.10') || item.periode.includes('11.11') || item.periode.includes('12.12') ? '#b45309' : item.periode.includes('Payday') ? '#047857' : '#475569'
                            }}>
                              {item.periode}
                            </span>
                          </td>

                          {/* 5. Tanggal */}
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                            {item.tanggal}
                          </td>

                          {/* 6. Closing */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {item.closing}
                          </td>

                          {/* 7. SKU */}
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>
                            {item.sku}
                          </td>

                          {/* 8. Product Name */}
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                            <div style={{ color: 'var(--text-primary)' }}>{item.productName}</div>
                            {item.notes && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--primary)', marginTop: '2px' }}>
                                💡 {item.notes}
                              </span>
                            )}
                          </td>

                          {/* 9. HARGA Bulanan */}
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                            Rp {item.hargaBulanan.toLocaleString('id-ID')}
                          </td>

                          {/* 10. Diskon */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#f97316' }}>
                            {item.diskonPercent}%
                          </td>

                          {/* 11. Total Diskon */}
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>
                            Rp {item.totalDiskon.toLocaleString('id-ID')}
                          </td>

                          {/* 12. Harga Promo */}
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                            Rp {item.hargaPromo.toLocaleString('id-ID')}
                          </td>

                          {/* 13. Qty */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.qty}
                          </td>

                          {/* 14. Total Promosi */}
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#8b5cf6' }}>
                            Rp {item.totalPromosi.toLocaleString('id-ID')}
                          </td>

                          {/* 15. Bottom Price */}
                          <td style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#f8fafc', color: 'var(--text-muted)' }}>
                            Rp {item.bottomPrice.toLocaleString('id-ID')}
                          </td>

                          {/* 16. Status Margin */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                            {isSafe ? (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '0.72rem', 
                                fontWeight: 700, 
                                backgroundColor: 'var(--success-light)', 
                                color: 'var(--success)' 
                              }}>
                                <ShieldCheck size={12} /> AMAN (+{diffToBottom.toLocaleString('id-ID')})
                              </span>
                            ) : (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '0.72rem', 
                                fontWeight: 700, 
                                backgroundColor: 'var(--danger-light)', 
                                color: 'var(--danger)' 
                              }}>
                                <AlertTriangle size={12} /> BAHAYA ({diffToBottom.toLocaleString('id-ID')})
                              </span>
                            )}
                          </td>

                          {/* 17. Aksi */}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              title="Hapus baris promo"
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--text-muted)', 
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: VISUAL CALENDAR (PERSIS TAB KALENDER PROMO SEPTEMBER) */}
      {/* ========================================================================= */}
      {activeView === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* MONTH SELECTOR BANNER */}
          <div className="card-flat" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '10px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CalendarDays size={20} color="var(--primary)" />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Matriks Kalender Promo {calendarMonth} 2026
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Format mingguan &amp; kanal promosi identik dengan tab <em>Kalender Promo September</em> di Google Sheet.
                </p>
              </div>
            </div>

            {/* MONTH SWITCHER PILLS */}
            <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              {(['Oktober', 'November', 'Desember'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setCalendarMonth(m)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    border: 'none',
                    backgroundColor: calendarMonth === m ? 'var(--surface)' : 'transparent',
                    color: calendarMonth === m ? 'var(--primary)' : 'var(--text-secondary)',
                    boxShadow: calendarMonth === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {m} 2026
                </button>
              ))}
            </div>
          </div>

          {/* CALENDAR SWIMLANE MATRIX */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            
            {/* WEEKDAYS HEADER (SENIN - MINGGU) */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '180px repeat(7, 1fr)', 
              backgroundColor: '#0f172a', 
              color: '#ffffff', 
              fontWeight: 700, 
              fontSize: '0.8125rem',
              borderBottom: '2px solid #334155'
            }}>
              <div style={{ padding: '12px 14px', borderRight: '1px solid #334155', display: 'flex', alignItems: 'center' }}>
                Kanal Promosi
              </div>
              <div style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Senin</div>
              <div style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Selasa</div>
              <div style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Rabu</div>
              <div style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Kamis</div>
              <div style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Jumat</div>
              <div style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #334155' }}>Sabtu</div>
              <div style={{ padding: '12px 8px', textAlign: 'center' }}>Minggu</div>
            </div>

            {/* DATES ROW (SAMPLE WEEK OVERVIEW FOR SELECTED MONTH) */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '180px repeat(7, 1fr)', 
              backgroundColor: '#f8fafc', 
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--surface-border)'
            }}>
              <div style={{ padding: '8px 14px', borderRight: '1px solid var(--surface-border)' }}>
                Fase Periode
              </div>
              <div style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid var(--surface-border)' }}>W1 (1-4)</div>
              <div style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid var(--surface-border)' }}>W1 (5-7)</div>
              <div style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid var(--surface-border)' }}>W2 (8-9)</div>
              <div style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid var(--surface-border)', backgroundColor: '#fef3c7', color: '#b45309' }}>
                ⭐ Mega Twindate
              </div>
              <div style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid var(--surface-border)' }}>W3 (15-20)</div>
              <div style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid var(--surface-border)' }}>W4 (21-24)</div>
              <div style={{ padding: '8px', textAlign: 'center', backgroundColor: '#ecfdf5', color: '#047857' }}>
                🎉 Payday Wave
              </div>
            </div>

            {/* ROW 1: FULL MONTH VOUCHER */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '180px repeat(7, 1fr)', 
              borderBottom: '1px solid var(--surface-border)',
              minHeight: '110px'
            }}>
              <div style={{ 
                padding: '16px 14px', 
                backgroundColor: '#f8fafc', 
                borderRight: '1px solid var(--surface-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>🏷️ Full Month</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Voucher Toko &amp; Video</span>
              </div>

              {/* Col 1-3 Regular */}
              <div style={{ gridColumn: 'span 3', padding: '12px', borderRight: '1px solid var(--surface-border)', fontSize: '0.75rem', backgroundColor: '#ffffff' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Voucher Akuisisi Pelanggan</div>
                <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <li>Voucher New Follower (Shopee) / New Buyers (TTS) 50% up to 5K</li>
                  <li>Voucher Video Disc max 5k min order 85k</li>
                  <li>Voc BAU max 3k min belanja 150k</li>
                </ul>
              </div>

              {/* Col 4 Twindate Mega Special */}
              <div style={{ padding: '12px', borderRight: '1px solid var(--surface-border)', fontSize: '0.75rem', backgroundColor: '#fffbeb' }}>
                <div style={{ fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>⭐ Special Twindate</div>
                <div style={{ color: '#92400e', lineHeight: 1.4 }}>
                  Voucher Mega Day disc 10% max 15k min order 150k + Golden Ticket 50%
                </div>
              </div>

              {/* Col 5-6 Mid Month */}
              <div style={{ gridColumn: 'span 2', padding: '12px', borderRight: '1px solid var(--surface-border)', fontSize: '0.75rem', backgroundColor: '#ffffff' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Mid-Month Retention</div>
                <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <li>Voc Repurchase NPD max 5k min order 40k</li>
                  <li>Voc Video Shopee max 5k min 85k</li>
                </ul>
              </div>

              {/* Col 7 Payday */}
              <div style={{ padding: '12px', fontSize: '0.75rem', backgroundColor: '#f0fdf4' }}>
                <div style={{ fontWeight: 700, color: '#15803d', marginBottom: '4px' }}>🎉 Payday Voucher</div>
                <div style={{ color: '#166534', lineHeight: 1.4 }}>
                  Voc Gajian max 10k min belanja 120k (Khusus Paket Lengkap &amp; Bundling C-Booster)
                </div>
              </div>
            </div>

            {/* ROW 2: PROMO TOKO (TIERED DISCOUNTS) */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '180px repeat(7, 1fr)', 
              borderBottom: '1px solid var(--surface-border)',
              minHeight: '120px'
            }}>
              <div style={{ 
                padding: '16px 14px', 
                backgroundColor: '#f8fafc', 
                borderRight: '1px solid var(--surface-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>🏪 Promo Toko</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Tiered Bundle &amp; Paket</span>
              </div>

              <div style={{ gridColumn: 'span 7', padding: '14px 18px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.75rem' }}>
                    Mekanisme Tiered Diskon Toko
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Beli <strong>3 pcs</strong> diskon <strong>4%</strong> | Beli <strong>4 pcs</strong> diskon <strong>5%</strong> | Beli <strong>5 pcs</strong> diskon <strong>6%</strong> (All SKU Existing &amp; NPD)
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Hero Pricing Full Month:</strong> C-Booster Serum Rp 58.000, C-Booster Cream Rp 39.000, Daily C-Booster Rp 94.000. Flash sale toko 3-5% untuk item pilihan (Acne, Glow, Retinol) bergantian setiap Senin &amp; Kamis.
                </div>
              </div>
            </div>

            {/* ROW 3: CAMPAIGN MARKETPLACE */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '180px repeat(7, 1fr)', 
              borderBottom: '1px solid var(--surface-border)',
              minHeight: '120px'
            }}>
              <div style={{ 
                padding: '16px 14px', 
                backgroundColor: '#f8fafc', 
                borderRight: '1px solid var(--surface-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>⚡ Campaign</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Flash Sale &amp; Mega Days</span>
              </div>

              {/* Early Month BAU */}
              <div style={{ gridColumn: 'span 3', padding: '12px', borderRight: '1px solid var(--surface-border)', fontSize: '0.75rem', backgroundColor: '#ffffff' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Flash Sale Selected Items 3-5%</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                  AHA Glow, Skin Tint, Daily C-Booster, Acne Wash. Penetrasi traffic awal bulan.
                </div>
              </div>

              {/* Twindate Mega Wave */}
              <div style={{ padding: '12px', borderRight: '1px solid var(--surface-border)', fontSize: '0.75rem', backgroundColor: '#fffbeb' }}>
                <div style={{ fontWeight: 700, color: '#b45309' }}>
                  {calendarMonth === 'Oktober' ? '⚡ 10.10 Mega Day' : calendarMonth === 'November' ? '⚡ 11.11 Big Sale' : '⚡ 12.12 Harbolnas'}
                </div>
                <div style={{ color: '#92400e', marginTop: '4px', lineHeight: 1.4 }}>
                  Flash Sale 5-6% Hero Wash &amp; Retinol Serum. Midnight Sale 00.00-02.00 WIB.
                </div>
              </div>

              {/* Mid Month */}
              <div style={{ gridColumn: 'span 2', padding: '12px', borderRight: '1px solid var(--surface-border)', fontSize: '0.75rem', backgroundColor: '#ffffff' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Mid-Month Flash Deals 3-4%</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                  Twinpack &amp; Triplepack Age Revival, Cleanser Tube, Ceramoist Series.
                </div>
              </div>

              {/* Payday Wave */}
              <div style={{ padding: '12px', fontSize: '0.75rem', backgroundColor: '#f0fdf4' }}>
                <div style={{ fontWeight: 700, color: '#15803d' }}>🎉 Gajian Sale 25-31</div>
                <div style={{ color: '#166534', marginTop: '4px', lineHeight: 1.4 }}>
                  Diskon 3-4% Paket Lengkap + Free Gift Pouch. Target AOV di atas Rp 250.000.
                </div>
              </div>
            </div>

            {/* ROW 4: LIVE STREAMING */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '180px repeat(7, 1fr)', 
              minHeight: '120px'
            }}>
              <div style={{ 
                padding: '16px 14px', 
                backgroundColor: '#f8fafc', 
                borderRight: '1px solid var(--surface-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>🎙️ Live Stream</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Shopee Live &amp; TikTok</span>
              </div>

              <div style={{ gridColumn: 'span 7', padding: '14px 18px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fdf2f8', color: '#db2777', fontWeight: 700, fontSize: '0.75rem' }}>
                    Live Streaming Strategy
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Flash Sale 3-6% khusus produk yang dipin di keranjang kuning live host. Voucher live diskon 50% max 5K.
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Prioritas SKU Live:</strong> Twinpack Sun Protector, Triplepack Gentle Cleanser, Night Cream Pot Mould, dan Bundling C-Booster. Durasi live minimal 8 jam/hari pada hari kerja, dan 16-24 jam nonstop saat Twindate &amp; Payday.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: VOUCHERS, TIERED BUNDLING & GWP STRATEGY */}
      {/* ========================================================================= */}
      {activeView === 'vouchers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* VOUCHER STRUCTURE */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BadgePercent size={20} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Struktur Voucher Marketplace
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Shopee &amp; TikTok Shop</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--surface-border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Voucher New Follower / New Buyer</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Diskon 50% up to Rp 5.000 tanpa minimal belanja (Semua Produk). Efektif mendongkrak konversi first-time buyer.
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--surface-border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Voucher Shopee Video &amp; Live</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Diskon max Rp 5.000 dengan minimal order Rp 85.000. Diberikan untuk checkout via keranjang Shopee Video / Live streaming.
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--surface-border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Voucher Payday &amp; Mega Campaign</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Diskon max Rp 10.000 dengan minimal belanja Rp 120.000. Khusus dialokasikan untuk produk Series Lengkap &amp; C-Booster.
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--surface-border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Voucher NPD (New Product Development)</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Voucher repeat order Rp 5.000 min pembelian Rp 40.000 khusus katalog inovasi produk baru.
                </div>
              </div>
            </div>
          </div>

          {/* TIERED BUNDLING MECHANICS */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={20} color="#f97316" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Tiered Bundling &amp; Diskon Toko
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Menaikkan Basket Size (AOV)</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Jumlah Pembelian</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Tier Diskon</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Est. Margin Safe</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>Beli 3 Pcs</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#f97316' }}>4% Diskon</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>AMAN &gt; OB</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>Beli 4 Pcs</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#f97316' }}>5% Diskon</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>AMAN &gt; OB</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>Beli 5 Pcs</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#f97316' }}>6% Diskon</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>AMAN &gt; Bottom Price</td>
                </tr>
              </tbody>
            </table>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              💡 <em>Catatan:</em> Sesuai closing rule, jika terdapat diskon yang sama dalam periode closing yang sama, sistem otomatis menghitung validitas kuota agar tidak double budget.
            </p>
          </div>

          {/* GWP & FREEBIES */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={20} color="#059669" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Freebies (GWP) Matrix
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Gift With Purchase Q4</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Pouch Exclusive Theraskin</strong>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 700 }}>Min Rp 200.000</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Otomatis diberikan untuk pembelian Paket Lengkap (Acne, Glow, Anti-Aging, Ceramoist) selama Twindate &amp; Payday.
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Beauty Sponge / Mask Brush</strong>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 700 }}>Min Rp 120.000</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Diberikan untuk pembelian bundling minimal 2 produk Glow Series atau C-Booster.
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Travel Size Gentle Toner (20ml)</strong>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 700 }}>Mega 12.12 Only</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Khusus 500 order pertama pada Midnight Sale 12.12 Harbolnas.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH PROMO CUSTOM */}
      {/* ========================================================================= */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              Tambah Baris Promosi Baru
            </h2>

            <form onSubmit={handleAddCustomPromo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Bulan
                  </label>
                  <select 
                    value={newPromo.bulan} 
                    onChange={(e) => setNewPromo(p => ({ ...p, bulan: e.target.value as any }))}
                    className="filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="Oktober">Oktober</option>
                    <option value="November">November</option>
                    <option value="Desember">Desember</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Marketplace
                  </label>
                  <select 
                    value={newPromo.marketplace} 
                    onChange={(e) => setNewPromo(p => ({ ...p, marketplace: e.target.value as any }))}
                    className="filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="TikTok Shop">TikTok Shop</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Kategori
                  </label>
                  <select 
                    value={newPromo.kategori} 
                    onChange={(e) => setNewPromo(p => ({ ...p, kategori: e.target.value as any }))}
                    className="filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="Live Streaming">Live Streaming</option>
                    <option value="Toko">Toko</option>
                    <option value="Campaign">Campaign</option>
                    <option value="Brand Membership">Brand Membership</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Sub Kategori
                  </label>
                  <input 
                    type="text" 
                    value={newPromo.subKategori} 
                    onChange={(e) => setNewPromo(p => ({ ...p, subKategori: e.target.value }))}
                    placeholder="Contoh: Flash Sale, Paket Promo" 
                    className="input-field" 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Periode
                  </label>
                  <input 
                    type="text" 
                    value={newPromo.periode} 
                    onChange={(e) => setNewPromo(p => ({ ...p, periode: e.target.value }))}
                    placeholder="Contoh: Twindate 10.10 / Payday" 
                    className="input-field" 
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Tanggal
                  </label>
                  <input 
                    type="text" 
                    value={newPromo.tanggal} 
                    onChange={(e) => setNewPromo(p => ({ ...p, tanggal: e.target.value }))}
                    placeholder="Contoh: 10 - 12 Oktober" 
                    className="input-field" 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Kode SKU
                  </label>
                  <input 
                    type="text" 
                    value={newPromo.sku} 
                    onChange={(e) => setNewPromo(p => ({ ...p, sku: e.target.value }))}
                    placeholder="FAA05T0100C" 
                    className="input-field" 
                    required 
                    style={{ width: '100%', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Product Name
                  </label>
                  <input 
                    type="text" 
                    value={newPromo.productName} 
                    onChange={(e) => setNewPromo(p => ({ ...p, productName: e.target.value }))}
                    placeholder="Theraskin Acne Facial Wash 100ml" 
                    className="input-field" 
                    required 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    HARGA Bulanan (Rp)
                  </label>
                  <input 
                    type="number" 
                    value={newPromo.hargaBulanan || ''} 
                    onChange={(e) => handleModalBulananChange(Number(e.target.value))}
                    className="input-field" 
                    required 
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Diskon (%)
                  </label>
                  <input 
                    type="number" 
                    value={newPromo.diskonPercent || ''} 
                    onChange={(e) => handleModalDiscountChange(Number(e.target.value))}
                    className="input-field" 
                    required 
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Harga Promo (Rp)
                  </label>
                  <input 
                    type="number" 
                    value={newPromo.hargaPromo || ''} 
                    onChange={(e) => setNewPromo(p => ({ ...p, hargaPromo: Number(e.target.value) }))}
                    className="input-field" 
                    required 
                    style={{ width: '100%', fontWeight: 700, color: 'var(--primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Target Qty
                  </label>
                  <input 
                    type="number" 
                    value={newPromo.qty || ''} 
                    onChange={(e) => {
                      const q = Number(e.target.value)
                      setNewPromo(p => ({ ...p, qty: q, totalPromosi: (p.totalDiskon || 0) * q }))
                    }}
                    className="input-field" 
                    required 
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Harga OB (Rp)
                  </label>
                  <input 
                    type="number" 
                    value={newPromo.hargaOB || ''} 
                    onChange={(e) => handleModalOBChange(Number(e.target.value))}
                    className="input-field" 
                    required 
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Bottom Price (-3%)
                  </label>
                  <input 
                    type="number" 
                    value={newPromo.bottomPrice || ''} 
                    readOnly
                    className="input-field" 
                    style={{ width: '100%', backgroundColor: '#f1f5f9' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Catatan Strategis
                </label>
                <input 
                  type="text" 
                  value={newPromo.notes || ''} 
                  onChange={(e) => setNewPromo(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Contoh: Slot Flash Sale Pukul 12.00, Free Pouch" 
                  className="input-field" 
                  style={{ width: '100%' }}
                />
              </div>

              {/* LIVE BOTTOM PRICE SAFETY CHECK */}
              {newPromo.hargaPromo && newPromo.bottomPrice ? (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: newPromo.hargaPromo >= newPromo.bottomPrice ? 'var(--success-light)' : 'var(--danger-light)',
                  color: newPromo.hargaPromo >= newPromo.bottomPrice ? 'var(--success)' : 'var(--danger)',
                  border: `1px solid ${newPromo.hargaPromo >= newPromo.bottomPrice ? 'var(--success-border)' : 'var(--danger-border)'}`
                }}>
                  {newPromo.hargaPromo >= newPromo.bottomPrice ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                  <span>
                    {newPromo.hargaPromo >= newPromo.bottomPrice 
                      ? `Harga Promo AMAN (+Rp ${(newPromo.hargaPromo - newPromo.bottomPrice).toLocaleString('id-ID')} di atas Bottom Price)` 
                      : `PERINGATAN: Harga Promo Rp ${(newPromo.bottomPrice - newPromo.hargaPromo).toLocaleString('id-ID')} di BAWAH Bottom Price!`}
                  </span>
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn-outline"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Simpan Promo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
