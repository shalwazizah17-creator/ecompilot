'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'
import { 
  Filter, 
  Printer, 
  FileText, 
  PieChart, 
  Store, 
  Calendar, 
  TrendingUp, 
  Plus, 
  X, 
  Trash2, 
  RotateCcw, 
  ShoppingBag, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import * as xlsx from 'xlsx'

// Helper to normalize dates from Excel or text strings into YYYY-MM-DD
function normalizeDateStr(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0]
  if (typeof val === 'number') {
    const excelEpoch = new Date(1899, 11, 30)
    const dateObj = new Date(excelEpoch.getTime() + val * 86400000)
    return dateObj.toISOString().split('T')[0]
  }
  const str = val.toString().trim()
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0')
    const month = ddmmyyyy[2].padStart(2, '0')
    const year = ddmmyyyy[3]
    return `${year}-${month}-${day}`
  }
  const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (yyyymmdd) {
    const year = yyyymmdd[1]
    const month = yyyymmdd[2].padStart(2, '0')
    const day = yyyymmdd[3].padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  return new Date().toISOString().split('T')[0]
}

// Helper to parse currency / numbers from Indonesian or formatted strings
function parseCurrency(val: any): number {
  if (typeof val === 'number') return val
  if (!val) return 0
  const str = val.toString().trim()
  const cleaned = str
    .replace(/^Rp\s*/i, '')
    .replace(/\s+/g, '')
    .replace(/\.(?=\d{3})/g, '')
    .replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// Detect cancelled/batal order status
function isCancelledStatus(statusStr: any): boolean {
  if (!statusStr) return false
  const s = statusStr.toString().toLowerCase()
  return (
    s.includes('batal') ||
    s.includes('cancel') ||
    s.includes('retur') ||
    s.includes('kembali') ||
    s.includes('refund') ||
    s.includes('gagal')
  )
}

interface ParsedFileAnalysis {
  fileName: string
  fileSize: number
  platform: string
  totalRows: number
  totalOrders: number
  validOrders: number
  cancelledOrders: number
  totalGMV: number
  startDate: string
  endDate: string
  dailyBreakdown: Array<{ date: string; gmv: number; orders: number }>
}

export default function MarketplaceIntelligence() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Filter Controls
  const [platform, setPlatform] = useState('ALL') // ALL, Shopee, TikTok Shop, Tokopedia
  const [period, setPeriod] = useState('MONTHLY') // WEEKLY, MONTHLY, YEARLY

  // Modal & Tab State
  const [showModal, setShowModal] = useState(false)
  const [modalTab, setModalTab] = useState<'upload' | 'manual'>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [processingFile, setProcessingFile] = useState(false)
  const [parsedAnalysis, setParsedAnalysis] = useState<ParsedFileAnalysis | null>(null)
  const [savingData, setSavingData] = useState(false)

  // Manual Form State
  const [inputPlatform, setInputPlatform] = useState('Shopee')
  const [inputReportType, setInputReportType] = useState('bulanan')
  const [inputDate, setInputDate] = useState(() => new Date().toISOString().split('T')[0])
  const [inputGMV, setInputGMV] = useState('')
  const [inputOrders, setInputOrders] = useState('')
  const [inputSpend, setInputSpend] = useState('')
  const [inputRefunds, setInputRefunds] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const directFileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/marketplace-intelligence`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const formatIDR = (val: number) => {
    if (!val || val === 0) return 'Rp 0'
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`
    }
    return `Rp ${val.toLocaleString('id-ID')}`
  }

  const handlePrint = () => {
    window.print()
  }

  // Parse Excel or CSV order file
  const processUploadedFile = async (file: File) => {
    setProcessingFile(true)
    try {
      let rawRows: any[] = []

      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
        rawRows = parsed.data
      } else {
        const buffer = await file.arrayBuffer()
        const workbook = xlsx.read(buffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        rawRows = xlsx.utils.sheet_to_json(sheet)
      }

      if (!rawRows || rawRows.length === 0) {
        alert('File kosong atau format tidak sesuai. Pastikan file berisi kolom pesanan dari Shopee / TikTok.')
        setProcessingFile(false)
        return
      }

      // Auto-detect platform
      let detectedPlatform = 'Shopee'
      const fn = file.name.toLowerCase()
      const headerKeys = Object.keys(rawRows[0] || {}).join(' ').toLowerCase()
      if (fn.includes('tiktok') || headerKeys.includes('order id') || headerKeys.includes('tiktok')) {
        detectedPlatform = 'TikTok Shop'
      } else if (fn.includes('tokopedia') || fn.includes('tokped') || headerKeys.includes('invoice')) {
        detectedPlatform = 'Tokopedia'
      } else if (fn.includes('shopee') || headerKeys.includes('no. pesanan')) {
        detectedPlatform = 'Shopee'
      }

      // Group orders by unique ID to avoid multi-row duplicate counts
      const orderMap = new Map<string, {
        orderId: string
        isCancelled: boolean
        date: string
        orderAmount: number
      }>()

      rawRows.forEach((row, idx) => {
        const orderId = (
          row['No. Pesanan'] || 
          row['Nomor Pesanan'] || 
          row['Order ID'] || 
          row['Order SN'] || 
          row['Nomor Invoice'] || 
          `ROW-${idx + 1}`
        ).toString().trim()

        const rawStatus = (
          row['Status Pesanan'] || 
          row['Order Status'] || 
          row['Status'] || 
          row['Status Terakhir'] || 
          'Selesai'
        ).toString()
        const isCancelled = isCancelledStatus(rawStatus)

        const rawDate = (
          row['Waktu Pembayaran Dilakukan'] || 
          row['Waktu Pesanan Dibuat'] || 
          row['Created Time'] || 
          row['Paid Time'] || 
          row['Tanggal Pembayaran'] || 
          row['Tanggal']
        )
        const date = normalizeDateStr(rawDate)

        const orderLevelAmount = parseCurrency(
          row['Total Pembayaran'] || 
          row['Total Pesanan'] || 
          row['Total Nilai Pesanan'] || 
          row['Order Amount'] || 
          row['Total Penjualan (IDR)'] ||
          row['Total Amount']
        )

        const itemLevelAmount = parseCurrency(
          row['Subtotal Produk'] || 
          row['SKU Subtotal After Discount'] || 
          row['Harga Setelah Diskon'] || 
          row['Harga Jual'] ||
          row['Harga Awal']
        ) * (parseInt(row['Jumlah'] || row['Quantity'] || '1') || 1)

        if (!orderMap.has(orderId)) {
          orderMap.set(orderId, {
            orderId,
            isCancelled,
            date,
            orderAmount: orderLevelAmount > 0 ? orderLevelAmount : itemLevelAmount
          })
        } else {
          const existing = orderMap.get(orderId)!
          if (orderLevelAmount === 0 && itemLevelAmount > 0) {
            existing.orderAmount += itemLevelAmount
          }
        }
      })

      // Calculate totals
      let validOrders = 0
      let cancelledOrders = 0
      let totalGMV = 0
      const dailyMap = new Map<string, { gmv: number; orders: number }>()
      const dateList: string[] = []

      orderMap.forEach((order) => {
        if (order.isCancelled) {
          cancelledOrders++
        } else {
          validOrders++
          totalGMV += order.orderAmount
          dateList.push(order.date)

          const cur = dailyMap.get(order.date) || { gmv: 0, orders: 0 }
          cur.gmv += order.orderAmount
          cur.orders += 1
          dailyMap.set(order.date, cur)
        }
      })

      dateList.sort()
      const startDate = dateList[0] || new Date().toISOString().split('T')[0]
      const endDate = dateList[dateList.length - 1] || new Date().toISOString().split('T')[0]

      const dailyBreakdown = Array.from(dailyMap.entries())
        .map(([date, val]) => ({ date, gmv: val.gmv, orders: val.orders }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setParsedAnalysis({
        fileName: file.name,
        fileSize: file.size,
        platform: detectedPlatform,
        totalRows: rawRows.length,
        totalOrders: orderMap.size,
        validOrders,
        cancelledOrders,
        totalGMV,
        startDate,
        endDate,
        dailyBreakdown
      })

      setShowModal(true)
      setModalTab('upload')

    } catch (err) {
      console.error('Failed to parse order file:', err)
      alert('Gagal membaca file. Pastikan file adalah format .xlsx atau .csv dari Shopee / TikTok Seller Centre.')
    } finally {
      setProcessingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (directFileInputRef.current) directFileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0])
    }
  }

  // Save parsed file data into database
  const handleApplyParsedData = async () => {
    if (!parsedAnalysis) return
    setSavingData(true)

    try {
      const res = await fetch(`/api/marketplace-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: parsedAnalysis.platform,
          bulkMetrics: parsedAnalysis.dailyBreakdown.map(d => ({
            date: d.date,
            gmv: d.gmv,
            orders: d.orders,
            spend: 0,
            refunds: 0,
            cancellations: 0,
          }))
        })
      })

      if (res.ok) {
        setShowModal(false)
        setParsedAnalysis(null)
        await load()
        alert(`Berhasil! ${parsedAnalysis.validOrders} pesanan valid (${formatIDR(parsedAnalysis.totalGMV)}) berhasil diterapkan ke dashboard! 🚀`)
      } else {
        alert('Gagal menyimpan data laporan ke server.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi saat menyimpan data.')
    } finally {
      setSavingData(false)
    }
  }

  // Handle manual submission fallback
  const handleSaveManualData = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingData(true)

    const gmvNum = parseFloat(inputGMV) || 0
    const ordersNum = parseInt(inputOrders) || 0
    const spendNum = parseFloat(inputSpend) || 0
    const refundsNum = parseFloat(inputRefunds) || 0

    try {
      const res = await fetch(`/api/marketplace-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: inputPlatform,
          date: inputDate,
          gmv: gmvNum,
          orders: ordersNum,
          spend: spendNum,
          refunds: refundsNum,
          cancellations: 0,
        })
      })

      if (res.ok) {
        setShowModal(false)
        setInputGMV('')
        setInputOrders('')
        setInputSpend('')
        setInputRefunds('')
        await load()
        alert('Data laporan berhasil disimpan! Dashboard sudah langsung terupdate 🎉')
      } else {
        alert('Gagal menyimpan data laporan ke server.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi saat menyimpan data.')
    } finally {
      setSavingData(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Yakin ingin menghapus baris data laporan ini?')) return
    try {
      const res = await fetch(`/api/marketplace-intelligence?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await load()
      } else {
        alert('Gagal menghapus data laporan.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Yakin ingin mengosongkan semua data laporan kembali ke 0? Data yang dihapus tidak bisa dikembalikan.')) return
    try {
      const res = await fetch(`/api/marketplace-intelligence?clearAll=true`, { method: 'DELETE' })
      if (res.ok) {
        await load()
        alert('Semua data laporan berhasil dibersihkan! Dashboard kembali bersih (0).')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filtered calculations based on platform selection
  const filteredData = useMemo(() => {
    if (!data) return null
    const { kpis, chartData, platformGrowth, recentEntries = [], hasData } = data

    if (platform === 'ALL') {
      return { kpis, chartData, platformGrowth, recentEntries, hasData }
    }

    const matchedEntries = recentEntries.filter((e: any) => 
      e.platform.toLowerCase().includes(platform.toLowerCase()) ||
      platform.toLowerCase().includes(e.platform.toLowerCase())
    )

    const totalGMV = matchedEntries.reduce((acc: number, cur: any) => acc + (cur.sales || 0), 0)
    const totalOrders = matchedEntries.reduce((acc: number, cur: any) => acc + (cur.orders || 0), 0)
    const totalAdSpend = matchedEntries.reduce((acc: number, cur: any) => acc + (cur.spend || 0), 0)
    const totalRefunds = matchedEntries.reduce((acc: number, cur: any) => acc + (cur.refunds || 0), 0)
    const totalNetSales = Math.max(0, totalGMV - totalRefunds)
    const roas = totalAdSpend > 0 ? totalGMV / totalAdSpend : 0

    const matchedGrowth = (platformGrowth || []).filter((p: any) =>
      p.name.toLowerCase().includes(platform.toLowerCase()) ||
      platform.toLowerCase().includes(p.name.toLowerCase())
    )

    return {
      kpis: {
        totalGMV,
        totalNetSales,
        totalOrders,
        roas,
        affiliateContribution: 0,
      },
      chartData: totalGMV > 0 ? chartData : [],
      platformGrowth: matchedGrowth,
      recentEntries: matchedEntries,
      hasData: matchedEntries.length > 0 && totalGMV > 0,
    }
  }, [data, platform])

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="skeleton" style={{ width: '300px', height: '40px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
        </div>
      </div>
    )
  }

  if (!filteredData || !filteredData.kpis) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Gagal memuat data laporan.</div>
  }

  const { kpis, chartData, platformGrowth, recentEntries, hasData } = filteredData

  const displayPlatform = platform === 'ALL' ? 'Semua Marketplace' : platform
  const displayPeriod = period === 'WEEKLY' ? 'Mingguan' : period === 'MONTHLY' ? 'Bulanan' : 'Tahunan'

  const hasChartPoints = chartData && chartData.length > 0 && chartData.some((c: any) => (c.gmv || 0) > 0)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HIDDEN FILE INPUT FOR DIRECT UPLOAD */}
      <input 
        ref={directFileInputRef}
        type="file" 
        accept=".xlsx,.xls,.csv" 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Laporan Evaluasi Marketplace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Rangkuman performa jualan di {displayPlatform} buat evaluasi {displayPeriod}.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }} className="no-print">
          {recentEntries.length > 0 && (
            <button 
              onClick={handleClearAll} 
              className="btn-outline" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error, #ef4444)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              title="Kosongkan semua data laporan"
            >
              <RotateCcw size={15} /> Kosongkan Data
            </button>
          )}

          {/* PRIMARY: UPLOAD EXCEL ORDER */}
          <button 
            onClick={() => {
              setModalTab('upload')
              setShowModal(true)
            }} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)' }}
          >
            <UploadCloud size={17} /> Upload Excel Pesanan
          </button>

          {/* SECONDARY: MANUAL INPUT */}
          <button 
            onClick={() => {
              setModalTab('manual')
              setShowModal(true)
            }} 
            className="btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Input Manual
          </button>

          {/* EXPORT PDF */}
          <button 
            onClick={handlePrint} 
            className="btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="no-print card-flat" style={{ padding: '14px 20px', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
          <Filter size={16} /> Filter Laporan
        </div>
        
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--surface-border)' }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={15} color="var(--text-muted)" />
          <select 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            className="filter-select"
            style={{ minWidth: '150px' }}
          >
            <option value="ALL">Semua Marketplace</option>
            <option value="Shopee">Shopee</option>
            <option value="TikTok Shop">TikTok Shop</option>
            <option value="Tokopedia">Tokopedia</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={15} color="var(--text-muted)" />
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="filter-select"
            style={{ minWidth: '120px' }}
          >
            <option value="WEEKLY">Mingguan</option>
            <option value="MONTHLY">Bulanan</option>
            <option value="YEARLY">Tahunan</option>
          </select>
        </div>
      </div>

      {/* PRINT HEADER */}
      <div className="print-only" style={{ display: 'none', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Laporan Evaluasi EcomPilot</h2>
        <div style={{ display: 'flex', gap: '24px', marginTop: '8px', color: '#555' }}>
          <span><strong>Platform:</strong> {displayPlatform}</span>
          <span><strong>Periode:</strong> {displayPeriod}</span>
          <span><strong>Tanggal Generate:</strong> {new Date().toLocaleDateString('id-ID')}</span>
        </div>
      </div>

      {/* AI SUMMARY / EMPTY INSIGHT */}
      <div className="ai-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} /> Insight Laporan {displayPeriod} (by AI)
        </h3>
        {kpis.totalGMV > 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
            Overall, performa jualan di {displayPlatform} berhasil nyetak GMV sebesar <strong>{formatIDR(kpis.totalGMV)}</strong> dengan total <strong>{kpis.totalOrders.toLocaleString('id-ID')} pesanan</strong>. Rata-rata ROAS berada di angka <strong>{kpis.roas > 0 ? `${kpis.roas.toFixed(1)}x` : '-'}</strong>. {kpis.affiliateContribution > 0 ? `Penjualan juga didukung mitra Affiliate sebesar ${kpis.affiliateContribution.toFixed(1)}% dari total sales.` : 'Belum ada catatan biaya affiliate pada periode ini.'} Pantau terus tren harian dan maksimalkan promosi pada channel dengan konversi tertinggi! 🚀
          </p>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Belum ada data laporan yang masuk untuk {displayPlatform} periode {displayPeriod}. Halaman ini siap digunakan tanpa data dummy. Silakan klik <strong>Upload Excel Pesanan</strong> di atas untuk membaca file ekspor Shopee/TikTok secara otomatis tanpa hitung manual! ✨
          </p>
        )}
      </div>

      {/* EXECUTIVE KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <div className="stat-card">
          <p className="stat-label" style={{ marginBottom: '8px' }}>Total GMV</p>
          <h2 className="stat-value">{formatIDR(kpis.totalGMV)}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label" style={{ marginBottom: '8px' }}>Net Sales</p>
          <h2 className="stat-value">{formatIDR(kpis.totalNetSales)}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label" style={{ marginBottom: '8px' }}>Total Order</p>
          <h2 className="stat-value">{kpis.totalOrders ? kpis.totalOrders.toLocaleString('id-ID') : '0'}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label" style={{ marginBottom: '8px' }}>ROAS Iklan</p>
          <h2 className="stat-value">{kpis.roas > 0 ? `${kpis.roas.toFixed(1)}x` : '-'}</h2>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--success-light)', borderColor: 'var(--success-border)' }}>
          <p className="stat-label" style={{ color: 'var(--success)', marginBottom: '8px' }}>Kontribusi Affiliate</p>
          <h2 className="stat-value" style={{ color: 'var(--success)' }}>
            {kpis.affiliateContribution > 0 ? `${kpis.affiliateContribution.toFixed(1)}%` : '0.0%'}
          </h2>
        </div>
      </div>

      {/* DIRECT DRAG-AND-DROP CARD IF NO DATA YET */}
      {!hasData && (
        <div 
          className="card no-print"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            padding: '36px 24px',
            textAlign: 'center',
            border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--surface-border)'}`,
            borderRadius: '12px',
            backgroundColor: isDragging ? 'rgba(37, 99, 235, 0.04)' : 'var(--surface)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onClick={() => directFileInputRef.current?.click()}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <UploadCloud size={28} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Tarik & Lepas File Excel Pesanan Shopee / TikTok di Sini
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 18px', lineHeight: 1.5 }}>
            Sistem otomatis membaca data pesanan, <strong>mengecualikan pesanan yang dibatalkan</strong>, menghitung total GMV, dan langsung mengisi grafik pertumbuhan secara otomatis.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
            <FileSpreadsheet size={16} /> Pilih File Excel (.xlsx / .csv)
          </div>
        </div>
      )}

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }} className="print-charts-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <TrendingUp size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Grafik Pertumbuhan GMV & Affiliate</h3>
          </div>
          {hasChartPoints ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAffiliate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `${(val/1000000)} Jt`} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--surface-border)' }}
                  />
                  <Area type="monotone" dataKey="gmv" name="Total GMV" stroke="#2563EB" fill="url(#colorGmv)" strokeWidth={3} />
                  <Area type="monotone" dataKey="affiliateGmv" name="Affiliate GMV" stroke="#059669" fill="url(#colorAffiliate)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px', backgroundColor: 'var(--surface-subtle, rgba(0,0,0,0.02))', borderRadius: '8px', border: '1px dashed var(--surface-border)' }}>
              <TrendingUp size={36} style={{ opacity: 0.35 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>Belum ada histori grafik penjualan</p>
              <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-muted)' }}>Upload file Excel pesanan untuk melihat grafik tren harian toko kamu.</p>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <PieChart size={18} color="var(--primary-navy)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Share per Platform</h3>
          </div>
          {platformGrowth && platformGrowth.length > 0 && platformGrowth.some((p: any) => (p.gmv || 0) > 0) ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformGrowth} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--surface-border)" />
                  <XAxis type="number" tickFormatter={(val) => `${(val/1000000)} Jt`} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} type="category" width={80} />
                  <Tooltip 
                    formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--surface-border)' }} 
                  />
                  <Bar dataKey="gmv" name="GMV" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px', backgroundColor: 'var(--surface-subtle, rgba(0,0,0,0.02))', borderRadius: '8px', border: '1px dashed var(--surface-border)' }}>
              <PieChart size={36} style={{ opacity: 0.35 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>Belum ada data share platform</p>
              <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-muted)', textAlign: 'center', padding: '0 16px' }}>Data Shopee, TikTok Shop, & Tokopedia akan muncul setelah laporan diupload.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIWAYAT INPUT DATA LAPORAN TABLE */}
      <div className="card no-print" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Riwayat Data Laporan Yang Masuk
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Rincian laporan penjualan yang tercatat di sistem.
            </p>
          </div>
          {recentEntries.length > 0 && (
            <span style={{ fontSize: '0.8125rem', padding: '4px 12px', backgroundColor: 'var(--surface-border)', borderRadius: '20px', fontWeight: 600 }}>
              {recentEntries.length} catatan tersimpan
            </span>
          )}
        </div>

        {recentEntries.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', border: '1px dashed var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--surface-subtle, rgba(0,0,0,0.01))' }}>
            <ShoppingBag size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
              Belum ada data laporan yang dimasukkan
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Upload file pesanan (.xlsx / .csv) dari Shopee atau TikTok untuk mengisi data penjualan secara otomatis.
            </p>
            <button 
              onClick={() => {
                setModalTab('upload')
                setShowModal(true)
              }} 
              className="btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
            >
              <UploadCloud size={15} /> Upload File Excel Sekarang
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <th style={{ padding: '10px 12px' }}>Tanggal</th>
                  <th style={{ padding: '10px 12px' }}>Platform</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total GMV</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Order</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Biaya Iklan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{item.date}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: item.platform.toLowerCase().includes('shopee') ? '#fff1ee' : item.platform.toLowerCase().includes('tiktok') ? '#f1f5f9' : '#eefbf4',
                        color: item.platform.toLowerCase().includes('shopee') ? '#ee4d2d' : item.platform.toLowerCase().includes('tiktok') ? '#0f172a' : '#10b981',
                        border: `1px solid ${item.platform.toLowerCase().includes('shopee') ? '#fed7aa' : item.platform.toLowerCase().includes('tiktok') ? '#cbd5e1' : '#a7f3d0'}`
                      }}>
                        {item.platform}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                      Rp {Number(item.sales || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {Number(item.orders || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {item.spend > 0 ? `Rp ${Number(item.spend).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteEntry(item.id)}
                        title="Hapus baris ini"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error, #ef4444)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INPUT & UPLOAD MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '540px', padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Input Data Laporan Penjualan</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Pilih cara memasukkan data: upload otomatis dari file pesanan atau isi manual.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setParsedAnalysis(null)
                }} 
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setModalTab('upload')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: modalTab === 'upload' ? 'var(--primary)' : 'transparent',
                  color: modalTab === 'upload' ? 'white' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <UploadCloud size={16} /> Upload Excel (Otomatis)
              </button>

              <button
                type="button"
                onClick={() => setModalTab('manual')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: modalTab === 'manual' ? 'var(--primary)' : 'transparent',
                  color: modalTab === 'manual' ? 'white' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={16} /> Input Manual
              </button>
            </div>

            {/* TAB 1: UPLOAD FILE EXCEL */}
            {modalTab === 'upload' && (
              <div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />

                {!parsedAnalysis ? (
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '36px 20px',
                      textAlign: 'center',
                      border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--surface-border)'}`,
                      borderRadius: '10px',
                      backgroundColor: isDragging ? 'rgba(37, 99, 235, 0.05)' : 'var(--surface-subtle, rgba(0,0,0,0.01))',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <FileSpreadsheet size={24} />
                    </div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                      {processingFile ? 'Membaca data file...' : 'Klik atau seret file Excel/CSV di sini'}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
                      File ekspor seluruh pesanan dari <strong>Shopee Seller Centre</strong> atau <strong>TikTok Shop</strong> (.xlsx, .xls, .csv).
                    </p>
                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '4px', backgroundColor: 'var(--surface-border)', color: 'var(--text-secondary)' }}>
                      Pesanan Batal otomatis dikeluarkan (Count = 0)
                    </span>
                  </div>
                ) : (
                  <div>
                    {/* ANALYSIS RESULT PREVIEW */}
                    <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--surface-subtle, rgba(0,0,0,0.02))', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileSpreadsheet size={20} color="var(--primary)" />
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {parsedAnalysis.fileName}
                          </span>
                        </div>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          backgroundColor: parsedAnalysis.platform === 'Shopee' ? '#fff1ee' : '#f1f5f9',
                          color: parsedAnalysis.platform === 'Shopee' ? '#ee4d2d' : '#0f172a',
                          border: `1px solid ${parsedAnalysis.platform === 'Shopee' ? '#fed7aa' : '#cbd5e1'}`
                        }}>
                          {parsedAnalysis.platform}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 2px' }}>Total Pesanan di File</p>
                          <p style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                            {parsedAnalysis.totalOrders.toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--error, #ef4444)', margin: '0 0 2px' }}>Pesanan Batal (Dikeluarkan)</p>
                          <p style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--error, #ef4444)' }}>
                            {parsedAnalysis.cancelledOrders.toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--success-light)', border: '1px solid var(--success-border)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--success)', margin: '0 0 2px' }}>Pesanan Valid (Dihitung)</p>
                          <p style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--success)' }}>
                            {parsedAnalysis.validOrders.toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.06)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--primary)', margin: '0 0 2px' }}>Total GMV Penjualan</p>
                          <p style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                            {formatIDR(parsedAnalysis.totalGMV)}
                          </p>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--surface-border)', paddingTop: '8px' }}>
                        <span>Periode: <strong>{parsedAnalysis.startDate}</strong> s/d <strong>{parsedAnalysis.endDate}</strong></span>
                        <span>{parsedAnalysis.dailyBreakdown.length} hari data grafik</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          setParsedAnalysis(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }} 
                        className="btn-outline"
                      >
                        Ganti File
                      </button>

                      <button 
                        type="button" 
                        onClick={handleApplyParsedData} 
                        className="btn-primary"
                        disabled={savingData}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {savingData ? 'Menerapkan...' : '🚀 Simpan & Terapkan ke Dashboard'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MANUAL INPUT */}
            {modalTab === 'manual' && (
              <form onSubmit={handleSaveManualData} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Platform</label>
                    <select 
                      className="input" 
                      value={inputPlatform}
                      onChange={e => setInputPlatform(e.target.value)}
                      required
                    >
                      <option value="Shopee">Shopee</option>
                      <option value="TikTok Shop">TikTok Shop</option>
                      <option value="Tokopedia">Tokopedia</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Tipe Laporan</label>
                    <select 
                      className="input"
                      value={inputReportType}
                      onChange={e => setInputReportType(e.target.value)}
                      required
                    >
                      <option value="harian">Harian</option>
                      <option value="mingguan">Mingguan</option>
                      <option value="bulanan">Bulanan</option>
                      <option value="tahunan">Tahunan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Periode / Tanggal</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={inputDate}
                    onChange={e => setInputDate(e.target.value)}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Total GMV (Rp) *</label>
                    <input 
                      type="number" 
                      className="input" 
                      placeholder="Contoh: 15000000" 
                      value={inputGMV}
                      onChange={e => setInputGMV(e.target.value)}
                      required 
                      min="0"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Total Pesanan (Orders) *</label>
                    <input 
                      type="number" 
                      className="input" 
                      placeholder="Contoh: 150" 
                      value={inputOrders}
                      onChange={e => setInputOrders(e.target.value)}
                      required 
                      min="0"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Biaya Iklan (Rp) (Opsional)</label>
                    <input 
                      type="number" 
                      className="input" 
                      placeholder="Contoh: 2500000" 
                      value={inputSpend}
                      onChange={e => setInputSpend(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>Pesanan Batal / Retur (Rp)</label>
                    <input 
                      type="number" 
                      className="input" 
                      placeholder="Contoh: 500000" 
                      value={inputRefunds}
                      onChange={e => setInputRefunds(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

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
                    disabled={savingData}
                  >
                    {savingData ? 'Menyimpan...' : 'Simpan Laporan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
