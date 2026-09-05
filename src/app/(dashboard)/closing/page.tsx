'use client'

import { useState, useRef } from 'react'
import { 
  Calculator, 
  UploadCloud, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  X,
  Layers,
  ChevronRight,
  Info,
  ShieldCheck,
  Eye,
  FileCheck2
} from 'lucide-react'
import * as xlsx from 'xlsx'
import Papa from 'papaparse'
import {
  ClosingRuleType,
  ClosingPeriodType,
  RawOrderTransaction,
  ClosingGroupAudit,
  processClosingTransactions,
  calculateClosingGroup,
  getClosingPeriod,
  getClosingPeriodLabel,
  isOrderCancelled,
  normalizeDiscount
} from '@/lib/closing-engine'

export default function ClosingPage() {
  const [closingGroups, setClosingGroups] = useState<ClosingGroupAudit[]>([])
  const [selectedBulan, setSelectedBulan] = useState('September')
  const [selectedPlatform, setSelectedPlatform] = useState('ALL')
  const [selectedPeriode, setSelectedPeriode] = useState<'ALL' | ClosingPeriodType>('ALL')
  const [copied, setCopied] = useState(false)
  const [copiedAudit, setCopiedAudit] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeAuditModal, setActiveAuditModal] = useState<ClosingGroupAudit | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    bulan: 'September',
    period: 'PERIOD_1' as ClosingPeriodType,
    platform: 'Shopee',
    kodePromosi: 'Voucher Toko',
    namaPromosi: 'Voucher Toko 5K',
    sku: 'FPK00000033',
    price: 215000,
    discountAmount: 5000,
    totalOrders: 100,
    cancelledOrders: 10
  })

  // Format IDR
  const fmt = (val: number) => `Rp ${val.toLocaleString('id-ID')}`

  // Filter rows based on dropdowns
  const filteredGroups = closingGroups.filter(g => {
    const matchBulan = selectedBulan === 'ALL' || g.month.toLowerCase() === selectedBulan.toLowerCase()
    const matchPlatform = selectedPlatform === 'ALL' || g.marketplace.toLowerCase().includes(selectedPlatform.toLowerCase())
    const matchPeriode = selectedPeriode === 'ALL' || g.closingPeriod === selectedPeriode
    return matchBulan && matchPlatform && matchPeriode
  })

  // Summary statistics
  const totalBiayaPromo = filteredGroups.reduce((sum, g) => sum + g.totalBiayaPromo, 0)
  const totalClosingQty = filteredGroups.reduce((sum, g) => sum + g.finalClosingQty, 0)
  const totalValidOrders = filteredGroups.reduce((sum, g) => sum + g.validOrders, 0)
  const totalCancelledOrders = filteredGroups.reduce((sum, g) => sum + g.cancelledOrders, 0)
  const totalRawOrders = totalValidOrders + totalCancelledOrders

  // 1-Click Copy standard format for Master Excel Closing FA 2 (Ctrl + V direct to Google Sheet)
  const handleCopyStandardGoogleSheet = () => {
    const header = [
      'Bulan',
      'Platform',
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

    const tsvData = filteredGroups.map(g => [
      g.month,
      g.marketplace,
      g.promotionCategory,
      g.promotionName,
      g.sku,
      g.price > 0 ? g.price : '',
      g.discountPercent > 0 ? `${g.discountPercent}%` : '',
      g.discountAmount > 0 ? g.discountAmount : '',
      g.priceAfterDiscount > 0 ? g.priceAfterDiscount : '',
      g.finalClosingQty,
      g.totalBiayaPromo
    ].join('\t')).join('\n')

    const fullContent = `${header}\n${tsvData}`
    navigator.clipboard.writeText(fullContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // 1-Click Copy Full Audit Breakdown (for Finance audit trail)
  const handleCopyAuditGoogleSheet = () => {
    const header = [
      'Bulan',
      'Periode',
      'Platform',
      'Kategori Promosi',
      'Nama Promosi',
      'Kode SKU',
      'Diskon Satuan',
      'Total Orders',
      'Pesanan Batal',
      'Pesanan Valid',
      'Rule Applied',
      'Formula Perhitungan',
      'Final QTY Closing',
      'Total Biaya Promo'
    ].join('\t')

    const tsvData = filteredGroups.map(g => [
      g.month,
      g.periodLabel,
      g.marketplace,
      g.promotionCategory,
      g.promotionName,
      g.sku,
      g.discountAmount,
      g.totalOrders,
      g.cancelledOrders,
      g.validOrders,
      g.appliedRule,
      g.formulaDescription,
      g.finalClosingQty,
      g.totalBiayaPromo
    ].join('\t')).join('\n')

    const fullContent = `${header}\n${tsvData}`
    navigator.clipboard.writeText(fullContent)
    setCopiedAudit(true)
    setTimeout(() => setCopiedAudit(false), 3000)
  }

  // Handle Upload Raw Order Excel / CSV via Calculation Engine
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      let rawData: any[] = []

      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
        rawData = parsed.data
      } else {
        const buffer = await file.arrayBuffer()
        const workbook = xlsx.read(buffer)
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        rawData = xlsx.utils.sheet_to_json(sheet)
      }

      // Convert raw rows into RawOrderTransaction objects
      const transactions: RawOrderTransaction[] = rawData.map((row: any, idx: number) => {
        const dateRaw = row['Waktu Pesanan Dibuat'] || row['Waktu Pembayaran Dilakukan'] || row['Created Time'] || row['Tanggal'] || new Date().toISOString()
        const status = (
          row['Status Pesanan'] || 
          row['Order Status'] || 
          row['Status'] || 
          'Selesai'
        ).toString()

        const orderNumber = row['No. Pesanan'] || row['Order ID'] || row['Order SN'] || `ORD-${idx + 1}`
        const sku = row['Nomor Referensi SKU'] || row['Seller SKU'] || row['SKU'] || row['Nama Produk'] || 'SKU-Umum'
        const promoName = row['Nama Promosi'] || row['Voucher Ditanggung Penjual'] || row['Paket Diskon'] || row['Flash Sale'] || 'Diskon Reguler'
        const hargaAwal = parseFloat(row['Harga Awal'] || row['Original Price'] || row['Harga'] || '0') || 0
        const totalDiskon = parseFloat(row['Total Diskon'] || row['Diskon Promosi'] || row['Potongan Penjual'] || row['Diskon'] || '5000') || 5000
        const qty = parseInt(row['Jumlah'] || row['Quantity'] || '1') || 1
        const period = getClosingPeriod(dateRaw)

        let promoCategory = 'Voucher Toko'
        const promoLow = promoName.toLowerCase()
        if (promoLow.includes('flash sale')) promoCategory = 'Promo Flash Sale'
        else if (promoLow.includes('paket') || promoLow.includes('combo')) promoCategory = 'Paket Diskon'
        else if (promoLow.includes('membership') || promoLow.includes('member')) promoCategory = 'Voucher Brand Membership'
        else if (promoLow.includes('digital') || promoLow.includes('karyawan') || promoLow.includes('blurry')) promoCategory = 'Voucher Digital Marketing'

        return {
          id: `tx-${idx}-${orderNumber}`,
          orderNumber,
          date: dateRaw,
          month: selectedBulan,
          period,
          marketplace: selectedPlatform !== 'ALL' ? selectedPlatform : 'Shopee',
          promotionCategory: promoCategory,
          promotionName: promoName,
          sku,
          price: hargaAwal,
          discountAmount: totalDiskon,
          quantity: qty,
          orderStatus: status,
          customerUsername: row['Username (Pembeli)'] || row['Customer'] || ''
        }
      })

      // Run through Closing Calculation Engine
      const result = processClosingTransactions(transactions)
      setClosingGroups(result.groups)

    } catch (err) {
      console.error('Failed to parse order file:', err)
      alert('Format file belum sesuai. Pastikan upload file order export dari Shopee atau TikTok ya!')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle Manual Row Submission with Engine Calculation
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const { totalOrders, cancelledOrders, price, discountAmount, bulan, period, platform, kodePromosi, namaPromosi, sku } = manualForm
    const validOrders = Math.max(0, totalOrders - cancelledOrders)

    // Generate mock transactions for audit traceability
    const txs: RawOrderTransaction[] = [
      ...Array.from({ length: validOrders }).map((_, i) => ({
        id: `manual-v-${Date.now()}-${i}`,
        orderNumber: `ORD-M-V-${i + 1}`,
        date: period === 'PERIOD_1' ? `${bulan}-05` : `${bulan}-20`,
        month: bulan,
        period,
        marketplace: platform,
        promotionCategory: kodePromosi,
        promotionName: namaPromosi,
        sku,
        price,
        discountAmount,
        quantity: 1,
        orderStatus: 'Selesai'
      })),
      ...Array.from({ length: cancelledOrders }).map((_, i) => ({
        id: `manual-c-${Date.now()}-${i}`,
        orderNumber: `ORD-M-C-${i + 1}`,
        date: period === 'PERIOD_1' ? `${bulan}-06` : `${bulan}-21`,
        month: bulan,
        period,
        marketplace: platform,
        promotionCategory: kodePromosi,
        promotionName: namaPromosi,
        sku,
        price,
        discountAmount,
        quantity: 1,
        orderStatus: 'Dibatalkan'
      }))
    ]

    const groupResult = calculateClosingGroup(txs)
    setClosingGroups([groupResult, ...closingGroups])
    setShowManualModal(false)
  }

  const handleDeleteGroup = (groupId: string) => {
    setClosingGroups(closingGroups.filter(g => g.groupId !== groupId))
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Rekap Closing Promo & Diskon</h1>
            <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#DBEAFE', fontWeight: 600 }}>
              Engine: DIVIDE_VALID_ORDERS_BY_2
            </span>
          </div>
          <p className="page-subtitle">
            Urutan hitung resmi Finance: Total Pesanan ➔ Keluarkan Batal ➔ Dapatkan Pesanan Valid ➔ Cek Diskon Sama di Periode Sama ➔ (Valid ÷ 2) ➔ QTY Closing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx,.xls,.csv" 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={isProcessing}
          >
            <UploadCloud size={16} />
            {isProcessing ? 'Memproses Order...' : 'Upload Pesanan Shopee/TikTok'}
          </button>

          {/* Copy Standard for Master Excel */}
          <button 
            onClick={handleCopyStandardGoogleSheet} 
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: copied ? 'var(--success)' : 'var(--primary)' }}
            disabled={filteredGroups.length === 0}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Tercopy! Tinggal Ctrl+V di Sheet' : 'Copy ke Google Sheet'}
          </button>

          {/* Copy Full Audit */}
          <button 
            onClick={handleCopyAuditGoogleSheet} 
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={filteredGroups.length === 0}
            title="Salin lengkap dengan kolom audit Total Order, Batal, Valid, dan Rumus"
          >
            {copiedAudit ? <Check size={16} color="var(--success)" /> : <FileCheck2 size={16} />}
            {copiedAudit ? 'Tercopy Format Audit' : 'Copy Format Audit'}
          </button>
        </div>
      </div>

      {/* FILTER & PERIOD BAR */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Bulan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Bulan:</span>
            <select 
              value={selectedBulan} 
              onChange={e => setSelectedBulan(e.target.value)} 
              className="filter-select"
            >
              <option value="September">September</option>
              <option value="Oktober">Oktober</option>
              <option value="Agustus">Agustus</option>
              <option value="ALL">Semua Bulan</option>
            </select>
          </div>

          {/* Periode Closing: Period 1 (1-15) vs Period 2 (16-30/31) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Periode:</span>
            <select 
              value={selectedPeriode} 
              onChange={e => setSelectedPeriode(e.target.value as any)} 
              className="filter-select"
            >
              <option value="ALL">Semua Periode</option>
              <option value="PERIOD_1">Periode 1 (Tgl 1 – 15)</option>
              <option value="PERIOD_2">Periode 2 (Tgl 16 – 30/31)</option>
            </select>
          </div>

          {/* Platform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Platform:</span>
            <select 
              value={selectedPlatform} 
              onChange={e => setSelectedPlatform(e.target.value)} 
              className="filter-select"
            >
              <option value="ALL">Semua Platform</option>
              <option value="Shopee">Shopee</option>
              <option value="TikTok">TikTok Shop</option>
              <option value="Lazada">Lazada</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {closingGroups.length > 0 && (
            <button 
              onClick={() => {
                if (confirm('Yakin mau kosongkan semua data closing?')) {
                  setClosingGroups([])
                }
              }}
              className="btn-outline" 
              style={{ fontSize: '0.8125rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
            >
              <Trash2 size={14} /> Kosongkan Tabel
            </button>
          )}
          <button 
            onClick={() => setShowManualModal(true)}
            className="btn-outline" 
            style={{ fontSize: '0.8125rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Input Data Closing Manual
          </button>
        </div>
      </div>

      {/* SUMMARY KPI CARDS (FINANCE TRANSPARENCY) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Total Biaya Diskon */}
        <div className="stat-card">
          <div className="stat-label">Total Biaya Promo Toko</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(totalBiayaPromo)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hasil perkalian: QTY Closing × Diskon
          </div>
        </div>

        {/* Final Closing QTY */}
        <div className="stat-card">
          <div className="stat-label">Total QTY Closing</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{totalClosingQty.toLocaleString()} pcs</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Setelah pembagian rule: Valid ÷ 2
          </div>
        </div>

        {/* Valid Orders vs Cancelled */}
        <div className="stat-card">
          <div className="stat-label">Pesanan Valid Terhitung</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{totalValidOrders.toLocaleString()} orders</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Dasar hitungan sebelum dibagi 2
          </div>
        </div>

        {/* Pesanan Batal (Excluded) */}
        <div className="stat-card" style={{ backgroundColor: '#FFF5F5', borderColor: '#FED7D7' }}>
          <div className="stat-label" style={{ color: 'var(--danger)' }}>Pesanan Batal (Dikeluarkan)</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{totalCancelledOrders.toLocaleString()} orders</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            COUNT = 0 (Tidak masuk QTY closing)
          </div>
        </div>
      </div>

      {/* FINANCE TRANSPARENCY BANNER */}
      <div className="info-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <p className="info-banner-text" style={{ margin: 0 }}>
            <strong>Transparansi Audit Finance:</strong> Angka QTY Closing diperoleh dari rumus resmi: <code style={{ backgroundColor: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>(Total Orders - Cancelled) ÷ 2</code> jika diskon sama dalam periode yang sama. Klik tombol mata <Eye size={13} style={{ display: 'inline' }} /> atau angka QTY untuk melihat rincian transaksi per baris.
          </p>
        </div>
      </div>

      {/* TABLE WITH AUDIT COLUMNS */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={16} color="var(--primary)" />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Daftar Rincian Closing ({selectedBulan} - {selectedPlatform} - {selectedPeriode === 'ALL' ? 'Semua Periode' : selectedPeriode})
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Menampilkan {filteredGroups.length} grup closing
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '90px' }}>Periode</th>
                <th style={{ minWidth: '80px' }}>Platform</th>
                <th style={{ minWidth: '130px' }}>Kategori</th>
                <th style={{ minWidth: '200px' }}>Nama Promosi</th>
                <th style={{ minWidth: '130px' }}>Kode SKU</th>
                <th style={{ textAlign: 'right', minWidth: '90px' }}>Diskon</th>
                <th style={{ textAlign: 'center', minWidth: '85px', backgroundColor: '#F8FAFC' }}>Total Orders</th>
                <th style={{ textAlign: 'center', minWidth: '85px', backgroundColor: '#FFF5F5' }}>Batal</th>
                <th style={{ textAlign: 'center', minWidth: '85px', backgroundColor: '#F0FDF4' }}>Valid</th>
                <th style={{ minWidth: '170px' }}>Rule & Formula</th>
                <th style={{ textAlign: 'center', minWidth: '95px', backgroundColor: '#EFF6FF' }}>Final QTY</th>
                <th style={{ textAlign: 'right', minWidth: '110px', backgroundColor: '#F1F5F9' }}>Biaya Promo</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '56px 24px', backgroundColor: 'var(--surface)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '420px', margin: '0 auto', gap: '10px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '4px' }}>
                        <FileSpreadsheet size={24} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Tabel Closing Masih Kosong
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        Data dummy sudah dibersihkan. Silakan <strong>upload file pesanan (.xlsx / .csv)</strong> dari Shopee/TikTok untuk hitung otomatis, atau klik <strong>"Input Data Closing Manual"</strong>.
                      </p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button 
                          onClick={() => fileInputRef.current?.click()} 
                          className="btn-primary" 
                          style={{ fontSize: '0.8125rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <UploadCloud size={14} /> Upload Pesanan
                        </button>
                        <button 
                          onClick={() => setShowManualModal(true)} 
                          className="btn-outline" 
                          style={{ fontSize: '0.8125rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Plus size={14} /> Input Manual
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((g) => (
                  <tr key={g.groupId}>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.7rem' }}>
                        {g.closingPeriod === 'PERIOD_1' ? '1–15' : '16–EOM'} {g.month.slice(0, 3)}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#DBEAFE' }}>
                        {g.marketplace}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{g.promotionCategory}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.promotionName}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{g.sku}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {fmt(g.discountAmount)}
                    </td>
                    
                    {/* Total Orders */}
                    <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', backgroundColor: '#F8FAFC' }}>
                      {g.totalOrders}
                    </td>

                    {/* Cancelled (Red) */}
                    <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: g.cancelledOrders > 0 ? 'var(--danger)' : 'var(--text-muted)', backgroundColor: '#FFF5F5', fontWeight: g.cancelledOrders > 0 ? 600 : 400 }}>
                      {g.cancelledOrders > 0 ? `-${g.cancelledOrders}` : '0'}
                    </td>

                    {/* Valid Orders */}
                    <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: 'var(--success)', backgroundColor: '#F0FDF4', fontWeight: 700 }}>
                      {g.validOrders}
                    </td>

                    {/* Rule & Formula */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>
                          {g.appliedRule}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {g.formulaDescription}
                        </span>
                      </div>
                    </td>

                    {/* Final QTY (Clickable drilldown) */}
                    <td style={{ textAlign: 'center', backgroundColor: '#EFF6FF' }}>
                      <button
                        onClick={() => setActiveAuditModal(g)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '0.9375rem',
                          color: '#2563EB',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px'
                        }}
                        title="Klik untuk melihat bukti transaksi rincian"
                      >
                        {g.finalClosingQty}
                      </button>
                    </td>

                    {/* Biaya Promo */}
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)', fontVariantNumeric: 'tabular-nums', backgroundColor: '#F8FAFC' }}>
                      {fmt(g.totalBiayaPromo)}
                    </td>

                    {/* Audit Icon / Delete */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button 
                          onClick={() => setActiveAuditModal(g)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                          title="Lihat Audit Lengkap"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteGroup(g.groupId)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="Hapus baris ini"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredGroups.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 700, backgroundColor: '#F8FAFC', borderTop: '2px solid var(--surface-border)' }}>
                  <td colSpan={6} style={{ textAlign: 'right', padding: '12px' }}>
                    TOTAL KESELURUHAN CLOSING:
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>{totalRawOrders}</td>
                  <td style={{ textAlign: 'center', padding: '12px', color: 'var(--danger)' }}>-{totalCancelledOrders}</td>
                  <td style={{ textAlign: 'center', padding: '12px', color: 'var(--success)' }}>{totalValidOrders}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aturan: Valid ÷ 2</td>
                  <td style={{ textAlign: 'center', padding: '12px', color: '#2563EB', fontSize: '1rem' }}>
                    {totalClosingQty} pcs
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px', color: 'var(--danger)', fontSize: '0.9375rem' }}>
                    {fmt(totalBiayaPromo)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* FINANCE AUDIT DRILLDOWN MODAL */}
      {activeAuditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--surface-border)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                    Audit Bukti Perhitungan Finance
                  </h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Rincian bagaimana angka QTY <strong>{activeAuditModal.finalClosingQty}</strong> diperoleh berdasarkan aturan validitas pesanan.
                </p>
              </div>
              <button 
                onClick={() => setActiveAuditModal(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Context Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid var(--surface-border)', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Promosi:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeAuditModal.promotionName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>SKU / Produk:</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{activeAuditModal.sku}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Periode:</span>
                <div style={{ fontWeight: 600 }}>{activeAuditModal.periodLabel}</div>
              </div>
            </div>

            {/* Formula Step-by-Step Breakdown */}
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E40AF', marginBottom: '10px' }}>
                Langkah Perhitungan Sesuai Aturan Closing:
              </h4>
              <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', color: '#1E3A8A' }}>
                <li>
                  Total pesanan masuk: <strong>{activeAuditModal.totalOrders} transaksi</strong>
                </li>
                <li>
                  Pesanan batal / cancelled yang dikeluarkan: <strong style={{ color: 'var(--danger)' }}>{activeAuditModal.cancelledOrders} transaksi</strong> (COUNT = 0)
                </li>
                <li>
                  Total pesanan valid yang memenuhi syarat: <strong>{activeAuditModal.totalOrders} - {activeAuditModal.cancelledOrders} = {activeAuditModal.validOrders} pesanan valid</strong>
                </li>
                <li>
                  Aturan bisnis terdeteksi: <strong>Diskon yang sama ({fmt(activeAuditModal.discountAmount)}) dalam periode yang sama ({activeAuditModal.closingPeriod})</strong>
                </li>
                <li>
                  Eksekusi Rule <code>DIVIDE_VALID_ORDERS_BY_2</code>: <strong style={{ color: '#2563EB', fontSize: '0.9375rem' }}>{activeAuditModal.validOrders} ÷ 2 = {activeAuditModal.finalClosingQty} QTY CLOSING</strong>
                </li>
                <li>
                  Total biaya subsidi toko: <strong>{activeAuditModal.finalClosingQty} × {fmt(activeAuditModal.discountAmount)} = {fmt(activeAuditModal.totalBiayaPromo)}</strong>
                </li>
              </ol>
            </div>

            {/* Transactions Table Drilldown */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                Daftar Transaksi Sumber ({activeAuditModal.transactions.length} baris):
              </h4>
              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                <table className="data-table" style={{ width: '100%', fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th>No. Pesanan</th>
                      <th>Tanggal</th>
                      <th>Status Pesanan</th>
                      <th>Diskon</th>
                      <th>Status Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAuditModal.transactions.map((tx) => {
                      const isCancelled = isOrderCancelled(tx.orderStatus)
                      return (
                        <tr key={tx.id} style={{ backgroundColor: isCancelled ? '#FFF5F5' : 'transparent' }}>
                          <td style={{ fontFamily: 'monospace', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                            {tx.orderNumber}
                          </td>
                          <td>{typeof tx.date === 'string' ? tx.date.split('T')[0] : '2026-09'}</td>
                          <td>
                            <span className="badge" style={{ backgroundColor: isCancelled ? '#FEE2E2' : '#DCFCE7', color: isCancelled ? '#991B1B' : '#166534' }}>
                              {tx.orderStatus}
                            </span>
                          </td>
                          <td>{fmt(tx.discountAmount)}</td>
                          <td>
                            {isCancelled ? (
                              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Dikeluarkan (0)</span>
                            ) : (
                              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Valid (Hitung)</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setActiveAuditModal(null)} className="btn-primary">
                Tutup Rincian Audit
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MANUAL INPUT MODAL WITH ENGINE RULE */}
      {showManualModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '520px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Input Data Closing Manual</h3>
              <button onClick={() => setShowManualModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Masukkan angka Total Pesanan & Pesanan Batal. Sistem secara otomatis menerapkan aturan <code style={{ backgroundColor: '#F1F5F9', padding: '2px 4px' }}>(Total - Batal) ÷ 2</code> untuk menghitung QTY Closing.
            </p>

            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Bulan</label>
                  <select 
                    value={manualForm.bulan} 
                    onChange={e => setManualForm({ ...manualForm, bulan: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%' }}
                  >
                    <option value="September">September</option>
                    <option value="Oktober">Oktober</option>
                    <option value="Agustus">Agustus</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Periode Closing</label>
                  <select 
                    value={manualForm.period} 
                    onChange={e => setManualForm({ ...manualForm, period: e.target.value as any })}
                    className="filter-select" 
                    style={{ width: '100%' }}
                  >
                    <option value="PERIOD_1">Periode 1 (1–15)</option>
                    <option value="PERIOD_2">Periode 2 (16–30/31)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Platform</label>
                  <select 
                    value={manualForm.platform} 
                    onChange={e => setManualForm({ ...manualForm, platform: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%' }}
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="TikTok Shop">TikTok Shop</option>
                    <option value="Lazada">Lazada</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Kategori Promosi</label>
                  <select 
                    value={manualForm.kodePromosi} 
                    onChange={e => setManualForm({ ...manualForm, kodePromosi: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%' }}
                  >
                    <option value="Voucher Toko">Voucher Toko</option>
                    <option value="Promo Flash Sale">Promo Flash Sale</option>
                    <option value="Paket Diskon">Paket Diskon</option>
                    <option value="Voucher Brand Membership">Voucher Brand Membership</option>
                    <option value="Voucher Digital Marketing">Voucher Digital Marketing</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Nama Promosi</label>
                <input 
                  type="text" 
                  value={manualForm.namaPromosi} 
                  onChange={e => setManualForm({ ...manualForm, namaPromosi: e.target.value })}
                  className="filter-select" 
                  style={{ width: '100%' }}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>SKU / Paket</label>
                  <input 
                    type="text" 
                    value={manualForm.sku} 
                    onChange={e => setManualForm({ ...manualForm, sku: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Nilai Diskon (Rp)</label>
                  <input 
                    type="number" 
                    value={manualForm.discountAmount} 
                    onChange={e => setManualForm({ ...manualForm, discountAmount: parseFloat(e.target.value) || 0 })}
                    className="filter-select" 
                    style={{ width: '100%' }}
                    required 
                  />
                </div>
              </div>

              {/* Order Numbers Input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Total Pesanan (Orders)</label>
                  <input 
                    type="number" 
                    value={manualForm.totalOrders} 
                    onChange={e => setManualForm({ ...manualForm, totalOrders: parseInt(e.target.value) || 0 })}
                    className="filter-select" 
                    style={{ width: '100%' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: 'var(--danger)' }}>Pesanan Batal</label>
                  <input 
                    type="number" 
                    value={manualForm.cancelledOrders} 
                    onChange={e => setManualForm({ ...manualForm, cancelledOrders: parseInt(e.target.value) || 0 })}
                    className="filter-select" 
                    style={{ width: '100%', borderColor: '#FED7D7' }}
                    required 
                  />
                </div>
              </div>

              {/* Preview calculation */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '6px 8px', backgroundColor: '#EFF6FF', borderRadius: '6px' }}>
                Preview: ({manualForm.totalOrders} total - {manualForm.cancelledOrders} batal) = {Math.max(0, manualForm.totalOrders - manualForm.cancelledOrders)} valid ➔ <strong>QTY Closing: {Math.max(0, manualForm.totalOrders - manualForm.cancelledOrders) / 2} pcs</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowManualModal(false)} className="btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Hitung & Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
