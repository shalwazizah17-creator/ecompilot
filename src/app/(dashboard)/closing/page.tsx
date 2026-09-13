'use client'

import { useState, useRef, useMemo } from 'react'
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
  AlertTriangle,
  HelpCircle,
  X,
  Layers,
  ChevronRight,
  Info,
  ShieldCheck,
  Eye,
  FileCheck2,
  Download,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Package,
  Boxes,
  ArrowUpDown,
  FileText,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import * as xlsx from 'xlsx'
import Papa from 'papaparse'
import {
  ClosingRuleType,
  ClosingPeriodType,
  ClosingStatus,
  RawOrderTransaction,
  ClosingGroupAudit,
  processClosingTransactions,
  calculateClosingGroup,
  getClosingPeriod,
  getClosingPeriodLabel,
  getDaysInMonth,
  getDynamicPeriodLabels,
  isOrderCancelled,
  normalizeDiscount,
  generateMasterClosingTSV,
  generateStandardMasterClosingTSV,
  generateFullAuditTSV,
  generateTheraskinClosingSeed
} from '@/lib/closing-engine'

export default function ClosingPage() {
  // Main Data States
  const [selectedBulan, setSelectedBulan] = useState('September')
  const [selectedTahun, setSelectedTahun] = useState(2026)
  const [closingGroups, setClosingGroups] = useState<ClosingGroupAudit[]>(() => 
    generateTheraskinClosingSeed('September', 2026)
  )
  const [selectedPlatform, setSelectedPlatform] = useState('ALL')
  const [selectedPeriode, setSelectedPeriode] = useState<'ALL' | ClosingPeriodType>('ALL')
  const [closingStatus, setClosingStatus] = useState<ClosingStatus>('Ready for Finance')
  const [activeTab, setActiveTab] = useState<'TABLE_REKAP' | 'PROMO_CATALOG' | 'RAW_ORDERS'>('TABLE_REKAP')
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIssueFilter, setActiveIssueFilter] = useState<string | null>(null)

  // Feedback & Copy states
  const [copiedMode, setCopiedMode] = useState<'NONE' | '6COL' | '11COL' | 'AUDIT'>('NONE')
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Modals
  const [activeAuditModal, setActiveAuditModal] = useState<ClosingGroupAudit | null>(null)
  const [activePaketModal, setActivePaketModal] = useState<ClosingGroupAudit | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)
  const [auditSearch, setAuditSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    bulan: 'September',
    year: 2026,
    period: 'PERIOD_1' as ClosingPeriodType,
    platform: 'Shopee Pusat',
    kodePromosi: 'Voucher Toko',
    subCategory: 'Voucher Diskon Toko',
    namaPromosi: 'Voucher Toko 5K',
    sku: 'FPK00000033',
    productName: 'Theraskin Perfect Glow Serum 20ml',
    price: 85000,
    discountAmount: 5000,
    totalOrders: 100,
    cancelledOrders: 10,
    isDuplicatePromo: true
  })

  // Format IDR currency
  const fmt = (val: number) => `Rp ${Math.round(val || 0).toLocaleString('id-ID')}`

  // Dynamic End of Month & Labels
  const periodLabels = useMemo(() => {
    return getDynamicPeriodLabels(selectedTahun, selectedBulan)
  }, [selectedTahun, selectedBulan])

  // Validation issues detector across all rows
  const validationSummary = useMemo(() => {
    let duplicateCount = 0
    let paketCount = 0
    let missingSkuCount = 0
    let invalidPriceCount = 0

    closingGroups.forEach(g => {
      if (g.isDuplicatePromo) duplicateCount++
      if (g.isPaketDiskon) paketCount++
      if (!g.sku || g.sku === 'All SKU' || g.sku === 'SKU-Umum') missingSkuCount++
      if (g.price <= 0 || g.priceAfterDiscount <= 0) invalidPriceCount++
    })

    return {
      duplicateCount,
      paketCount,
      missingSkuCount,
      invalidPriceCount,
      totalIssues: duplicateCount + paketCount + missingSkuCount + invalidPriceCount
    }
  }, [closingGroups])

  // Filter rows based on dropdowns, search, and active issue filter
  const filteredGroups = useMemo(() => {
    return closingGroups.filter(g => {
      const matchBulan = selectedBulan === 'ALL' || g.month.toLowerCase() === selectedBulan.toLowerCase()
      const matchPlatform = selectedPlatform === 'ALL' || g.marketplace.toLowerCase().includes(selectedPlatform.toLowerCase())
      const matchPeriode = selectedPeriode === 'ALL' || g.closingPeriod === selectedPeriode
      
      const q = searchQuery.toLowerCase().trim()
      const matchSearch = !q || 
        g.sku.toLowerCase().includes(q) || 
        g.promotionName.toLowerCase().includes(q) || 
        (g.productName && g.productName.toLowerCase().includes(q)) ||
        g.promotionCategory.toLowerCase().includes(q)

      let matchIssue = true
      if (activeIssueFilter === 'DUPLICATE_PROMO') {
        matchIssue = Boolean(g.isDuplicatePromo)
      } else if (activeIssueFilter === 'PAKET_DISKON') {
        matchIssue = Boolean(g.isPaketDiskon)
      } else if (activeIssueFilter === 'MISSING_SKU') {
        matchIssue = !g.sku || g.sku === 'All SKU' || g.sku === 'SKU-Umum'
      } else if (activeIssueFilter === 'INVALID_PRICE') {
        matchIssue = g.price <= 0 || g.priceAfterDiscount <= 0
      }

      return matchBulan && matchPlatform && matchPeriode && matchSearch && matchIssue
    })
  }, [closingGroups, selectedBulan, selectedPlatform, selectedPeriode, searchQuery, activeIssueFilter])

  // Summary statistics for Filtered Rows
  const totalBiayaPromosi = useMemo(() => {
    return filteredGroups.reduce((sum, g) => sum + (g.biaya || g.totalBiayaPromo || 0), 0)
  }, [filteredGroups])

  const totalClosingQty = useMemo(() => {
    return filteredGroups.reduce((sum, g) => sum + g.finalClosingQty, 0)
  }, [filteredGroups])

  const totalValidOrders = useMemo(() => {
    return filteredGroups.reduce((sum, g) => sum + g.validOrders, 0)
  }, [filteredGroups])

  const totalCancelledOrders = useMemo(() => {
    return filteredGroups.reduce((sum, g) => sum + g.cancelledOrders, 0)
  }, [filteredGroups])

  const totalRawOrders = totalValidOrders + totalCancelledOrders

  // Period-specific subtotals
  const p1Rows = filteredGroups.filter(g => g.closingPeriod === 'PERIOD_1')
  const p2Rows = filteredGroups.filter(g => g.closingPeriod === 'PERIOD_2')

  const p1Qty = p1Rows.reduce((sum, g) => sum + g.finalClosingQty, 0)
  const p1Biaya = p1Rows.reduce((sum, g) => sum + (g.biaya || 0), 0)

  const p2Qty = p2Rows.reduce((sum, g) => sum + g.finalClosingQty, 0)
  const p2Biaya = p2Rows.reduce((sum, g) => sum + (g.biaya || 0), 0)

  // Safe clipboard helper
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

  // 1-Click: COPY HASIL CLOSING (6 Kolom TSV: Platform | Kode Promosi | Nama Promosi | SKU | Quantity | Biaya)
  const handleCopyHasilClosing6Col = async () => {
    if (filteredGroups.length === 0) return
    const tsv = generateMasterClosingTSV(filteredGroups)
    await safeCopyToClipboard(tsv)
    setCopiedMode('6COL')
    showToast(`Tercopy ${filteredGroups.length} baris format 6 kolom! Siap di-paste langsung (Ctrl+V) ke Master Closing.`)
    setTimeout(() => setCopiedMode('NONE'), 4000)
  }

  // Copy Standard 11-column Master Closing format
  const handleCopyStandard11Col = async () => {
    if (filteredGroups.length === 0) return
    const tsv = generateStandardMasterClosingTSV(filteredGroups)
    await safeCopyToClipboard(tsv)
    setCopiedMode('11COL')
    showToast(`Tercopy format 11 kolom Master Closing dengan header.`)
    setTimeout(() => setCopiedMode('NONE'), 4000)
  }

  // Copy Full Audit breakdown
  const handleCopyFullAudit = async () => {
    if (filteredGroups.length === 0) return
    const tsv = generateFullAuditTSV(filteredGroups)
    await safeCopyToClipboard(tsv)
    setCopiedMode('AUDIT')
    showToast(`Tercopy format audit lengkap (Total Order, Batal, Valid, Rule, QTY, Biaya).`)
    setTimeout(() => setCopiedMode('NONE'), 4000)
  }

  // Toast notifier helper
  const showToast = (msg: string) => {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(null), 5000)
  }

  // Recalculate Closing (Hitung Closing)
  const handleRecalculateClosing = () => {
    setIsProcessing(true)
    setTimeout(() => {
      // Re-evaluate all groups with engine rules
      const updated = closingGroups.map(g => {
        const recalculated = calculateClosingGroup(g.transactions, undefined, g.isDuplicatePromo)
        recalculated.subCategory = g.subCategory
        recalculated.productName = g.productName
        recalculated.isPaketDiskon = g.isPaketDiskon
        recalculated.bundleComponents = g.bundleComponents
        return recalculated
      })
      setClosingGroups(updated)
      setIsProcessing(false)
      showToast('Kalkulasi Closing selesai! Semua pesanan valid, rule duplikat, dan biaya telah diperbarui.')
    }, 400)
  }

  // Toggle Duplicate Rule on a specific row
  const handleToggleDuplicateRule = (groupId: string) => {
    if (closingStatus === 'Closed') {
      alert('Status closing saat ini CLOSED (Terkunci). Silakan klik tombol "Reopen Closing" terlebih dahulu jika ingin mengedit.')
      return
    }

    setClosingGroups(prev => prev.map(g => {
      if (g.groupId === groupId) {
        const newIsDuplicate = !g.isDuplicatePromo
        const updated = calculateClosingGroup(g.transactions, undefined, newIsDuplicate)
        updated.subCategory = g.subCategory
        updated.productName = g.productName
        updated.isPaketDiskon = g.isPaketDiskon
        updated.bundleComponents = g.bundleComponents
        return updated
      }
      return g
    }))
  }

  // Export Excel (.xlsx) with clean formatting for Finance
  const handleExportExcel = () => {
    if (filteredGroups.length === 0) {
      alert('Tidak ada data yang dapat diekspor!')
      return
    }

    try {
      // Sheet 1: Master Closing Ready
      const masterRows = filteredGroups.map(r => ({
        'Platform': r.marketplace,
        'Kode Promosi': r.promotionCategory,
        'Nama Promosi': r.promotionName,
        'Kode SKU': r.sku,
        'Nama Produk': r.productName || '',
        'Periode': r.periodLabel,
        'Harga Bulanan': r.price,
        'Diskon': r.discountPercent > 0 ? `${r.discountPercent}%` : '',
        'Total Diskon': r.discountAmount,
        'Harga Setelah Diskon': r.priceAfterDiscount,
        'Quantity': r.finalClosingQty,
        'Biaya Promo (Net)': Math.round(r.biaya)
      }))

      // Sheet 2: Audit Trail
      const auditRows = filteredGroups.map(r => ({
        'Platform': r.marketplace,
        'Periode': r.periodLabel,
        'Kode Promosi': r.promotionCategory,
        'Nama Promosi': r.promotionName,
        'SKU': r.sku,
        'Total Orders': r.totalOrders,
        'Pesanan Batal': r.cancelledOrders,
        'Pesanan Valid': r.validOrders,
        'Duplicate Rule': r.isDuplicatePromo ? 'Ya (÷2)' : 'Tidak',
        'Final QTY': r.finalClosingQty,
        'Harga Promo': r.priceAfterDiscount,
        'Biaya Closing': Math.round(r.biaya),
        'Formula': r.formulaDescription
      }))

      const wb = xlsx.utils.book_new()
      const wsMaster = xlsx.utils.json_to_sheet(masterRows)
      const wsAudit = xlsx.utils.json_to_sheet(auditRows)

      xlsx.utils.book_append_sheet(wb, wsMaster, 'Rekap Closing Master')
      xlsx.utils.book_append_sheet(wb, wsAudit, 'Audit Finance')

      const filename = `Rekap_Closing_${selectedPlatform}_${selectedBulan}_${selectedTahun}.xlsx`
      xlsx.writeFile(wb, filename)
      showToast(`Berhasil mengekspor ${filename}`)
    } catch (err) {
      console.error('Export Excel failed:', err)
      alert('Gagal mengekspor file Excel. Silakan coba kembali.')
    }
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

      if (!rawData || rawData.length === 0) {
        throw new Error('File tidak memiliki baris data.')
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
        const sku = row['Nomor Referensi SKU'] || row['Seller SKU'] || row['SKU'] || 'FPK00000033'
        const productName = row['Nama Produk'] || row['Product Name'] || 'Produk Theraskin'
        const promoName = row['Nama Promosi'] || row['Voucher Ditanggung Penjual'] || row['Paket Diskon'] || row['Flash Sale'] || 'Promo Diskon'
        const hargaAwal = parseFloat(row['Harga Awal'] || row['Original Price'] || row['Harga'] || '85000') || 85000
        const totalDiskon = parseFloat(row['Total Diskon'] || row['Diskon Promosi'] || row['Potongan Penjual'] || row['Diskon'] || '5000') || 5000
        const qty = parseInt(row['Jumlah'] || row['Quantity'] || '1') || 1
        const period = getClosingPeriod(dateRaw)

        let promoCategory = 'Voucher Toko'
        const promoLow = promoName.toLowerCase()
        if (promoLow.includes('flash sale')) promoCategory = 'Promo Flash Sale'
        else if (promoLow.includes('paket') || promoLow.includes('combo')) promoCategory = 'Paket Diskon'
        else if (promoLow.includes('membership') || promoLow.includes('member')) promoCategory = 'Voucher Brand Membership'
        else if (promoLow.includes('live') || promoLow.includes('video')) promoCategory = 'Voucher Live / Video'

        return {
          id: `tx-${idx}-${orderNumber}`,
          orderNumber,
          date: dateRaw,
          month: selectedBulan,
          period,
          marketplace: selectedPlatform !== 'ALL' ? selectedPlatform : 'Shopee Pusat',
          promotionCategory: promoCategory,
          promotionName: promoName,
          sku,
          productName,
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
      setClosingStatus('Data Imported')
      showToast(`Berhasil mengimpor ${transactions.length} pesanan menjadi ${result.groups.length} baris closing.`)

    } catch (err) {
      console.error('Failed to parse order file:', err)
      alert('Format file belum sesuai. Pastikan upload file order export dari Shopee, TikTok Shop, atau Lazada ya!')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle Manual Row Submission with Engine Calculation
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const { 
      totalOrders, 
      cancelledOrders, 
      price, 
      discountAmount, 
      bulan, 
      year, 
      period, 
      platform, 
      kodePromosi, 
      subCategory,
      namaPromosi, 
      sku, 
      productName, 
      isDuplicatePromo 
    } = manualForm

    const validOrders = Math.max(0, totalOrders - cancelledOrders)

    // Generate mock transactions for complete audit traceability
    const txs: RawOrderTransaction[] = [
      ...Array.from({ length: validOrders }).map((_, i) => ({
        id: `manual-v-${Date.now()}-${i}`,
        orderNumber: `ORD-M-V-${i + 1}`,
        date: period === 'PERIOD_1' ? `${year}-09-05` : `${year}-09-20`,
        month: bulan,
        period,
        marketplace: platform,
        promotionCategory: kodePromosi,
        promotionName: namaPromosi,
        sku,
        productName,
        price,
        discountAmount,
        quantity: 1,
        orderStatus: 'Selesai',
        isDuplicatePromo
      })),
      ...Array.from({ length: cancelledOrders }).map((_, i) => ({
        id: `manual-c-${Date.now()}-${i}`,
        orderNumber: `ORD-M-C-${i + 1}`,
        date: period === 'PERIOD_1' ? `${year}-09-06` : `${year}-09-21`,
        month: bulan,
        period,
        marketplace: platform,
        promotionCategory: kodePromosi,
        promotionName: namaPromosi,
        sku,
        productName,
        price,
        discountAmount,
        quantity: 1,
        orderStatus: 'Dibatalkan',
        isDuplicatePromo
      }))
    ]

    const groupResult = calculateClosingGroup(txs, undefined, isDuplicatePromo)
    groupResult.subCategory = subCategory
    groupResult.productName = productName
    groupResult.isPaketDiskon = kodePromosi.toLowerCase().includes('paket') || namaPromosi.toLowerCase().includes('paket')
    if (groupResult.isPaketDiskon) {
      groupResult.bundleComponents = [`${sku} (Utama)`]
    }

    setClosingGroups([groupResult, ...closingGroups])
    setShowManualModal(false)
    showToast(`Baris promo "${namaPromosi}" berhasil ditambahkan.`)
  }

  const handleDeleteGroup = (groupId: string) => {
    if (closingStatus === 'Closed') {
      alert('Closing berstatus CLOSED. Buka kunci closing jika ingin menghapus.')
      return
    }
    if (confirm('Hapus baris promo closing ini?')) {
      setClosingGroups(closingGroups.filter(g => g.groupId !== groupId))
      showToast('Baris closing telah dihapus.')
    }
  }

  // Reset demo seed
  const handleResetSeedData = () => {
    if (confirm('Muat ulang data referensi Theraskin untuk periode ini?')) {
      setClosingGroups(generateTheraskinClosingSeed(selectedBulan, selectedTahun))
      setActiveIssueFilter(null)
      setSearchQuery('')
      showToast('Data referensi closing Theraskin berhasil dimuat ulang.')
    }
  }

  // Filter raw orders for the Raw Orders Tab
  const allRawTransactions = useMemo(() => {
    return filteredGroups.flatMap(g => g.transactions)
  }, [filteredGroups])

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* 1. TOAST NOTIFICATION */}
      {statusMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#0F172A',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '0.875rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeInUp 0.25s ease-out'
        }}>
          <CheckCircle2 size={18} color="#4ADE80" />
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} style={{ color: '#94A3B8', marginLeft: '8px' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. PAGE HEADER & PRIMARY ACTION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Laporan Closing Promo</h1>
            <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#DBEAFE', fontWeight: 600 }}>
              Working Closing Tool
            </span>
            {closingStatus === 'Closed' ? (
              <span className="badge" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA', fontWeight: 700 }}>
                <Lock size={12} /> CLOSED
              </span>
            ) : (
              <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0', fontWeight: 600 }}>
                {closingStatus}
              </span>
            )}
          </div>
          <p className="page-subtitle" style={{ maxWidth: '780px' }}>
            Rekap dan validasi data promo marketplace untuk kebutuhan closing Finance. Memproses pesanan valid, aturan duplikat promo, dan menghasilkan <strong>Quantity + Biaya</strong> untuk Master Closing.
          </p>
        </div>

        {/* Action Button Strip */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx,.xls,.csv" 
            style={{ display: 'none' }} 
          />
          
          {/* Upload Button */}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', height: '38px' }}
            disabled={isProcessing || closingStatus === 'Closed'}
          >
            <UploadCloud size={16} />
            {isProcessing ? 'Memproses File...' : 'Upload Pesanan'}
          </button>

          {/* Hitung Closing Button */}
          <button 
            onClick={handleRecalculateClosing}
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', height: '38px', color: '#1E40AF', borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}
            disabled={isProcessing || closingStatus === 'Closed'}
            title="Hitung ulang seluruh aturan promo, pesanan batal, dan kuantitas"
          >
            <RefreshCw size={15} className={isProcessing ? 'animate-spin' : ''} />
            Hitung Closing
          </button>

          {/* 1-CLICK: COPY HASIL CLOSING (6 Columns Format for Master Closing) */}
          <button 
            onClick={handleCopyHasilClosing6Col} 
            className="btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.8125rem', 
              height: '38px', 
              backgroundColor: copiedMode === '6COL' ? 'var(--success)' : '#2563EB',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
            }}
            disabled={filteredGroups.length === 0}
            title="Salin 6 kolom TSV: Platform | Kode Promosi | Nama Promosi | SKU | Quantity | Biaya"
          >
            {copiedMode === '6COL' ? <Check size={16} /> : <Copy size={16} />}
            {copiedMode === '6COL' ? 'Tercopy! Tinggal Paste di Master Closing' : 'COPY HASIL CLOSING'}
          </button>

          {/* Export Excel (.xlsx) */}
          <button 
            onClick={handleExportExcel} 
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', height: '38px' }}
            disabled={filteredGroups.length === 0}
            title="Download file Excel terformat untuk Finance"
          >
            <Download size={15} />
            Export Excel
          </button>

          {/* Manual Input Modal Trigger */}
          <button 
            onClick={() => setShowManualModal(true)}
            className="btn-outline" 
            style={{ fontSize: '0.8125rem', height: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}
            disabled={closingStatus === 'Closed'}
          >
            <Plus size={15} /> Input Manual
          </button>
        </div>
      </div>

      {/* 3. LOCKED STATUS BANNER (If Closed) */}
      {closingStatus === 'Closed' && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '10px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <Lock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#991B1B' }}>
                Periode Closing Ini Telah Dikunci (Closed)
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#7F1D1D' }}>
                Data telah difinalisasi untuk Finance. Perubahan data dinonaktifkan untuk menjaga integritas rekonsiliasi.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Buka kembali kunci closing (Reopen) untuk melakukan koreksi?')) {
                setClosingStatus('Under Review')
                showToast('Closing berhasil dibuka kembali (Under Review).')
              }
            }}
            className="btn-outline"
            style={{
              fontSize: '0.8125rem',
              backgroundColor: '#FFFFFF',
              borderColor: '#DC2626',
              color: '#DC2626',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Unlock size={14} /> Reopen Closing
          </button>
        </div>
      )}

      {/* 4. MAIN FILTER & DYNAMIC MONTH BAR */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          {/* Bulan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Bulan:</span>
            <select 
              value={selectedBulan} 
              onChange={e => setSelectedBulan(e.target.value)} 
              className="filter-select"
              style={{ padding: '6px 12px', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid var(--surface-border-strong)', backgroundColor: 'var(--surface)' }}
            >
              <option value="Januari">Januari</option>
              <option value="Februari">Februari</option>
              <option value="Maret">Maret</option>
              <option value="April">April</option>
              <option value="Mei">Mei</option>
              <option value="Juni">Juni</option>
              <option value="Juli">Juli</option>
              <option value="Agustus">Agustus</option>
              <option value="September">September</option>
              <option value="Oktober">Oktober</option>
              <option value="November">November</option>
              <option value="Desember">Desember</option>
              <option value="ALL">Semua Bulan</option>
            </select>
          </div>

          {/* Tahun */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tahun:</span>
            <select 
              value={selectedTahun} 
              onChange={e => setSelectedTahun(parseInt(e.target.value))} 
              className="filter-select"
              style={{ padding: '6px 12px', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid var(--surface-border-strong)', backgroundColor: 'var(--surface)' }}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          {/* Platform: Shopee Pusat, Shopee Semarang, TikTok, Lazada */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Platform:</span>
            <select 
              value={selectedPlatform} 
              onChange={e => setSelectedPlatform(e.target.value)} 
              className="filter-select"
              style={{ padding: '6px 12px', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid var(--surface-border-strong)', backgroundColor: 'var(--surface)' }}
            >
              <option value="ALL">Semua Marketplace</option>
              <option value="Shopee Pusat">Shopee Pusat</option>
              <option value="Shopee Semarang">Shopee Semarang</option>
              <option value="TikTok Shop">TikTok Shop</option>
              <option value="Lazada">Lazada</option>
            </select>
          </div>

          {/* Periode Closing: Dynamic 1-15 & 16-EOM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Periode:</span>
            <select 
              value={selectedPeriode} 
              onChange={e => setSelectedPeriode(e.target.value as any)} 
              className="filter-select"
              style={{ padding: '6px 12px', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid var(--surface-border-strong)', backgroundColor: 'var(--surface)', fontWeight: 500 }}
            >
              <option value="ALL">Semua Periode (1 – {periodLabels.lastDay})</option>
              <option value="PERIOD_1">{periodLabels.p1Label}</option>
              <option value="PERIOD_2">{periodLabels.p2Label}</option>
            </select>
          </div>

          {/* Status Closing Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select 
              value={closingStatus} 
              onChange={e => setClosingStatus(e.target.value as ClosingStatus)} 
              className="filter-select"
              style={{ 
                padding: '6px 12px', 
                fontSize: '0.8125rem', 
                borderRadius: '6px', 
                border: '1px solid var(--surface-border-strong)', 
                backgroundColor: closingStatus === 'Closed' ? '#FEF2F2' : 'var(--surface)',
                fontWeight: 600,
                color: closingStatus === 'Closed' ? '#DC2626' : 'inherit'
              }}
            >
              <option value="Draft">Draft</option>
              <option value="Data Imported">Data Imported</option>
              <option value="Under Review">Under Review</option>
              <option value="Ready for Finance">Ready for Finance</option>
              <option value="Closed">🔒 Closed (Kunci Data)</option>
            </select>
          </div>

        </div>

        {/* Secondary Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={handleResetSeedData}
            className="btn-ghost" 
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Reset ke data awal Theraskin"
          >
            <RefreshCw size={12} /> Reset Data
          </button>

          {closingGroups.length > 0 && (
            <button 
              onClick={() => {
                if (closingStatus === 'Closed') {
                  alert('Status Closed! Tidak bisa mengosongkan tabel.')
                  return
                }
                if (confirm('Kosongkan semua data closing yang sedang aktif?')) {
                  setClosingGroups([])
                }
              }}
              className="btn-ghost" 
              style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={12} /> Bersihkan
            </button>
          )}
        </div>
      </div>

      {/* 5. SUMMARY STRIP (4 COMPACT CHIPS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Chip 1: Total Program */}
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total Program Promo</span>
            <Package size={16} color="var(--text-muted)" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '6px' }}>
            {filteredGroups.length} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>program</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {selectedPlatform === 'ALL' ? 'Semua Platform' : selectedPlatform}
          </div>
        </div>

        {/* Chip 2: Total QTY Terjual */}
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total QTY Terjual</span>
            <Boxes size={16} color="#2563EB" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: '#2563EB', marginTop: '6px' }}>
            {totalClosingQty.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>pcs</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {totalValidOrders.toLocaleString()} pesanan valid ({totalCancelledOrders} batal)
          </div>
        </div>

        {/* Chip 3: Total Biaya Promosi */}
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total Biaya Promosi</span>
            <Calculator size={16} color="#DC2626" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: '#DC2626', marginTop: '6px' }}>
            {fmt(totalBiayaPromosi)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Formula: Final QTY × Harga Setelah Diskon
          </div>
        </div>

        {/* Chip 4: Perlu Review */}
        <div 
          className="stat-card" 
          style={{ 
            padding: '16px 20px', 
            backgroundColor: validationSummary.totalIssues > 0 ? '#FFFBEB' : 'var(--surface)', 
            borderColor: validationSummary.totalIssues > 0 ? '#FDE68A' : 'var(--surface-border)'
          }}
        >
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: validationSummary.totalIssues > 0 ? '#B45309' : 'var(--text-muted)' }}>
            <span>Data Perlu Review</span>
            <AlertTriangle size={16} color={validationSummary.totalIssues > 0 ? '#D97706' : 'var(--text-muted)'} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: validationSummary.totalIssues > 0 ? '#B45309' : 'var(--success)', marginTop: '6px' }}>
            {validationSummary.totalIssues} <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>indikasi</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: validationSummary.totalIssues > 0 ? '#92400E' : 'var(--text-muted)', marginTop: '4px' }}>
            {validationSummary.totalIssues === 0 ? 'Semua data bersih & valid' : 'Klik panel di bawah untuk cek rincian'}
          </div>
        </div>

      </div>

      {/* 6. PANEL "PERLU REVIEW" (VALIDATION INDICATORS) */}
      {validationSummary.totalIssues > 0 && (
        <div style={{
          backgroundColor: '#FFFDF5',
          border: '1px solid #FEF08A',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#854D0E', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} color="#D97706" /> PERLU REVIEW:
            </span>

            {/* Chip Duplicate Promo */}
            {validationSummary.duplicateCount > 0 && (
              <button
                onClick={() => setActiveIssueFilter(activeIssueFilter === 'DUPLICATE_PROMO' ? null : 'DUPLICATE_PROMO')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeIssueFilter === 'DUPLICATE_PROMO' ? '#D97706' : '#FEF3C7',
                  color: activeIssueFilter === 'DUPLICATE_PROMO' ? '#FFFFFF' : '#92400E',
                  border: '1px solid #FDE68A'
                }}
              >
                <span>⚠️ {validationSummary.duplicateCount} Duplicate Promo Detected (÷2)</span>
              </button>
            )}

            {/* Chip Paket Diskon */}
            {validationSummary.paketCount > 0 && (
              <button
                onClick={() => setActiveIssueFilter(activeIssueFilter === 'PAKET_DISKON' ? null : 'PAKET_DISKON')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeIssueFilter === 'PAKET_DISKON' ? '#2563EB' : '#EFF6FF',
                  color: activeIssueFilter === 'PAKET_DISKON' ? '#FFFFFF' : '#1E40AF',
                  border: '1px solid #BFDBFE'
                }}
              >
                <span>📦 {validationSummary.paketCount} Paket Diskon Needs Validation</span>
              </button>
            )}

            {/* Chip Missing SKU */}
            {validationSummary.missingSkuCount > 0 && (
              <button
                onClick={() => setActiveIssueFilter(activeIssueFilter === 'MISSING_SKU' ? null : 'MISSING_SKU')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeIssueFilter === 'MISSING_SKU' ? '#DC2626' : '#FEE2E2',
                  color: activeIssueFilter === 'MISSING_SKU' ? '#FFFFFF' : '#991B1B',
                  border: '1px solid #FECACA'
                }}
              >
                <span>🏷️ {validationSummary.missingSkuCount} Missing Product SKU</span>
              </button>
            )}

            {/* Chip Invalid Price */}
            {validationSummary.invalidPriceCount > 0 && (
              <button
                onClick={() => setActiveIssueFilter(activeIssueFilter === 'INVALID_PRICE' ? null : 'INVALID_PRICE')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeIssueFilter === 'INVALID_PRICE' ? '#DC2626' : '#FEE2E2',
                  color: activeIssueFilter === 'INVALID_PRICE' ? '#FFFFFF' : '#991B1B',
                  border: '1px solid #FECACA'
                }}
              >
                <span>💰 {validationSummary.invalidPriceCount} Invalid Price</span>
              </button>
            )}
          </div>

          {activeIssueFilter && (
            <button
              onClick={() => setActiveIssueFilter(null)}
              style={{ fontSize: '0.75rem', color: '#92400E', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
            >
              Reset Filter Issue (Tampilkan Semua)
            </button>
          )}
        </div>
      )}

      {/* 7. VIEW MODE TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', paddingBottom: '2px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('TABLE_REKAP')}
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'TABLE_REKAP' ? 700 : 500,
              color: activeTab === 'TABLE_REKAP' ? '#2563EB' : 'var(--text-secondary)',
              borderBottom: activeTab === 'TABLE_REKAP' ? '2px solid #2563EB' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Calculator size={16} /> Tabel Rekap Closing ({filteredGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('PROMO_CATALOG')}
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'PROMO_CATALOG' ? 700 : 500,
              color: activeTab === 'PROMO_CATALOG' ? '#2563EB' : 'var(--text-secondary)',
              borderBottom: activeTab === 'PROMO_CATALOG' ? '2px solid #2563EB' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText size={16} /> Data Promo Closing
          </button>
          <button
            onClick={() => setActiveTab('RAW_ORDERS')}
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'RAW_ORDERS' ? 700 : 500,
              color: activeTab === 'RAW_ORDERS' ? '#2563EB' : 'var(--text-secondary)',
              borderBottom: activeTab === 'RAW_ORDERS' ? '2px solid #2563EB' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Boxes size={16} /> Data Pesanan Mentah ({allRawTransactions.length})
          </button>
        </div>

        {/* Quick Search & Secondary Copy dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Cari SKU / Promo / Produk..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                fontSize: '0.8125rem',
                borderRadius: '6px',
                border: '1px solid var(--surface-border-strong)',
                backgroundColor: 'var(--surface)'
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Secondary Copy Options (11-Kolom & Audit) */}
          <button
            onClick={handleCopyStandard11Col}
            className="btn-outline"
            style={{ fontSize: '0.75rem', padding: '6px 10px', height: '32px' }}
            title="Copy 11 kolom Master Closing"
          >
            {copiedMode === '11COL' ? <Check size={13} color="var(--success)" /> : <FileSpreadsheet size={13} />}
            Copy 11-Kolom
          </button>
          <button
            onClick={handleCopyFullAudit}
            className="btn-outline"
            style={{ fontSize: '0.75rem', padding: '6px 10px', height: '32px' }}
            title="Copy format audit rincian lengkap"
          >
            {copiedMode === 'AUDIT' ? <Check size={13} color="var(--success)" /> : <FileCheck2 size={13} />}
            Copy Audit
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SPREADSHEET WORKING TABLE (MAIN INTERFACE)                        */}
      {/* ========================================================================= */}
      {activeTab === 'TABLE_REKAP' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          
          <div style={{ overflowX: 'auto', maxHeight: '720px' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'separate', borderSpacing: 0 }}>
              
              {/* STICKY HEADER */}
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC' }}>
                <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                  <th style={{ minWidth: '110px', position: 'sticky', left: 0, backgroundColor: '#F8FAFC', zIndex: 11 }}>Marketplace</th>
                  <th style={{ minWidth: '130px' }}>Kategori (Kode)</th>
                  <th style={{ minWidth: '130px' }}>Sub Kategori</th>
                  <th style={{ minWidth: '85px', textAlign: 'center' }}>Periode</th>
                  <th style={{ minWidth: '110px' }}>Tanggal Promo</th>
                  <th style={{ minWidth: '110px', fontFamily: 'monospace' }}>SKU</th>
                  <th style={{ minWidth: '190px' }}>Product Name</th>
                  <th style={{ textAlign: 'right', minWidth: '95px' }}>Harga Normal</th>
                  <th style={{ textAlign: 'center', minWidth: '65px' }}>Diskon</th>
                  <th style={{ textAlign: 'right', minWidth: '95px' }}>Total Diskon</th>
                  <th style={{ textAlign: 'right', minWidth: '100px', backgroundColor: '#F1F5F9' }}>Harga Promo</th>
                  <th style={{ textAlign: 'center', minWidth: '80px', backgroundColor: '#F8FAFC' }}>Total Orders</th>
                  <th style={{ textAlign: 'center', minWidth: '75px', backgroundColor: '#FFF5F5', color: '#DC2626' }}>Batal</th>
                  <th style={{ textAlign: 'center', minWidth: '75px', backgroundColor: '#F0FDF4', color: '#16A34A' }}>Valid</th>
                  <th style={{ textAlign: 'center', minWidth: '110px' }}>Duplicate Rule</th>
                  <th style={{ textAlign: 'center', minWidth: '95px', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }}>FINAL QTY</th>
                  <th style={{ textAlign: 'right', minWidth: '120px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontWeight: 700 }}>BIAYA</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={18} style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: 'var(--surface)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '440px', margin: '0 auto', gap: '12px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', marginBottom: '4px' }}>
                          <FileSpreadsheet size={28} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          Belum Ada Data Closing Yang Cocok
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          Tidak ditemukan data closing untuk filter yang dipilih. Silakan ubah filter, upload file pesanan marketplace, atau klik tombol <strong>"Muat Ulang Data Theraskin"</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button 
                            onClick={handleResetSeedData}
                            className="btn-primary" 
                            style={{ fontSize: '0.8125rem', padding: '8px 14px' }}
                          >
                            Muat Data Theraskin
                          </button>
                          <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="btn-outline" 
                            style={{ fontSize: '0.8125rem', padding: '8px 14px' }}
                          >
                            Upload Pesanan
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => {
                    const platformBadgeColor = g.marketplace.includes('Shopee')
                      ? { bg: '#FFF7ED', text: '#EA580C', border: '#FFEDD5' }
                      : g.marketplace.includes('TikTok')
                        ? { bg: '#F8FAFC', text: '#0F172A', border: '#E2E8F0' }
                        : { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE' }

                    return (
                      <tr key={g.groupId} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        
                        {/* 1. Marketplace (Sticky Left) */}
                        <td style={{ position: 'sticky', left: 0, backgroundColor: 'var(--surface)', zIndex: 5 }}>
                          <span className="badge" style={{ backgroundColor: platformBadgeColor.bg, color: platformBadgeColor.text, borderColor: platformBadgeColor.border, fontSize: '0.72rem' }}>
                            {g.marketplace}
                          </span>
                        </td>

                        {/* 2. Kategori Promosi */}
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {g.promotionCategory}
                        </td>

                        {/* 3. Sub Kategori */}
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          {g.subCategory || g.promotionName}
                        </td>

                        {/* 4. Periode */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.7rem' }}>
                            {g.closingPeriod === 'PERIOD_1' ? '1–15' : `16–${periodLabels.lastDay}`} {g.month.slice(0, 3)}
                          </span>
                        </td>

                        {/* 5. Tanggal Promo */}
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {g.periodDateRange || (g.closingPeriod === 'PERIOD_1' ? periodLabels.p1DateRange : periodLabels.p2DateRange)}
                        </td>

                        {/* 6. SKU */}
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1E293B', fontSize: '0.8rem' }}>
                          {g.sku}
                        </td>

                        {/* 7. Product Name */}
                        <td style={{ color: 'var(--text-primary)', maxWidth: '220px', whiteSpace: 'normal', lineHeight: 1.3 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>{g.productName || g.sku}</span>
                            {g.isPaketDiskon && (
                              <button 
                                onClick={() => setActivePaketModal(g)}
                                style={{ alignSelf: 'flex-start', fontSize: '0.68rem', color: '#2563EB', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                              >
                                [ Review Paket Diskon ]
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 8. Harga Normal */}
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                          {fmt(g.price)}
                        </td>

                        {/* 9. Diskon % */}
                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                          {g.discountPercent > 0 ? `${g.discountPercent}%` : '-'}
                        </td>

                        {/* 10. Total Diskon (Rp) */}
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#D97706' }}>
                          {fmt(g.discountAmount)}
                        </td>

                        {/* 11. Harga Promo (Harga Setelah Diskon) */}
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, backgroundColor: '#F8FAFC' }}>
                          {fmt(g.priceAfterDiscount)}
                        </td>

                        {/* 12. Total Orders */}
                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', backgroundColor: '#F8FAFC' }}>
                          {g.totalOrders}
                        </td>

                        {/* 13. Pesanan Batal (Excluded, COUNT = 0) */}
                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: g.cancelledOrders > 0 ? '#DC2626' : 'var(--text-muted)', backgroundColor: '#FFF5F5', fontWeight: g.cancelledOrders > 0 ? 700 : 400 }}>
                          {g.cancelledOrders > 0 ? `-${g.cancelledOrders}` : '0'}
                        </td>

                        {/* 14. Pesanan Valid */}
                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: '#16A34A', backgroundColor: '#F0FDF4', fontWeight: 700 }}>
                          {g.validOrders}
                        </td>

                        {/* 15. Duplicate Rule (Ya ÷2 / Tidak) */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleDuplicateRule(g.groupId)}
                            title="Klik untuk mengubah aturan duplikat promo"
                            style={{
                              border: 'none',
                              cursor: closingStatus === 'Closed' ? 'not-allowed' : 'pointer',
                              padding: 0,
                              background: 'transparent'
                            }}
                          >
                            {g.isDuplicatePromo ? (
                              <span className="badge badge-warning" style={{ fontSize: '0.68rem', cursor: 'pointer' }}>
                                Ya (÷2)
                              </span>
                            ) : (
                              <span className="badge badge-neutral" style={{ fontSize: '0.68rem', cursor: 'pointer' }}>
                                Tidak
                              </span>
                            )}
                          </button>
                        </td>

                        {/* 16. FINAL QTY (Clickable drilldown) */}
                        <td style={{ textAlign: 'center', backgroundColor: '#EFF6FF' }}>
                          <button
                            onClick={() => setActiveAuditModal(g)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 800,
                              fontSize: '0.9375rem',
                              color: '#1D4ED8',
                              textDecoration: 'underline',
                              textUnderlineOffset: '3px'
                            }}
                            title="Klik untuk audit rincian transaksi"
                          >
                            {g.finalClosingQty}
                          </button>
                        </td>

                        {/* 17. BIAYA (Final QTY × Harga Setelah Diskon) */}
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#B91C1C', fontVariantNumeric: 'tabular-nums', backgroundColor: '#FEF2F2' }}>
                          {fmt(g.biaya)}
                        </td>

                        {/* 18. Action column */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button 
                              onClick={() => setActiveAuditModal(g)} 
                              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                              title="Lihat Audit Detail"
                            >
                              <Eye size={15} />
                            </button>
                            <button 
                              onClick={() => handleDeleteGroup(g.groupId)} 
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                              title="Hapus baris ini"
                              disabled={closingStatus === 'Closed'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    )
                  })
                )}
              </tbody>

              {/* SPREADSHEET FOOTERS & SUB-TOTALS PER PERIOD */}
              {filteredGroups.length > 0 && (
                <tfoot>
                  {/* Period 1 Subtotal */}
                  <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid var(--surface-border)', fontSize: '0.8125rem' }}>
                    <td colSpan={7} style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      SUBTOTAL {periodLabels.p1Header.toUpperCase()} ({p1Rows.length} program):
                    </td>
                    <td colSpan={8} style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Kuantitas & Biaya Periode 1:
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 800, color: '#1D4ED8', backgroundColor: '#EFF6FF' }}>
                      {p1Qty.toLocaleString()} pcs
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 800, color: '#B91C1C', backgroundColor: '#FEF2F2' }}>
                      {fmt(p1Biaya)}
                    </td>
                    <td></td>
                  </tr>

                  {/* Period 2 Subtotal */}
                  <tr style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid var(--surface-border)', fontSize: '0.8125rem' }}>
                    <td colSpan={7} style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      SUBTOTAL {periodLabels.p2Header.toUpperCase()} ({p2Rows.length} program):
                    </td>
                    <td colSpan={8} style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Kuantitas & Biaya Periode 2:
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 800, color: '#1D4ED8', backgroundColor: '#EFF6FF' }}>
                      {p2Qty.toLocaleString()} pcs
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 800, color: '#B91C1C', backgroundColor: '#FEF2F2' }}>
                      {fmt(p2Biaya)}
                    </td>
                    <td></td>
                  </tr>

                  {/* GRAND TOTAL */}
                  <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF', fontWeight: 800, fontSize: '0.875rem' }}>
                    <td colSpan={7} style={{ padding: '14px 16px', color: '#F8FAFC' }}>
                      GRAND TOTAL CLOSING ({filteredGroups.length} PROGRAM PROMO):
                    </td>
                    <td colSpan={4} style={{ textAlign: 'right', padding: '14px 16px', color: '#94A3B8', fontSize: '0.75rem' }}>
                      Order Masuk: {totalRawOrders} (Batal: -{totalCancelledOrders})
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 8px', color: '#E2E8F0' }}>{totalRawOrders}</td>
                    <td style={{ textAlign: 'center', padding: '14px 8px', color: '#FCA5A5' }}>-{totalCancelledOrders}</td>
                    <td style={{ textAlign: 'center', padding: '14px 8px', color: '#86EFAC' }}>{totalValidOrders}</td>
                    <td style={{ textAlign: 'center', padding: '14px 8px', color: '#FCD34D', fontSize: '0.75rem' }}>Final Rules</td>
                    <td style={{ textAlign: 'center', padding: '14px 8px', color: '#93C5FD', fontSize: '1.05rem', backgroundColor: '#1E293B' }}>
                      {totalClosingQty.toLocaleString()} pcs
                    </td>
                    <td style={{ textAlign: 'right', padding: '14px 16px', color: '#FCA5A5', fontSize: '1.05rem', backgroundColor: '#1E293B' }}>
                      {fmt(totalBiayaPromosi)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}

            </table>
          </div>

          {/* Bottom Bar with 1-Click Copy reminder */}
          <div style={{ padding: '12px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={16} color="var(--primary)" />
              <span>
                Format copy otomatis mencocokkan format Master Closing: <code>Platform \t Kode Promosi \t Nama Promosi \t SKU \t Quantity \t Biaya</code>
              </span>
            </div>
            <button
              onClick={handleCopyHasilClosing6Col}
              className="btn-primary"
              style={{ fontSize: '0.8125rem', padding: '6px 14px', backgroundColor: copiedMode === '6COL' ? 'var(--success)' : '#2563EB' }}
              disabled={filteredGroups.length === 0}
            >
              {copiedMode === '6COL' ? <Check size={14} /> : <Copy size={14} />}
              {copiedMode === '6COL' ? 'Tercopy ke Clipboard' : 'COPY HASIL CLOSING'}
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DATA PROMO CLOSING (REFERENCE CATALOG)                             */}
      {/* ========================================================================= */}
      {activeTab === 'PROMO_CATALOG' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Katalog Referensi Promo Closing</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                Daftar program promo acuan untuk rekonsiliasi data pesanan marketplace.
              </p>
            </div>
            <span className="badge badge-info">{filteredGroups.length} Program Terdaftar</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredGroups.map(g => (
              <div 
                key={g.groupId} 
                style={{ 
                  border: '1px solid var(--surface-border)', 
                  borderRadius: '10px', 
                  padding: '16px', 
                  backgroundColor: '#FAFAFA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '0.72rem' }}>
                    {g.marketplace}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    {g.closingPeriod === 'PERIOD_1' ? 'Periode 1' : 'Periode 2'}
                  </span>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {g.promotionName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {g.promotionCategory} • {g.subCategory}
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>SKU:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{g.sku}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Produk:</span>
                    <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '180px' }}>{g.productName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Harga Promo:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(g.priceAfterDiscount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nilai Diskon:</span>
                    <span style={{ fontWeight: 600, color: '#D97706' }}>{fmt(g.discountAmount)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed var(--surface-border)', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hasil QTY: <strong>{g.finalClosingQty} pcs</strong></span>
                  <button 
                    onClick={() => setActiveAuditModal(g)}
                    className="btn-outline" 
                    style={{ fontSize: '0.75rem', padding: '4px 10px', height: '28px' }}
                  >
                    Rincian Audit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DATA PESANAN MENTAH (RAW ORDERS STREAM)                            */}
      {/* ========================================================================= */}
      {activeTab === 'RAW_ORDERS' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Audit Aliran Transaksi Pesanan Mentah</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                Menampilkan seluruh transaksi pesanan individual untuk membuktikan eksklusi pesanan batal (COUNT = 0).
              </p>
            </div>
            <span className="badge badge-neutral">{allRawTransactions.length} Total Transaksi</span>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '560px' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.75rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#F8FAFC', zIndex: 10 }}>
                <tr>
                  <th>No. Pesanan</th>
                  <th>Tanggal</th>
                  <th>Platform</th>
                  <th>SKU</th>
                  <th>Nama Produk</th>
                  <th>Promosi</th>
                  <th style={{ textAlign: 'right' }}>Harga</th>
                  <th style={{ textAlign: 'right' }}>Diskon</th>
                  <th style={{ textAlign: 'center' }}>Status Pesanan</th>
                  <th style={{ textAlign: 'center' }}>Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {allRawTransactions.map(tx => {
                  const isCancelled = isOrderCancelled(tx.orderStatus)
                  return (
                    <tr key={tx.id} style={{ backgroundColor: isCancelled ? '#FFF5F5' : 'transparent' }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                        {tx.orderNumber}
                      </td>
                      <td>{typeof tx.date === 'string' ? tx.date.split('T')[0] : '2026-09'}</td>
                      <td>{tx.marketplace}</td>
                      <td style={{ fontFamily: 'monospace' }}>{tx.sku}</td>
                      <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.productName || tx.sku}
                      </td>
                      <td>{tx.promotionName}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(tx.price)}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#D97706' }}>{fmt(tx.discountAmount)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge" style={{ backgroundColor: isCancelled ? '#FEE2E2' : '#DCFCE7', color: isCancelled ? '#991B1B' : '#166534', fontSize: '0.7rem' }}>
                          {tx.orderStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isCancelled ? (
                          <span style={{ color: '#DC2626', fontWeight: 700 }}>COUNT = 0 (Batal)</span>
                        ) : (
                          <span style={{ color: '#16A34A', fontWeight: 700 }}>Valid (Dihitung)</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FINANCE AUDIT DRILLDOWN MODAL                                    */}
      {/* ========================================================================= */}
      {activeAuditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--surface-border)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={20} color="#2563EB" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                    Audit Bukti Perhitungan Finance
                  </h3>
                  <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                    {activeAuditModal.marketplace}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Rincian verifikasi matematis bagaimana angka Quantity <strong>{activeAuditModal.finalClosingQty} pcs</strong> dan Biaya <strong>{fmt(activeAuditModal.biaya)}</strong> diperoleh.
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
                <span style={{ color: 'var(--text-muted)' }}>Program Promo:</span>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{activeAuditModal.promotionName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeAuditModal.promotionCategory}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Produk & SKU:</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{activeAuditModal.sku}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{activeAuditModal.productName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Periode Rekonsiliasi:</span>
                <div style={{ fontWeight: 600 }}>{activeAuditModal.periodLabel}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeAuditModal.periodDateRange}</div>
              </div>
            </div>

            {/* Step-by-Step Mathematical Calculation */}
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E40AF', marginBottom: '10px' }}>
                Langkah Perhitungan Sesuai Aturan Closing:
              </h4>
              <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', color: '#1E3A8A' }}>
                <li>
                  Total pesanan masuk: <strong>{activeAuditModal.totalOrders} order</strong>
                </li>
                <li>
                  Pesanan batal / cancelled yang dikeluarkan (COUNT = 0): <strong style={{ color: 'var(--danger)' }}>{activeAuditModal.cancelledOrders} order</strong>
                </li>
                <li>
                  Total pesanan valid (memenuhi syarat closing): <strong>{activeAuditModal.totalOrders} - {activeAuditModal.cancelledOrders} = {activeAuditModal.validOrders} pesanan valid</strong>
                </li>
                <li>
                  Evaluasi Duplicate Promo Rule: <strong>{activeAuditModal.isDuplicatePromo ? 'Ditemukan promo/diskon yang sama di periode ini ➔ Aturan (÷2) Aktif' : 'Promo UNIK di periode ini ➔ Tidak Dibagi 2'}</strong>
                </li>
                <li>
                  Hasil Akhir Quantity: <strong style={{ color: '#2563EB', fontSize: '0.9375rem' }}>{activeAuditModal.finalClosingQty} PCS</strong> (Formula: {activeAuditModal.formulaDescription})
                </li>
                <li>
                  Perhitungan Biaya Finance: <strong>{activeAuditModal.finalClosingQty} pcs × {fmt(activeAuditModal.priceAfterDiscount)} (Harga Promo Net) = <span style={{ color: '#B91C1C', fontSize: '0.9375rem' }}>{fmt(activeAuditModal.biaya)}</span></strong>
                </li>
              </ol>
            </div>

            {/* Transactions Drilldown Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                  Daftar Transaksi Sumber ({activeAuditModal.transactions.length} pesanan):
                </h4>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Filter No. Pesanan..." 
                    value={auditSearch}
                    onChange={e => setAuditSearch(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px 4px 26px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--surface-border)' }}
                  />
                </div>
              </div>

              <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
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
                    {activeAuditModal.transactions
                      .filter(tx => !auditSearch || tx.orderNumber.toLowerCase().includes(auditSearch.toLowerCase()))
                      .map((tx) => {
                        const isCancelled = isOrderCancelled(tx.orderStatus)
                        return (
                          <tr key={tx.id} style={{ backgroundColor: isCancelled ? '#FFF5F5' : 'transparent' }}>
                            <td style={{ fontFamily: 'monospace', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                              {tx.orderNumber}
                            </td>
                            <td>{typeof tx.date === 'string' ? tx.date.split('T')[0] : '2026-09'}</td>
                            <td>
                              <span className="badge" style={{ backgroundColor: isCancelled ? '#FEE2E2' : '#DCFCE7', color: isCancelled ? '#991B1B' : '#166534', fontSize: '0.68rem' }}>
                                {tx.orderStatus}
                              </span>
                            </td>
                            <td>{fmt(tx.discountAmount)}</td>
                            <td>
                              {isCancelled ? (
                                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>COUNT = 0 (Batal)</span>
                              ) : (
                                <span style={{ color: 'var(--success)', fontWeight: 700 }}>Valid (Hitung)</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border)', paddingTop: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Audit ID: <code>{activeAuditModal.groupId}</code>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => {
                    handleToggleDuplicateRule(activeAuditModal.groupId)
                    setActiveAuditModal(null)
                  }}
                  className="btn-outline" 
                  style={{ fontSize: '0.8125rem' }}
                  disabled={closingStatus === 'Closed'}
                >
                  Ganti Rule Duplikat ({activeAuditModal.isDuplicatePromo ? 'Ubah ke Unik' : 'Ubah ke Duplikat ÷2'})
                </button>
                <button onClick={() => setActiveAuditModal(null)} className="btn-primary" style={{ fontSize: '0.8125rem' }}>
                  Tutup Rincian Audit
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REVIEW PAKET DISKON (BUNDLE VALIDATION)                          */}
      {/* ========================================================================= */}
      {activePaketModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '620px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} color="#2563EB" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Review Paket Diskon Marketplace</h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Validasi komponen bundling produk, rasio isi paket, dan harga promo setelah diskon.
                </p>
              </div>
              <button onClick={() => setActivePaketModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Nama Promo:</strong> {activePaketModal.promotionName}</div>
              <div><strong>Marketplace:</strong> {activePaketModal.marketplace} ({activePaketModal.periodLabel})</div>
              <div><strong>Bundle SKU:</strong> <code style={{ fontWeight: 600 }}>{activePaketModal.sku}</code></div>
              <div><strong>Harga Normal Paket:</strong> {fmt(activePaketModal.price)}</div>
              <div><strong>Potongan Diskon Paket:</strong> {fmt(activePaketModal.discountAmount)} ({activePaketModal.discountPercent}%)</div>
              <div><strong>Harga Promo Net:</strong> <span style={{ fontWeight: 700, color: '#1E40AF' }}>{fmt(activePaketModal.priceAfterDiscount)}</span></div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                Komponen Produk Dalam Paket (Bundle Items):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(activePaketModal.bundleComponents && activePaketModal.bundleComponents.length > 0
                  ? activePaketModal.bundleComponents
                  : ['FPK00000033 (Theraskin Perfect Glow Serum 20ml)', 'FPK00000078 (Theraskin Sunscreen SPF 50 30g)']
                ).map((comp, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '6px', backgroundColor: '#F1F5F9', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#16A34A" />
                      <span style={{ fontWeight: 600 }}>Komponen #{idx + 1}:</span>
                      <span>{comp}</span>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Valid SKU</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '10px 14px', backgroundColor: '#EFF6FF', borderRadius: '8px', fontSize: '0.8125rem', color: '#1E40AF' }}>
              💡 <strong>Catatan Finance:</strong> Seluruh pesanan valid untuk paket diskon ini ({activePaketModal.validOrders} order) dikonversi menjadi {activePaketModal.finalClosingQty} QTY closing dengan total biaya promo {fmt(activePaketModal.biaya)}.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button onClick={() => setActivePaketModal(null)} className="btn-primary" style={{ fontSize: '0.8125rem' }}>
                Selesai Review
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INPUT DATA CLOSING MANUAL                                        */}
      {/* ========================================================================= */}
      {showManualModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '560px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Input Baris Closing Manual</h3>
              <button onClick={() => setShowManualModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Masukkan data promo marketplace. Sistem akan secara otomatis menghitung <strong>Pesanan Valid</strong> dan menentukan <strong>Final QTY & Biaya</strong>.
            </p>

            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Platform</label>
                  <select 
                    value={manualForm.platform} 
                    onChange={e => setManualForm({ ...manualForm, platform: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                  >
                    <option value="Shopee Pusat">Shopee Pusat</option>
                    <option value="Shopee Semarang">Shopee Semarang</option>
                    <option value="TikTok Shop">TikTok Shop</option>
                    <option value="Lazada">Lazada</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Bulan</label>
                  <select 
                    value={manualForm.bulan} 
                    onChange={e => setManualForm({ ...manualForm, bulan: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                  >
                    <option value="September">September</option>
                    <option value="Oktober">Oktober</option>
                    <option value="Agustus">Agustus</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Periode</label>
                  <select 
                    value={manualForm.period} 
                    onChange={e => setManualForm({ ...manualForm, period: e.target.value as any })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                  >
                    <option value="PERIOD_1">1–15 (P1)</option>
                    <option value="PERIOD_2">16–EOM (P2)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Kategori Promosi</label>
                  <select 
                    value={manualForm.kodePromosi} 
                    onChange={e => setManualForm({ ...manualForm, kodePromosi: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                  >
                    <option value="Voucher Toko">Voucher Toko</option>
                    <option value="Promo Flash Sale">Promo Flash Sale</option>
                    <option value="Paket Diskon">Paket Diskon</option>
                    <option value="Voucher Brand Membership">Voucher Brand Membership</option>
                    <option value="Voucher Live / Video">Voucher Live / Video</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Nama Promosi</label>
                  <input 
                    type="text" 
                    value={manualForm.namaPromosi} 
                    onChange={e => setManualForm({ ...manualForm, namaPromosi: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>SKU Produk</label>
                  <input 
                    type="text" 
                    value={manualForm.sku} 
                    onChange={e => setManualForm({ ...manualForm, sku: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Nama Produk</label>
                  <input 
                    type="text" 
                    value={manualForm.productName} 
                    onChange={e => setManualForm({ ...manualForm, productName: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Harga Normal (Rp)</label>
                  <input 
                    type="number" 
                    value={manualForm.price} 
                    onChange={e => setManualForm({ ...manualForm, price: parseFloat(e.target.value) || 0 })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
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
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                    required 
                  />
                </div>
              </div>

              {/* Order Numbers & Duplicate Rule */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '10px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Total Order</label>
                  <input 
                    type="number" 
                    value={manualForm.totalOrders} 
                    onChange={e => setManualForm({ ...manualForm, totalOrders: parseInt(e.target.value) || 0 })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: 'var(--danger)' }}>Batal</label>
                  <input 
                    type="number" 
                    value={manualForm.cancelledOrders} 
                    onChange={e => setManualForm({ ...manualForm, cancelledOrders: parseInt(e.target.value) || 0 })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem', borderColor: '#FED7D7' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Duplikat Promo?</label>
                  <select 
                    value={manualForm.isDuplicatePromo ? 'true' : 'false'} 
                    onChange={e => setManualForm({ ...manualForm, isDuplicatePromo: e.target.value === 'true' })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                  >
                    <option value="true">Ya (Bagi 2)</option>
                    <option value="false">Tidak (Unik)</option>
                  </select>
                </div>
              </div>

              {/* Preview calculation */}
              <div style={{ fontSize: '0.75rem', color: '#1E40AF', padding: '8px 10px', backgroundColor: '#EFF6FF', borderRadius: '6px', border: '1px solid #DBEAFE' }}>
                Preview: ({manualForm.totalOrders} total - {manualForm.cancelledOrders} batal) = {Math.max(0, manualForm.totalOrders - manualForm.cancelledOrders)} valid ➔ <strong>Final QTY: {manualForm.isDuplicatePromo ? Math.max(0, manualForm.totalOrders - manualForm.cancelledOrders) / 2 : Math.max(0, manualForm.totalOrders - manualForm.cancelledOrders)} pcs</strong> | <strong>Biaya: {fmt((manualForm.isDuplicatePromo ? Math.max(0, manualForm.totalOrders - manualForm.cancelledOrders) / 2 : Math.max(0, manualForm.totalOrders - manualForm.cancelledOrders)) * Math.max(0, manualForm.price - manualForm.discountAmount))}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowManualModal(false)} className="btn-outline" style={{ fontSize: '0.8125rem' }}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.8125rem' }}>
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
