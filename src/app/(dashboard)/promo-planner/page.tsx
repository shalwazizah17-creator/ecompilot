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
  CalendarDays
} from 'lucide-react'
import * as xlsx from 'xlsx'

export interface PromoPlanItem {
  id: string
  bulan: 'Oktober' | 'November' | 'Desember'
  marketplace: 'Shopee' | 'TikTok Shop'
  kategori: string // Flash Sale, Campaign, Live Stream
  subKategori: string // Promo Flash Sale, Paket Promo, dll
  periode: string // Twindate 10.10, Payday, Twindate 11.11, Harbolnas 12.12, Mid-Month
  tanggal: string // e.g. "10 Okt 2026" or "25-31 Okt 2026"
  sku: string
  namaProduk: string
  hargaNormal: number
  diskonPercent: number
  hargaPromo: number
  hargaOB: number
  bottomPrice: number
  notes?: string
}

// Master Pre-loaded Recommendations for Theraskin Q4 2026 (100% Safe vs Bottom Price)
const INITIAL_PROMO_PLANS: PromoPlanItem[] = [
  // --- OKTOBER 2026 ---
  {
    id: 'okt-1',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Flash Sale',
    subKategori: 'Promo Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 Okt 2026',
    sku: 'FAA05T0100C',
    namaProduk: 'Advanced Acne Facial Wash 100ml',
    hargaNormal: 39200,
    diskonPercent: 6,
    hargaPromo: 37000,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: 'Hero Volume. Slot Flash Sale 12.00 & 18.00'
  },
  {
    id: 'okt-2',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Flash Sale',
    subKategori: 'Promo Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 Okt 2026',
    sku: 'FFG01T0100C',
    namaProduk: 'Perfect Glow Facial Wash 100ml',
    hargaNormal: 41500,
    diskonPercent: 5,
    hargaPromo: 39500,
    hargaOB: 38000,
    bottomPrice: 36860,
    notes: 'Traffic Driver Glow Series'
  },
  {
    id: 'okt-3',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Flash Sale',
    subKategori: 'Promo Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 Okt 2026',
    sku: 'FAR01B0015CS',
    namaProduk: 'Age Revival Retinol Serum 15ml',
    hargaNormal: 64900,
    diskonPercent: 5,
    hargaPromo: 61900,
    hargaOB: 59000,
    bottomPrice: 57230,
    notes: 'Midnight Sale 00.00-02.00 (High Profit)'
  },
  {
    id: 'okt-4',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Live Stream',
    subKategori: 'Flash Sale Live',
    periode: 'Twindate 10.10',
    tanggal: '10 Okt 2026',
    sku: 'FAA12B0015CI',
    namaProduk: 'Advanced Acne Serum 15ml',
    hargaNormal: 74400,
    diskonPercent: 4,
    hargaPromo: 71500,
    hargaOB: 69000,
    bottomPrice: 66930,
    notes: 'Khusus pin keranjang kuning host live'
  },
  {
    id: 'okt-5',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Paket Promo',
    periode: 'Payday',
    tanggal: '25-31 Okt 2026',
    sku: 'FPK00000040',
    namaProduk: 'Advanced Acne Paket Lengkap',
    hargaNormal: 244700,
    diskonPercent: 3,
    hargaPromo: 238000,
    hargaOB: 243500,
    bottomPrice: 236195,
    notes: 'Bundling Gajian + Free Pouch Exclusive'
  },
  {
    id: 'okt-6',
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Paket Promo',
    periode: 'Payday',
    tanggal: '25-31 Okt 2026',
    sku: 'FPK00000039',
    namaProduk: 'Perfect Glow Paket Lengkap',
    hargaNormal: 269900,
    diskonPercent: 4,
    hargaPromo: 259000,
    hargaOB: 262500,
    bottomPrice: 254625,
    notes: 'Top Basket Size. Diskon Payday + Free Brush'
  },
  {
    id: 'okt-7',
    bulan: 'Oktober',
    marketplace: 'TikTok Shop',
    kategori: 'Live Stream',
    subKategori: 'Flash Sale Live',
    periode: 'Payday',
    tanggal: '25-31 Okt 2026',
    sku: 'FPK00000033',
    namaProduk: 'Age Revival Anti Aging Paket Lengkap',
    hargaNormal: 215000,
    diskonPercent: 3,
    hargaPromo: 209000,
    hargaOB: 210000,
    bottomPrice: 203700,
    notes: 'Target audiens usia 25+'
  },

  // --- NOVEMBER 2026 ---
  {
    id: 'nov-1',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Flash Sale',
    subKategori: 'Super Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 Nov 2026',
    sku: 'FAA05T0100C',
    namaProduk: 'Advanced Acne Facial Wash 100ml',
    hargaNormal: 39200,
    diskonPercent: 6,
    hargaPromo: 37000,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: 'Puncak 11.11 Volume Terbesar'
  },
  {
    id: 'nov-2',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Flash Sale',
    subKategori: 'Super Flash Sale',
    periode: 'Twindate 11.11',
    tanggal: '11 Nov 2026',
    sku: 'FAR01B0015CS',
    namaProduk: 'Age Revival Retinol Serum 15ml',
    hargaNormal: 64900,
    diskonPercent: 5,
    hargaPromo: 61900,
    hargaOB: 59000,
    bottomPrice: 57230,
    notes: 'Super Brand Day 11.11'
  },
  {
    id: 'nov-3',
    bulan: 'November',
    marketplace: 'TikTok Shop',
    kategori: 'Live Stream',
    subKategori: 'Mega 11.11 Live',
    periode: 'Twindate 11.11',
    tanggal: '11 Nov 2026',
    sku: 'FPK00000039',
    namaProduk: 'Perfect Glow Paket Lengkap',
    hargaNormal: 269900,
    diskonPercent: 4,
    hargaPromo: 259000,
    hargaOB: 262500,
    bottomPrice: 254625,
    notes: 'Live Stream 24 Jam Nonstop'
  },
  {
    id: 'nov-4',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Payday Sale',
    periode: 'Payday',
    tanggal: '25-30 Nov 2026',
    sku: 'FPK00000040',
    namaProduk: 'Advanced Acne Paket Lengkap',
    hargaNormal: 244700,
    diskonPercent: 3,
    hargaPromo: 238000,
    hargaOB: 243500,
    bottomPrice: 236195,
    notes: 'Payday November & Black Friday'
  },
  {
    id: 'nov-5',
    bulan: 'November',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Payday Sale',
    periode: 'Payday',
    tanggal: '25-30 Nov 2026',
    sku: 'FPK00000037',
    namaProduk: 'CeraMoist Series Paket Lengkap',
    hargaNormal: 198000,
    diskonPercent: 3,
    hargaPromo: 192000,
    hargaOB: 194500,
    bottomPrice: 188665,
    notes: 'Skin barrier package promo'
  },

  // --- DESEMBER 2026 ---
  {
    id: 'des-1',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Flash Sale',
    subKategori: 'Harbolnas 12.12',
    periode: 'Twindate 12.12',
    tanggal: '12 Des 2026',
    sku: 'FAA05T0100C',
    namaProduk: 'Advanced Acne Facial Wash 100ml',
    hargaNormal: 39200,
    diskonPercent: 6,
    hargaPromo: 37000,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: 'Puncak Harbolnas 12.12 Nasional'
  },
  {
    id: 'des-2',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Flash Sale',
    subKategori: 'Harbolnas 12.12',
    periode: 'Twindate 12.12',
    tanggal: '12 Des 2026',
    sku: 'FFG01T0100C',
    namaProduk: 'Perfect Glow Facial Wash 100ml',
    hargaNormal: 41500,
    diskonPercent: 5,
    hargaPromo: 39500,
    hargaOB: 38000,
    bottomPrice: 36860,
    notes: 'Harbolnas Best Seller Cleanser'
  },
  {
    id: 'des-3',
    bulan: 'Desember',
    marketplace: 'TikTok Shop',
    kategori: 'Live Stream',
    subKategori: 'Harbolnas 12.12',
    periode: 'Twindate 12.12',
    tanggal: '12 Des 2026',
    sku: 'FPK00000033',
    namaProduk: 'Age Revival Anti Aging Paket Lengkap',
    hargaNormal: 215000,
    diskonPercent: 3,
    hargaPromo: 209000,
    hargaOB: 210000,
    bottomPrice: 203700,
    notes: 'Harbolnas Anti-Aging Hero'
  },
  {
    id: 'des-4',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Year-End Sale',
    periode: 'Akhir Tahun',
    tanggal: '25-31 Des 2026',
    sku: 'FPK00000040',
    namaProduk: 'Advanced Acne Paket Lengkap',
    hargaNormal: 244700,
    diskonPercent: 3,
    hargaPromo: 238000,
    hargaOB: 243500,
    bottomPrice: 236195,
    notes: 'Cuci Gudang Akhir Tahun 2026'
  },
  {
    id: 'des-5',
    bulan: 'Desember',
    marketplace: 'Shopee',
    kategori: 'Campaign',
    subKategori: 'Year-End Sale',
    periode: 'Akhir Tahun',
    tanggal: '25-31 Des 2026',
    sku: 'FPK00000039',
    namaProduk: 'Perfect Glow Paket Lengkap',
    hargaNormal: 269900,
    diskonPercent: 4,
    hargaPromo: 259000,
    hargaOB: 262500,
    bottomPrice: 254625,
    notes: 'New Year Holiday Gift Package'
  }
]

export default function PromoPlannerPage() {
  const [promoList, setPromoList] = useState<PromoPlanItem[]>(INITIAL_PROMO_PLANS)
  
  // Filter states
  const [filterBulan, setFilterBulan] = useState<string>('ALL') // ALL, Oktober, November, Desember
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL') // ALL, Shopee, TikTok Shop
  const [filterKategori, setFilterKategori] = useState<string>('ALL') // ALL, Flash Sale, Campaign, Live Stream

  // Clipboard copy state
  const [copied, setCopied] = useState(false)

  // Modal State for custom promo
  const [showModal, setShowModal] = useState(false)
  const [newPromo, setNewPromo] = useState<Partial<PromoPlanItem>>({
    bulan: 'Oktober',
    marketplace: 'Shopee',
    kategori: 'Flash Sale',
    subKategori: 'Promo Flash Sale',
    periode: 'Twindate 10.10',
    tanggal: '10 Okt 2026',
    sku: 'FAA05T0100C',
    namaProduk: 'Advanced Acne Facial Wash 100ml',
    hargaNormal: 39200,
    diskonPercent: 5,
    hargaPromo: 37240,
    hargaOB: 35500,
    bottomPrice: 34435,
    notes: ''
  })

  // Filtered List
  const filteredList = useMemo(() => {
    return promoList.filter(item => {
      const matchBulan = filterBulan === 'ALL' || item.bulan === filterBulan
      const matchPlatform = filterPlatform === 'ALL' || item.marketplace === filterPlatform
      const matchKategori = filterKategori === 'ALL' || item.kategori === filterKategori
      return matchBulan && matchPlatform && matchKategori
    })
  }, [promoList, filterBulan, filterPlatform, filterKategori])

  // 1-Click Copy Format for Google Sheet (TSV / Tab-Separated)
  const handleCopyToGoogleSheet = () => {
    const headers = [
      'Bulan',
      'Marketplace',
      'Kategori',
      'Sub Kategori',
      'Periode',
      'Tanggal',
      'SKU',
      'Nama Produk',
      'Harga Normal',
      'Diskon %',
      'Harga Promo',
      'Bottom Price',
      'Catatan'
    ].join('\t')

    const rows = filteredList.map(item => [
      item.bulan,
      item.marketplace,
      item.kategori,
      item.subKategori,
      item.periode,
      item.tanggal,
      item.sku,
      item.namaProduk,
      item.hargaNormal,
      `${item.diskonPercent}%`,
      item.hargaPromo,
      item.bottomPrice,
      item.notes || ''
    ].join('\t')).join('\n')

    const fullText = `${headers}\n${rows}`
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Export to Real Excel .xlsx file using SheetJS
  const handleExportExcel = () => {
    const dataForSheet = filteredList.map(item => ({
      'Bulan': item.bulan,
      'Marketplace': item.marketplace,
      'Kategori': item.kategori,
      'Sub Kategori': item.subKategori,
      'Periode': item.periode,
      'Tanggal': item.tanggal,
      'SKU': item.sku,
      'Nama Produk': item.namaProduk,
      'Harga Normal': item.hargaNormal,
      'Diskon %': `${item.diskonPercent}%`,
      'Harga Promo': item.hargaPromo,
      'Bottom Price (-3% OB)': item.bottomPrice,
      'Status Margin': item.hargaPromo >= item.bottomPrice ? 'AMAN' : 'BAHAYA',
      'Catatan': item.notes || ''
    }))

    const worksheet = xlsx.utils.json_to_sheet(dataForSheet)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Plan Promo Q4')
    xlsx.writeFile(workbook, `Plan_Promo_Theraskin_Q4_2026.xlsx`)
  }

  const handleDeleteItem = (id: string) => {
    if (!confirm('Hapus baris promo ini dari plan?')) return
    setPromoList(prev => prev.filter(p => p.id !== id))
  }

  const handleAddCustomPromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPromo.sku || !newPromo.namaProduk) return

    const itemToAdd: PromoPlanItem = {
      id: `custom-${Date.now()}`,
      bulan: newPromo.bulan as any || 'Oktober',
      marketplace: newPromo.marketplace as any || 'Shopee',
      kategori: newPromo.kategori || 'Flash Sale',
      subKategori: newPromo.subKategori || 'Promo Flash Sale',
      periode: newPromo.periode || 'Twindate',
      tanggal: newPromo.tanggal || '10 Okt 2026',
      sku: newPromo.sku,
      namaProduk: newPromo.namaProduk,
      hargaNormal: Number(newPromo.hargaNormal) || 0,
      diskonPercent: Number(newPromo.diskonPercent) || 0,
      hargaPromo: Number(newPromo.hargaPromo) || 0,
      hargaOB: Number(newPromo.hargaOB) || 0,
      bottomPrice: Number(newPromo.bottomPrice) || 0,
      notes: newPromo.notes || 'Custom Promo'
    }

    setPromoList(prev => [itemToAdd, ...prev])
    setShowModal(false)
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Plan & Kalender Promo Marketplace
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
              Q4 2026
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Rekomendasi promo Oktober–Desember Theraskin: validasi batas Bottom Price Finance & siap salin ke Google Sheet.
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
              transition: 'all 0.2s'
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
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Download .xlsx
          </button>

          {/* TAMBAH PROMO CUSTOM */}
          <button 
            onClick={() => setShowModal(true)} 
            className="btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Tambah Promo
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
          fontSize: '0.875rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <Check size={18} color="#059669" />
          <div>
            <strong>Tabel Berhasil Disalin!</strong> Buka Google Sheet kamu (atau Excel kantor), lalu tekan <strong>Ctrl + V</strong> di sel target. Seluruh kolom dan angka promo langsung rapi terpetakan.
          </div>
        </div>
      )}

      {/* STRATEGIC SUMMARY BADGES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '6px' }}>
            <CalendarDays size={16} color="var(--primary)" />
            <span>Total Promo Q4 Terjadwal</span>
          </div>
          <h2 className="stat-value" style={{ fontSize: '1.5rem', margin: 0 }}>{promoList.length} Item Promo</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Oktober, November, Desember</p>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '6px' }}>
            <Flame size={16} color="#f97316" />
            <span>Hero SKU Pilihan</span>
          </div>
          <h2 className="stat-value" style={{ fontSize: '1.5rem', margin: 0, color: '#f97316' }}>Top 5 Skincare</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Acne Wash, Retinol, Paket Lengkap</p>
        </div>

        <div className="stat-card" style={{ padding: '16px', backgroundColor: 'var(--success-light)', borderColor: 'var(--success-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.8125rem', marginBottom: '6px' }}>
            <ShieldCheck size={16} />
            <span>Proteksi Bottom Price</span>
          </div>
          <h2 className="stat-value" style={{ fontSize: '1.5rem', margin: 0, color: 'var(--success)' }}>100% AMAN</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--success)', margin: '4px 0 0' }}>Seluruh harga &gt; -3% dari Harga OB</p>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '6px' }}>
            <Gift size={16} color="#8b5cf6" />
            <span>Freebies &amp; GWP</span>
          </div>
          <h2 className="stat-value" style={{ fontSize: '1.5rem', margin: 0, color: '#8b5cf6' }}>Pouch &amp; Brush</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Freebie bundling Paket Lengkap</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card-flat no-print" style={{ padding: '14px 20px', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
          <Filter size={16} /> Filter Plan
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--surface-border)' }}></div>

        {/* Filter Bulan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={15} color="var(--text-muted)" />
          <select 
            value={filterBulan} 
            onChange={(e) => setFilterBulan(e.target.value)}
            className="filter-select"
            style={{ minWidth: '130px' }}
          >
            <option value="ALL">Semua Bulan (Q4)</option>
            <option value="Oktober">Oktober 2026</option>
            <option value="November">November 2026</option>
            <option value="Desember">Desember 2026</option>
          </select>
        </div>

        {/* Filter Marketplace */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={15} color="var(--text-muted)" />
          <select 
            value={filterPlatform} 
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="filter-select"
            style={{ minWidth: '140px' }}
          >
            <option value="ALL">Semua Platform</option>
            <option value="Shopee">Shopee</option>
            <option value="TikTok Shop">TikTok Shop</option>
          </select>
        </div>

        {/* Filter Kategori */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={15} color="var(--text-muted)" />
          <select 
            value={filterKategori} 
            onChange={(e) => setFilterKategori(e.target.value)}
            className="filter-select"
            style={{ minWidth: '140px' }}
          >
            <option value="ALL">Semua Tipe Promo</option>
            <option value="Flash Sale">Flash Sale</option>
            <option value="Campaign">Campaign &amp; Payday</option>
            <option value="Live Stream">Live Stream</option>
          </select>
        </div>

        <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Menampilkan <strong>{filteredList.length}</strong> promo
        </span>
      </div>

      {/* INTERACTIVE TABLE */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-subtle, rgba(0,0,0,0.01))' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Matriks Rekomendasi Promo &amp; Harga Coret Q4
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Format kolom sama persis dengan Master Excel Sheet. Klik tombol <strong>&quot;1-Click Copy&quot;</strong> di atas untuk menyalin.
            </p>
          </div>
          <button 
            onClick={handleCopyToGoogleSheet} 
            className="btn-outline" 
            style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />} Salin Tabel
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-border)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <th style={{ padding: '10px 14px' }}>Bulan</th>
                <th style={{ padding: '10px 14px' }}>Platform</th>
                <th style={{ padding: '10px 14px' }}>Event / Periode</th>
                <th style={{ padding: '10px 14px' }}>Tanggal</th>
                <th style={{ padding: '10px 14px' }}>Kode SKU</th>
                <th style={{ padding: '10px 14px' }}>Nama Produk</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Harga Normal</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Diskon %</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Harga Promo</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Bottom Price</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Margin Safety</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', width: '60px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => {
                const marginSafety = item.hargaPromo - item.bottomPrice
                const isSafe = marginSafety >= 0

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{item.bulan}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: item.marketplace === 'Shopee' ? '#fff1ee' : '#f1f5f9',
                        color: item.marketplace === 'Shopee' ? '#ee4d2d' : '#0f172a',
                        border: `1px solid ${item.marketplace === 'Shopee' ? '#fed7aa' : '#cbd5e1'}`
                      }}>
                        {item.marketplace}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.periode}</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.subKategori}</span>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {item.tanggal}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {item.sku}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 500 }}>
                      {item.namaProduk}
                      {item.notes && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--primary)', marginTop: '2px' }}>
                          💡 {item.notes}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      Rp {item.hargaNormal.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#f97316' }}>
                      {item.diskonPercent}%
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                      Rp {item.hargaPromo.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>
                      Rp {item.bottomPrice.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {isSafe ? (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          fontSize: '0.7rem', 
                          fontWeight: 700,
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          backgroundColor: '#ecfdf5', 
                          color: '#059669', 
                          border: '1px solid #a7f3d0' 
                        }}>
                          <ShieldCheck size={12} /> AMAN (+Rp {marginSafety.toLocaleString('id-ID')})
                        </span>
                      ) : (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          fontSize: '0.7rem', 
                          fontWeight: 700,
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          backgroundColor: '#fef2f2', 
                          color: '#dc2626', 
                          border: '1px solid #fecaca' 
                        }}>
                          <AlertTriangle size={12} /> BAHAYA (-Rp {Math.abs(marginSafety).toLocaleString('id-ID')})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        title="Hapus baris promo ini"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error, #ef4444)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH PROMO CUSTOM */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '520px', padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Tambah Item Promo ke Plan</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Sesuaikan promo SKU untuk dimasukkan ke jadwal kalender.
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomPromo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Bulan</label>
                  <select 
                    className="input"
                    value={newPromo.bulan}
                    onChange={e => setNewPromo({ ...newPromo, bulan: e.target.value as any })}
                    required
                  >
                    <option value="Oktober">Oktober 2026</option>
                    <option value="November">November 2026</option>
                    <option value="Desember">Desember 2026</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Marketplace</label>
                  <select 
                    className="input"
                    value={newPromo.marketplace}
                    onChange={e => setNewPromo({ ...newPromo, marketplace: e.target.value as any })}
                    required
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="TikTok Shop">TikTok Shop</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Periode / Event</label>
                  <input 
                    type="text"
                    className="input"
                    value={newPromo.periode}
                    placeholder="Contoh: Twindate 10.10"
                    onChange={e => setNewPromo({ ...newPromo, periode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Tanggal Pelaksanaan</label>
                  <input 
                    type="text"
                    className="input"
                    value={newPromo.tanggal}
                    placeholder="Contoh: 10 Okt 2026"
                    onChange={e => setNewPromo({ ...newPromo, tanggal: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Kode SKU &amp; Nama Produk</label>
                <input 
                  type="text"
                  className="input"
                  value={newPromo.namaProduk}
                  placeholder="Contoh: Advanced Acne Facial Wash 100ml"
                  onChange={e => setNewPromo({ ...newPromo, namaProduk: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Harga Normal (Rp)</label>
                  <input 
                    type="number"
                    className="input"
                    value={newPromo.hargaNormal}
                    onChange={e => {
                      const hn = Number(e.target.value) || 0
                      const dp = Number(newPromo.diskonPercent) || 0
                      const hp = Math.round(hn * (1 - dp / 100))
                      setNewPromo({ ...newPromo, hargaNormal: hn, hargaPromo: hp })
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Diskon %</label>
                  <input 
                    type="number"
                    className="input"
                    value={newPromo.diskonPercent}
                    onChange={e => {
                      const dp = Number(e.target.value) || 0
                      const hn = Number(newPromo.hargaNormal) || 0
                      const hp = Math.round(hn * (1 - dp / 100))
                      setNewPromo({ ...newPromo, diskonPercent: dp, hargaPromo: hp })
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Harga Promo (Rp)</label>
                  <input 
                    type="number"
                    className="input"
                    value={newPromo.hargaPromo}
                    onChange={e => setNewPromo({ ...newPromo, hargaPromo: Number(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Bottom Price (Rp)</label>
                  <input 
                    type="number"
                    className="input"
                    value={newPromo.bottomPrice}
                    placeholder="Batas minimal Finance"
                    onChange={e => setNewPromo({ ...newPromo, bottomPrice: Number(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              {Number(newPromo.hargaPromo) < Number(newPromo.bottomPrice) && (
                <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} />
                  <span><strong>Peringatan Finance:</strong> Harga promo di bawah batas Bottom Price!</span>
                </div>
              )}

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
                  Tambahkan ke Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
