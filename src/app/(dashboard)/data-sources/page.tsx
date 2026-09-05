'use client'

import { useEffect, useState, useRef } from 'react'
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  UploadCloud, 
  ChevronRight, 
  FileText, 
  ShoppingCart, 
  Store, 
  Target, 
  Activity,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import * as xlsx from 'xlsx'

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Wizard State
  const [step, setStep] = useState(1) // 1: Upload, 2: Auto-Detected Summary, 3: Advanced Mapping (Optional), 4: Validate, 5: Done
  const [fileData, setFileData] = useState<any>(null)
  const [detectedPlatform, setDetectedPlatform] = useState<string>('')
  const [detectedType, setDetectedType] = useState<string>('')
  const [mappings, setMappings] = useState<any>({})
  const [validation, setValidation] = useState<any>(null)
  const [duplicateAction, setDuplicateAction] = useState<'SKIP'|'REPLACE'>('SKIP')
  const [importStatus, setImportStatus] = useState<string>('')
  const [stats, setStats] = useState<any>(null)
  const [showAdvancedMapping, setShowAdvancedMapping] = useState(false)

  // Smart Auto Analysis Stats
  const [autoAnalysis, setAutoAnalysis] = useState<{
    totalRows: number
    validOrders: number
    cancelledOrders: number
    totalGMV: number
    detectedPlatformLabel: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await fetch(`/api/data-sources`)
      const data = await res.json()
      if (data.dataSources) setDataSources(data.dataSources)
    } catch (e) {
      console.error(e)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    setLoading(true)

    try {
      let json: any[] = []
      let headers: string[] = []

      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
        json = parsed.data
        headers = parsed.meta.fields || []
      } else {
        const buffer = await file.arrayBuffer()
        const workbook = xlsx.read(buffer)
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        json = xlsx.utils.sheet_to_json(sheet)
        headers = Object.keys(json[0] || {})
      }

      setFileData({ name: file.name, size: file.size, rows: json, headers })

      // Auto Detect Platform & Type
      let p = 'Shopee', t = 'SALES'
      const fn = file.name.toLowerCase()
      const hdrs = headers.join(' ').toLowerCase()

      if (fn.includes('shopee') || hdrs.includes('no. pesanan') || hdrs.includes('order amount')) {
        p = 'Shopee'
      } else if (fn.includes('tiktok') || hdrs.includes('order id') || hdrs.includes('tiktok')) {
        p = 'TikTok'
      } else if (fn.includes('tokopedia')) {
        p = 'Tokopedia'
      } else if (fn.includes('meta') || hdrs.includes('campaign name')) {
        p = 'Meta Ads'
      }

      if (fn.includes('affiliate') || hdrs.includes('commission') || hdrs.includes('komisi')) {
        t = 'AFFILIATE'
      } else if (fn.includes('ads') || hdrs.includes('spend') || hdrs.includes('biaya iklan')) {
        t = 'ADS'
      } else {
        t = 'SALES'
      }

      setDetectedPlatform(p)
      setDetectedType(t)

      // Intelligent Auto Mapping without manual hassle
      const defaultMap: any = {}
      headers.forEach(h => {
        const hl = h.toLowerCase().trim()
        
        // Date mapping
        if (hl.includes('waktu pesanan dibuat') || hl.includes('waktu pembayaran') || hl.includes('created time') || hl.includes('tanggal') || hl === 'date') {
          defaultMap[h] = 'date'
        }
        // Sales / GMV mapping
        else if (hl.includes('total pembayaran') || hl.includes('total harga produk') || hl.includes('order amount') || hl.includes('gmv') || hl === 'sales' || hl.includes('total nilai')) {
          defaultMap[h] = 'sales'
        }
        // Orders mapping
        else if (hl.includes('no. pesanan') || hl.includes('order id') || hl.includes('order sn') || hl === 'orders') {
          defaultMap[h] = 'orders'
        }
        // Spend mapping
        else if (hl.includes('biaya iklan') || hl.includes('spend') || hl.includes('biaya')) {
          defaultMap[h] = 'spend'
        }
        // Commission
        else if (hl.includes('komisi') || hl.includes('commission')) {
          defaultMap[h] = 'commission'
        }
        // Clicks
        else if (hl.includes('klik') || hl.includes('click')) {
          defaultMap[h] = 'clicks'
        }
        // Creator / Affiliate Name
        else if (hl.includes('nama kreator') || hl.includes('creator name') || hl.includes('affiliate name')) {
          defaultMap[h] = 'affiliate_name'
        }
        // Creator ID
        else if (hl.includes('creator id') || hl.includes('affiliate id')) {
          defaultMap[h] = 'affiliate_id'
        }
      })
      setMappings(defaultMap)

      // Instant Analysis: Filter Cancelled / Batal orders
      let cancelledCount = 0
      let validCount = 0
      let gmvSum = 0

      json.forEach(row => {
        const status = (
          row['Status Pesanan'] || 
          row['Order Status'] || 
          row['Status'] || 
          ''
        ).toString().toLowerCase()

        if (status.includes('batal') || status.includes('cancel') || status.includes('retur') || status.includes('refund')) {
          cancelledCount++
        } else {
          validCount++
          const val = parseFloat(
            row['Total Pembayaran'] || 
            row['Total Harga Produk'] || 
            row['Order Amount'] || 
            row['Sales'] || 
            '0'
          ) || 0
          gmvSum += val
        }
      })

      setAutoAnalysis({
        totalRows: json.length,
        validOrders: validCount,
        cancelledOrders: cancelledCount,
        totalGMV: gmvSum,
        detectedPlatformLabel: `${p} (${t === 'SALES' ? 'Pesanan & Penjualan' : t})`
      })

      // Go to Step 2: Auto-Detected Summary (Skip manual 50 dropdown mapping!)
      setStep(2)

    } catch (err) {
      console.error(err)
      alert('Gagal membaca file. Pastikan format file .xlsx, .xls, atau .csv ya!')
    } finally {
      setLoading(false)
    }
  }

  const runValidation = async () => {
    setLoading(true)
    try {
      const mappedRows = fileData.rows.map((row: any) => {
        const newRow: any = {}
        for (const src in mappings) {
          if (mappings[src]) newRow[mappings[src]] = row[src]
        }
        return newRow
      })

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'validate',
          fileContent: Papa.unparse(fileData.rows),
          brandId: dataSources[0]?.brand_id,
          platformId: dataSources.find(d => d.platform.name.includes(detectedPlatform))?.platform_id,
          sourceType: detectedType,
          mapping: mappings
        })
      })
      const data = await res.json()
      setValidation(data)
      setStep(4)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const confirmImport = async () => {
    setImportStatus('UPLOADING')
    
    const platformRec = dataSources.find(d => d.platform.name.includes(detectedPlatform))
    if (!platformRec) {
      setImportStatus('Platform belum terkonfigurasi di database')
      return
    }

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'import',
          fileContent: Papa.unparse(fileData.rows),
          brandId: platformRec.brand_id,
          platformId: platformRec.platform_id,
          sourceType: detectedType,
          mapping: mappings,
          duplicateStrategy: duplicateAction
        })
      })

      const data = await res.json()
      if (res.ok) {
        setStats(data.summary)
        setStep(5)
      } else {
        alert(data.error || 'Gagal import')
        setImportStatus('FAILED')
      }
    } catch (err) {
      setImportStatus('FAILED')
    }
  }

  const fmt = (val: number) => `Rp ${val.toLocaleString('id-ID')}`

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1000px' }}>
      
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sumber Data & Import Otomatis</h1>
          <p className="page-subtitle">
            Upload file laporan mentahan dari Shopee, TikTok Shop, Tokopedia, atau Meta Ads. EcomPilot otomatis membaca dan menyaring datanya secara instan tanpa perlu mencocokkan kolom manual.
          </p>
        </div>
      </div>

      {/* STEP 1: UPLOAD INITIAL */}
      {step === 1 && (
        <>
          <div 
            className="card" 
            style={{ 
              textAlign: 'center', 
              padding: '56px 24px', 
              border: '2px dashed var(--surface-border)', 
              borderRadius: '16px',
              backgroundColor: 'var(--surface)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
              <UploadCloud size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Upload Laporan Pesanan / Iklan Marketplace
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', maxWidth: '520px', margin: '0 auto 24px' }}>
              Pilih file ekspor mentah (.xlsx, .xls, .csv) dari Shopee atau TikTok. Sistem langsung mendeteksi platform, menyaring pesanan batal, dan menghitung rincian closing secara otomatis.
            </p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".csv,.xlsx,.xls" 
              onChange={handleFileUpload} 
            />
            
            <button 
              className="btn-primary" 
              style={{ padding: '12px 28px', fontSize: '0.9375rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <FileSpreadsheet size={18} />
              {loading ? 'Menganalisis File...' : 'Pilih File Excel / CSV'}
            </button>
          </div>

          {/* SUPPORTED PLATFORMS */}
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Format yang Langsung Didukung Otomatis:
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { title: 'Shopee Seller Centre', desc: 'Laporan Pesanan, Flash Sale, Voucher Toko, Shopee Ads', icon: ShoppingCart, color: '#EE4D2D' },
                { title: 'TikTok Shop Seller Centre', desc: 'Order Export, Creator Affiliate, Ads Campaign', icon: Store, color: '#000000' },
                { title: 'Tokopedia Seller', desc: 'Laporan Transaksi & Penjualan Produk', icon: ShoppingCart, color: '#03AC0E' },
                { title: 'Meta Ads Manager', desc: 'Spend Iklan, Purchases, ROAS per Campaign', icon: Activity, color: '#0668E1' },
              ].map(card => (
                <div key={card.title} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '10px', color: card.color }}>
                    <card.icon size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{card.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* STEP 2: AUTO-DETECTED SUMMARY (NO MANUAL 50-DROPDOWN MAPPING!) */}
      {step === 2 && autoAnalysis && (
        <div className="card fade-in" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  File Berhasil Dibaca Otomatis! 🎉
                </h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Nama File: <strong>{fileData.name}</strong> • Terdeteksi: <strong>{autoAnalysis.detectedPlatformLabel}</strong>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setStep(1); setFileData(null); setAutoAnalysis(null); }}
              className="btn-outline" 
              style={{ fontSize: '0.8125rem' }}
            >
              Ganti File Lain
            </button>
          </div>

          {/* KEY AUTO ANALYSIS METRICS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            
            <div className="stat-card">
              <div className="stat-label">Total Baris File</div>
              <div className="stat-value">{autoAnalysis.totalRows.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Data mentah terdeteksi</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Pesanan Sukses Dihitung</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {autoAnalysis.validOrders.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Dikirim & Selesai</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Pesanan Batal Di-Skip</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>
                {autoAnalysis.cancelledOrders.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Otomatis dibuang (tidak dihitung)</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Estimasi Nilai Transaksi</div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {autoAnalysis.totalGMV > 0 ? fmt(autoAnalysis.totalGMV) : '-'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Nilai bersih belanjaan</div>
            </div>

          </div>

          {/* DIRECT ACTION SHORTCUTS */}
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Mau lanjut ke mana dengan data ini?
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Data pesanan sudah bersih dari transaksi batal. Kamu bisa langsung mengolahnya jadi laporan closingan Excel atau menyimpannya ke database analytics EcomPilot.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link 
                href="/closing" 
                className="btn-primary" 
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              >
                <FileSpreadsheet size={16} />
                Buka di Rekap Closing Promo (Jalur Ninja) ➔
              </Link>

              <button 
                onClick={runValidation} 
                className="btn-outline" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
              >
                <DatabaseIcon size={16} />
                Simpan ke Database Analytics Toko
              </button>
            </div>
          </div>

          {/* ADVANCED COLUMN MAPPING (ACCORDION / OPTIONAL) */}
          <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
            <button 
              onClick={() => setShowAdvancedMapping(!showAdvancedMapping)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <HelpCircle size={14} />
              {showAdvancedMapping ? 'Sembunyikan Pengaturan Kolom Lanjutan ▲' : 'Pengaturan Kolom Lanjutan (Opsional untuk Developer) ▼'}
            </button>

            {showAdvancedMapping && (
              <div className="fade-in" style={{ marginTop: '16px' }}>
                <table className="data-table" style={{ width: '100%', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th>Kolom di File Excel</th>
                      <th>Target Field EcomPilot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileData.headers.slice(0, 15).map((h: string) => (
                      <tr key={h}>
                        <td>{h}</td>
                        <td>
                          <select 
                            value={mappings[h] || ''} 
                            onChange={e => setMappings({...mappings, [h]: e.target.value})}
                            className="filter-select"
                            style={{ width: '100%' }}
                          >
                            <option value="">-- Abaikan (Ignore) --</option>
                            <option value="date">Tanggal (Date)</option>
                            <option value="sales">Nilai Penjualan / GMV</option>
                            <option value="orders">Nomor Pesanan (Order ID)</option>
                            <option value="spend">Biaya Iklan (Spend)</option>
                            <option value="commission">Komisi Affiliate</option>
                            <option value="clicks">Jumlah Klik</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* STEP 4: VALIDATION & DUPLICATE RESOLUTION */}
      {step === 4 && validation && (
        <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Validasi & Pencegahan Duplikasi</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
            <div className="stat-card">
              <div className="stat-label">Total Baris</div>
              <div className="stat-value">{validation.totalRows}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Baris Valid</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{validation.validRows}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Baris Error</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{validation.invalidRows}</div>
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>
              Strategi Duplikasi Data:
            </label>
            <select 
              value={duplicateAction} 
              onChange={e => setDuplicateAction(e.target.value as any)}
              className="filter-select"
              style={{ width: '100%' }}
            >
              <option value="SKIP">Lewati jika pesanan sudah pernah di-import (Disarankan)</option>
              <option value="REPLACE">Timpa data lama dengan data baru</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button className="btn-outline" onClick={() => setStep(2)}>Kembali</button>
            <button 
              className="btn-primary" 
              onClick={confirmImport}
              disabled={importStatus === 'UPLOADING'}
            >
              {importStatus === 'UPLOADING' ? 'Menyimpan...' : 'Konfirmasi & Simpan ke Database'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS */}
      {step === 5 && stats && (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Import Data Berhasil!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '460px', margin: 0 }}>
            {stats.processed} baris data berhasil disinkronkan ke database analitik EcomPilot.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>
              Lihat Dashboard Utama
            </Link>
            <Link href="/closing" className="btn-outline" style={{ textDecoration: 'none' }}>
              Buka Rekap Closing Promo
            </Link>
            <button 
              className="btn-outline" 
              onClick={() => { setStep(1); setStats(null); setFileData(null); setValidation(null); setAutoAnalysis(null); }}
            >
              Upload File Lain
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

function DatabaseIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  )
}
