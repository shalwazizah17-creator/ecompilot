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
  ChevronDown,
  Sparkles,
  MapPin,
  Flame,
  Tag,
  CheckCheck
} from 'lucide-react'
import * as xlsx from 'xlsx'
import Papa from 'papaparse'
import {
  ClosingRuleType,
  ClosingPeriodType,
  ClosingStatus,
  ClosingType,
  ShopeeBranch,
  MarketplacePlatform,
  SHOPEE_BRANCHES,
  ALL_PLATFORMS,
  isShopeePlatform,
  classifyClosingType,
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

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL')
  const [selectedClosingType, setSelectedClosingType] = useState<'ALL' | ClosingType>('ALL')
  const [selectedPeriode, setSelectedPeriode] = useState<'ALL' | ClosingPeriodType>('ALL')
  const [closingStatus, setClosingStatus] = useState<ClosingStatus>('Ready for Finance')
  const [activeTab, setActiveTab] = useState<'TABLE_REKAP' | 'PROMO_CATALOG' | 'RAW_ORDERS'>('TABLE_REKAP')
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIssueFilter, setActiveIssueFilter] = useState<string | null>(null)

  // Feedback & Copy states
  const [copiedMode, setCopiedMode] = useState<'NONE' | 'ALL' | 'REGULER' | 'CAMPAIGN' | '11COL' | 'AUDIT'>('NONE')
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Modals
  const [activeAuditModal, setActiveAuditModal] = useState<ClosingGroupAudit | null>(null)
  const [activePaketModal, setActivePaketModal] = useState<ClosingGroupAudit | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTargetBranch, setUploadTargetBranch] = useState<string>('AUTO')
  const [auditSearch, setAuditSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    bulan: 'September',
    year: 2026,
    period: 'PERIOD_1' as ClosingPeriodType,
    platform: 'Shopee Semarang' as MarketplacePlatform,
    closingType: 'REGULER' as ClosingType,
    kodePromosi: 'Voucher Toko',
    subCategory: 'Voucher Diskon Toko',
    namaPromosi: 'Voucher Toko Semarang 5K',
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

  // Filter rows based on dropdowns, search, closingType, and active issue filter
  const filteredGroups = useMemo(() => {
    return closingGroups.filter(g => {
      // Month
      const matchBulan = selectedBulan === 'ALL' || g.month.toLowerCase() === selectedBulan.toLowerCase()
      
      // Platform & Branch
      let matchPlatform = true
      if (selectedPlatform === 'ALL') {
        matchPlatform = true
      } else if (selectedPlatform === 'SHOPEE_ALL') {
        matchPlatform = isShopeePlatform(g.marketplace)
      } else {
        matchPlatform = g.marketplace.toLowerCase().includes(selectedPlatform.toLowerCase())
      }

      // Closing Type (Reguler vs Campaign)
      const matchClosingType = selectedClosingType === 'ALL' || g.closingType === selectedClosingType

      // Period
      const matchPeriode = selectedPeriode === 'ALL' || g.closingPeriod === selectedPeriode
      
      // Search
      const q = searchQuery.toLowerCase().trim()
      const matchSearch = !q || 
        g.sku.toLowerCase().includes(q) || 
        g.promotionName.toLowerCase().includes(q) || 
        (g.productName && g.productName.toLowerCase().includes(q)) ||
        g.promotionCategory.toLowerCase().includes(q) ||
        g.marketplace.toLowerCase().includes(q)

      // Issue filter
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

      return matchBulan && matchPlatform && matchClosingType && matchPeriode && matchSearch && matchIssue
    })
  }, [closingGroups, selectedBulan, selectedPlatform, selectedClosingType, selectedPeriode, searchQuery, activeIssueFilter])

  // Summary statistics for Filtered Rows
  const totalBiayaPromosi = useMemo(() => {
    return filteredGroups.reduce((sum, g) => sum + (g.biaya || g.totalBiayaPromo || 0), 0)
  }, [filteredGroups])

  const totalBiayaReguler = useMemo(() => {
    return filteredGroups.filter(g => g.closingType === 'REGULER').reduce((sum, g) => sum + (g.biaya || 0), 0)
  }, [filteredGroups])

  const totalBiayaCampaign = useMemo(() => {
    return filteredGroups.filter(g => g.closingType === 'CAMPAIGN').reduce((sum, g) => sum + (g.biaya || 0), 0)
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

  // 1-Click Copy Handlers
  const handleCopyAll = async () => {
    if (filteredGroups.length === 0) return
    const tsv = generateMasterClosingTSV(filteredGroups)
    await safeCopyToClipboard(tsv)
    setCopiedMode('ALL')
    showToast(`Tercopy ${filteredGroups.length} baris (Semua Closing)! Siap paste (Ctrl+V) ke Master Closing.`)
    setTimeout(() => setCopiedMode('NONE'), 4000)
  }

  const handleCopyReguler = async () => {
    const regulerRows = filteredGroups.filter(g => g.closingType === 'REGULER')
    if (regulerRows.length === 0) {
      alert('Tidak ada baris Closingan Reguler pada filter saat ini!')
      return
    }
    const tsv = generateMasterClosingTSV(filteredGroups, 'REGULER')
    await safeCopyToClipboard(tsv)
    setCopiedMode('REGULER')
    showToast(`Tercopy ${regulerRows.length} baris khusus Closingan Reguler! Siap paste ke Sheet Master Closing.`)
    setTimeout(() => setCopiedMode('NONE'), 4000)
  }

  const handleCopyCampaign = async () => {
    const campaignRows = filteredGroups.filter(g => g.closingType === 'CAMPAIGN')
    if (campaignRows.length === 0) {
      alert('Tidak ada baris Closingan Campaign pada filter saat ini!')
      return
    }
    const tsv = generateMasterClosingTSV(filteredGroups, 'CAMPAIGN')
    await safeCopyToClipboard(tsv)
    setCopiedMode('CAMPAIGN')
    showToast(`Tercopy ${campaignRows.length} baris khusus Closingan Campaign! Siap paste ke Sheet Master Closing.`)
    setTimeout(() => setCopiedMode('NONE'), 4000)
  }

  const handleCopyStandard11Col = async () => {
    if (filteredGroups.length === 0) return
    const tsv = generateStandardMasterClosingTSV(filteredGroups)
    await safeCopyToClipboard(tsv)
    setCopiedMode('11COL')
    showToast(`Tercopy format 11 kolom Master Closing dengan header.`)
    setTimeout(() => setCopiedMode('NONE'), 4000)
  }

  const handleCopyFullAudit = async () => {
    if (filteredGroups.length === 0) return
    const tsv = generateFullAuditTSV(filteredGroups)
    await safeCopyToClipboard(tsv)
    setCopiedMode('AUDIT')
    showToast(`Tercopy format audit rincian lengkap (Total Order, Batal, Valid, Cabang, Rule, QTY, Biaya).`)
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
      showToast('Kalkulasi Closing selesai! Semua pesanan valid, cabang, rule duplikat, dan biaya telah diperbarui.')
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
      const masterRows = filteredGroups.map(r => ({
        'Platform': r.marketplace,
        'Cabang': r.branchCity || '-',
        'Tipe Closing': r.closingType,
        'Kode Promosi': r.promotionCategory,
        'Nama Promosi': r.promotionName,
        'Kode SKU': r.sku,
        'Nama Produk': r.productName || '',
        'Periode': r.periodLabel,
        'Harga Bulanan': r.price,
        'Diskon': r.discountPercent > 0 ? `${r.discountPercent}%` : '',
        'Total Diskon': r.discountAmount,
        'Harga Promo (Net)': r.priceAfterDiscount,
        'Quantity': r.finalClosingQty,
        'Biaya Promo (Net)': Math.round(r.biaya)
      }))

      const auditRows = filteredGroups.map(r => ({
        'Platform': r.marketplace,
        'Cabang': r.branchCity || '-',
        'Tipe Closing': r.closingType,
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

  // Handle Upload Raw Order Excel / CSV via Automated Smart Pipeline
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

      // Determine platform / branch
      let targetMarketplace = 'Shopee Semarang'
      if (uploadTargetBranch !== 'AUTO') {
        targetMarketplace = uploadTargetBranch
      } else {
        const filenameLow = file.name.toLowerCase()
        if (filenameLow.includes('semarang')) targetMarketplace = 'Shopee Semarang'
        else if (filenameLow.includes('bali')) targetMarketplace = 'Shopee Bali'
        else if (filenameLow.includes('surabaya')) targetMarketplace = 'Shopee Surabaya'
        else if (filenameLow.includes('pusat')) targetMarketplace = 'Shopee Pusat'
        else if (filenameLow.includes('tiktok')) targetMarketplace = 'TikTok Shop'
        else if (filenameLow.includes('lazada')) targetMarketplace = 'Lazada'
        else if (selectedPlatform !== 'ALL' && selectedPlatform !== 'SHOPEE_ALL') targetMarketplace = selectedPlatform
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
        
        // Anti-Pusing: Otomatis potong periode 1 (1-15) vs 2 (16-30/31)
        const period = getClosingPeriod(dateRaw)

        let promoCategory = 'Voucher Toko'
        const promoLow = promoName.toLowerCase()
        if (promoLow.includes('flash sale')) promoCategory = 'Promo Flash Sale'
        else if (promoLow.includes('paket') || promoLow.includes('combo')) promoCategory = 'Paket Diskon'
        else if (promoLow.includes('membership') || promoLow.includes('member')) promoCategory = 'Voucher Brand Membership'
        else if (promoLow.includes('live') || promoLow.includes('video')) promoCategory = 'Voucher Live / Video'

        // Anti-Pusing: Otomatis klasifikasi Reguler vs Campaign
        const closingType = classifyClosingType(promoCategory, promoName, hargaAwal, totalDiskon)

        return {
          id: `tx-${idx}-${orderNumber}`,
          orderNumber,
          date: dateRaw,
          month: selectedBulan,
          period,
          marketplace: targetMarketplace,
          closingType,
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
      setClosingGroups(prev => [...result.groups, ...prev])
      setClosingStatus('Data Imported')
      setShowUploadModal(false)
      showToast(`Sukses! ${transactions.length} pesanan otomatis disortir ke Periode 1 & 2 untuk ${targetMarketplace}.`)

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
      closingType,
      kodePromosi, 
      subCategory,
      namaPromosi, 
      sku, 
      productName, 
      isDuplicatePromo 
    } = manualForm

    const validOrders = Math.max(0, totalOrders - cancelledOrders)

    const txs: RawOrderTransaction[] = [
      ...Array.from({ length: validOrders }).map((_, i) => ({
        id: `manual-v-${Date.now()}-${i}`,
        orderNumber: `ORD-M-V-${i + 1}`,
        date: period === 'PERIOD_1' ? `${year}-09-05` : `${year}-09-20`,
        month: bulan,
        period,
        marketplace: platform,
        closingType,
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
        closingType,
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
    showToast(`Baris promo "${namaPromosi}" (${platform} - ${closingType}) berhasil ditambahkan.`)
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
    if (confirm('Muat ulang data referensi lengkap Theraskin (Shopee Semarang, Bali, Surabaya, Pusat, TikTok, Lazada)?')) {
      setClosingGroups(generateTheraskinClosingSeed(selectedBulan, selectedTahun))
      setActiveIssueFilter(null)
      setSearchQuery('')
      setSelectedPlatform('ALL')
      setSelectedClosingType('ALL')
      showToast('Data referensi closing Theraskin multi-cabang berhasil dimuat ulang.')
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
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeInUp 0.25s ease-out'
        }}>
          <CheckCircle2 size={18} color="#4ADE80" />
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} style={{ color: '#94A3B8', marginLeft: '8px', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. ANTI-PUSING PIPELINE BANNER (ZERO-HEADACHE EXPLAINER) */}
      <div style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        color: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.3)', border: '1px solid rgba(147, 197, 253, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93C5FD' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em', color: '#F8FAFC' }}>
                Pipeline Closing Otomatis (Anti-Pusing Data Mentah)
              </span>
              <span className="badge" style={{ backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: '0.68rem', padding: '2px 8px' }}>
                Multi-Cabang Shopee
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
              Upload file pesanan mentah ➔ Sistem otomatis potong <strong>Tgl 1–15 & 16–30/31</strong>, bersihkan batal (COUNT=0), pisahkan <strong>Shopee Semarang/Bali/Surabaya/Pusat</strong>, dan kelompokkan <strong>Harga Campaign vs Reguler</strong>.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
            style={{ fontSize: '0.8125rem', padding: '7px 14px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563EB', fontWeight: 600 }}
          >
            <UploadCloud size={15} /> Upload File Order
          </button>
          <button
            onClick={handleCopyAll}
            className="btn-outline"
            style={{ fontSize: '0.8125rem', padding: '7px 14px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}
            disabled={filteredGroups.length === 0}
          >
            <Copy size={14} /> 1-Click Copy Master
          </button>
        </div>
      </div>

      {/* 3. PAGE HEADER & PRIMARY ACTION BUTTONS */}
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
          <p className="page-subtitle" style={{ maxWidth: '820px' }}>
            Rekonsiliasi data promo untuk Finance. Menghasilkan <strong>Quantity + Biaya</strong> untuk <strong>Shopee (Pusat, Semarang, Bali, Surabaya)</strong>, <strong>TikTok Shop</strong>, dan <strong>Lazada</strong>, dengan pemisahan harga khusus Campaign.
          </p>
        </div>

        {/* 1-Click Copy Strip (Reguler, Campaign, & Semua) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Copy Reguler Only */}
          <button 
            onClick={handleCopyReguler}
            className="btn-outline"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.75rem', 
              height: '36px',
              backgroundColor: copiedMode === 'REGULER' ? 'var(--success-light)' : 'var(--surface)',
              color: copiedMode === 'REGULER' ? 'var(--success)' : '#1E293B',
              borderColor: copiedMode === 'REGULER' ? 'var(--success-border)' : 'var(--surface-border-strong)'
            }}
            title="Salin 6 kolom baris Closingan Reguler saja"
          >
            {copiedMode === 'REGULER' ? <Check size={14} /> : <Tag size={14} color="#2563EB" />}
            {copiedMode === 'REGULER' ? 'Tercopy Reguler!' : 'Copy Closingan Reguler'}
          </button>

          {/* Copy Campaign Only */}
          <button 
            onClick={handleCopyCampaign}
            className="btn-outline"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.75rem', 
              height: '36px',
              backgroundColor: copiedMode === 'CAMPAIGN' ? 'var(--success-light)' : 'var(--surface)',
              color: copiedMode === 'CAMPAIGN' ? 'var(--success)' : '#1E293B',
              borderColor: copiedMode === 'CAMPAIGN' ? 'var(--success-border)' : 'var(--surface-border-strong)'
            }}
            title="Salin 6 kolom baris Closingan Campaign saja"
          >
            {copiedMode === 'CAMPAIGN' ? <Check size={14} /> : <Flame size={14} color="#EA580C" />}
            {copiedMode === 'CAMPAIGN' ? 'Tercopy Campaign!' : 'Copy Closingan Campaign'}
          </button>

          {/* 1-CLICK COPY ALL */}
          <button 
            onClick={handleCopyAll} 
            className="btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.8125rem', 
              height: '36px', 
              backgroundColor: copiedMode === 'ALL' ? 'var(--success)' : '#2563EB',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
            }}
            disabled={filteredGroups.length === 0}
            title="Salin semua baris 6 kolom TSV: Platform | Kode Promosi | Nama Promosi | SKU | Quantity | Biaya"
          >
            {copiedMode === 'ALL' ? <Check size={16} /> : <Copy size={16} />}
            {copiedMode === 'ALL' ? 'Tercopy Semua!' : 'COPY HASIL CLOSING'}
          </button>

          {/* Export Excel */}
          <button 
            onClick={handleExportExcel} 
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', height: '36px' }}
            disabled={filteredGroups.length === 0}
          >
            <Download size={14} /> Export Excel
          </button>

          {/* Input Manual */}
          <button 
            onClick={() => setShowManualModal(true)}
            className="btn-outline" 
            style={{ fontSize: '0.75rem', height: '36px', display: 'flex', alignItems: 'center', gap: '6px' }}
            disabled={closingStatus === 'Closed'}
          >
            <Plus size={14} /> Input Manual
          </button>
        </div>
      </div>

      {/* 4. MAIN FILTER & BRANCH SELECTOR BAR */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Row A: Month, Year, Period, Status */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
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

            {/* Periode Closing (Dynamic 1-15 & 16-EOM) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Periode:</span>
              <select 
                value={selectedPeriode} 
                onChange={e => setSelectedPeriode(e.target.value as any)} 
                className="filter-select"
                style={{ padding: '6px 12px', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid var(--surface-border-strong)', backgroundColor: 'var(--surface)', fontWeight: 600 }}
              >
                <option value="ALL">Semua Periode (1 – {periodLabels.lastDay})</option>
                <option value="PERIOD_1">{periodLabels.p1Label}</option>
                <option value="PERIOD_2">{periodLabels.p2Label}</option>
              </select>
            </div>

            {/* Status Closing */}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={handleResetSeedData}
              className="btn-ghost" 
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Reset data awal multi-cabang"
            >
              <RefreshCw size={12} /> Reset Data Theraskin
            </button>
            {closingGroups.length > 0 && (
              <button 
                onClick={() => {
                  if (closingStatus === 'Closed') {
                    alert('Status Closed! Buka kunci terlebih dahulu.')
                    return
                  }
                  if (confirm('Kosongkan semua data closing?')) setClosingGroups([])
                }}
                className="btn-ghost" 
                style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={12} /> Bersihkan
              </button>
            )}
          </div>
        </div>

        {/* Row B: Marketplace Platform & Shopee Branches Quick Switcher */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--surface-border)' }}>
          
          {/* Branch Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px', textTransform: 'uppercase' }}>
              Cabang / Toko:
            </span>

            <button
              onClick={() => setSelectedPlatform('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: selectedPlatform === 'ALL' ? 700 : 500,
                backgroundColor: selectedPlatform === 'ALL' ? '#0F172A' : '#F1F5F9',
                color: selectedPlatform === 'ALL' ? '#FFFFFF' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: selectedPlatform === 'ALL' ? '#0F172A' : 'transparent',
                cursor: 'pointer'
              }}
            >
              Semua Platform ({closingGroups.length})
            </button>

            {/* Shopee Semarang */}
            <button
              onClick={() => setSelectedPlatform('Shopee Semarang')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: selectedPlatform === 'Shopee Semarang' ? 700 : 500,
                backgroundColor: selectedPlatform === 'Shopee Semarang' ? '#EA580C' : '#FFF7ED',
                color: selectedPlatform === 'Shopee Semarang' ? '#FFFFFF' : '#C2410C',
                border: '1px solid',
                borderColor: selectedPlatform === 'Shopee Semarang' ? '#EA580C' : '#FED7AA',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <MapPin size={12} /> Shopee Semarang
            </button>

            {/* Shopee Bali */}
            <button
              onClick={() => setSelectedPlatform('Shopee Bali')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: selectedPlatform === 'Shopee Bali' ? 700 : 500,
                backgroundColor: selectedPlatform === 'Shopee Bali' ? '#EA580C' : '#FFF7ED',
                color: selectedPlatform === 'Shopee Bali' ? '#FFFFFF' : '#C2410C',
                border: '1px solid',
                borderColor: selectedPlatform === 'Shopee Bali' ? '#EA580C' : '#FED7AA',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <MapPin size={12} /> Shopee Bali
            </button>

            {/* Shopee Surabaya */}
            <button
              onClick={() => setSelectedPlatform('Shopee Surabaya')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: selectedPlatform === 'Shopee Surabaya' ? 700 : 500,
                backgroundColor: selectedPlatform === 'Shopee Surabaya' ? '#EA580C' : '#FFF7ED',
                color: selectedPlatform === 'Shopee Surabaya' ? '#FFFFFF' : '#C2410C',
                border: '1px solid',
                borderColor: selectedPlatform === 'Shopee Surabaya' ? '#EA580C' : '#FED7AA',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <MapPin size={12} /> Shopee Surabaya
            </button>

            {/* Shopee Pusat */}
            <button
              onClick={() => setSelectedPlatform('Shopee Pusat')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: selectedPlatform === 'Shopee Pusat' ? 700 : 500,
                backgroundColor: selectedPlatform === 'Shopee Pusat' ? '#EA580C' : '#FFF7ED',
                color: selectedPlatform === 'Shopee Pusat' ? '#FFFFFF' : '#C2410C',
                border: '1px solid',
                borderColor: selectedPlatform === 'Shopee Pusat' ? '#EA580C' : '#FED7AA',
                cursor: 'pointer'
              }}
            >
              Shopee Pusat
            </button>

            {/* TikTok Shop (Tanpa Cabang) */}
            <button
              onClick={() => setSelectedPlatform('TikTok Shop')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: selectedPlatform === 'TikTok Shop' ? 700 : 500,
                backgroundColor: selectedPlatform === 'TikTok Shop' ? '#0F172A' : '#F8FAFC',
                color: selectedPlatform === 'TikTok Shop' ? '#FFFFFF' : '#0F172A',
                border: '1px solid',
                borderColor: selectedPlatform === 'TikTok Shop' ? '#0F172A' : '#CBD5E1',
                cursor: 'pointer'
              }}
            >
              TikTok Shop
            </button>

            {/* Lazada (Tanpa Cabang) */}
            <button
              onClick={() => setSelectedPlatform('Lazada')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: selectedPlatform === 'Lazada' ? 700 : 500,
                backgroundColor: selectedPlatform === 'Lazada' ? '#2563EB' : '#EFF6FF',
                color: selectedPlatform === 'Lazada' ? '#FFFFFF' : '#1D4ED8',
                border: '1px solid',
                borderColor: selectedPlatform === 'Lazada' ? '#2563EB' : '#BFDBFE',
                cursor: 'pointer'
              }}
            >
              Lazada
            </button>
          </div>

          {/* Closing Type Selector: Reguler vs Campaign */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tipe:
            </span>
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '2px' }}>
              <button
                onClick={() => setSelectedClosingType('ALL')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: selectedClosingType === 'ALL' ? 700 : 500,
                  backgroundColor: selectedClosingType === 'ALL' ? '#FFFFFF' : 'transparent',
                  color: selectedClosingType === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: selectedClosingType === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Semua Tipe
              </button>
              <button
                onClick={() => setSelectedClosingType('REGULER')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: selectedClosingType === 'REGULER' ? 700 : 500,
                  backgroundColor: selectedClosingType === 'REGULER' ? '#FFFFFF' : 'transparent',
                  color: selectedClosingType === 'REGULER' ? '#2563EB' : 'var(--text-secondary)',
                  boxShadow: selectedClosingType === 'REGULER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Tag size={12} /> Promo Reguler
              </button>
              <button
                onClick={() => setSelectedClosingType('CAMPAIGN')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: selectedClosingType === 'CAMPAIGN' ? 700 : 500,
                  backgroundColor: selectedClosingType === 'CAMPAIGN' ? '#FFFFFF' : 'transparent',
                  color: selectedClosingType === 'CAMPAIGN' ? '#EA580C' : 'var(--text-secondary)',
                  boxShadow: selectedClosingType === 'CAMPAIGN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Flame size={12} /> Closingan Campaign
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 5. SUMMARY KPI CARDS (REGULER VS CAMPAIGN BREAKDOWN) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        
        {/* Total Program */}
        <div className="stat-card" style={{ padding: '14px 18px' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total Program</span>
            <Package size={15} color="var(--text-muted)" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem', marginTop: '4px' }}>
            {filteredGroups.length} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>baris</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {selectedPlatform === 'ALL' ? 'Multi-cabang & platform' : selectedPlatform}
          </div>
        </div>

        {/* Total QTY Terjual */}
        <div className="stat-card" style={{ padding: '14px 18px' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total QTY Closing</span>
            <Boxes size={15} color="#2563EB" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem', color: '#2563EB', marginTop: '4px' }}>
            {totalClosingQty.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>pcs</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {totalValidOrders.toLocaleString()} valid (-{totalCancelledOrders} batal)
          </div>
        </div>

        {/* Biaya Promo Reguler */}
        <div className="stat-card" style={{ padding: '14px 18px', backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1E40AF' }}>
            <span>Biaya Promo Reguler</span>
            <Tag size={15} color="#2563EB" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem', color: '#1E40AF', marginTop: '4px' }}>
            {fmt(totalBiayaReguler)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#3B82F6', marginTop: '2px' }}>
            Voucher & diskon toko
          </div>
        </div>

        {/* Biaya Closingan Campaign */}
        <div className="stat-card" style={{ padding: '14px 18px', backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#C2410C' }}>
            <span>Biaya Campaign</span>
            <Flame size={15} color="#EA580C" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem', color: '#EA580C', marginTop: '4px' }}>
            {fmt(totalBiayaCampaign)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#F97316', marginTop: '2px' }}>
            Harga khusus Campaign & Mega
          </div>
        </div>

        {/* Grand Total Biaya */}
        <div className="stat-card" style={{ padding: '14px 18px', backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#991B1B' }}>
            <span>Grand Total Biaya</span>
            <Calculator size={15} color="#DC2626" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem', color: '#DC2626', marginTop: '4px' }}>
            {fmt(totalBiayaPromosi)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '2px' }}>
            Total rekonsiliasi Finance
          </div>
        </div>

      </div>

      {/* 6. PERLU REVIEW PANEL */}
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
              <AlertTriangle size={15} color="#D97706" /> PERLU REVIEW ({validationSummary.totalIssues}):
            </span>

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
                <span>⚠️ {validationSummary.duplicateCount} Duplicate Promo (÷2)</span>
              </button>
            )}

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
                <span>📦 {validationSummary.paketCount} Paket Diskon</span>
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

        {/* Quick Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Cari SKU / Promo / Cabang..." 
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
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={12} />
              </button>
            )}
          </div>
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
                  <th style={{ minWidth: '130px', position: 'sticky', left: 0, backgroundColor: '#F8FAFC', zIndex: 11 }}>Marketplace & Cabang</th>
                  <th style={{ minWidth: '95px', textAlign: 'center' }}>Tipe Closing</th>
                  <th style={{ minWidth: '130px' }}>Kategori (Kode)</th>
                  <th style={{ minWidth: '140px' }}>Sub Kategori / Campaign</th>
                  <th style={{ minWidth: '85px', textAlign: 'center' }}>Periode</th>
                  <th style={{ minWidth: '110px' }}>Tanggal Promo</th>
                  <th style={{ minWidth: '110px', fontFamily: 'monospace' }}>SKU</th>
                  <th style={{ minWidth: '190px' }}>Product Name</th>
                  <th style={{ textAlign: 'right', minWidth: '95px' }}>Harga Normal</th>
                  <th style={{ textAlign: 'center', minWidth: '65px' }}>Diskon</th>
                  <th style={{ textAlign: 'right', minWidth: '95px' }}>Total Diskon</th>
                  <th style={{ textAlign: 'right', minWidth: '105px', backgroundColor: '#F1F5F9' }}>Harga Promo (Net)</th>
                  <th style={{ textAlign: 'center', minWidth: '80px', backgroundColor: '#F8FAFC' }}>Total Orders</th>
                  <th style={{ textAlign: 'center', minWidth: '75px', backgroundColor: '#FFF5F5', color: '#DC2626' }}>Batal</th>
                  <th style={{ textAlign: 'center', minWidth: '75px', backgroundColor: '#F0FDF4', color: '#16A34A' }}>Valid</th>
                  <th style={{ textAlign: 'center', minWidth: '105px' }}>Duplicate Rule</th>
                  <th style={{ textAlign: 'center', minWidth: '95px', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }}>FINAL QTY</th>
                  <th style={{ textAlign: 'right', minWidth: '120px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontWeight: 700 }}>BIAYA</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={19} style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: 'var(--surface)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '440px', margin: '0 auto', gap: '12px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', marginBottom: '4px' }}>
                          <FileSpreadsheet size={28} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          Belum Ada Data Closing Yang Cocok
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          Tidak ditemukan baris closing untuk cabang / tipe promo yang dipilih. Klik <strong>"Upload File Order"</strong> untuk import otomatis atau <strong>"Reset Data Theraskin"</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button onClick={handleResetSeedData} className="btn-primary" style={{ fontSize: '0.8125rem', padding: '8px 14px' }}>
                            Muat Data Theraskin
                          </button>
                          <button onClick={() => setShowUploadModal(true)} className="btn-outline" style={{ fontSize: '0.8125rem', padding: '8px 14px' }}>
                            Upload Pesanan
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => {
                    const isCampaign = g.closingType === 'CAMPAIGN'
                    const platformBadgeColor = g.marketplace.includes('Shopee')
                      ? { bg: '#FFF7ED', text: '#EA580C', border: '#FFEDD5' }
                      : g.marketplace.includes('TikTok')
                        ? { bg: '#F8FAFC', text: '#0F172A', border: '#E2E8F0' }
                        : { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE' }

                    return (
                      <tr key={g.groupId} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        
                        {/* 1. Marketplace & Cabang (Sticky Left) */}
                        <td style={{ position: 'sticky', left: 0, backgroundColor: 'var(--surface)', zIndex: 5 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="badge" style={{ backgroundColor: platformBadgeColor.bg, color: platformBadgeColor.text, borderColor: platformBadgeColor.border, fontSize: '0.72rem' }}>
                              {g.marketplace}
                            </span>
                            {g.branchCity && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px', paddingLeft: '4px' }}>
                                <MapPin size={10} /> Cabang {g.branchCity}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Tipe Closing (Reguler vs Campaign) */}
                        <td style={{ textAlign: 'center' }}>
                          {isCampaign ? (
                            <span className="badge" style={{ backgroundColor: '#FFF7ED', color: '#EA580C', borderColor: '#FFEDD5', fontSize: '0.68rem', fontWeight: 700 }}>
                              <Flame size={11} /> Campaign
                            </span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#DBEAFE', fontSize: '0.68rem', fontWeight: 600 }}>
                              <Tag size={11} /> Reguler
                            </span>
                          )}
                        </td>

                        {/* 3. Kategori Promosi */}
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {g.promotionCategory}
                        </td>

                        {/* 4. Sub Kategori / Campaign */}
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          {g.subCategory || g.promotionName}
                        </td>

                        {/* 5. Periode */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.7rem' }}>
                            {g.closingPeriod === 'PERIOD_1' ? '1–15' : `16–${periodLabels.lastDay}`} {g.month.slice(0, 3)}
                          </span>
                        </td>

                        {/* 6. Tanggal Promo */}
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {g.periodDateRange || (g.closingPeriod === 'PERIOD_1' ? periodLabels.p1DateRange : periodLabels.p2DateRange)}
                        </td>

                        {/* 7. SKU */}
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1E293B', fontSize: '0.8rem' }}>
                          {g.sku}
                        </td>

                        {/* 8. Product Name */}
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

                        {/* 9. Harga Normal */}
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                          {fmt(g.price)}
                        </td>

                        {/* 10. Diskon % */}
                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                          {g.discountPercent > 0 ? `${g.discountPercent}%` : '-'}
                        </td>

                        {/* 11. Total Diskon (Rp) */}
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#D97706' }}>
                          {fmt(g.discountAmount)}
                        </td>

                        {/* 12. Harga Promo (Harga Setelah Diskon / Beda saat Campaign) */}
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, backgroundColor: isCampaign ? '#FFF7ED' : '#F8FAFC', color: isCampaign ? '#C2410C' : 'var(--text-primary)' }}>
                          {fmt(g.priceAfterDiscount)}
                          {isCampaign && <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#EA580C' }}>Harga Campaign</span>}
                        </td>

                        {/* 13. Total Orders */}
                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', backgroundColor: '#F8FAFC' }}>
                          {g.totalOrders}
                        </td>

                        {/* 14. Pesanan Batal (Excluded, COUNT = 0) */}
                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: g.cancelledOrders > 0 ? '#DC2626' : 'var(--text-muted)', backgroundColor: '#FFF5F5', fontWeight: g.cancelledOrders > 0 ? 700 : 400 }}>
                          {g.cancelledOrders > 0 ? `-${g.cancelledOrders}` : '0'}
                        </td>

                        {/* 15. Pesanan Valid */}
                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: '#16A34A', backgroundColor: '#F0FDF4', fontWeight: 700 }}>
                          {g.validOrders}
                        </td>

                        {/* 16. Duplicate Rule (Ya ÷2 / Tidak) */}
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

                        {/* 17. FINAL QTY (Clickable drilldown) */}
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

                        {/* 18. BIAYA (Final QTY × Harga Setelah Diskon) */}
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#B91C1C', fontVariantNumeric: 'tabular-nums', backgroundColor: '#FEF2F2' }}>
                          {fmt(g.biaya)}
                        </td>

                        {/* 19. Action column */}
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

              {/* SPREADSHEET FOOTERS & SUB-TOTALS */}
              {filteredGroups.length > 0 && (
                <tfoot>
                  {/* Period 1 Subtotal */}
                  <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid var(--surface-border)', fontSize: '0.8125rem' }}>
                    <td colSpan={8} style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
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
                    <td colSpan={8} style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
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
                    <td colSpan={8} style={{ padding: '14px 16px', color: '#F8FAFC' }}>
                      GRAND TOTAL CLOSING ({filteredGroups.length} PROGRAM):
                    </td>
                    <td colSpan={4} style={{ textAlign: 'right', padding: '14px 16px', color: '#94A3B8', fontSize: '0.75rem' }}>
                      Order: {totalRawOrders} (Batal: -{totalCancelledOrders})
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 8px', color: '#E2E8F0' }}>{totalRawOrders}</td>
                    <td style={{ textAlign: 'center', padding: '14px 8px', color: '#FCA5A5' }}>-{totalCancelledOrders}</td>
                    <td style={{ textAlign: 'center', padding: '14px 8px', color: '#86EFAC' }}>{totalValidOrders}</td>
                    <td style={{ textAlign: 'center', padding: '14px 8px', color: '#FCD34D', fontSize: '0.75rem' }}>Final</td>
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

          {/* Bottom Bar with 1-Click Copy Reminder */}
          <div style={{ padding: '12px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={16} color="var(--primary)" />
              <span>
                Format TSV 6 Kolom: <code>Platform / Cabang \t Kode Promosi \t Nama Promosi \t SKU \t Quantity \t Biaya</code> (Siap Paste di Master Closing)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCopyReguler}
                className="btn-outline"
                style={{ fontSize: '0.75rem', padding: '6px 12px', height: '32px' }}
              >
                Copy Reguler
              </button>
              <button
                onClick={handleCopyCampaign}
                className="btn-outline"
                style={{ fontSize: '0.75rem', padding: '6px 12px', height: '32px' }}
              >
                Copy Campaign
              </button>
              <button
                onClick={handleCopyAll}
                className="btn-primary"
                style={{ fontSize: '0.8125rem', padding: '6px 14px', backgroundColor: copiedMode === 'ALL' ? 'var(--success)' : '#2563EB' }}
                disabled={filteredGroups.length === 0}
              >
                {copiedMode === 'ALL' ? <Check size={14} /> : <Copy size={14} />}
                {copiedMode === 'ALL' ? 'Tercopy Semua' : 'COPY HASIL CLOSING'}
              </button>
            </div>
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
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Katalog Referensi Promo Closing (Reguler & Campaign)</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                Daftar program promo acuan untuk rekonsiliasi data pesanan marketplace cabang dan pusat.
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
                  backgroundColor: g.closingType === 'CAMPAIGN' ? '#FFFDF5' : '#FAFAFA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '0.72rem' }}>
                    {g.marketplace}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {g.closingType === 'CAMPAIGN' ? (
                      <span className="badge" style={{ backgroundColor: '#FFF7ED', color: '#EA580C', fontSize: '0.68rem' }}>
                        <Flame size={10} /> Campaign
                      </span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                        <Tag size={10} /> Reguler
                      </span>
                    )}
                    <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                      {g.closingPeriod === 'PERIOD_1' ? 'P1 (1-15)' : 'P2 (16-EOM)'}
                    </span>
                  </div>
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
                    <span style={{ fontWeight: 700, color: g.closingType === 'CAMPAIGN' ? '#EA580C' : 'var(--text-primary)' }}>
                      {fmt(g.priceAfterDiscount)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Diskon Satuan:</span>
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
                Menampilkan seluruh transaksi pesanan individual dari Shopee (Semarang, Bali, Surabaya, Pusat), TikTok, dan Lazada.
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
                  <th>Periode</th>
                  <th>Platform & Cabang</th>
                  <th>Tipe</th>
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
                      <td>
                        <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: '#F1F5F9' }}>
                          {tx.period === 'PERIOD_1' ? '1–15' : '16–EOM'}
                        </span>
                      </td>
                      <td>{tx.marketplace}</td>
                      <td>
                        {tx.closingType === 'CAMPAIGN' ? (
                          <span className="badge" style={{ backgroundColor: '#FFF7ED', color: '#EA580C', fontSize: '0.65rem' }}>Campaign</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '0.65rem' }}>Reguler</span>
                        )}
                      </td>
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
      {/* MODAL: SMART UPLOAD DENGAN TARGET CABANG                                  */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '540px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UploadCloud size={20} color="#2563EB" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Upload File Pesanan Marketplace</h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Sistem otomatis membagi transaksi ke Periode 1 (1–15) dan Periode 2 (16–30/31).
                </p>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Pilih Target Platform / Cabang:
              </label>
              <select
                value={uploadTargetBranch}
                onChange={e => setUploadTargetBranch(e.target.value)}
                className="filter-select"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.875rem' }}
              >
                <option value="AUTO">✨ Auto-Detect (Otomatis deteksi dari nama file/header)</option>
                <optgroup label="Shopee Multi-Cabang">
                  <option value="Shopee Semarang">Shopee Semarang</option>
                  <option value="Shopee Bali">Shopee Bali</option>
                  <option value="Shopee Surabaya">Shopee Surabaya</option>
                  <option value="Shopee Pusat">Shopee Pusat</option>
                </optgroup>
                <optgroup label="Platform Lainnya">
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="Lazada">Lazada</option>
                </optgroup>
              </select>
            </div>

            <div style={{
              border: '2px dashed var(--surface-border-strong)',
              borderRadius: '10px',
              padding: '28px 20px',
              textAlign: 'center',
              backgroundColor: '#F8FAFC',
              cursor: 'pointer'
            }} onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx,.xls,.csv" 
                style={{ display: 'none' }} 
              />
              <UploadCloud size={32} color="#2563EB" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Klik di sini untuk memilih file .xlsx atau .csv
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Mendukung export pesanan resmi Shopee, TikTok Shop, atau Lazada
              </div>
            </div>

            <div style={{ backgroundColor: '#EFF6FF', padding: '10px 14px', borderRadius: '8px', fontSize: '0.78rem', color: '#1E40AF', lineHeight: 1.4 }}>
              💡 <strong>Zero-Headache Pipeline:</strong> Anda tidak perlu memisahkan tanggal manual di Excel. Tanggal 1–15 akan masuk Periode 1 dan tanggal 16–30/31 akan masuk Periode 2 secara otomatis.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowUploadModal(false)} className="btn-outline" style={{ fontSize: '0.8125rem' }}>
                Batal
              </button>
            </div>

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
                  {activeAuditModal.closingType === 'CAMPAIGN' && (
                    <span className="badge" style={{ backgroundColor: '#FFF7ED', color: '#EA580C' }}>
                      Campaign
                    </span>
                  )}
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
                  Perhitungan Biaya Finance: <strong>{activeAuditModal.finalClosingQty} pcs × {fmt(activeAuditModal.priceAfterDiscount)} ({activeAuditModal.closingType === 'CAMPAIGN' ? 'Harga Khusus Campaign' : 'Harga Promo Net'}) = <span style={{ color: '#B91C1C', fontSize: '0.9375rem' }}>{fmt(activeAuditModal.biaya)}</span></strong>
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
      {/* MODAL 2: REVIEW PAKET DISKON                                              */}
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
          <div className="card fade-in" style={{ width: '100%', maxWidth: '580px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Input Baris Closing Manual</h3>
              <button onClick={() => setShowManualModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Platform / Cabang</label>
                  <select 
                    value={manualForm.platform} 
                    onChange={e => setManualForm({ ...manualForm, platform: e.target.value as any })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                  >
                    <optgroup label="Shopee Cabang">
                      <option value="Shopee Semarang">Shopee Semarang</option>
                      <option value="Shopee Bali">Shopee Bali</option>
                      <option value="Shopee Surabaya">Shopee Surabaya</option>
                      <option value="Shopee Pusat">Shopee Pusat</option>
                    </optgroup>
                    <optgroup label="Platform Lain">
                      <option value="TikTok Shop">TikTok Shop</option>
                      <option value="Lazada">Lazada</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Tipe Closing</label>
                  <select 
                    value={manualForm.closingType} 
                    onChange={e => setManualForm({ ...manualForm, closingType: e.target.value as any })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem', fontWeight: 600 }}
                  >
                    <option value="REGULER">🏷️ Reguler</option>
                    <option value="CAMPAIGN">🚀 Campaign</option>
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
