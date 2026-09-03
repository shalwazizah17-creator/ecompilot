'use client'

import { useState, useRef } from 'react'
import { 
  Calculator, 
  UploadCloud, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  Trash2, 
  Filter, 
  Calendar, 
  Store, 
  ArrowDownToLine, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react'
import * as xlsx from 'xlsx'
import Papa from 'papaparse'

interface ClosingRow {
  id: string
  bulan: string
  platform: string
  kodePromosi: string
  namaPromosi: string
  kodeSku: string
  harga: number
  diskonPersen: number
  totalDiskon: number
  hargaSetelahDiskon: number
  quantity: number
  biaya: number
}

// Mulai dengan tabel kosong (tanpa data dummy)
const INITIAL_ROWS: ClosingRow[] = []

export default function ClosingPage() {
  const [rows, setRows] = useState<ClosingRow[]>(INITIAL_ROWS)
  const [selectedBulan, setSelectedBulan] = useState('September')
  const [selectedPlatform, setSelectedPlatform] = useState('Shopee')
  const [selectedPeriode, setSelectedPeriode] = useState('16-30/31')
  const [copied, setCopied] = useState(false)
  const [skippedCancelled, setSkippedCancelled] = useState(0)
  const [processedOrders, setProcessedOrders] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Format IDR
  const fmt = (val: number) => `Rp ${val.toLocaleString('id-ID')}`

  // Filter rows based on dropdown
  const filteredRows = rows.filter(r => {
    const matchBulan = selectedBulan === 'ALL' || r.bulan === selectedBulan
    const matchPlatform = selectedPlatform === 'ALL' || r.platform.toLowerCase().includes(selectedPlatform.toLowerCase())
    return matchBulan && matchPlatform
  })

  // Total summary calculations
  const totalBiaya = filteredRows.reduce((sum, r) => sum + r.biaya, 0)
  const totalQuantity = filteredRows.reduce((sum, r) => sum + r.quantity, 0)
  const totalVoucherToko = filteredRows.filter(r => r.kodePromosi.toLowerCase().includes('voucher')).reduce((sum, r) => sum + r.biaya, 0)
  const totalFlashSale = filteredRows.filter(r => r.kodePromosi.toLowerCase().includes('flash sale')).reduce((sum, r) => sum + r.biaya, 0)

  // 1-Click Copy to Clipboard (TSV format so it pastes directly into Google Sheet cells!)
  const handleCopyGoogleSheet = () => {
    // Header + Rows in TSV
    const header = ['Bulan', 'Platform', 'Kode Promosi', 'Nama Promosi', 'Kode SKU', 'Harga', 'Diskon', 'Total Diskon', 'Harga Setelah Diskon', 'Quantity', 'Biaya'].join('\t')
    const tsvData = filteredRows.map(r => [
      r.bulan,
      r.platform,
      r.kodePromosi,
      r.namaPromosi,
      r.kodeSku,
      r.harga > 0 ? r.harga : '',
      r.diskonPersen > 0 ? `${r.diskonPersen}%` : '',
      r.totalDiskon > 0 ? r.totalDiskon : '',
      r.hargaSetelahDiskon > 0 ? r.hargaSetelahDiskon : '',
      r.quantity,
      r.biaya
    ].join('\t')).join('\n')

    const fullContent = `${header}\n${tsvData}`
    navigator.clipboard.writeText(fullContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Handle Upload Raw Order Excel / CSV
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

      // Filter logic: Exclude "Batal", "Dibatalkan", "Cancelled", "Retur"
      let cancelledCount = 0
      let validCount = 0
      const promoMap = new Map<string, ClosingRow>()

      rawData.forEach((order: any, idx: number) => {
        // Find status column
        const status = (
          order['Status Pesanan'] || 
          order['Order Status'] || 
          order['Status'] || 
          ''
        ).toString().toLowerCase()

        if (status.includes('batal') || status.includes('cancel') || status.includes('retur') || status.includes('refund')) {
          cancelledCount++
          return
        }

        validCount++

        // Extract promo info
        const sku = order['Nomor Referensi SKU'] || order['Seller SKU'] || order['SKU'] || order['Nama Produk'] || 'SKU-Umum'
        const namaPromo = order['Nama Promosi'] || order['Voucher Ditanggung Penjual'] || order['Paket Diskon'] || order['Flash Sale'] || 'Diskon Reguler'
        const hargaAwal = parseFloat(order['Harga Awal'] || order['Original Price'] || '0') || 0
        const totalDiskon = parseFloat(order['Total Diskon'] || order['Diskon Promosi'] || order['Potongan Penjual'] || '5000') || 5000
        const qty = parseInt(order['Jumlah'] || order['Quantity'] || '1') || 1

        const key = `${namaPromo}_${sku}`
        if (promoMap.has(key)) {
          const existing = promoMap.get(key)!
          existing.quantity += qty
          existing.biaya = existing.totalDiskon * existing.quantity
        } else {
          promoMap.set(key, {
            id: `upload-${idx}`,
            bulan: selectedBulan,
            platform: selectedPlatform,
            kodePromosi: namaPromo.toLowerCase().includes('voucher') ? 'Voucher Toko' : namaPromo.toLowerCase().includes('paket') ? 'Paket Diskon' : 'Promo Flash Sale',
            namaPromosi: namaPromo,
            kodeSku: sku,
            harga: hargaAwal,
            diskonPersen: hargaAwal > 0 ? Math.round((totalDiskon / hargaAwal) * 100) : 0,
            totalDiskon: totalDiskon,
            hargaSetelahDiskon: Math.max(0, hargaAwal - totalDiskon),
            quantity: qty,
            biaya: totalDiskon * qty
          })
        }
      })

      if (promoMap.size > 0) {
        setRows(Array.from(promoMap.values()))
      }
      setSkippedCancelled(cancelledCount)
      setProcessedOrders(validCount)
    } catch (err) {
      console.error('Failed to parse order file:', err)
      alert('Format file belum sesuai. Pastikan upload file order export dari Shopee atau TikTok ya.')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Add row manual
  const handleAddRow = () => {
    const newRow: ClosingRow = {
      id: Date.now().toString(),
      bulan: selectedBulan,
      platform: selectedPlatform,
      kodePromosi: 'Voucher Toko',
      namaPromosi: 'Voucher Baru (Input Manual)',
      kodeSku: 'All SKU',
      harga: 100000,
      diskonPersen: 5,
      totalDiskon: 5000,
      hargaSetelahDiskon: 95000,
      quantity: 1,
      biaya: 5000
    }
    setRows([newRow, ...rows])
  }

  // Delete row
  const handleDeleteRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id))
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Rekap Closing Promo & Diskon</h1>
            <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Jalur Ninja (Stealth) 🥷
            </span>
          </div>
          <p className="page-subtitle">
            Otomatis hitung pesanan terkirim (tanpa pesanan batal/retur), hitung biaya diskon per voucher & SKU, siap copy-paste ke Master Excel kantor.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Upload Pesanan File */}
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

          {/* Copy to Google Sheet */}
          <button 
            onClick={handleCopyGoogleSheet} 
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: copied ? 'var(--success)' : 'var(--primary)' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Tercopy! Tinggal Ctrl+V di Sheet' : 'Copy ke Google Sheet'}
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

          {/* Periode Closing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Periode:</span>
            <select 
              value={selectedPeriode} 
              onChange={e => setSelectedPeriode(e.target.value)} 
              className="filter-select"
            >
              <option value="1-15">Periode 1 (Tgl 1 - 15)</option>
              <option value="16-30/31">Periode 2 (Tgl 16 - 30/31)</option>
              <option value="ALL">Full Month (1 - Akhir)</option>
            </select>
          </div>

          {/* Platform / Cabang Tab */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Platform:</span>
            <select 
              value={selectedPlatform} 
              onChange={e => setSelectedPlatform(e.target.value)} 
              className="filter-select"
            >
              <option value="Shopee">Shopee Pusat</option>
              <option value="Shopee_Surabaya">Shopee Surabaya</option>
              <option value="Shopee_Bali">Shopee Bali</option>
              <option value="Shopee_Semarang">Shopee Semarang</option>
              <option value="Shopee_Palembang">Shopee Palembang</option>
              <option value="TikTok">TikTok Shop</option>
              <option value="Lazada">Lazada</option>
              <option value="ALL">Semua Platform</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {rows.length > 0 && (
            <button 
              onClick={() => {
                if (confirm('Yakin mau kosongkan semua data closing?')) {
                  setRows([])
                  setProcessedOrders(0)
                  setSkippedCancelled(0)
                }
              }}
              className="btn-outline" 
              style={{ fontSize: '0.8125rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
            >
              <Trash2 size={14} /> Kosongkan Data
            </button>
          )}
          <button 
            onClick={handleAddRow}
            className="btn-outline" 
            style={{ fontSize: '0.8125rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Tambah Baris Manual
          </button>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Total Biaya Diskon */}
        <div className="stat-card">
          <div className="stat-label">Total Biaya Promo Toko</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(totalBiaya)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Subsidi diskon & voucher yang ditanggung toko
          </div>
        </div>

        {/* Total Qty Terjual */}
        <div className="stat-card">
          <div className="stat-label">Total Qty Promo Terjual</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{totalQuantity.toLocaleString()} pcs</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Dari total {filteredRows.length} item promo aktif
          </div>
        </div>

        {/* Breakdown Voucher vs Flash Sale */}
        <div className="stat-card">
          <div className="stat-label">Porsi Biaya Promo</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            Voucher: <span style={{ color: 'var(--warning)' }}>{fmt(totalVoucherToko)}</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            Flash Sale: <span style={{ color: 'var(--success)' }}>{fmt(totalFlashSale)}</span>
          </div>
        </div>

        {/* Filter Pesanan Status Info */}
        <div className="stat-card" style={{ backgroundColor: '#F8FAFC' }}>
          <div className="stat-label">Filter Pesanan Valid</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <CheckCircle2 size={16} color="var(--success)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {processedOrders} pesanan sukses
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <AlertCircle size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {skippedCancelled} pesanan batal/retur di-skip
            </span>
          </div>
        </div>
      </div>

      {/* INSTRUCTION BANNER */}
      <div className="info-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileSpreadsheet size={18} className="info-banner-icon" />
          <p className="info-banner-text" style={{ margin: 0 }}>
            <strong>Alur Ninja:</strong> Upload file pesanan dari Shopee/TikTok ➔ Cek baris promo & diskon ➔ Klik <strong>"Copy ke Google Sheet"</strong> ➔ Buka tab closingan di Sheet kantor lo dan tekan <strong>Ctrl + V</strong>. Beres tanpa pusing ngitung!
          </p>
        </div>
      </div>

      {/* TABLE MATCHING 2026_Master Excel_Closing FA 2 */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={16} color="var(--primary)" />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Daftar Rincian Closing Promo ({selectedBulan} - {selectedPlatform})
            </h2>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Rumus: <strong>Biaya = Total Diskon × Quantity</strong>
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '90px' }}>Bulan</th>
                <th style={{ minWidth: '90px' }}>Platform</th>
                <th style={{ minWidth: '130px' }}>Kode Promosi</th>
                <th style={{ minWidth: '220px' }}>Nama Promosi</th>
                <th style={{ minWidth: '140px' }}>Kode SKU</th>
                <th style={{ textAlign: 'right', minWidth: '90px' }}>Harga</th>
                <th style={{ textAlign: 'center', minWidth: '70px' }}>Diskon</th>
                <th style={{ textAlign: 'right', minWidth: '100px' }}>Total Diskon</th>
                <th style={{ textAlign: 'right', minWidth: '110px' }}>Harga Akhir</th>
                <th style={{ textAlign: 'center', minWidth: '70px' }}>Quantity</th>
                <th style={{ textAlign: 'right', minWidth: '110px', backgroundColor: '#F1F5F9' }}>Biaya Promo</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '56px 24px', backgroundColor: 'var(--surface)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '420px', margin: '0 auto', gap: '10px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '4px' }}>
                        <FileSpreadsheet size={24} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Tabel Closing Masih Kosong
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        Data dummy sudah dibersihkan. Silakan <strong>upload file pesanan (.xlsx / .csv)</strong> dari Shopee/TikTok untuk hitung otomatis, atau klik <strong>"Tambah Baris Manual"</strong>.
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
                          onClick={handleAddRow} 
                          className="btn-outline" 
                          style={{ fontSize: '0.8125rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Plus size={14} /> Tambah Baris
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, i) => (
                  <tr key={r.id}>
                    <td>{r.bulan}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#DBEAFE' }}>
                        {r.platform}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.kodePromosi}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.namaPromosi}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{r.kodeSku}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {r.harga > 0 ? fmt(r.harga) : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {r.diskonPersen > 0 ? (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                          {r.diskonPersen}%
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.totalDiskon > 0 ? fmt(r.totalDiskon) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                      {r.hargaSetelahDiskon > 0 ? fmt(r.hargaSetelahDiskon) : '-'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {r.quantity}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)', fontVariantNumeric: 'tabular-nums', backgroundColor: '#F8FAFC' }}>
                      {fmt(r.biaya)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteRow(r.id)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Hapus baris"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 700, backgroundColor: '#F8FAFC', borderTop: '2px solid var(--surface-border)' }}>
                  <td colSpan={9} style={{ textAlign: 'right', padding: '12px' }}>
                    TOTAL KESELURUHAN BIAYA PROMO:
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    {totalQuantity} pcs
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px', color: 'var(--danger)', fontSize: '0.9375rem' }}>
                    {fmt(totalBiaya)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  )
}
