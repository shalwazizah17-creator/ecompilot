'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, 
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
  Eye,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowUpRight,
  SlidersHorizontal,
  Kanban,
  LayoutGrid,
  MoreHorizontal,
  TrendingUp,
  CheckCircle2,
  Maximize2,
  Minimize2
} from 'lucide-react'
import * as xlsx from 'xlsx'

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Running' | 'Completed'

export interface PromoPlanItem {
  id: string
  campaignName: string // Hero campaign label (e.g. "TwinDate 10.10 Flash Sale")
  status: CampaignStatus
  bulan: 'Oktober' | 'November' | 'Desember'
  marketplace: 'Shopee' | 'TikTok Shop' | 'Tokopedia' | 'Lazada'
  kategori: 'Live Streaming' | 'Toko' | 'Campaign' | 'Brand Membership'
  subKategori: string // Flash Sale, Paket diskon, Voucher NPD, Promo Flash Sale, Diskon Toko
  periode: string // Twindate 10.10, Payday, Twindate 11.11, Harbolnas 12.12, Full Month Regular, DD & Payday, BAU
  tanggal: string // e.g. "10 - 12 Oktober", "25 - 31 Oktober", "1 - 31 Oktober"
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
    id: 'hero-okt-1',
    campaignName: "TwinDate 10.10 Flash Sale Live",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: "Twinpack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 80400,
    diskonPercent: 6,
    totalDiskon: 4824,
    hargaPromo: 75576,
    qty: 50,
    totalPromosi: 241200,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: "Hero Live Streaming Twindate 10.10. Pin keranjang kuning slot 12.00 & 19.00"
  },
  {
    id: 'hero-okt-10',
    campaignName: "Brand Membership Glow Flash Sale",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Brand Membership',
    subKategori: 'Flash Sale',
    periode: 'Full Month Regular',
    tanggal: '1 - 31 Oktober',
    closing: 'All',
    sku: 'FPK00000042',
    productName: "Theraskin Perfect Glow Basic Skincare",
    hargaBulanan: 159500,
    diskonPercent: 6,
    totalDiskon: 9570,
    hargaPromo: 149930,
    qty: 45,
    totalPromosi: 430650,
    hargaOB: 142000,
    bottomPrice: 137740,
    notes: "Member Exclusive Flash Sale mingguan"
  },
  {
    id: 'hero-okt-2',
    campaignName: "TwinDate 10.10 Volume Wash Mega Deal",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FAA05T0100C',
    productName: "Advanced Acne Facial Wash 100ml",
    hargaBulanan: 39200,
    diskonPercent: 6,
    totalDiskon: 2352,
    hargaPromo: 36848,
    qty: 120,
    totalPromosi: 282240,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: "Volume driver acne series. Slot Flash Sale kilat 10.10"
  },
  {
    id: 'hero-okt-3',
    campaignName: "TwinDate 10.10 Midnight Retinol Sale",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Promo Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FAR01B0015CS',
    productName: "THERASKIN Age Revival Intense Retinol Serum Botol 15 ml Shrink",
    hargaBulanan: 64900,
    diskonPercent: 5,
    totalDiskon: 3245,
    hargaPromo: 61655,
    qty: 60,
    totalPromosi: 194700,
    hargaOB: 59000,
    bottomPrice: 57230,
    notes: "Midnight Sale 00.00 - 02.00 WIB. Margin tinggi & repeat purchase kuat"
  },
  {
    id: 'hero-okt-4',
    campaignName: "TwinDate 10.10 Cleanser Twinpack Deal",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'GCAR2PC',
    productName: "Twinpack Age Revival Gentle Cleanser Tube 100 ml",
    hargaBulanan: 82600,
    diskonPercent: 6,
    totalDiskon: 4956,
    hargaPromo: 77644,
    qty: 40,
    totalPromosi: 198240,
    hargaOB: 75000,
    bottomPrice: 72750,
    notes: "Bundling cleanser double volume 10.10"
  },
  {
    id: 'hero-okt-5',
    campaignName: "TikTok 10.10 Host Live Yellow Basket",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FAR03P0010GPES',
    productName: "THERASKIN Age Revival Protection Day Cream Pot New 10 g Shrink",
    hargaBulanan: 40200,
    diskonPercent: 6,
    totalDiskon: 2412,
    hargaPromo: 37788,
    qty: 80,
    totalPromosi: 192960,
    hargaOB: 36000,
    bottomPrice: 34920,
    notes: "Highlight TikTok Live Shop. Komisi affiliate creator 12%"
  },
  {
    id: 'hero-okt-6',
    campaignName: "Payday Acne Series + Free Pouch",
    status: 'Scheduled',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Paket Promo',
    periode: 'Payday',
    tanggal: '25 - 31 Oktober',
    closing: 'All',
    sku: 'FPK00000040',
    productName: "Theraskin Advanced Acne Paket Lengkap",
    hargaBulanan: 244700,
    diskonPercent: 3,
    totalDiskon: 7341,
    hargaPromo: 237359,
    qty: 35,
    totalPromosi: 256935,
    hargaOB: 243500,
    bottomPrice: 236195,
    notes: "Paket Gajian + GWP Free Pouch Exclusive Theraskin"
  },
  {
    id: 'hero-okt-7',
    campaignName: "Payday Glow Series AOV Booster",
    status: 'Scheduled',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Paket Promo',
    periode: 'Payday',
    tanggal: '25 - 31 Oktober',
    closing: 'All',
    sku: 'FPK00000039',
    productName: "Theraskin Perfect Glow Paket Lengkap",
    hargaBulanan: 269900,
    diskonPercent: 4,
    totalDiskon: 10796,
    hargaPromo: 259104,
    qty: 40,
    totalPromosi: 431840,
    hargaOB: 262500,
    bottomPrice: 254625,
    notes: "AOV Booster Payday Oktober + Free Face Sponge / Brush"
  },
  {
    id: 'hero-okt-8',
    campaignName: "TikTok Payday Anti-Aging Prime",
    status: 'Scheduled',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale Live',
    periode: 'Payday',
    tanggal: '25 - 31 Oktober',
    closing: 'All',
    sku: 'FPK00000033',
    productName: "Theraskin Age Revival Anti Aging Paket Lengkap",
    hargaBulanan: 215000,
    diskonPercent: 3,
    totalDiskon: 6450,
    hargaPromo: 208550,
    qty: 30,
    totalPromosi: 193500,
    hargaOB: 210000,
    bottomPrice: 203700,
    notes: "Target audiens wanita usia 25-45 tahun saat gajian"
  },
  {
    id: 'hero-okt-9',
    campaignName: "Brand Membership Member Baru NPD",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Brand Membership',
    subKategori: 'Voucher NPD',
    periode: 'Full Month Regular',
    tanggal: '1 - 31 Oktober',
    closing: 'All',
    sku: 'FPK00000032',
    productName: "Paket Theraskin AHA Glow White",
    hargaBulanan: 138500,
    diskonPercent: 4,
    totalDiskon: 5540,
    hargaPromo: 132960,
    qty: 50,
    totalPromosi: 277000,
    hargaOB: 125000,
    bottomPrice: 121250,
    notes: "Voucher khusus member baru toko & repeat order"
  },
  {
    id: 'okt-1',
    campaignName: "Voucher Member Baru NPD 10.10",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Brand Membership',
    subKategori: 'Voucher NPD',
    periode: 'Full Month Regular',
    tanggal: '1 - 31 Oktober',
    closing: 'All',
    sku: 'NPD-VMBR',
    productName: "Voucher Member Baru NPD (C-Booster Series & Theraskin Men)",
    hargaBulanan: 100000,
    diskonPercent: 10,
    totalDiskon: 10000,
    hargaPromo: 90000,
    qty: 150,
    totalPromosi: 1500000,
    hargaOB: 85000,
    bottomPrice: 82450,
    notes: "Voucher New Member khusus Produk Baru (C-Booster Series, Theraskin Men). Diskon 10% min order 100K."
  },
  {
    id: 'okt-10',
    campaignName: "Flash Sale Toko 10.10 C-Booster Cream",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FVD02P0010G',
    productName: "Theraskin Daily C-Booster Cream",
    hargaBulanan: 39000,
    diskonPercent: 4,
    totalDiskon: 1560,
    hargaPromo: 37440,
    qty: 90,
    totalPromosi: 140400,
    hargaOB: 35000,
    bottomPrice: 33950,
    notes: "Flash Sale Toko pendamping serum C-Booster. Penyerapan cepat mencerahkan flek hitam."
  },
  {
    id: 'okt-11',
    campaignName: "Flash Sale Toko Payday C-Booster Series Bundling",
    status: 'Scheduled',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Payday',
    tanggal: '25 - 31 Oktober',
    closing: 'All',
    sku: 'BUNDLING-CBOOSTERSERIES',
    productName: "Theraskin Daily C-Booster Series",
    hargaBulanan: 97000,
    diskonPercent: 4,
    totalDiskon: 3880,
    hargaPromo: 93120,
    qty: 80,
    totalPromosi: 310400,
    hargaOB: 88000,
    bottomPrice: 85360,
    notes: "Paket bundling C-Booster lengkap (Serum + Cream). Paling dicari saat gajian."
  },
  {
    id: 'okt-12',
    campaignName: "TikTok Flash Sale Toko C-Booster Cream Multi-Pack",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'CBOOSTERCREAM2PC',
    productName: "Theraskin Daily C-Booster Cream (2 Pcs Twinpack)",
    hargaBulanan: 78000,
    diskonPercent: 4,
    totalDiskon: 3120,
    hargaPromo: 74880,
    qty: 70,
    totalPromosi: 218400,
    hargaOB: 70000,
    bottomPrice: 67900,
    notes: "Twinpack C-Booster Cream TikTok Shop Flash Sale Toko. Hemat ongkir & volume booster."
  },
  {
    id: 'okt-13',
    campaignName: "Shopee Flash Sale Toko Twinpack Sun Protector Age Revival",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10 & Payday',
    tanggal: '10 - 12 Oktober & 25 - 31 Oktober',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: "Twinpack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 80400,
    diskonPercent: 4,
    totalDiskon: 3216,
    hargaPromo: 77184,
    qty: 90,
    totalPromosi: 289440,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: "Hero sunscreen anti-aging kembar di Shopee. Best value volume SKU."
  },
  {
    id: 'okt-14',
    campaignName: "TikTok Shop Flash Sale Toko Twinpack Sun Protector Age Revival",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10 & Payday',
    tanggal: '10 - 12 Oktober & 25 - 31 Oktober',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: "Twinpack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 80400,
    diskonPercent: 4,
    totalDiskon: 3216,
    hargaPromo: 77184,
    qty: 90,
    totalPromosi: 289440,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: "Hero sunscreen anti-aging kembar di TikTok Shop. Best value volume SKU."
  },
  {
    id: 'okt-15',
    campaignName: "Lazada Flash Sale Toko Twinpack Sun Protector Age Revival",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10 & Payday',
    tanggal: '10 - 12 Oktober & 25 - 31 Oktober',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: "Twinpack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 80400,
    diskonPercent: 4,
    totalDiskon: 3216,
    hargaPromo: 77184,
    qty: 90,
    totalPromosi: 289440,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: "Hero sunscreen anti-aging kembar di Lazada. Best value volume SKU."
  },
  {
    id: 'okt-16',
    campaignName: "Shopee Flash Sale Toko Bundle Ekonomis Advanced Acne",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'ECOADVACNE',
    productName: "Bundle Ekonomis Advanced Acne",
    hargaBulanan: 75400,
    diskonPercent: 4,
    totalDiskon: 3016,
    hargaPromo: 72384,
    qty: 110,
    totalPromosi: 331760,
    hargaOB: 68000,
    bottomPrice: 65960,
    notes: "Paket hemat jerawat untuk pelajar & pemula di Shopee."
  },
  {
    id: 'okt-17',
    campaignName: "Lazada Flash Sale Toko Bundle Ekonomis Advanced Acne",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'ECOADVACNE',
    productName: "Bundle Ekonomis Advanced Acne",
    hargaBulanan: 75400,
    diskonPercent: 4,
    totalDiskon: 3016,
    hargaPromo: 72384,
    qty: 110,
    totalPromosi: 331760,
    hargaOB: 68000,
    bottomPrice: 65960,
    notes: "Paket hemat jerawat untuk pelajar & pemula di Lazada."
  },
  {
    id: 'okt-18',
    campaignName: "Shopee 10.10 Campaign Flash Sale Theraskin Men Serum",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FMM03B0015C',
    productName: "Theraskin Men Multi Action Serum 15 mL",
    hargaBulanan: 52000,
    diskonPercent: 5,
    totalDiskon: 2600,
    hargaPromo: 49400,
    qty: 120,
    totalPromosi: 312000,
    hargaOB: 47000,
    bottomPrice: 45590,
    notes: "Official Campaign Flash Sale slot Shopee Mall / Super Brand Day. Produk pria unggulan."
  },
  {
    id: 'okt-19',
    campaignName: "TikTok Shop 10.10 Mega Campaign Flash Sale Men Serum",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FMM03B0015C',
    productName: "Theraskin Men Multi Action Serum 15 mL",
    hargaBulanan: 52000,
    diskonPercent: 5,
    totalDiskon: 2600,
    hargaPromo: 49400,
    qty: 130,
    totalPromosi: 338000,
    hargaOB: 47000,
    bottomPrice: 45590,
    notes: "Featured TikTok Shop Mega Campaign banner + Affiliate Creator Push untuk Men Skincare."
  },
  {
    id: 'okt-2',
    campaignName: "Voucher Pembelian Berulang NPD 10.10",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Brand Membership',
    subKategori: 'Voucher NPD',
    periode: 'Full Month Regular',
    tanggal: '1 - 31 Oktober',
    closing: 'All',
    sku: 'NPD-VREP',
    productName: "Voucher Pembelian Berulang NPD (C-Booster Series & Theraskin Men)",
    hargaBulanan: 150000,
    diskonPercent: 13,
    totalDiskon: 19500,
    hargaPromo: 130500,
    qty: 100,
    totalPromosi: 1950000,
    hargaOB: 120000,
    bottomPrice: 116400,
    notes: "Voucher Repeat Order pelanggan setia untuk C-Booster Series & Theraskin Men. Diskon 13% min order 150K."
  },
  {
    id: 'okt-20',
    campaignName: "Lazada 10.10 Mega Campaign Flash Sale Men Serum",
    status: 'Scheduled',
    bulan: 'Oktober',
    marketplace: 'Lazada',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FMM03B0015C',
    productName: "Theraskin Men Multi Action Serum 15 mL",
    hargaBulanan: 52000,
    diskonPercent: 5,
    totalDiskon: 2600,
    hargaPromo: 49400,
    qty: 80,
    totalPromosi: 208000,
    hargaOB: 47000,
    bottomPrice: 45590,
    notes: "LazFlash Mega Deal slot utama pria. Sesuai master sheet row 642 & 660."
  },
  {
    id: 'okt-21',
    campaignName: "Shopee 10.10 Campaign Flash Sale C-Booster Serum",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FVD01B0015C',
    productName: "Theraskin Daily C-Booster Serum",
    hargaBulanan: 58000,
    diskonPercent: 4,
    totalDiskon: 2320,
    hargaPromo: 55680,
    qty: 110,
    totalPromosi: 255200,
    hargaOB: 52000,
    bottomPrice: 50440,
    notes: "Shopee Campaign Flash Sale resmi 10.10/11.11/12.12. Diskon 4% harga promo Rp 55.680."
  },
  {
    id: 'okt-22',
    campaignName: "TikTok Shop 10.10 Campaign Flash Sale C-Booster Cream",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FVD02P0010G',
    productName: "Theraskin Daily C-Booster Cream",
    hargaBulanan: 39000,
    diskonPercent: 2,
    totalDiskon: 780,
    hargaPromo: 38220,
    qty: 100,
    totalPromosi: 78000,
    hargaOB: 35000,
    bottomPrice: 33950,
    notes: "Official Campaign Flash Sale TikTok Shop. Diskon 2% harga promo Rp 38.220."
  },
  {
    id: 'okt-23',
    campaignName: "Lazada 10.10 Campaign Flash Sale C-Booster Series Bundling",
    status: 'Scheduled',
    bulan: 'Oktober',
    marketplace: 'Lazada',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'BUNDLING-CBOOSTERSERIES',
    productName: "Theraskin Daily C-Booster Series",
    hargaBulanan: 97000,
    diskonPercent: 3,
    totalDiskon: 2910,
    hargaPromo: 94090,
    qty: 90,
    totalPromosi: 261900,
    hargaOB: 88000,
    bottomPrice: 85360,
    notes: "Lazada Campaign Flash Sale paket lengkap Vit C. Sesuai row 626 master sheet."
  },
  {
    id: 'okt-24',
    campaignName: "Shopee 10.10 Campaign Flash Sale Blurry Skin Tint Shade 02",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FBD02B0030C',
    productName: "Theraskin Blurry Cover Skin Tint Shade 02 Light to Medium",
    hargaBulanan: 68200,
    diskonPercent: 5,
    totalDiskon: 3410,
    hargaPromo: 64790,
    qty: 85,
    totalPromosi: 289850,
    hargaOB: 61000,
    bottomPrice: 59170,
    notes: "Featured Base Makeup NPD Campaign Flash Sale di Shopee. Harga promo Rp 64.790."
  },
  {
    id: 'okt-25',
    campaignName: "TikTok Shop 10.10 Campaign Flash Sale Blurry Skin Tint Shade 02",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FBD02B0030C',
    productName: "Theraskin Blurry Cover Skin Tint Shade 02 Light to Medium",
    hargaBulanan: 68200,
    diskonPercent: 5,
    totalDiskon: 3410,
    hargaPromo: 64790,
    qty: 85,
    totalPromosi: 289850,
    hargaOB: 61000,
    bottomPrice: 59170,
    notes: "Featured Base Makeup NPD Campaign Flash Sale di TikTok Shop. Harga promo Rp 64.790."
  },
  {
    id: 'okt-26',
    campaignName: "Shopee Live 10.10 Midnight Flash Sale Retinol Serum",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FAR01B0015CS',
    productName: "THERASKIN Age Revival Intense Retinol Serum Botol 15 ml Shrink",
    hargaBulanan: 64900,
    diskonPercent: 6,
    totalDiskon: 3894,
    hargaPromo: 61006,
    qty: 100,
    totalPromosi: 389400,
    hargaOB: 58000,
    bottomPrice: 56260,
    notes: "Hero live streaming jam 20.00-24.00. Ekstra voucher live 15% Shopee."
  },
  {
    id: 'okt-27',
    campaignName: "TikTok Live 10.10 Keranjang Kuning C-Booster Series Bundling",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'BUNDLING-CBOOSTERSERIES',
    productName: "Theraskin Daily C-Booster Series",
    hargaBulanan: 97000,
    diskonPercent: 6,
    totalDiskon: 5820,
    hargaPromo: 91180,
    qty: 120,
    totalPromosi: 698400,
    hargaOB: 88000,
    bottomPrice: 85360,
    notes: "Pin Keranjang Kuning nomor 1 & 2 di TikTok Live Stream Marathon. Komisi affiliate 12%."
  },
  {
    id: 'okt-28',
    campaignName: "Shopee Live Payday Volume Wash Cleanser Mega Deal",
    status: 'Scheduled',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Payday',
    tanggal: '25 - 31 Oktober',
    closing: 'All',
    sku: 'FAA05T0100C',
    productName: "Advanced Acne Facial Wash 100ml",
    hargaBulanan: 39200,
    diskonPercent: 6,
    totalDiskon: 2352,
    hargaPromo: 36848,
    qty: 150,
    totalPromosi: 352800,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: "Flash Sale Kilat Live Stream Payday. Fast moving order booster."
  },
  {
    id: 'okt-3',
    campaignName: "Shopee Paket Diskon NPD Volume 10.10",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'Twindate 10.10 & Payday',
    tanggal: '10 - 12 Oktober & 25 - 31 Oktober',
    closing: 'All',
    sku: 'NPD-TIER35',
    productName: "Paket Diskon NPD (Beli 3 disc 4%, 4 disc 5%, 5 disc 6%)",
    hargaBulanan: 150000,
    diskonPercent: 5,
    totalDiskon: 7500,
    hargaPromo: 142500,
    qty: 120,
    totalPromosi: 900000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Combo hemat produk baru Theraskin (C-Booster Series & Theraskin Men). Bertingkat 4%-6% di Shopee."
  },
  {
    id: 'okt-4',
    campaignName: "Shopee Paket Diskon NPD BAU Harian",
    status: 'Scheduled',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'BAU',
    tanggal: '13 - 24 Oktober',
    closing: 'All',
    sku: 'NPD-TIERBAU',
    productName: "Paket Diskon NPD Reguler (Beli 3 disc 2%, 4 disc 3%, 5 disc 5%)",
    hargaBulanan: 150000,
    diskonPercent: 3,
    totalDiskon: 4500,
    hargaPromo: 145500,
    qty: 80,
    totalPromosi: 360000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Paket diskon harian BAU produk baru Theraskin (C-Booster & Men Series) di Shopee."
  },
  {
    id: 'okt-5',
    campaignName: "TikTok Shop Paket Diskon NPD Volume 10.10",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'Twindate 10.10 & Payday',
    tanggal: '10 - 12 Oktober & 25 - 31 Oktober',
    closing: 'All',
    sku: 'NPD-TIER35',
    productName: "Paket Diskon NPD (Beli 3 disc 4%, 4 disc 5%, 5 disc 6%)",
    hargaBulanan: 150000,
    diskonPercent: 5,
    totalDiskon: 7500,
    hargaPromo: 142500,
    qty: 120,
    totalPromosi: 900000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Combo hemat produk baru Theraskin (C-Booster Series & Theraskin Men). Bertingkat 4%-6% di TikTok Shop."
  },
  {
    id: 'okt-6',
    campaignName: "TikTok Shop Paket Diskon NPD BAU Harian",
    status: 'Scheduled',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'BAU',
    tanggal: '13 - 24 Oktober',
    closing: 'All',
    sku: 'NPD-TIERBAU',
    productName: "Paket Diskon NPD Reguler (Beli 3 disc 2%, 4 disc 3%, 5 disc 5%)",
    hargaBulanan: 150000,
    diskonPercent: 3,
    totalDiskon: 4500,
    hargaPromo: 145500,
    qty: 80,
    totalPromosi: 360000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Paket diskon harian BAU produk baru Theraskin (C-Booster & Men Series) di TikTok Shop."
  },
  {
    id: 'okt-7',
    campaignName: "Lazada Paket Diskon NPD Volume 10.10",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'Twindate 10.10 & Payday',
    tanggal: '10 - 12 Oktober & 25 - 31 Oktober',
    closing: 'All',
    sku: 'NPD-TIER35',
    productName: "Paket Diskon NPD (Beli 3 disc 4%, 4 disc 5%, 5 disc 6%)",
    hargaBulanan: 150000,
    diskonPercent: 5,
    totalDiskon: 7500,
    hargaPromo: 142500,
    qty: 120,
    totalPromosi: 900000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Combo hemat produk baru Theraskin (C-Booster Series & Theraskin Men). Bertingkat 4%-6% di Lazada."
  },
  {
    id: 'okt-8',
    campaignName: "Lazada Paket Diskon NPD BAU Harian",
    status: 'Scheduled',
    bulan: 'Oktober',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'BAU',
    tanggal: '13 - 24 Oktober',
    closing: 'All',
    sku: 'NPD-TIERBAU',
    productName: "Paket Diskon NPD Reguler (Beli 3 disc 2%, 4 disc 3%, 5 disc 5%)",
    hargaBulanan: 150000,
    diskonPercent: 3,
    totalDiskon: 4500,
    hargaPromo: 145500,
    qty: 80,
    totalPromosi: 360000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Paket diskon harian BAU produk baru Theraskin (C-Booster & Men Series) di Lazada."
  },
  {
    id: 'okt-9',
    campaignName: "Flash Sale Toko 10.10 C-Booster Serum",
    status: 'Running',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 - 12 Oktober',
    closing: 'All',
    sku: 'FVD01B0015C',
    productName: "Theraskin Daily C-Booster Serum",
    hargaBulanan: 58000,
    diskonPercent: 4,
    totalDiskon: 2320,
    hargaPromo: 55680,
    qty: 100,
    totalPromosi: 232000,
    hargaOB: 52000,
    bottomPrice: 50440,
    notes: "Flash Sale Toko slot jam 12.00 & 20.00. Hero hero produk pencerah Vit C terbaru."
  },
  // ================= NOVEMBER 2026 =================
  {
    id: 'hero-nov-1',
    campaignName: "Mega 11.11 Puncak Volume Acne Wash",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Super Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FAA05T0100C',
    productName: "Advanced Acne Facial Wash 100ml",
    hargaBulanan: 39200,
    diskonPercent: 6,
    totalDiskon: 2352,
    hargaPromo: 36848,
    qty: 250,
    totalPromosi: 588000,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: "Puncak Mega 11.11 Volume Terbesar Nasional"
  },
  {
    id: 'hero-nov-2',
    campaignName: "Mega 11.11 Triplepack Sunscreen Deal",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Super Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'TRIPLESUNAGERPROTECTIONDC',
    productName: "Triplepack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 120600,
    diskonPercent: 6,
    totalDiskon: 7236,
    hargaPromo: 113364,
    qty: 70,
    totalPromosi: 506520,
    hargaOB: 108000,
    bottomPrice: 104760,
    notes: "Bundling Triplepack Sunscreen Super Deal 11.11"
  },
  {
    id: 'hero-nov-3',
    campaignName: "Super Brand Day 11.11 Retinol Serum",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Super Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FAR01B0015CS',
    productName: "THERASKIN Age Revival Intense Retinol Serum Botol 15 ml Shrink",
    hargaBulanan: 64900,
    diskonPercent: 5,
    totalDiskon: 3245,
    hargaPromo: 61655,
    qty: 100,
    totalPromosi: 324500,
    hargaOB: 59000,
    bottomPrice: 57230,
    notes: "Super Brand Day 11.11 Flash Sale Utama"
  },
  {
    id: 'hero-nov-4',
    campaignName: "TikTok Mega 11.11 Live 24 Jam Nonstop",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Mega 11.11 Live',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FPK00000039',
    productName: "Theraskin Perfect Glow Paket Lengkap",
    hargaBulanan: 269900,
    diskonPercent: 4,
    totalDiskon: 10796,
    hargaPromo: 259104,
    qty: 60,
    totalPromosi: 647760,
    hargaOB: 262500,
    bottomPrice: 254625,
    notes: "Live Streaming 24 Jam Nonstop kolaborasi Top Affiliate"
  },
  {
    id: 'hero-nov-5',
    campaignName: "11.11 Gentle Cleanser Hero Bundling",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'GCAR3PC',
    productName: "Triplepack Age Revival Gentle Cleanser Tube 100 ml",
    hargaBulanan: 123900,
    diskonPercent: 6,
    totalDiskon: 7434,
    hargaPromo: 116466,
    qty: 50,
    totalPromosi: 371700,
    hargaOB: 110000,
    bottomPrice: 106700,
    notes: "Hero Cleanser Bundling 11.11"
  },
  {
    id: 'hero-nov-6',
    campaignName: "Payday Nov & Black Friday Weekend",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Payday Sale',
    periode: 'Payday',
    tanggal: '25 - 30 November',
    closing: 'All',
    sku: 'FPK00000040',
    productName: "Theraskin Advanced Acne Paket Lengkap",
    hargaBulanan: 244700,
    diskonPercent: 3,
    totalDiskon: 7341,
    hargaPromo: 237359,
    qty: 45,
    totalPromosi: 330345,
    hargaOB: 243500,
    bottomPrice: 236195,
    notes: "Payday November & Black Friday Weekend"
  },
  {
    id: 'hero-nov-7',
    campaignName: "CeraMoist Skin Barrier Payday",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Payday Sale',
    periode: 'Payday',
    tanggal: '25 - 30 November',
    closing: 'All',
    sku: 'FPK00000037',
    productName: "Theraskin CeraMoist Series Paket Lengkap",
    hargaBulanan: 198000,
    diskonPercent: 3,
    totalDiskon: 5940,
    hargaPromo: 192060,
    qty: 40,
    totalPromosi: 237600,
    hargaOB: 194500,
    bottomPrice: 188665,
    notes: "Skin Barrier Hero Campaign + Free Pouch"
  },
  {
    id: 'nov-1',
    campaignName: "Voucher Member Baru NPD 11.11",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Brand Membership',
    subKategori: 'Voucher NPD',
    periode: 'Full Month Regular',
    tanggal: '1 - 30 November',
    closing: 'All',
    sku: 'NPD-VMBR',
    productName: "Voucher Member Baru NPD (C-Booster Series & Theraskin Men)",
    hargaBulanan: 100000,
    diskonPercent: 10,
    totalDiskon: 10000,
    hargaPromo: 90000,
    qty: 150,
    totalPromosi: 1500000,
    hargaOB: 85000,
    bottomPrice: 82450,
    notes: "Voucher New Member khusus Produk Baru (C-Booster Series, Theraskin Men). Diskon 10% min order 100K."
  },
  {
    id: 'nov-10',
    campaignName: "Flash Sale Toko 11.11 C-Booster Cream",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FVD02P0010G',
    productName: "Theraskin Daily C-Booster Cream",
    hargaBulanan: 39000,
    diskonPercent: 4,
    totalDiskon: 1560,
    hargaPromo: 37440,
    qty: 90,
    totalPromosi: 140400,
    hargaOB: 35000,
    bottomPrice: 33950,
    notes: "Flash Sale Toko pendamping serum C-Booster. Penyerapan cepat mencerahkan flek hitam."
  },
  {
    id: 'nov-11',
    campaignName: "Flash Sale Toko Payday C-Booster Series Bundling",
    status: 'Draft',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Payday',
    tanggal: '25 - 30 November',
    closing: 'All',
    sku: 'BUNDLING-CBOOSTERSERIES',
    productName: "Theraskin Daily C-Booster Series",
    hargaBulanan: 97000,
    diskonPercent: 4,
    totalDiskon: 3880,
    hargaPromo: 93120,
    qty: 80,
    totalPromosi: 310400,
    hargaOB: 88000,
    bottomPrice: 85360,
    notes: "Paket bundling C-Booster lengkap (Serum + Cream). Paling dicari saat gajian."
  },
  {
    id: 'nov-12',
    campaignName: "TikTok Flash Sale Toko C-Booster Cream Multi-Pack",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'CBOOSTERCREAM2PC',
    productName: "Theraskin Daily C-Booster Cream (2 Pcs Twinpack)",
    hargaBulanan: 78000,
    diskonPercent: 4,
    totalDiskon: 3120,
    hargaPromo: 74880,
    qty: 70,
    totalPromosi: 218400,
    hargaOB: 70000,
    bottomPrice: 67900,
    notes: "Twinpack C-Booster Cream TikTok Shop Flash Sale Toko. Hemat ongkir & volume booster."
  },
  {
    id: 'nov-13',
    campaignName: "Shopee Flash Sale Toko Twinpack Sun Protector Age Revival",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11 & Payday',
    tanggal: '11 - 13 November & 25 - 30 November',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: "Twinpack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 80400,
    diskonPercent: 4,
    totalDiskon: 3216,
    hargaPromo: 77184,
    qty: 90,
    totalPromosi: 289440,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: "Hero sunscreen anti-aging kembar di Shopee. Best value volume SKU."
  },
  {
    id: 'nov-14',
    campaignName: "TikTok Shop Flash Sale Toko Twinpack Sun Protector Age Revival",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11 & Payday',
    tanggal: '11 - 13 November & 25 - 30 November',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: "Twinpack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 80400,
    diskonPercent: 4,
    totalDiskon: 3216,
    hargaPromo: 77184,
    qty: 90,
    totalPromosi: 289440,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: "Hero sunscreen anti-aging kembar di TikTok Shop. Best value volume SKU."
  },
  {
    id: 'nov-15',
    campaignName: "Lazada Flash Sale Toko Twinpack Sun Protector Age Revival",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11 & Payday',
    tanggal: '11 - 13 November & 25 - 30 November',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: "Twinpack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 80400,
    diskonPercent: 4,
    totalDiskon: 3216,
    hargaPromo: 77184,
    qty: 90,
    totalPromosi: 289440,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: "Hero sunscreen anti-aging kembar di Lazada. Best value volume SKU."
  },
  {
    id: 'nov-16',
    campaignName: "Shopee Flash Sale Toko Bundle Ekonomis Advanced Acne",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'ECOADVACNE',
    productName: "Bundle Ekonomis Advanced Acne",
    hargaBulanan: 75400,
    diskonPercent: 4,
    totalDiskon: 3016,
    hargaPromo: 72384,
    qty: 110,
    totalPromosi: 331760,
    hargaOB: 68000,
    bottomPrice: 65960,
    notes: "Paket hemat jerawat untuk pelajar & pemula di Shopee."
  },
  {
    id: 'nov-17',
    campaignName: "Lazada Flash Sale Toko Bundle Ekonomis Advanced Acne",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'ECOADVACNE',
    productName: "Bundle Ekonomis Advanced Acne",
    hargaBulanan: 75400,
    diskonPercent: 4,
    totalDiskon: 3016,
    hargaPromo: 72384,
    qty: 110,
    totalPromosi: 331760,
    hargaOB: 68000,
    bottomPrice: 65960,
    notes: "Paket hemat jerawat untuk pelajar & pemula di Lazada."
  },
  {
    id: 'nov-18',
    campaignName: "Shopee 11.11 Campaign Flash Sale Theraskin Men Serum",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FMM03B0015C',
    productName: "Theraskin Men Multi Action Serum 15 mL",
    hargaBulanan: 52000,
    diskonPercent: 5,
    totalDiskon: 2600,
    hargaPromo: 49400,
    qty: 120,
    totalPromosi: 312000,
    hargaOB: 47000,
    bottomPrice: 45590,
    notes: "Official Campaign Flash Sale slot Shopee Mall / Super Brand Day. Produk pria unggulan."
  },
  {
    id: 'nov-19',
    campaignName: "TikTok Shop 11.11 Mega Campaign Flash Sale Men Serum",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FMM03B0015C',
    productName: "Theraskin Men Multi Action Serum 15 mL",
    hargaBulanan: 52000,
    diskonPercent: 5,
    totalDiskon: 2600,
    hargaPromo: 49400,
    qty: 130,
    totalPromosi: 338000,
    hargaOB: 47000,
    bottomPrice: 45590,
    notes: "Featured TikTok Shop Mega Campaign banner + Affiliate Creator Push untuk Men Skincare."
  },
  {
    id: 'nov-2',
    campaignName: "Voucher Pembelian Berulang NPD 11.11",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Brand Membership',
    subKategori: 'Voucher NPD',
    periode: 'Full Month Regular',
    tanggal: '1 - 30 November',
    closing: 'All',
    sku: 'NPD-VREP',
    productName: "Voucher Pembelian Berulang NPD (C-Booster Series & Theraskin Men)",
    hargaBulanan: 150000,
    diskonPercent: 13,
    totalDiskon: 19500,
    hargaPromo: 130500,
    qty: 100,
    totalPromosi: 1950000,
    hargaOB: 120000,
    bottomPrice: 116400,
    notes: "Voucher Repeat Order pelanggan setia untuk C-Booster Series & Theraskin Men. Diskon 13% min order 150K."
  },
  {
    id: 'nov-20',
    campaignName: "Lazada 11.11 Mega Campaign Flash Sale Men Serum",
    status: 'Draft',
    bulan: 'November',
    marketplace: 'Lazada',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FMM03B0015C',
    productName: "Theraskin Men Multi Action Serum 15 mL",
    hargaBulanan: 52000,
    diskonPercent: 5,
    totalDiskon: 2600,
    hargaPromo: 49400,
    qty: 80,
    totalPromosi: 208000,
    hargaOB: 47000,
    bottomPrice: 45590,
    notes: "LazFlash Mega Deal slot utama pria. Sesuai master sheet row 642 & 660."
  },
  {
    id: 'nov-21',
    campaignName: "Shopee 11.11 Campaign Flash Sale C-Booster Serum",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FVD01B0015C',
    productName: "Theraskin Daily C-Booster Serum",
    hargaBulanan: 58000,
    diskonPercent: 4,
    totalDiskon: 2320,
    hargaPromo: 55680,
    qty: 110,
    totalPromosi: 255200,
    hargaOB: 52000,
    bottomPrice: 50440,
    notes: "Shopee Campaign Flash Sale resmi 10.10/11.11/12.12. Diskon 4% harga promo Rp 55.680."
  },
  {
    id: 'nov-22',
    campaignName: "TikTok Shop 11.11 Campaign Flash Sale C-Booster Cream",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FVD02P0010G',
    productName: "Theraskin Daily C-Booster Cream",
    hargaBulanan: 39000,
    diskonPercent: 2,
    totalDiskon: 780,
    hargaPromo: 38220,
    qty: 100,
    totalPromosi: 78000,
    hargaOB: 35000,
    bottomPrice: 33950,
    notes: "Official Campaign Flash Sale TikTok Shop. Diskon 2% harga promo Rp 38.220."
  },
  {
    id: 'nov-23',
    campaignName: "Lazada 11.11 Campaign Flash Sale C-Booster Series Bundling",
    status: 'Draft',
    bulan: 'November',
    marketplace: 'Lazada',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'BUNDLING-CBOOSTERSERIES',
    productName: "Theraskin Daily C-Booster Series",
    hargaBulanan: 97000,
    diskonPercent: 3,
    totalDiskon: 2910,
    hargaPromo: 94090,
    qty: 90,
    totalPromosi: 261900,
    hargaOB: 88000,
    bottomPrice: 85360,
    notes: "Lazada Campaign Flash Sale paket lengkap Vit C. Sesuai row 626 master sheet."
  },
  {
    id: 'nov-24',
    campaignName: "Shopee 11.11 Campaign Flash Sale Blurry Skin Tint Shade 02",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FBD02B0030C',
    productName: "Theraskin Blurry Cover Skin Tint Shade 02 Light to Medium",
    hargaBulanan: 68200,
    diskonPercent: 5,
    totalDiskon: 3410,
    hargaPromo: 64790,
    qty: 85,
    totalPromosi: 289850,
    hargaOB: 61000,
    bottomPrice: 59170,
    notes: "Featured Base Makeup NPD Campaign Flash Sale di Shopee. Harga promo Rp 64.790."
  },
  {
    id: 'nov-25',
    campaignName: "TikTok Shop 11.11 Campaign Flash Sale Blurry Skin Tint Shade 02",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FBD02B0030C',
    productName: "Theraskin Blurry Cover Skin Tint Shade 02 Light to Medium",
    hargaBulanan: 68200,
    diskonPercent: 5,
    totalDiskon: 3410,
    hargaPromo: 64790,
    qty: 85,
    totalPromosi: 289850,
    hargaOB: 61000,
    bottomPrice: 59170,
    notes: "Featured Base Makeup NPD Campaign Flash Sale di TikTok Shop. Harga promo Rp 64.790."
  },
  {
    id: 'nov-26',
    campaignName: "Shopee Live 11.11 Midnight Flash Sale Retinol Serum",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FAR01B0015CS',
    productName: "THERASKIN Age Revival Intense Retinol Serum Botol 15 ml Shrink",
    hargaBulanan: 64900,
    diskonPercent: 6,
    totalDiskon: 3894,
    hargaPromo: 61006,
    qty: 100,
    totalPromosi: 389400,
    hargaOB: 58000,
    bottomPrice: 56260,
    notes: "Hero live streaming jam 20.00-24.00. Ekstra voucher live 15% Shopee."
  },
  {
    id: 'nov-27',
    campaignName: "TikTok Live 11.11 Keranjang Kuning C-Booster Series Bundling",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'BUNDLING-CBOOSTERSERIES',
    productName: "Theraskin Daily C-Booster Series",
    hargaBulanan: 97000,
    diskonPercent: 6,
    totalDiskon: 5820,
    hargaPromo: 91180,
    qty: 120,
    totalPromosi: 698400,
    hargaOB: 88000,
    bottomPrice: 85360,
    notes: "Pin Keranjang Kuning nomor 1 & 2 di TikTok Live Stream Marathon. Komisi affiliate 12%."
  },
  {
    id: 'nov-28',
    campaignName: "Shopee Live Payday Volume Wash Cleanser Mega Deal",
    status: 'Draft',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Payday',
    tanggal: '25 - 30 November',
    closing: 'All',
    sku: 'FAA05T0100C',
    productName: "Advanced Acne Facial Wash 100ml",
    hargaBulanan: 39200,
    diskonPercent: 6,
    totalDiskon: 2352,
    hargaPromo: 36848,
    qty: 150,
    totalPromosi: 352800,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: "Flash Sale Kilat Live Stream Payday. Fast moving order booster."
  },
  {
    id: 'nov-3',
    campaignName: "Shopee Paket Diskon NPD Volume 11.11",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'Twindate 11.11 & Payday',
    tanggal: '11 - 13 November & 25 - 30 November',
    closing: 'All',
    sku: 'NPD-TIER35',
    productName: "Paket Diskon NPD (Beli 3 disc 4%, 4 disc 5%, 5 disc 6%)",
    hargaBulanan: 150000,
    diskonPercent: 5,
    totalDiskon: 7500,
    hargaPromo: 142500,
    qty: 120,
    totalPromosi: 900000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Combo hemat produk baru Theraskin (C-Booster Series & Theraskin Men). Bertingkat 4%-6% di Shopee."
  },
  {
    id: 'nov-4',
    campaignName: "Shopee Paket Diskon NPD BAU Harian",
    status: 'Draft',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'BAU',
    tanggal: '14 - 24 November',
    closing: 'All',
    sku: 'NPD-TIERBAU',
    productName: "Paket Diskon NPD Reguler (Beli 3 disc 2%, 4 disc 3%, 5 disc 5%)",
    hargaBulanan: 150000,
    diskonPercent: 3,
    totalDiskon: 4500,
    hargaPromo: 145500,
    qty: 80,
    totalPromosi: 360000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Paket diskon harian BAU produk baru Theraskin (C-Booster & Men Series) di Shopee."
  },
  {
    id: 'nov-5',
    campaignName: "TikTok Shop Paket Diskon NPD Volume 11.11",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'Twindate 11.11 & Payday',
    tanggal: '11 - 13 November & 25 - 30 November',
    closing: 'All',
    sku: 'NPD-TIER35',
    productName: "Paket Diskon NPD (Beli 3 disc 4%, 4 disc 5%, 5 disc 6%)",
    hargaBulanan: 150000,
    diskonPercent: 5,
    totalDiskon: 7500,
    hargaPromo: 142500,
    qty: 120,
    totalPromosi: 900000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Combo hemat produk baru Theraskin (C-Booster Series & Theraskin Men). Bertingkat 4%-6% di TikTok Shop."
  },
  {
    id: 'nov-6',
    campaignName: "TikTok Shop Paket Diskon NPD BAU Harian",
    status: 'Draft',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'BAU',
    tanggal: '14 - 24 November',
    closing: 'All',
    sku: 'NPD-TIERBAU',
    productName: "Paket Diskon NPD Reguler (Beli 3 disc 2%, 4 disc 3%, 5 disc 5%)",
    hargaBulanan: 150000,
    diskonPercent: 3,
    totalDiskon: 4500,
    hargaPromo: 145500,
    qty: 80,
    totalPromosi: 360000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Paket diskon harian BAU produk baru Theraskin (C-Booster & Men Series) di TikTok Shop."
  },
  {
    id: 'nov-7',
    campaignName: "Lazada Paket Diskon NPD Volume 11.11",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'Twindate 11.11 & Payday',
    tanggal: '11 - 13 November & 25 - 30 November',
    closing: 'All',
    sku: 'NPD-TIER35',
    productName: "Paket Diskon NPD (Beli 3 disc 4%, 4 disc 5%, 5 disc 6%)",
    hargaBulanan: 150000,
    diskonPercent: 5,
    totalDiskon: 7500,
    hargaPromo: 142500,
    qty: 120,
    totalPromosi: 900000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Combo hemat produk baru Theraskin (C-Booster Series & Theraskin Men). Bertingkat 4%-6% di Lazada."
  },
  {
    id: 'nov-8',
    campaignName: "Lazada Paket Diskon NPD BAU Harian",
    status: 'Draft',
    bulan: 'November',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'BAU',
    tanggal: '14 - 24 November',
    closing: 'All',
    sku: 'NPD-TIERBAU',
    productName: "Paket Diskon NPD Reguler (Beli 3 disc 2%, 4 disc 3%, 5 disc 5%)",
    hargaBulanan: 150000,
    diskonPercent: 3,
    totalDiskon: 4500,
    hargaPromo: 145500,
    qty: 80,
    totalPromosi: 360000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Paket diskon harian BAU produk baru Theraskin (C-Booster & Men Series) di Lazada."
  },
  {
    id: 'nov-9',
    campaignName: "Flash Sale Toko 11.11 C-Booster Serum",
    status: 'Scheduled',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 - 13 November',
    closing: 'All',
    sku: 'FVD01B0015C',
    productName: "Theraskin Daily C-Booster Serum",
    hargaBulanan: 58000,
    diskonPercent: 4,
    totalDiskon: 2320,
    hargaPromo: 55680,
    qty: 100,
    totalPromosi: 232000,
    hargaOB: 52000,
    bottomPrice: 50440,
    notes: "Flash Sale Toko slot jam 12.00 & 20.00. Hero hero produk pencerah Vit C terbaru."
  },
  // ================= DESEMBER 2026 =================
  {
    id: 'des-1',
    campaignName: "Voucher Member Baru NPD 12.12",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Brand Membership',
    subKategori: 'Voucher NPD',
    periode: 'Full Month Regular',
    tanggal: '1 - 31 Desember',
    closing: 'All',
    sku: 'NPD-VMBR',
    productName: "Voucher Member Baru NPD (C-Booster Series & Theraskin Men)",
    hargaBulanan: 100000,
    diskonPercent: 10,
    totalDiskon: 10000,
    hargaPromo: 90000,
    qty: 150,
    totalPromosi: 1500000,
    hargaOB: 85000,
    bottomPrice: 82450,
    notes: "Voucher New Member khusus Produk Baru (C-Booster Series, Theraskin Men). Diskon 10% min order 100K."
  },
  {
    id: 'des-10',
    campaignName: "Flash Sale Toko 12.12 C-Booster Cream",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FVD02P0010G',
    productName: "Theraskin Daily C-Booster Cream",
    hargaBulanan: 39000,
    diskonPercent: 4,
    totalDiskon: 1560,
    hargaPromo: 37440,
    qty: 90,
    totalPromosi: 140400,
    hargaOB: 35000,
    bottomPrice: 33950,
    notes: "Flash Sale Toko pendamping serum C-Booster. Penyerapan cepat mencerahkan flek hitam."
  },
  {
    id: 'des-11',
    campaignName: "Flash Sale Toko Payday C-Booster Series Bundling",
    status: 'Draft',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Payday',
    tanggal: '25 - 31 Desember',
    closing: 'All',
    sku: 'BUNDLING-CBOOSTERSERIES',
    productName: "Theraskin Daily C-Booster Series",
    hargaBulanan: 97000,
    diskonPercent: 4,
    totalDiskon: 3880,
    hargaPromo: 93120,
    qty: 80,
    totalPromosi: 310400,
    hargaOB: 88000,
    bottomPrice: 85360,
    notes: "Paket bundling C-Booster lengkap (Serum + Cream). Paling dicari saat gajian."
  },
  {
    id: 'des-12',
    campaignName: "TikTok Flash Sale Toko C-Booster Cream Multi-Pack",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'CBOOSTERCREAM2PC',
    productName: "Theraskin Daily C-Booster Cream (2 Pcs Twinpack)",
    hargaBulanan: 78000,
    diskonPercent: 4,
    totalDiskon: 3120,
    hargaPromo: 74880,
    qty: 70,
    totalPromosi: 218400,
    hargaOB: 70000,
    bottomPrice: 67900,
    notes: "Twinpack C-Booster Cream TikTok Shop Flash Sale Toko. Hemat ongkir & volume booster."
  },
  {
    id: 'des-13',
    campaignName: "Shopee Flash Sale Toko Twinpack Sun Protector Age Revival",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12 & Payday',
    tanggal: '12 - 14 Desember & 25 - 31 Desember',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: "Twinpack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 80400,
    diskonPercent: 4,
    totalDiskon: 3216,
    hargaPromo: 77184,
    qty: 90,
    totalPromosi: 289440,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: "Hero sunscreen anti-aging kembar di Shopee. Best value volume SKU."
  },
  {
    id: 'des-14',
    campaignName: "TikTok Shop Flash Sale Toko Twinpack Sun Protector Age Revival",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12 & Payday',
    tanggal: '12 - 14 Desember & 25 - 31 Desember',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: "Twinpack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 80400,
    diskonPercent: 4,
    totalDiskon: 3216,
    hargaPromo: 77184,
    qty: 90,
    totalPromosi: 289440,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: "Hero sunscreen anti-aging kembar di TikTok Shop. Best value volume SKU."
  },
  {
    id: 'des-15',
    campaignName: "Lazada Flash Sale Toko Twinpack Sun Protector Age Revival",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12 & Payday',
    tanggal: '12 - 14 Desember & 25 - 31 Desember',
    closing: 'All',
    sku: 'TWINSUNAGERPROTECTIONDC',
    productName: "Twinpack Sun Protector Age Revival Protection Day Cream",
    hargaBulanan: 80400,
    diskonPercent: 4,
    totalDiskon: 3216,
    hargaPromo: 77184,
    qty: 90,
    totalPromosi: 289440,
    hargaOB: 73000,
    bottomPrice: 70810,
    notes: "Hero sunscreen anti-aging kembar di Lazada. Best value volume SKU."
  },
  {
    id: 'des-16',
    campaignName: "Shopee Flash Sale Toko Bundle Ekonomis Advanced Acne",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'ECOADVACNE',
    productName: "Bundle Ekonomis Advanced Acne",
    hargaBulanan: 75400,
    diskonPercent: 4,
    totalDiskon: 3016,
    hargaPromo: 72384,
    qty: 110,
    totalPromosi: 331760,
    hargaOB: 68000,
    bottomPrice: 65960,
    notes: "Paket hemat jerawat untuk pelajar & pemula di Shopee."
  },
  {
    id: 'des-17',
    campaignName: "Lazada Flash Sale Toko Bundle Ekonomis Advanced Acne",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'ECOADVACNE',
    productName: "Bundle Ekonomis Advanced Acne",
    hargaBulanan: 75400,
    diskonPercent: 4,
    totalDiskon: 3016,
    hargaPromo: 72384,
    qty: 110,
    totalPromosi: 331760,
    hargaOB: 68000,
    bottomPrice: 65960,
    notes: "Paket hemat jerawat untuk pelajar & pemula di Lazada."
  },
  {
    id: 'des-18',
    campaignName: "Shopee 12.12 Campaign Flash Sale Theraskin Men Serum",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FMM03B0015C',
    productName: "Theraskin Men Multi Action Serum 15 mL",
    hargaBulanan: 52000,
    diskonPercent: 5,
    totalDiskon: 2600,
    hargaPromo: 49400,
    qty: 120,
    totalPromosi: 312000,
    hargaOB: 47000,
    bottomPrice: 45590,
    notes: "Official Campaign Flash Sale slot Shopee Mall / Super Brand Day. Produk pria unggulan."
  },
  {
    id: 'des-19',
    campaignName: "TikTok Shop 12.12 Mega Campaign Flash Sale Men Serum",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FMM03B0015C',
    productName: "Theraskin Men Multi Action Serum 15 mL",
    hargaBulanan: 52000,
    diskonPercent: 5,
    totalDiskon: 2600,
    hargaPromo: 49400,
    qty: 130,
    totalPromosi: 338000,
    hargaOB: 47000,
    bottomPrice: 45590,
    notes: "Featured TikTok Shop Mega Campaign banner + Affiliate Creator Push untuk Men Skincare."
  },
  {
    id: 'des-2',
    campaignName: "Voucher Pembelian Berulang NPD 12.12",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Brand Membership',
    subKategori: 'Voucher NPD',
    periode: 'Full Month Regular',
    tanggal: '1 - 31 Desember',
    closing: 'All',
    sku: 'NPD-VREP',
    productName: "Voucher Pembelian Berulang NPD (C-Booster Series & Theraskin Men)",
    hargaBulanan: 150000,
    diskonPercent: 13,
    totalDiskon: 19500,
    hargaPromo: 130500,
    qty: 100,
    totalPromosi: 1950000,
    hargaOB: 120000,
    bottomPrice: 116400,
    notes: "Voucher Repeat Order pelanggan setia untuk C-Booster Series & Theraskin Men. Diskon 13% min order 150K."
  },
  {
    id: 'des-20',
    campaignName: "Lazada 12.12 Mega Campaign Flash Sale Men Serum",
    status: 'Draft',
    bulan: 'Desember',
    marketplace: 'Lazada',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FMM03B0015C',
    productName: "Theraskin Men Multi Action Serum 15 mL",
    hargaBulanan: 52000,
    diskonPercent: 5,
    totalDiskon: 2600,
    hargaPromo: 49400,
    qty: 80,
    totalPromosi: 208000,
    hargaOB: 47000,
    bottomPrice: 45590,
    notes: "LazFlash Mega Deal slot utama pria. Sesuai master sheet row 642 & 660."
  },
  {
    id: 'des-21',
    campaignName: "Shopee 12.12 Campaign Flash Sale C-Booster Serum",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FVD01B0015C',
    productName: "Theraskin Daily C-Booster Serum",
    hargaBulanan: 58000,
    diskonPercent: 4,
    totalDiskon: 2320,
    hargaPromo: 55680,
    qty: 110,
    totalPromosi: 255200,
    hargaOB: 52000,
    bottomPrice: 50440,
    notes: "Shopee Campaign Flash Sale resmi 10.10/11.11/12.12. Diskon 4% harga promo Rp 55.680."
  },
  {
    id: 'des-22',
    campaignName: "TikTok Shop 12.12 Campaign Flash Sale C-Booster Cream",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FVD02P0010G',
    productName: "Theraskin Daily C-Booster Cream",
    hargaBulanan: 39000,
    diskonPercent: 2,
    totalDiskon: 780,
    hargaPromo: 38220,
    qty: 100,
    totalPromosi: 78000,
    hargaOB: 35000,
    bottomPrice: 33950,
    notes: "Official Campaign Flash Sale TikTok Shop. Diskon 2% harga promo Rp 38.220."
  },
  {
    id: 'des-23',
    campaignName: "Lazada 12.12 Campaign Flash Sale C-Booster Series Bundling",
    status: 'Draft',
    bulan: 'Desember',
    marketplace: 'Lazada',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'BUNDLING-CBOOSTERSERIES',
    productName: "Theraskin Daily C-Booster Series",
    hargaBulanan: 97000,
    diskonPercent: 3,
    totalDiskon: 2910,
    hargaPromo: 94090,
    qty: 90,
    totalPromosi: 261900,
    hargaOB: 88000,
    bottomPrice: 85360,
    notes: "Lazada Campaign Flash Sale paket lengkap Vit C. Sesuai row 626 master sheet."
  },
  {
    id: 'des-24',
    campaignName: "Shopee 12.12 Campaign Flash Sale Blurry Skin Tint Shade 02",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FBD02B0030C',
    productName: "Theraskin Blurry Cover Skin Tint Shade 02 Light to Medium",
    hargaBulanan: 68200,
    diskonPercent: 5,
    totalDiskon: 3410,
    hargaPromo: 64790,
    qty: 85,
    totalPromosi: 289850,
    hargaOB: 61000,
    bottomPrice: 59170,
    notes: "Featured Base Makeup NPD Campaign Flash Sale di Shopee. Harga promo Rp 64.790."
  },
  {
    id: 'des-25',
    campaignName: "TikTok Shop 12.12 Campaign Flash Sale Blurry Skin Tint Shade 02",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Campaign',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FBD02B0030C',
    productName: "Theraskin Blurry Cover Skin Tint Shade 02 Light to Medium",
    hargaBulanan: 68200,
    diskonPercent: 5,
    totalDiskon: 3410,
    hargaPromo: 64790,
    qty: 85,
    totalPromosi: 289850,
    hargaOB: 61000,
    bottomPrice: 59170,
    notes: "Featured Base Makeup NPD Campaign Flash Sale di TikTok Shop. Harga promo Rp 64.790."
  },
  {
    id: 'des-26',
    campaignName: "Shopee Live 12.12 Midnight Flash Sale Retinol Serum",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FAR01B0015CS',
    productName: "THERASKIN Age Revival Intense Retinol Serum Botol 15 ml Shrink",
    hargaBulanan: 64900,
    diskonPercent: 6,
    totalDiskon: 3894,
    hargaPromo: 61006,
    qty: 100,
    totalPromosi: 389400,
    hargaOB: 58000,
    bottomPrice: 56260,
    notes: "Hero live streaming jam 20.00-24.00. Ekstra voucher live 15% Shopee."
  },
  {
    id: 'des-27',
    campaignName: "TikTok Live 12.12 Keranjang Kuning C-Booster Series Bundling",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'BUNDLING-CBOOSTERSERIES',
    productName: "Theraskin Daily C-Booster Series",
    hargaBulanan: 97000,
    diskonPercent: 6,
    totalDiskon: 5820,
    hargaPromo: 91180,
    qty: 120,
    totalPromosi: 698400,
    hargaOB: 88000,
    bottomPrice: 85360,
    notes: "Pin Keranjang Kuning nomor 1 & 2 di TikTok Live Stream Marathon. Komisi affiliate 12%."
  },
  {
    id: 'des-28',
    campaignName: "Shopee Live Payday Volume Wash Cleanser Mega Deal",
    status: 'Draft',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Flash Sale',
    periode: 'Payday',
    tanggal: '25 - 31 Desember',
    closing: 'All',
    sku: 'FAA05T0100C',
    productName: "Advanced Acne Facial Wash 100ml",
    hargaBulanan: 39200,
    diskonPercent: 6,
    totalDiskon: 2352,
    hargaPromo: 36848,
    qty: 150,
    totalPromosi: 352800,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: "Flash Sale Kilat Live Stream Payday. Fast moving order booster."
  },
  {
    id: 'des-3',
    campaignName: "Shopee Paket Diskon NPD Volume 12.12",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'Twindate 12.12 & Payday',
    tanggal: '12 - 14 Desember & 25 - 31 Desember',
    closing: 'All',
    sku: 'NPD-TIER35',
    productName: "Paket Diskon NPD (Beli 3 disc 4%, 4 disc 5%, 5 disc 6%)",
    hargaBulanan: 150000,
    diskonPercent: 5,
    totalDiskon: 7500,
    hargaPromo: 142500,
    qty: 120,
    totalPromosi: 900000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Combo hemat produk baru Theraskin (C-Booster Series & Theraskin Men). Bertingkat 4%-6% di Shopee."
  },
  {
    id: 'des-4',
    campaignName: "Shopee Paket Diskon NPD BAU Harian",
    status: 'Draft',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'BAU',
    tanggal: '15 - 24 Desember',
    closing: 'All',
    sku: 'NPD-TIERBAU',
    productName: "Paket Diskon NPD Reguler (Beli 3 disc 2%, 4 disc 3%, 5 disc 5%)",
    hargaBulanan: 150000,
    diskonPercent: 3,
    totalDiskon: 4500,
    hargaPromo: 145500,
    qty: 80,
    totalPromosi: 360000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Paket diskon harian BAU produk baru Theraskin (C-Booster & Men Series) di Shopee."
  },
  {
    id: 'des-5',
    campaignName: "TikTok Shop Paket Diskon NPD Volume 12.12",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'Twindate 12.12 & Payday',
    tanggal: '12 - 14 Desember & 25 - 31 Desember',
    closing: 'All',
    sku: 'NPD-TIER35',
    productName: "Paket Diskon NPD (Beli 3 disc 4%, 4 disc 5%, 5 disc 6%)",
    hargaBulanan: 150000,
    diskonPercent: 5,
    totalDiskon: 7500,
    hargaPromo: 142500,
    qty: 120,
    totalPromosi: 900000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Combo hemat produk baru Theraskin (C-Booster Series & Theraskin Men). Bertingkat 4%-6% di TikTok Shop."
  },
  {
    id: 'des-6',
    campaignName: "TikTok Shop Paket Diskon NPD BAU Harian",
    status: 'Draft',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'BAU',
    tanggal: '15 - 24 Desember',
    closing: 'All',
    sku: 'NPD-TIERBAU',
    productName: "Paket Diskon NPD Reguler (Beli 3 disc 2%, 4 disc 3%, 5 disc 5%)",
    hargaBulanan: 150000,
    diskonPercent: 3,
    totalDiskon: 4500,
    hargaPromo: 145500,
    qty: 80,
    totalPromosi: 360000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Paket diskon harian BAU produk baru Theraskin (C-Booster & Men Series) di TikTok Shop."
  },
  {
    id: 'des-7',
    campaignName: "Lazada Paket Diskon NPD Volume 12.12",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'Twindate 12.12 & Payday',
    tanggal: '12 - 14 Desember & 25 - 31 Desember',
    closing: 'All',
    sku: 'NPD-TIER35',
    productName: "Paket Diskon NPD (Beli 3 disc 4%, 4 disc 5%, 5 disc 6%)",
    hargaBulanan: 150000,
    diskonPercent: 5,
    totalDiskon: 7500,
    hargaPromo: 142500,
    qty: 120,
    totalPromosi: 900000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Combo hemat produk baru Theraskin (C-Booster Series & Theraskin Men). Bertingkat 4%-6% di Lazada."
  },
  {
    id: 'des-8',
    campaignName: "Lazada Paket Diskon NPD BAU Harian",
    status: 'Draft',
    bulan: 'Desember',
    marketplace: 'Lazada',
    kategori: 'Toko',
    subKategori: 'Paket Diskon NPD',
    periode: 'BAU',
    tanggal: '15 - 24 Desember',
    closing: 'All',
    sku: 'NPD-TIERBAU',
    productName: "Paket Diskon NPD Reguler (Beli 3 disc 2%, 4 disc 3%, 5 disc 5%)",
    hargaBulanan: 150000,
    diskonPercent: 3,
    totalDiskon: 4500,
    hargaPromo: 145500,
    qty: 80,
    totalPromosi: 360000,
    hargaOB: 135000,
    bottomPrice: 130950,
    notes: "Paket diskon harian BAU produk baru Theraskin (C-Booster & Men Series) di Lazada."
  },
  {
    id: 'des-9',
    campaignName: "Flash Sale Toko 12.12 C-Booster Serum",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periode: 'Twindate 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FVD01B0015C',
    productName: "Theraskin Daily C-Booster Serum",
    hargaBulanan: 58000,
    diskonPercent: 4,
    totalDiskon: 2320,
    hargaPromo: 55680,
    qty: 100,
    totalPromosi: 232000,
    hargaOB: 52000,
    bottomPrice: 50440,
    notes: "Flash Sale Toko slot jam 12.00 & 20.00. Hero hero produk pencerah Vit C terbaru."
  },
  {
    id: 'hero-des-1',
    campaignName: "Harbolnas 12.12 Puncak Nasional Wash",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Harbolnas 12.12',
    periode: 'Harbolnas 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FAA05T0100C',
    productName: "Advanced Acne Facial Wash 100ml",
    hargaBulanan: 39200,
    diskonPercent: 6,
    totalDiskon: 2352,
    hargaPromo: 36848,
    qty: 300,
    totalPromosi: 705600,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: "Puncak Harbolnas 12.12 Nasional. Alokasi stok terbesar Q4"
  },
  {
    id: 'hero-des-2',
    campaignName: "Harbolnas 12.12 Perfect Glow Best Seller",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Harbolnas 12.12',
    periode: 'Harbolnas 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FFG01T0100C',
    productName: "Theraskin Perfect Glow Facial Wash 100ml",
    hargaBulanan: 41500,
    diskonPercent: 5,
    totalDiskon: 2075,
    hargaPromo: 39425,
    qty: 180,
    totalPromosi: 373500,
    hargaOB: 38000,
    bottomPrice: 36860,
    notes: "Best Seller Glow Facial Wash 12.12"
  },
  {
    id: 'hero-des-3',
    campaignName: "Harbolnas 12.12 Live Host Special Deal",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Live Streaming',
    subKategori: 'Harbolnas 12.12',
    periode: 'Harbolnas 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FAR04P0010GPES',
    productName: "THERASKIN Age Revival Moisture Lock Night Cream Pot 10 g Shrink",
    hargaBulanan: 41500,
    diskonPercent: 6,
    totalDiskon: 2490,
    hargaPromo: 39010,
    qty: 90,
    totalPromosi: 224100,
    hargaOB: 37000,
    bottomPrice: 35890,
    notes: "Live Streaming 12.12 Special Host Deal"
  },
  {
    id: 'hero-des-4',
    campaignName: "TikTok 12.12 Anti-Aging Grand Finale",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Live Streaming',
    subKategori: 'Harbolnas 12.12',
    periode: 'Harbolnas 12.12',
    tanggal: '12 - 14 Desember',
    closing: 'All',
    sku: 'FPK00000033',
    productName: "Theraskin Age Revival Anti Aging Paket Lengkap",
    hargaBulanan: 215000,
    diskonPercent: 3,
    totalDiskon: 6450,
    hargaPromo: 208550,
    qty: 50,
    totalPromosi: 322500,
    hargaOB: 210000,
    bottomPrice: 203700,
    notes: "Hero Anti-Aging Paket Harbolnas 12.12"
  },
  {
    id: 'hero-des-5',
    campaignName: "Cuci Gudang Akhir Tahun 2026",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Year-End Sale',
    periode: 'Payday',
    tanggal: '25 - 31 Desember',
    closing: 'All',
    sku: 'FPK00000040',
    productName: "Theraskin Advanced Acne Paket Lengkap",
    hargaBulanan: 244700,
    diskonPercent: 3,
    totalDiskon: 7341,
    hargaPromo: 237359,
    qty: 60,
    totalPromosi: 440460,
    hargaOB: 243500,
    bottomPrice: 236195,
    notes: "Cuci Gudang Akhir Tahun 2026 + Free Pouch"
  },
  {
    id: 'hero-des-6',
    campaignName: "New Year Glowing Holiday Gift Set",
    status: 'Scheduled',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Toko',
    subKategori: 'Year-End Sale',
    periode: 'Payday',
    tanggal: '25 - 31 Desember',
    closing: 'All',
    sku: 'FPK00000039',
    productName: "Theraskin Perfect Glow Paket Lengkap",
    hargaBulanan: 269900,
    diskonPercent: 4,
    totalDiskon: 10796,
    hargaPromo: 259104,
    qty: 60,
    totalPromosi: 647760,
    hargaOB: 262500,
    bottomPrice: 254625,
    notes: "Year-End Glowing Gift Set for New Year Eve"
  },
]

// Day Range Parser for Calendar
function parseCampaignDays(tanggal: string): { startDay: number; endDay: number } {
  const rangeMatch = tanggal.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (rangeMatch) {
    return { startDay: parseInt(rangeMatch[1], 10), endDay: parseInt(rangeMatch[2], 10) }
  }
  const singleMatch = tanggal.match(/(\d+)/)
  if (singleMatch) {
    const d = parseInt(singleMatch[1], 10)
    return { startDay: d, endDay: d }
  }
  return { startDay: 1, endDay: 30 }
}

// Dedicated Marketplace Badge Matching Official App Icons
export function MarketplaceBadge({ platform }: { platform: string }) {
  const p = (platform || '').toLowerCase()
  if (p.includes('tiktok')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 9px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        backgroundColor: '#000000',
        color: '#ffffff',
        border: '1px solid #27272a',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}>
        {/* TikTok App Icon with authentic 3D chromatic notes */}
        <span style={{
          width: '16px',
          height: '16px',
          borderRadius: '4px',
          backgroundColor: '#0a0a0a',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '1px solid #3f3f46'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            {/* Cyan note layer shifted left */}
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.368 0 .717.072 1.037.2v-3.52a6.34 6.34 0 0 0-1.037-.085A6.335 6.335 0 0 0 3 15.672 6.335 6.335 0 0 0 9.344 22a6.335 6.335 0 0 0 6.336-6.328V9.124a8.17 8.17 0 0 0 4.909 1.63v-3.5a4.764 4.764 0 0 1-1-.568z" fill="#25F4EE" transform="translate(-1.4, 0)" />
            {/* Magenta note layer shifted right */}
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.368 0 .717.072 1.037.2v-3.52a6.34 6.34 0 0 0-1.037-.085A6.335 6.335 0 0 0 3 15.672 6.335 6.335 0 0 0 9.344 22a6.335 6.335 0 0 0 6.336-6.328V9.124a8.17 8.17 0 0 0 4.909 1.63v-3.5a4.764 4.764 0 0 1-1-.568z" fill="#FE2C55" transform="translate(1.4, 0)" />
            {/* Crisp Central White note */}
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.368 0 .717.072 1.037.2v-3.52a6.34 6.34 0 0 0-1.037-.085A6.335 6.335 0 0 0 3 15.672 6.335 6.335 0 0 0 9.344 22a6.335 6.335 0 0 0 6.336-6.328V9.124a8.17 8.17 0 0 0 4.909 1.63v-3.5a4.764 4.764 0 0 1-1-.568z" fill="#FFFFFF" />
          </svg>
        </span>
        <span style={{ letterSpacing: '-0.01em', color: '#ffffff', fontWeight: 700 }}>TikTok Shop</span>
      </span>
    )
  }

  // Shopee
  if (p.includes('shopee')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        backgroundColor: '#fff1ee',
        color: '#ee4d2d',
        border: '1px solid #fed7aa',
        boxShadow: '0 1px 2px rgba(238,77,45,0.08)',
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}>
        <ShoppingBag size={12} color="#ee4d2d" />
        <span>Shopee</span>
      </span>
    )
  }

  // Lazada
  if (p.includes('lazada')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        backgroundColor: '#eef2ff',
        color: '#1e40af',
        border: '1px solid #c7d2fe',
        boxShadow: '0 1px 2px rgba(30,64,175,0.08)',
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}>
        <ShoppingBag size={12} color="#1e40af" />
        <span>Lazada</span>
      </span>
    )
  }

  // Tokopedia
  if (p.includes('tokopedia')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        backgroundColor: '#f0fdf4',
        color: '#15803d',
        border: '1px solid #bbf7d0',
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}>
        <span>Tokopedia</span>
      </span>
    )
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 700,
      backgroundColor: '#f1f5f9',
      color: '#334155',
      border: '1px solid #cbd5e1',
      whiteSpace: 'nowrap',
      lineHeight: 1.2
    }}>
      <span>{platform}</span>
    </span>
  )
}

export default function PromoPlannerPage() {
  const [promoList, setPromoList] = useState<PromoPlanItem[]>(INITIAL_PROMO_PLANS)

  // Load campaigns added from Campaign Opportunity
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const added = localStorage.getItem('ecompilot_added_promo_plans')
      if (added) {
        try {
          const parsed = JSON.parse(added)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPromoList(prev => {
              const existingIds = new Set(prev.map(p => p.id))
              const newItems = parsed.filter((p: any) => !existingIds.has(p.id))
              return newItems.length > 0 ? [...newItems, ...prev] : prev
            })
          }
        } catch (e) {
          console.error('Failed to parse added promo plans', e)
        }
      }
    }
  }, [])
  
  // View mode switcher: 'list' | 'board' | 'calendar'
  const [activeView, setActiveView] = useState<'list' | 'board' | 'calendar'>('list')

  // Table Density Mode: 'compact' (Fit Layar - No Scroll) | 'spread' (17 Kolom Sheet Melebar)
  const [tableDensity, setTableDensity] = useState<'compact' | 'spread'>('compact')

  // Filter states
  const [filterBulan, setFilterBulan] = useState<string>('ALL') // ALL, Oktober, November, Desember
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL') // ALL, Shopee, TikTok Shop, Lazada, Tokopedia
  const [filterKategori, setFilterKategori] = useState<string>('ALL') // ALL, Live Streaming, Toko, Campaign, Brand Membership
  const [filterSubKategori, setFilterSubKategori] = useState<string>('ALL') // ALL, Flash Sale, Voucher NPD, Paket Diskon NPD, etc.
  const [filterStatus, setFilterStatus] = useState<string>('ALL') // ALL, Draft, Scheduled, Running, Completed
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Calendar specific state (Year: 2026, Month: 9 for Oct, 10 for Nov, 11 for Dec)
  const [calendarMonthIndex, setCalendarMonthIndex] = useState<number>(9) // 9 = Oktober 2026

  // Drawer detail state
  const [selectedCampaign, setSelectedCampaign] = useState<PromoPlanItem | null>(null)

  // Calendar Day popover state for +X more
  const [activeDayModal, setActiveDayModal] = useState<{ day: number; monthName: string; campaigns: PromoPlanItem[] } | null>(null)

  // Clipboard copy state
  const [copied, setCopied] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  // Modal State for custom promo / create campaign
  const [showModal, setShowModal] = useState(false)
  const [newPromo, setNewPromo] = useState<Partial<PromoPlanItem>>({
    campaignName: '',
    status: 'Scheduled',
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

  // Safe clipboard copy helper with infallible fallback
  const safeCopyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
      throw new Error('Clipboard API not available')
    } catch {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textarea)
        return success
      } catch (e) {
        console.error('Copy fallback failed', e)
        return false
      }
    }
  }

  // Filtered List
  const filteredList = useMemo(() => {
    return promoList.filter(item => {
      const matchBulan = filterBulan === 'ALL' || item.bulan === filterBulan
      const matchPlatform = filterPlatform === 'ALL' || item.marketplace.toLowerCase() === filterPlatform.toLowerCase()
      const matchKategori = filterKategori === 'ALL' || item.kategori === filterKategori
      const matchSubKategori = filterSubKategori === 'ALL' || item.subKategori === filterSubKategori
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus
      const matchSearch = !searchQuery.trim() || 
        item.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.periode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subKategori && item.subKategori.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchBulan && matchPlatform && matchKategori && matchSubKategori && matchStatus && matchSearch
    })
  }, [promoList, filterBulan, filterPlatform, filterKategori, filterSubKategori, filterStatus, searchQuery])

  // Summary Metrics (Computed directly from existing data)
  const metrics = useMemo(() => {
    const runningCount = promoList.filter(i => i.status === 'Running').length
    const scheduledCount = promoList.filter(i => i.status === 'Scheduled').length
    const totalSKUs = promoList.length
    const totalGMV = promoList.reduce((acc, curr) => acc + (curr.hargaPromo * curr.qty), 0)
    const totalPromosiCost = promoList.reduce((acc, curr) => acc + curr.totalPromosi, 0)
    const safeCount = promoList.filter(i => i.hargaPromo >= i.bottomPrice).length
    const isAllSafe = safeCount === promoList.length

    return {
      runningCount,
      scheduledCount,
      totalSKUs,
      totalGMV,
      totalPromosiCost,
      safeCount,
      isAllSafe
    }
  }, [promoList])

  // Calendar month data
  const calendarMonths = [
    { index: 8, name: 'September', year: 2026 },
    { index: 9, name: 'Oktober', year: 2026 },
    { index: 10, name: 'November', year: 2026 },
    { index: 11, name: 'Desember', year: 2026 }
  ]
  const currentMonthInfo = calendarMonths.find(m => m.index === calendarMonthIndex) || calendarMonths[1]

  // Month grid generator (Monday first)
  const calendarDays = useMemo(() => {
    const year = currentMonthInfo.year
    const month = currentMonthInfo.index
    const firstDay = new Date(year, month, 1)
    let startDayOfWeek = firstDay.getDay() // 0 = Sun, 1 = Mon ...
    startDayOfWeek = (startDayOfWeek + 6) % 7 // Convert to 0 = Mon, 6 = Sun

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const result: { day: number; isCurrentMonth: boolean; dateNum: number }[] = []

    // Prev month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      result.push({ day: daysInPrevMonth - i, isCurrentMonth: false, dateNum: daysInPrevMonth - i })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ day: d, isCurrentMonth: true, dateNum: d })
    }

    // Next month padding
    const remainder = (7 - (result.length % 7)) % 7
    for (let d = 1; d <= remainder; d++) {
      result.push({ day: d, isCurrentMonth: false, dateNum: d })
    }

    return result
  }, [currentMonthInfo])

  // 1-Click Copy Format for Google Sheets (Matches Tab September 1:1)
  const handleCopyToGoogleSheet = async () => {
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
    await safeCopyToClipboard(fullText)
    setCopied(true)
    setExportOpen(false)
    setTimeout(() => setCopied(false), 3500)
  }

  // Export to Real Excel .xlsx file with exact sheet column headers
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      alert('Tidak ada item promo yang cocok dengan filter untuk diekspor. Silakan reset filter terlebih dahulu.')
      return
    }

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
    setExportOpen(false)
  }

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm('Hapus campaign ini dari rencana promosi?')) return
    setPromoList(prev => prev.filter(p => p.id !== id))
    if (selectedCampaign?.id === id) {
      setSelectedCampaign(null)
    }
  }

  const handleResetFilters = () => {
    setFilterBulan('ALL')
    setFilterPlatform('ALL')
    setFilterKategori('ALL')
    setFilterSubKategori('ALL')
    setFilterStatus('ALL')
    setSearchQuery('')
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
      campaignName: newPromo.campaignName || `${newPromo.periode || 'Campaign'} Promo`,
      status: (newPromo.status as CampaignStatus) || 'Scheduled',
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
    setNewPromo({
      campaignName: '',
      status: 'Scheduled',
      bulan: 'Oktober',
      marketplace: 'Shopee',
      kategori: 'Live Streaming',
      subKategori: 'Flash Sale',
      periode: 'Twindate 10.10',
      tanggal: '10 - 12 Oktober',
      closing: 'All',
      sku: '',
      productName: '',
      hargaBulanan: 0,
      diskonPercent: 0,
      totalDiskon: 0,
      hargaPromo: 0,
      qty: 10,
      totalPromosi: 0,
      hargaOB: 0,
      bottomPrice: 0,
      notes: ''
    })
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

  // Status Badge Styler
  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'Running':
        return {
          bg: '#ecfdf5',
          color: '#047857',
          border: '#a7f3d0',
          dot: '#10b981',
          label: 'Running'
        }
      case 'Scheduled':
        return {
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#bfdbfe',
          dot: '#3b82f6',
          label: 'Scheduled'
        }
      case 'Draft':
        return {
          bg: '#fefce8',
          color: '#a16207',
          border: '#fef08a',
          dot: '#eab308',
          label: 'Draft'
        }
      case 'Completed':
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
          dot: '#64748b',
          label: 'Completed'
        }
    }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      
      {/* ========================================================================= */}
      {/* SECTION C: REDESIGNED HEADER */}
      {/* ========================================================================= */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        paddingBottom: '4px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Promo Planner
            </h1>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              padding: '3px 9px', 
              borderRadius: '9999px', 
              backgroundColor: '#eff6ff', 
              color: 'var(--primary)',
              border: '1px solid #bfdbfe'
            }}>
              Q4 2026
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Rencanakan, monitor, dan evaluasi seluruh campaign marketplace.
          </p>
        </div>

        {/* HEADER ACTIONS */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} className="no-print">
          
          {/* EXPORT DROPDOWN / BUTTON */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '9px 14px',
                cursor: 'pointer',
                borderRadius: '8px'
              }}
            >
              <Download size={15} /> Export <ChevronRight size={14} style={{ transform: exportOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.15s' }} />
            </button>

            {exportOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '240px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--surface-border)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                zIndex: 100,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <button
                  onClick={handleCopyToGoogleSheet}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-subtle, #f8fafc)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Copy size={14} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 600 }}>1-Click Copy Sheet</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Format 1:1 Tab September</div>
                  </div>
                </button>

                <button
                  onClick={handleExportExcel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-subtle, #f8fafc)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Download size={14} color="#059669" />
                  <div>
                    <div style={{ fontWeight: 600 }}>Download .xlsx</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>File Excel Lengkap</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* PRIMARY CTA: + BUAT CAMPAIGN */}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: '9px 18px',
              cursor: 'pointer',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Plus size={16} /> + Buat Campaign
          </button>
        </div>
      </div>

      {/* COPIED ALERT NOTIFICATION */}
      {copied && (
        <div style={{ 
          padding: '12px 18px', 
          borderRadius: '8px', 
          backgroundColor: '#ecfdf5', 
          border: '1px solid #a7f3d0', 
          color: '#065f46', 
          fontSize: '0.8125rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)'
        }}>
          <Check size={18} color="#059669" />
          <div>
            <strong>Tersalin ke Clipboard!</strong> Format kolom siap dipaste langsung ke Google Sheet (tekan <strong>Ctrl + V</strong> di sel tujuan).
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION D: COMPACT SUMMARY / KPI CARDS */}
      {/* ========================================================================= */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
        gap: '12px' 
      }}>
        {/* Card 1: Campaign Aktif */}
        <div className="stat-card" style={{ padding: '14px 16px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Campaign Aktif
            </span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {metrics.runningCount}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>Sedang jalan</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>Oktober Twindate &amp; Membership</p>
        </div>

        {/* Card 2: Akan Dimulai */}
        <div className="stat-card" style={{ padding: '14px 16px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Akan Dimulai
            </span>
            <Clock size={14} color="#3b82f6" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {metrics.scheduledCount}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>Terjadwal</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>Payday Okt, 11.11 &amp; Harbolnas 12.12</p>
        </div>

        {/* Card 3: SKU Dipromosikan */}
        <div className="stat-card" style={{ padding: '14px 16px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              SKU Dipromosikan
            </span>
            <ShoppingBag size={14} color="#f97316" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {metrics.totalSKUs}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Item Q4</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>Acne, Glow, Retinol &amp; Bundling</p>
        </div>

        {/* Card 4: Estimasi GMV */}
        <div className="stat-card" style={{ padding: '14px 16px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Estimasi GMV
            </span>
            <TrendingUp size={14} color="#8b5cf6" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              Rp {(metrics.totalGMV / 1000000).toFixed(1).replace('.', ',')} jt
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>Rp {metrics.totalGMV.toLocaleString('id-ID')} target</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION P: TODAY'S FOCUS BANNER */}
      {/* ========================================================================= */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--surface-border)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={15} color="var(--primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Today&apos;s Focus:</span>
              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: 600, 
                padding: '1px 6px', 
                borderRadius: '4px', 
                backgroundColor: '#ecfdf5', 
                color: '#047857' 
              }}>
                Running
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Shopee TwinDate 10.10 Flash Sale (50 Pcs Twinpack Day Cream &amp; 120 Pcs Acne Wash)
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Next Up: TikTok Payday Anti-Aging Prime &bull; Proteksi Bottom Price Finance <strong>100% AMAN</strong>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setFilterStatus('Running')
            setActiveView('list')
          }}
          className="btn-outline"
          style={{ 
            fontSize: '0.72rem', 
            padding: '4px 10px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Lihat Campaign Berjalan <ArrowUpRight size={13} />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION E: VIEW SWITCHER (SEGMENTED CONTROL) & CONTROLS BAR */}
      {/* ========================================================================= */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* SEGMENTED CONTROL: [ List ] [ Board ] [ Calendar ] */}
        <div style={{
          display: 'inline-flex',
          backgroundColor: '#f1f5f9',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid var(--surface-border)'
        }}>
          <button
            onClick={() => setActiveView('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: 'none',
              backgroundColor: activeView === 'list' ? 'var(--surface)' : 'transparent',
              color: activeView === 'list' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeView === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <List size={15} /> List
          </button>

          <button
            onClick={() => setActiveView('board')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: 'none',
              backgroundColor: activeView === 'board' ? 'var(--surface)' : 'transparent',
              color: activeView === 'board' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeView === 'board' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <Kanban size={15} /> Board
          </button>

          <button
            onClick={() => setActiveView('calendar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: 'none',
              backgroundColor: activeView === 'calendar' ? 'var(--surface)' : 'transparent',
              color: activeView === 'calendar' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeView === 'calendar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <CalendarDays size={15} /> Calendar
          </button>
        </div>

        {/* DENSITY TOGGLE (KOMPAK FIT LAYAR vs MASTER SHEET MELEBAR) */}
        {activeView === 'list' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Format Tampilan:</span>
            <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
              <button
                onClick={() => setTableDensity('compact')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '5px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: tableDensity === 'compact' ? 'var(--surface)' : 'transparent',
                  color: tableDensity === 'compact' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: tableDensity === 'compact' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Tampilan pas layar tanpa perlu geser horizontal"
              >
                <Minimize2 size={12} /> Fit Layar (Tanpa Geser)
              </button>

              <button
                onClick={() => setTableDensity('spread')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '5px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: tableDensity === 'spread' ? 'var(--surface)' : 'transparent',
                  color: tableDensity === 'spread' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: tableDensity === 'spread' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Tampilan lengkap 17 kolom melebar sesuai spreadsheet"
              >
                <Maximize2 size={12} /> Master Sheet (17 Kolom)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION F: MODERN COMPACT FILTER BAR */}
      {/* ========================================================================= */}
      <div className="card-flat no-print" style={{ 
        padding: '10px 14px', 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center', 
        backgroundColor: 'var(--surface)', 
        border: '1px solid var(--surface-border)', 
        borderRadius: '10px', 
        flexWrap: 'wrap' 
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', flex: '1', minWidth: '200px', position: 'relative' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
          <input
            type="text"
            placeholder="Cari campaign, SKU, atau produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '32px', paddingRight: searchQuery ? '28px' : '10px', fontSize: '0.8125rem', width: '100%', height: '34px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              title="Hapus pencarian"
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--surface-border)' }}></div>

        {/* Filter Marketplace */}
        <select 
          value={filterPlatform} 
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="filter-select"
          style={{ minWidth: '130px', fontSize: '0.78rem', height: '34px' }}
        >
          <option value="ALL">Semua Marketplace</option>
          <option value="Shopee">Shopee</option>
          <option value="TikTok Shop">TikTok Shop</option>
          <option value="Lazada">Lazada</option>
        </select>

        {/* Filter Kategori / Channel */}
        <select 
          value={filterKategori} 
          onChange={(e) => setFilterKategori(e.target.value)}
          className="filter-select"
          style={{ minWidth: '125px', fontSize: '0.78rem', height: '34px' }}
        >
          <option value="ALL">Semua Channel</option>
          <option value="Toko">Promo Toko</option>
          <option value="Campaign">Campaign</option>
          <option value="Live Streaming">Live Streaming</option>
          <option value="Brand Membership">Brand Membership</option>
        </select>

        {/* Filter Sub-Kategori / Jenis Promo */}
        <select 
          value={filterSubKategori} 
          onChange={(e) => setFilterSubKategori(e.target.value)}
          className="filter-select"
          style={{ minWidth: '135px', fontSize: '0.78rem', height: '34px' }}
        >
          <option value="ALL">Semua Jenis Promo</option>
          <option value="Flash Sale">⚡ Flash Sale</option>
          <option value="Voucher NPD">🎟️ Voucher NPD (Produk Baru)</option>
          <option value="Paket Diskon NPD">📦 Paket Diskon NPD</option>
          <option value="Paket diskon">📦 Paket Diskon Reguler</option>
        </select>

        {/* Filter Status */}
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
          style={{ minWidth: '115px', fontSize: '0.78rem', height: '34px' }}
        >
          <option value="ALL">Semua Status</option>
          <option value="Running">Running</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Draft">Draft</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Filter Bulan */}
        <select 
          value={filterBulan} 
          onChange={(e) => setFilterBulan(e.target.value)}
          className="filter-select"
          style={{ minWidth: '115px', fontSize: '0.78rem', height: '34px' }}
        >
          <option value="ALL">Semua Bulan</option>
          <option value="Oktober">Oktober 2026</option>
          <option value="November">November 2026</option>
          <option value="Desember">Desember 2026</option>
        </select>

        {/* RESET FILTER BUTTON */}
        {(filterBulan !== 'ALL' || filterPlatform !== 'ALL' || filterKategori !== 'ALL' || filterSubKategori !== 'ALL' || filterStatus !== 'ALL' || searchQuery !== '') && (
          <button
            onClick={handleResetFilters}
            className="btn-outline"
            style={{ 
              fontSize: '0.72rem', 
              padding: '4px 8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              color: 'var(--danger)',
              borderColor: 'var(--danger-border)',
              cursor: 'pointer',
              height: '34px'
            }}
            title="Reset semua filter"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION G & H & I & J: LIST VIEW (OPTIMIZED ZERO-HORIZONTAL-SCROLL TABLE) */}
      {/* ========================================================================= */}
      {activeView === 'list' && (
        <div>
          {tableDensity === 'compact' ? (
            /* ================= COMPACT TABLE: 100% FIT LAYAR - TANPA GESER ================= */
            <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600, borderBottom: '1px solid var(--surface-border)' }}>
                    <th style={{ padding: '12px 14px', width: '14%' }}>Marketplace &amp; Channel</th>
                    <th style={{ padding: '12px 14px', width: '20%' }}>Campaign &amp; Periode</th>
                    <th style={{ padding: '12px 14px', width: '25%' }}>Produk &amp; SKU</th>
                    <th style={{ padding: '12px 14px', width: '16%', textAlign: 'right' }}>Harga Promo &amp; Diskon</th>
                    <th style={{ padding: '12px 14px', width: '13%', textAlign: 'right' }}>Target &amp; GMV</th>
                    <th style={{ padding: '12px 14px', width: '8%', textAlign: 'center' }}>Proteksi Margin</th>
                    <th style={{ padding: '12px 10px', width: '4%', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tidak ada campaign yang cocok dengan filter Anda.</span>
                          <button
                            onClick={handleResetFilters}
                            className="btn-outline"
                            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                          >
                            <RotateCcw size={13} /> Reset Filter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => {
                      const stBadge = getStatusBadge(item.status)
                      const estGMV = item.hargaPromo * item.qty
                      const marginSafety = item.hargaPromo - item.bottomPrice
                      const isSafe = marginSafety >= 0

                      return (
                        <tr 
                          key={item.id} 
                          onClick={() => setSelectedCampaign(item)}
                          style={{ 
                            borderBottom: '1px solid var(--surface-border)', 
                            transition: 'background-color 0.12s',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {/* 1. Marketplace & Channel */}
                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <div style={{ marginBottom: '4px' }}>
                              <MarketplaceBadge platform={item.marketplace} />
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              {item.kategori}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {item.subKategori}
                            </div>
                          </td>

                          {/* 2. Campaign & Periode */}
                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem', lineHeight: 1.3 }}>
                              {item.campaignName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '1px 6px',
                                borderRadius: '9999px',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                backgroundColor: stBadge.bg,
                                color: stBadge.color,
                                border: `1px solid ${stBadge.border}`
                              }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: stBadge.dot }}></span>
                                {stBadge.label}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {item.tanggal}
                              </span>
                            </div>
                          </td>

                          {/* 3. Produk & SKU */}
                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem', lineHeight: 1.35 }}>
                              {item.productName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <span style={{ 
                                padding: '1px 5px', 
                                borderRadius: '3px', 
                                fontFamily: 'monospace', 
                                fontSize: '0.68rem', 
                                backgroundColor: '#f1f5f9', 
                                color: '#334155',
                                fontWeight: 600
                              }}>
                                {item.sku}
                              </span>
                              {item.notes && (
                                <span style={{ fontSize: '0.68rem', color: 'var(--primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }} title={item.notes}>
                                  💡 {item.notes}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 4. Harga Promo & Diskon */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.875rem' }}>
                              Rp {item.hargaPromo.toLocaleString('id-ID')}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <del>Rp {item.hargaBulanan.toLocaleString('id-ID')}</del>{' '}
                              <span style={{ color: '#f97316', fontWeight: 700 }}>(-{item.diskonPercent}%)</span>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#f97316', marginTop: '1px' }}>
                              Hemat Rp {item.totalDiskon.toLocaleString('id-ID')}
                            </div>
                          </td>

                          {/* 5. Target & Est. GMV */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                              {item.qty} pcs
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                              Rp {estGMV.toLocaleString('id-ID')}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                              Biaya: Rp {item.totalPromosi.toLocaleString('id-ID')}
                            </div>
                          </td>

                          {/* 6. Proteksi Margin Finance */}
                          <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'top' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              backgroundColor: isSafe ? 'var(--success-light)' : 'var(--danger-light)',
                              color: isSafe ? 'var(--success)' : 'var(--danger)',
                              border: `1px solid ${isSafe ? 'var(--success-border)' : 'var(--danger-border)'}`
                            }}>
                              <ShieldCheck size={11} /> {isSafe ? 'AMAN' : 'BAHAYA'}
                            </span>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                              Buffer: +Rp {marginSafety.toLocaleString('id-ID')}
                            </div>
                          </td>

                          {/* 7. Actions */}
                          <td style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'top' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCampaign(item)
                              }}
                              title="Lihat Detail Campaign"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ================= SPREAD TABLE: 17 KOLOM MASTER SHEET MELEBAR ================= */
            <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem', minWidth: '1350px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600, borderBottom: '1px solid var(--surface-border)' }}>
                      <th style={{ padding: '10px 12px' }}>Marketplace</th>
                      <th style={{ padding: '10px 12px' }}>Kategori</th>
                      <th style={{ padding: '10px 12px' }}>Sub Kategori</th>
                      <th style={{ padding: '10px 12px' }}>Periode</th>
                      <th style={{ padding: '10px 12px' }}>Tanggal</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Closing</th>
                      <th style={{ padding: '10px 12px' }}>SKU</th>
                      <th style={{ padding: '10px 12px', minWidth: '200px' }}>Product Name</th>
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
                    {filteredList.map((item) => {
                      const marginSafety = item.hargaPromo - item.bottomPrice
                      const isSafe = marginSafety >= 0
                      return (
                        <tr key={item.id} onClick={() => setSelectedCampaign(item)} style={{ borderBottom: '1px solid var(--surface-border)', cursor: 'pointer' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <MarketplaceBadge platform={item.marketplace} />
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.kategori}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{item.subKategori}</td>
                          <td style={{ padding: '10px 12px' }}>{item.periode}</td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{item.tanggal}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.closing}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600 }}>{item.sku}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>{item.productName}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>Rp {item.hargaBulanan.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#f97316' }}>{item.diskonPercent}%</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#f97316' }}>Rp {item.totalDiskon.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>Rp {item.hargaPromo.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{item.qty}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#8b5cf6' }}>Rp {item.totalPromosi.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#f8fafc' }}>Rp {item.bottomPrice.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isSafe ? 'var(--success)' : 'var(--danger)' }}>
                              {isSafe ? 'AMAN' : 'BAHAYA'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedCampaign(item) }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION O: BOARD VIEW (KANBAN) */}
      {/* ========================================================================= */}
      {activeView === 'board' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '14px',
          alignItems: 'start'
        }}>
          {(['Draft', 'Scheduled', 'Running', 'Completed'] as CampaignStatus[]).map((statusCol) => {
            const itemsInCol = filteredList.filter(i => i.status === statusCol)
            const colBadge = getStatusBadge(statusCol)
            const colGMV = itemsInCol.reduce((acc, curr) => acc + (curr.hargaPromo * curr.qty), 0)

            return (
              <div 
                key={statusCol}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--surface-border)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colBadge.dot }}></span>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {statusCol}
                    </h3>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      padding: '1px 6px', 
                      borderRadius: '9999px', 
                      backgroundColor: '#ffffff', 
                      color: 'var(--text-secondary)',
                      border: '1px solid #e2e8f0'
                    }}>
                      {itemsInCol.length}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Rp {(colGMV / 1000000).toFixed(1)}M
                  </span>
                </div>

                {/* Cards Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px' }}>
                  {itemsInCol.length === 0 ? (
                    <div style={{
                      padding: '28px 14px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '8px'
                    }}>
                      Tidak ada campaign {statusCol}
                    </div>
                  ) : (
                    itemsInCol.map((item) => {
                      const itemGMV = item.hargaPromo * item.qty

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedCampaign(item)}
                          style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                            e.currentTarget.style.transform = 'none'
                          }}
                        >
                          {/* Card Top: Marketplace & Period */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <MarketplaceBadge platform={item.marketplace} />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {item.tanggal}
                            </span>
                          </div>

                          {/* Card Body: Campaign Name & SKU */}
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {item.campaignName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {item.productName}
                          </div>

                          {/* Card Metrics: Target & GMV */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '10px',
                            paddingTop: '8px',
                            borderTop: '1px solid #f1f5f9',
                            fontSize: '0.72rem'
                          }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Target: </span>
                              <strong style={{ color: 'var(--text-primary)' }}>{item.qty} pcs</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Est. GMV: </span>
                              <strong style={{ color: 'var(--primary)' }}>Rp {itemGMV.toLocaleString('id-ID')}</strong>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION K & L & M: MODERN PROFESSIONAL CALENDAR VIEW */}
      {/* ========================================================================= */}
      {activeView === 'calendar' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          {/* CALENDAR HEADER BAR */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--surface-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Left Month Controls: [ ← ] Month YYYY [ → ] [ Today ] */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setCalendarMonthIndex(prev => Math.max(8, prev - 1))}
                  disabled={calendarMonthIndex <= 8}
                  className="btn-outline"
                  style={{ padding: '5px 8px', borderRadius: '6px', cursor: calendarMonthIndex <= 8 ? 'not-allowed' : 'pointer' }}
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>

                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 8px', color: 'var(--text-primary)' }}>
                  {currentMonthInfo.name} {currentMonthInfo.year}
                </h3>

                <button
                  onClick={() => setCalendarMonthIndex(prev => Math.min(11, prev + 1))}
                  disabled={calendarMonthIndex >= 11}
                  className="btn-outline"
                  style={{ padding: '5px 8px', borderRadius: '6px', cursor: calendarMonthIndex >= 11 ? 'not-allowed' : 'pointer' }}
                  title="Bulan berikutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* TODAY BUTTON */}
              <button
                onClick={() => setCalendarMonthIndex(9)} // Jump to Oktober 2026
                className="btn-outline"
                style={{ fontSize: '0.75rem', fontWeight: 600, padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Today
              </button>
            </div>

            {/* Right: Quick Month Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pilih Bulan:</span>
              <select
                value={calendarMonthIndex}
                onChange={(e) => setCalendarMonthIndex(Number(e.target.value))}
                className="filter-select"
                style={{ fontSize: '0.78rem', height: '32px', minWidth: '130px' }}
              >
                <option value={8}>September 2026</option>
                <option value={9}>Oktober 2026</option>
                <option value={10}>November 2026</option>
                <option value={11}>Desember 2026</option>
              </select>
            </div>
          </div>

          {/* CALENDAR WEEKDAYS HEADER */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid var(--surface-border)',
            textAlign: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-secondary)'
          }}>
            <div style={{ padding: '8px' }}>Senin</div>
            <div style={{ padding: '8px' }}>Selasa</div>
            <div style={{ padding: '8px' }}>Rabu</div>
            <div style={{ padding: '8px' }}>Kamis</div>
            <div style={{ padding: '8px' }}>Jumat</div>
            <div style={{ padding: '8px', color: '#f97316' }}>Sabtu</div>
            <div style={{ padding: '8px', color: '#dc2626' }}>Minggu</div>
          </div>

          {/* CALENDAR DAYS GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            backgroundColor: 'var(--surface-border)',
            gap: '1px'
          }}>
            {calendarDays.map((cell, idx) => {
              // Find active campaigns for this day
              const dayCampaigns = cell.isCurrentMonth
                ? promoList.filter(item => {
                    if (item.bulan !== currentMonthInfo.name) return false
                    const { startDay, endDay } = parseCampaignDays(item.tanggal)
                    return cell.dateNum >= startDay && cell.dateNum <= endDay
                  })
                : []

              const isToday = cell.isCurrentMonth && currentMonthInfo.name === 'Oktober' && cell.dateNum === 10

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: cell.isCurrentMonth ? '#ffffff' : '#f8fafc',
                    minHeight: '120px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    position: 'relative'
                  }}
                >
                  {/* Day Number Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: isToday ? 800 : cell.isCurrentMonth ? 600 : 400,
                      color: isToday ? '#ffffff' : cell.isCurrentMonth ? 'var(--text-primary)' : '#94a3b8',
                      width: isToday ? '20px' : 'auto',
                      height: isToday ? '20px' : 'auto',
                      borderRadius: isToday ? '50%' : '0',
                      backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {cell.day}
                    </span>

                    {isToday && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                        Hari Ini
                      </span>
                    )}
                  </div>

                  {/* Campaign Event Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                    {dayCampaigns.slice(0, 2).map((camp) => {
                      const stBadge = getStatusBadge(camp.status)
                      const isTiktok = camp.marketplace.toLowerCase().includes('tiktok')
                      const isLazada = camp.marketplace.toLowerCase().includes('lazada')

                      return (
                        <div
                          key={camp.id}
                          onClick={() => setSelectedCampaign(camp)}
                          title={`${camp.campaignName} (${camp.marketplace} - ${camp.status})`}
                          style={{
                            padding: '2px 5px',
                            borderRadius: '4px',
                            fontSize: '0.67rem',
                            fontWeight: 600,
                            backgroundColor: isTiktok ? '#000000' : isLazada ? '#eff6ff' : '#fff1ee',
                            color: isTiktok ? '#ffffff' : isLazada ? '#1e40af' : '#ee4d2d',
                            border: `1px solid ${isTiktok ? '#27272a' : isLazada ? '#c7d2fe' : '#fed7aa'}`,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'opacity 0.15s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: stBadge.dot, flexShrink: 0 }}></span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {camp.campaignName}
                          </span>
                        </div>
                      )
                    })}

                    {/* "+X more" trigger */}
                    {dayCampaigns.length > 2 && (
                      <button
                        onClick={() => setActiveDayModal({
                          day: cell.dateNum,
                          monthName: currentMonthInfo.name,
                          campaigns: dayCampaigns
                        })}
                        style={{
                          fontSize: '0.67rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: '1px 3px',
                          marginTop: 'auto'
                        }}
                      >
                        +{dayCampaigns.length - 2} lainnya
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION N: CAMPAIGN DETAIL DRAWER (SLIDE-OVER FROM RIGHT) */}
      {/* ========================================================================= */}
      {selectedCampaign && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 9999,
          transition: 'all 0.2s ease'
        }}>
          <div 
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#ffffff',
              height: '100%',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
          >
            {/* DRAWER HEADER */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--surface-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <MarketplaceBadge platform={selectedCampaign.marketplace} />
                  
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: getStatusBadge(selectedCampaign.status).bg,
                    color: getStatusBadge(selectedCampaign.status).color,
                    border: `1px solid ${getStatusBadge(selectedCampaign.status).border}`
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: getStatusBadge(selectedCampaign.status).dot }}></span>
                    {selectedCampaign.status}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                  {selectedCampaign.campaignName}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {selectedCampaign.periode} &bull; {selectedCampaign.tanggal}
                </div>
              </div>

              <button
                onClick={() => setSelectedCampaign(null)}
                title="Tutup Detail"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* DRAWER BODY */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              
              {/* Origin Banner from Campaign Opportunity */}
              {(selectedCampaign.id.startsWith('from-opp-') || (selectedCampaign.notes && selectedCampaign.notes.includes('Berasal dari Campaign Opportunity'))) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1d4ed8', fontWeight: 600 }}>
                    <Sparkles size={14} color="#2563eb" /> Sumber: <strong>Campaign Opportunity</strong>
                  </div>
                  <Link
                    href="/campaign-opportunity"
                    style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    View Opportunity &rarr;
                  </Link>
                </div>
              )}

              {/* Product Info Card */}
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Target Produk
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedCampaign.productName}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.75rem' }}>
                  <span>SKU: <strong style={{ fontFamily: 'monospace' }}>{selectedCampaign.sku}</strong></span>
                  <span>Channel: <strong>{selectedCampaign.kategori}</strong></span>
                </div>
              </div>

              {/* Performance & Target Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target Alokasi Stok</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedCampaign.qty} Pcs
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estimasi Hasil GMV</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                    Rp {(selectedCampaign.hargaPromo * selectedCampaign.qty).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Pricing & Discount Breakdown */}
              <div>
                <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
                  Struktur Harga &amp; Diskon
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>HARGA Bulanan (Normal):</span>
                    <strong>Rp {selectedCampaign.hargaBulanan.toLocaleString('id-ID')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Diskon Promosi:</span>
                    <strong style={{ color: '#f97316' }}>{selectedCampaign.diskonPercent}% (-Rp {selectedCampaign.totalDiskon.toLocaleString('id-ID')})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Harga Promo Final:</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>Rp {selectedCampaign.hargaPromo.toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </div>

              {/* Financial & Margin Protection Detail */}
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '0.8125rem' }}>
                  <ShieldCheck size={16} /> Proteksi Margin Finance
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#166534' }}>Harga Operational Base (OB):</span>
                    <strong>Rp {selectedCampaign.hargaOB.toLocaleString('id-ID')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#166534' }}>Bottom Price (-3% dr OB):</span>
                    <strong>Rp {selectedCampaign.bottomPrice.toLocaleString('id-ID')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed #86efac' }}>
                    <span style={{ color: '#166534', fontWeight: 600 }}>Safety Buffer:</span>
                    <strong style={{ color: '#047857' }}>
                      +Rp {(selectedCampaign.hargaPromo - selectedCampaign.bottomPrice).toLocaleString('id-ID')} (100% AMAN)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Strategic Insights & Notes */}
              {selectedCampaign.notes && (
                <div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    💡 Catatan Operasional
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px' }}>
                    {selectedCampaign.notes}
                  </p>
                </div>
              )}

            </div>

            {/* DRAWER FOOTER ACTIONS */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--surface-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <button
                onClick={() => handleDeleteItem(selectedCampaign.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--danger)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={14} /> Hapus Campaign
              </button>

              <button
                onClick={() => setSelectedCampaign(null)}
                className="btn-primary"
                style={{ fontSize: '0.8125rem', padding: '8px 18px', cursor: 'pointer' }}
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DAY POPUP MODAL (FROM "+X MORE" ON CALENDAR) */}
      {/* ========================================================================= */}
      {activeDayModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Campaign pada {activeDayModal.day} {activeDayModal.monthName} 2026
              </h3>
              <button
                onClick={() => setActiveDayModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
              {activeDayModal.campaigns.map(c => {
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveDayModal(null)
                      setSelectedCampaign(c)
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        {c.campaignName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {c.productName} &bull; {c.qty} pcs
                      </div>
                    </div>
                    <MarketplaceBadge platform={c.marketplace} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: + BUAT CAMPAIGN / TAMBAH PROMO CUSTOM */}
      {/* ========================================================================= */}
      {showModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{
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
          }}
        >
          <div className="card" style={{ maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Buat Campaign Baru
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Rencanakan alokasi promo &amp; validasi batas aman Bottom Price Finance.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                title="Tutup Modal"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomPromo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Nama Campaign
                </label>
                <input 
                  type="text" 
                  value={newPromo.campaignName || ''} 
                  onChange={(e) => setNewPromo(p => ({ ...p, campaignName: e.target.value }))}
                  placeholder="Contoh: Shopee TwinDate 10.10 Flash Sale Live" 
                  className="input-field" 
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
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
                    <option value="Lazada">Lazada</option>
                    <option value="Tokopedia">Tokopedia</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select 
                    value={newPromo.status || 'Scheduled'} 
                    onChange={(e) => setNewPromo(p => ({ ...p, status: e.target.value as any }))}
                    className="filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Running">Running</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Kategori / Channel
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
                    Tanggal / Durasi
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
                    Target Qty (Pcs)
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
                  Simpan Campaign
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
