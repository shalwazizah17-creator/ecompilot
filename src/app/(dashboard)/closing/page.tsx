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
  CheckCheck,
  TableProperties
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
  PatokanClosingRow,
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
  generatePatokanValuesTSV,
  generateFullPatokanTSV,
  generateTheraskinClosingSeed,
  detectMarketplacePlatform,
  normalizeRawOrder,
  PlatformDetectionResult,
  DetectedMarketplace,
  cleanNumeric
} from '@/lib/closing-engine'

export default function ClosingPage() {
  // Main Data States (Synchronized with Google Sheet Patokan '2026_Promo Theraskin')
  const [selectedBulan, setSelectedBulan] = useState('September')
  const [selectedTahun, setSelectedTahun] = useState(2026)
  const [activeSheetTab, setActiveSheetTab] = useState<'ALL' | 'September' | 'September Cabang'>('ALL')
  const [closingRows, setClosingRows] = useState<PatokanClosingRow[]>(() => 
    generateTheraskinClosingSeed('September', 2026)
  )

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL')
  const [selectedSubKategori, setSelectedSubKategori] = useState<string>('ALL')
  const [selectedClosingType, setSelectedClosingType] = useState<'ALL' | ClosingType>('ALL')
  const [closingStatus, setClosingStatus] = useState<ClosingStatus>('Ready for Finance')
  const [activeViewTab, setActiveViewTab] = useState<'PATOKAN_TABLE' | 'RAW_ORDERS'>('PATOKAN_TABLE')
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIssueFilter, setActiveIssueFilter] = useState<string | null>(null)

  // Feedback & Copy states
  const [copiedMode, setCopiedMode] = useState<'NONE' | 'COLS_O_T' | 'FULL_PATOKAN' | 'MASTER_6COL'>('NONE')
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Modals
  const [activeAuditModal, setActiveAuditModal] = useState<PatokanClosingRow | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTargetBranch, setUploadTargetBranch] = useState<string>('AUTO')
  const [uploadModalTab, setUploadModalTab] = useState<'FILE' | 'QUICK_PASTE' | 'SIMULATOR'>('FILE')
  const [quickPasteText, setQuickPasteText] = useState('')
  const [simForm, setSimForm] = useState({
    marketplace: 'Lazada',
    sku: 'PAK033POT010PCS',
    date: '2026-09-05',
    hargaAwal: 40200,
    totalDiskon: 1608,
    qty: 1
  })
  const [simResult, setSimResult] = useState<{
    matched: boolean
    targetRow?: PatokanClosingRow
    hargaSetelahDiskon: number
    period: 'PERIOD_1' | 'PERIOD_2'
    biayaBrand: number
    keterangan: string
  } | null>(null)
  const [lastDetectionResult, setLastDetectionResult] = useState<PlatformDetectionResult | null>(null)
  const [auditSearch, setAuditSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    sheetTab: 'September Cabang' as 'September' | 'September Cabang',
    marketplace: 'Shopee Semarang',
    kategori: 'Toko',
    subKategori: 'Flash Sale',
    periodeBadge: 'DD & Payday',
    tanggal: '1-7 Sep & 25-30 Sep',
    sku: 'PAK033POT010PCS',
    productName: 'THERASKIN Age Revival Protection Day Cream 10g',
    hargaBulanan: 40200,
    diskonPersen: 4,
    totalDiskon: 1608,
    targetQty: 20,
    totalPromosi: 10,
    ordersP1: 15,
    cancelP1: 1,
    ordersP2: 10,
    cancelP2: 0,
    isDuplicate: false,
    closingType: 'CAMPAIGN' as ClosingType
  })

  // Format IDR currency
  const fmt = (val: number) => `Rp ${Math.round(val || 0).toLocaleString('id-ID')}`

  // Dynamic End of Month & Labels
  const periodLabels = useMemo(() => {
    return getDynamicPeriodLabels(selectedTahun, selectedBulan)
  }, [selectedTahun, selectedBulan])

  // Filter rows based on Tab Patokan, Platform, Sub Kategori, and Search
  const filteredRows = useMemo(() => {
    return closingRows.filter(r => {
      // Tab Patokan (September vs September Cabang)
      if (activeSheetTab !== 'ALL' && r.sheetTab !== activeSheetTab) return false

      // Platform & Branch
      if (selectedPlatform !== 'ALL') {
        if (!r.marketplace.toLowerCase().includes(selectedPlatform.toLowerCase())) return false
      }

      // Sub Kategori
      if (selectedSubKategori !== 'ALL' && r.subKategori !== selectedSubKategori) return false

      // Closing Type
      if (selectedClosingType !== 'ALL' && r.closingType !== selectedClosingType) return false

      // Search Query
      const q = searchQuery.toLowerCase().trim()
      if (q) {
        const match = 
          r.sku.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.marketplace.toLowerCase().includes(q) ||
          r.subKategori.toLowerCase().includes(q) ||
          r.tanggal.toLowerCase().includes(q)
        if (!match) return false
      }

      // Issue filter
      if (activeIssueFilter === 'DUPLICATE') {
        if (!r.isDuplicateP1 && !r.isDuplicateP2) return false
      }

      return true
    })
  }, [closingRows, activeSheetTab, selectedPlatform, selectedSubKategori, selectedClosingType, searchQuery, activeIssueFilter])

  // Summary Metrics calculated directly from Patokan Columns
  const summaryMetrics = useMemo(() => {
    let totalQtyP1 = 0
    let totalBiayaP1 = 0
    let totalQtyP2 = 0
    let totalBiayaP2 = 0
    let grandTotalQty = 0
    let grandTotalBiaya = 0

    filteredRows.forEach(r => {
      totalQtyP1 += (r.qtyP1 || 0)
      totalBiayaP1 += (r.biayaP1 || 0)
      totalQtyP2 += (r.qtyP2 || 0)
      totalBiayaP2 += (r.biayaP2 || 0)
      grandTotalQty += (r.grandTotalQty || 0)
      grandTotalBiaya += (r.grandTotalBiaya || 0)
    })

    return {
      totalQtyP1,
      totalBiayaP1,
      totalQtyP2,
      totalBiayaP2,
      grandTotalQty,
      grandTotalBiaya,
      totalRows: filteredRows.length
    }
  }, [filteredRows])

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

  // 1-Click: COPY KOLOM O s/d T (Qty 1-15, Biaya 1-15, Qty 16-30, Biaya 16-30, Grand Total Qty, Grand Total Biaya)
  const handleCopyColsOT = async () => {
    if (filteredRows.length === 0) return
    const tsv = generatePatokanValuesTSV(filteredRows)
    await safeCopyToClipboard(tsv)
    setCopiedMode('COLS_O_T')
    showToast(`Tercopy ${filteredRows.length} baris Kolom O s/d T! Tinggal klik cell O2 di Google Sheet lalu Ctrl+V.`)
    setTimeout(() => setCopiedMode('NONE'), 4000)
  }

  // 1-Click: COPY SELURUH SHEET PATOKAN (Kolom B s/d T)
  const handleCopyFullPatokan = async () => {
    if (filteredRows.length === 0) return
    const tsv = generateFullPatokanTSV(filteredRows)
    await safeCopyToClipboard(tsv)
    setCopiedMode('FULL_PATOKAN')
    showToast(`Tercopy seluruh spreadsheet patokan (Kolom B s/d T) dengan header!`)
    setTimeout(() => setCopiedMode('NONE'), 4000)
  }

  // Copy 6-Column Master Closing format
  const handleCopyMaster6Col = async () => {
    if (filteredRows.length === 0) return
    const tsv = generateMasterClosingTSV(filteredRows)
    await safeCopyToClipboard(tsv)
    setCopiedMode('MASTER_6COL')
    showToast(`Tercopy format 6 kolom Master Closing Finance (Platform, Kode, Promo, SKU, Qty, Biaya).`)
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
      setClosingRows(prev => prev.map(r => {
        const qtyP1 = r.isDuplicateP1 ? (r.validOrdersP1 || 0) / 2 : (r.validOrdersP1 || 0)
        const qtyP2 = r.isDuplicateP2 ? (r.validOrdersP2 || 0) / 2 : (r.validOrdersP2 || 0)
        const biayaP1 = qtyP1 * r.totalDiskon
        const biayaP2 = qtyP2 * r.totalDiskon
        const grandTotalQty = qtyP1 + qtyP2
        const grandTotalBiaya = biayaP1 + biayaP2

        return {
          ...r,
          qtyP1,
          biayaP1,
          qtyP2,
          biayaP2,
          grandTotalQty,
          grandTotalBiaya,
          finalClosingQty: grandTotalQty,
          biaya: grandTotalBiaya,
          totalBiayaPromo: grandTotalBiaya
        }
      }))
      setIsProcessing(false)
      showToast('Kalkulasi closing selesai! Qty 1-15, Qty 16-30, dan Biaya Promosi telah diperbarui.')
    }, 400)
  }

  // Export Excel (.xlsx) matching exact patokan columns
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      alert('Tidak ada data yang dapat diekspor!')
      return
    }

    try {
      const exportData = filteredRows.map(r => ({
        'Marketplace': r.marketplace,
        'Kategori': r.kategori,
        'Sub Kategori': r.subKategori,
        'Periode': r.periodeBadge,
        'Tanggal': r.tanggal,
        'SKU': r.sku,
        'Product Name': r.productName,
        'HARGA Bulanan': r.hargaBulanan,
        'Diskon': r.diskonPersen > 0 ? `${r.diskonPersen}%` : '',
        'Total Diskon': r.totalDiskon,
        'Harga Promo': r.hargaPromo,
        'Qty': r.targetQty,
        'Total Promosi': r.totalPromosi,
        'Qty 1-15 Sep': r.qtyP1,
        'Biaya 1-15 Sep': Math.round(r.biayaP1),
        'Qty 16-30 Sep': r.qtyP2,
        'Biaya 16-30 Sep': Math.round(r.biayaP2),
        'GRAND TOTAL QTY TERJUAL': r.grandTotalQty,
        'GRAND TOTAL BIAYA PROMOSI': Math.round(r.grandTotalBiaya)
      }))

      const wb = xlsx.utils.book_new()
      const ws = xlsx.utils.json_to_sheet(exportData)
      xlsx.utils.book_append_sheet(wb, ws, '2026_Promo Theraskin')

      const filename = `2026_Promo_Theraskin_${selectedBulan}_${selectedTahun}.xlsx`
      xlsx.writeFile(wb, filename)
      showToast(`Berhasil mengekspor ${filename}`)
    } catch (err) {
      console.error('Export Excel failed:', err)
      alert('Gagal mengekspor file Excel. Silakan coba kembali.')
    }
  }

  // Reusable order processor with Auto-Platform Signature Detection & Precision Price-Matching
  const applyRawOrders = (
    rawData: any[], 
    targetMarketplaceOverride?: string, 
    filename: string = '', 
    sheetName: string = ''
  ) => {
    if (!rawData || rawData.length === 0) return { matchedOrdersCount: 0, unmatchedOrdersCount: 0, detection: null }

    // 1. Detect platform automatically from headers, filename, or sheet
    const detection = detectMarketplacePlatform(rawData[0] || {}, filename, sheetName)
    setLastDetectionResult(detection)

    // 2. Resolve target platform & branch
    let effectivePlatform: DetectedMarketplace = detection.platform
    let effectiveBranch: MarketplacePlatform = detection.suggestedTargetMarketplace

    if (targetMarketplaceOverride && targetMarketplaceOverride !== 'AUTO') {
      effectiveBranch = targetMarketplaceOverride as MarketplacePlatform
      if (effectiveBranch.toLowerCase().includes('shopee')) {
        effectivePlatform = 'SHOPEE'
      } else if (effectiveBranch.toLowerCase().includes('tiktok')) {
        effectivePlatform = 'TIKTOK'
      } else if (effectiveBranch.toLowerCase().includes('lazada')) {
        effectivePlatform = 'LAZADA'
      }
    }

    let matchedOrdersCount = 0
    let unmatchedOrdersCount = 0
    const updatedRows = [...closingRows]

    rawData.forEach((row: any) => {
      const norm = normalizeRawOrder(row, effectivePlatform, effectiveBranch)
      
      // Match against catalog rows: Platform + (SKU/Name) + Kolom L (Harga Promo)
      const matchedRowIndex = updatedRows.findIndex(r => {
        // A. Platform filtering
        if (norm.platform === 'TikTok Shop') {
          if (!r.marketplace.toLowerCase().includes('tiktok')) return false
        } else if (norm.platform === 'Lazada') {
          if (!r.marketplace.toLowerCase().includes('lazada')) return false
        } else if (norm.platform === 'Shopee') {
          if (!r.marketplace.toLowerCase().includes('shopee')) return false
          if (norm.branchCity && norm.branchCity !== 'Pusat') {
            if (!r.marketplace.toLowerCase().includes(norm.branchCity.toLowerCase())) return false
          } else if (norm.branchCity === 'Pusat') {
            if (r.marketplace.toLowerCase().includes('semarang') || 
                r.marketplace.toLowerCase().includes('bali') || 
                r.marketplace.toLowerCase().includes('surabaya')) {
              return false
            }
          }
        }

        // B. SKU / Product Name matching
        const cleanNormSku = norm.sku.toLowerCase().replace(/[^a-z0-9]/g, '')
        const cleanRowSku = r.sku.toLowerCase().replace(/[^a-z0-9]/g, '')
        const skuMatches = cleanNormSku && cleanRowSku && (cleanNormSku === cleanRowSku || cleanNormSku.includes(cleanRowSku) || cleanRowSku.includes(cleanNormSku))
        
        const cleanNormName = norm.productName.toLowerCase()
        const cleanRowName = r.productName.toLowerCase()
        const nameMatches = cleanNormName && cleanRowName && (
          cleanNormName.includes(cleanRowName) || cleanRowName.includes(cleanNormName)
        )
        
        const isVoucherRow = r.sku.toLowerCase() === 'all sku' || r.subKategori.toLowerCase().includes('voucher')

        // C. Price matching against Kolom L (Harga Promo): Net Unit or Total
        const priceMatchesUnit = Math.abs(r.hargaPromo - norm.netPricePerUnit) <= 600
        const priceMatchesTotal = Math.abs(r.hargaPromo - norm.netPriceTotal) <= 600
        const discountMatches = Math.abs(r.totalDiskon - norm.unitDiscount) <= 300

        if (isVoucherRow) {
          return discountMatches || priceMatchesUnit
        }

        if (skuMatches && (priceMatchesUnit || priceMatchesTotal || discountMatches)) {
          return true
        }

        if (nameMatches && (priceMatchesUnit || priceMatchesTotal)) {
          return true
        }

        // Fallback exact SKU match with relaxed price tolerance
        if (skuMatches && Math.abs(r.hargaPromo - norm.netPricePerUnit) <= 1500) {
          return true
        }

        return false
      })

      if (matchedRowIndex !== -1) {
        matchedOrdersCount++
        const r = updatedRows[matchedRowIndex]
        const qty = norm.quantity

        if (norm.period === 'PERIOD_1') {
          r.totalOrdersP1 = (r.totalOrdersP1 || 0) + qty
          if (norm.isCancelled) {
            r.cancelledOrdersP1 = (r.cancelledOrdersP1 || 0) + qty
          } else {
            r.validOrdersP1 = (r.validOrdersP1 || 0) + qty
          }
        } else {
          r.totalOrdersP2 = (r.totalOrdersP2 || 0) + qty
          if (norm.isCancelled) {
            r.cancelledOrdersP2 = (r.cancelledOrdersP2 || 0) + qty
          } else {
            r.validOrdersP2 = (r.validOrdersP2 || 0) + qty
          }
        }

        // Recompute Qty & Biaya according to duplicate promo rule
        r.qtyP1 = r.isDuplicateP1 ? Math.max(0, r.validOrdersP1) / 2 : Math.max(0, r.validOrdersP1)
        r.biayaP1 = r.qtyP1 * r.totalDiskon
        r.qtyP2 = r.isDuplicateP2 ? Math.max(0, r.validOrdersP2) / 2 : Math.max(0, r.validOrdersP2)
        r.biayaP2 = r.qtyP2 * r.totalDiskon
        r.grandTotalQty = r.qtyP1 + r.qtyP2
        r.grandTotalBiaya = r.biayaP1 + r.biayaP2
        r.finalClosingQty = r.grandTotalQty
        r.biaya = r.grandTotalBiaya
        r.totalBiayaPromo = r.grandTotalBiaya

        // Keep transaction log for Finance audit drilldown
        if (!r.transactions) r.transactions = []
        r.transactions.push({
          id: norm.rawId,
          orderNumber: norm.orderNumber || `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          date: norm.dateRaw,
          month: selectedBulan,
          period: norm.period,
          marketplace: r.marketplace,
          closingType: r.closingType,
          promotionCategory: r.subKategori,
          promotionName: r.productName,
          sku: r.sku,
          productName: r.productName,
          price: r.hargaBulanan,
          discountAmount: r.totalDiskon,
          quantity: norm.quantity,
          orderStatus: norm.orderStatus,
          isDuplicatePromo: norm.period === 'PERIOD_1' ? r.isDuplicateP1 : r.isDuplicateP2
        })
      } else {
        unmatchedOrdersCount++
      }
    })

    setClosingRows(updatedRows)
    setClosingStatus('Data Imported')
    return { matchedOrdersCount, unmatchedOrdersCount, detection }
  }

  // Handle Upload Raw Order Excel / CSV with Automated Smart Price-Matching
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      let rawData: any[] = []
      let sheetName = ''

      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
        rawData = parsed.data
      } else {
        const buffer = await file.arrayBuffer()
        const workbook = xlsx.read(buffer)
        sheetName = workbook.SheetNames[0] || ''
        const sheet = workbook.Sheets[sheetName]
        rawData = xlsx.utils.sheet_to_json(sheet)
      }

      if (!rawData || rawData.length === 0) {
        throw new Error('File tidak memiliki baris data.')
      }

      const res = applyRawOrders(rawData, uploadTargetBranch, file.name, sheetName)
      setShowUploadModal(false)
      
      const pName = res.detection?.platformLabel || 'Marketplace'
      showToast(`Sukses! ${rawData.length} pesanan (${pName}) diproses: ${res.matchedOrdersCount} cocok otomatis dengan Harga Promo katalog.`)

    } catch (err) {
      console.error('Failed to parse order file:', err)
      alert('Format file belum sesuai. Pastikan upload file order export dari Shopee, TikTok Shop, atau Lazada ya!')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle Quick Paste Process
  const handleQuickPasteProcess = () => {
    if (!quickPasteText.trim()) return
    setIsProcessing(true)
    try {
      let parsed = Papa.parse(quickPasteText, { header: true, skipEmptyLines: true }).data
      if (!parsed || parsed.length === 0 || Object.keys(parsed[0] || {}).length <= 1) {
        parsed = Papa.parse(quickPasteText, { delimiter: '\t', header: true, skipEmptyLines: true }).data
      }
      if (!parsed || parsed.length === 0) {
        alert('Teks tidak dapat dibaca sebagai tabel. Pastikan copy tabel dari Excel atau Google Sheet.')
        return
      }

      const res = applyRawOrders(parsed, uploadTargetBranch, 'QuickPaste.tsv', 'OrderSKUList')
      setShowUploadModal(false)
      setQuickPasteText('')
      
      const pName = res.detection?.platformLabel || 'Marketplace'
      showToast(`Sukses Quick Paste (${pName})! ${parsed.length} pesanan diproses: ${res.matchedOrdersCount} berhasil dicocokkan ke Harga Promo katalog.`)
    } catch (err) {
      console.error(err)
      alert('Gagal memproses data Quick Paste. Pastikan format kolom sesuai.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Run Simulator Test
  const handleRunSimulator = () => {
    const net = Math.max(0, simForm.hargaAwal - simForm.totalDiskon)
    const period = getClosingPeriod(simForm.date)
    
    // Find matched row in catalog
    const target = closingRows.find(r => {
      const matchPlatform = r.marketplace.toLowerCase().includes(simForm.marketplace.toLowerCase().split(' ')[0])
      const matchSku = r.sku.toLowerCase() === simForm.sku.toLowerCase() || r.sku === 'All SKU'
      const matchPrice = Math.abs(r.hargaPromo - net) <= 500
      const matchVoucher = r.sku === 'All SKU' && Math.abs(r.totalDiskon - simForm.totalDiskon) <= 100
      return matchPlatform && (matchVoucher || (matchSku && matchPrice))
    })

    if (target) {
      const biaya = simForm.qty * target.totalDiskon
      setSimResult({
        matched: true,
        targetRow: target,
        hargaSetelahDiskon: net,
        period,
        biayaBrand: biaya,
        keterangan: `COCOK 100%! Pesanan ${simForm.sku} di ${target.marketplace} memiliki Harga Promo Rp ${net.toLocaleString('id-ID')} (identik dengan Kolom L di Google Sheet). Karena tanggal pesanan adalah ${simForm.date}, maka masuk ke ${period === 'PERIOD_1' ? 'Periode 1 (Qty 1–15 Sep)' : 'Periode 2 (Qty 16–30 Sep)'}.`
      })
    } else {
      setSimResult({
        matched: false,
        hargaSetelahDiskon: net,
        period,
        biayaBrand: 0,
        keterangan: `TIDAK ADA ROW PROMO YANG COCOK: Di ${simForm.marketplace}, tidak ada promosi dengan SKU '${simForm.sku}' pada Harga Promo Rp ${net.toLocaleString('id-ID')}. Pesanan ini tidak akan dimasukkan ke closing promo (terjual harga normal atau promo lain).`
      })
    }
  }

  // Handle Apply Single Simulator Result to Main Table
  const handleApplySimulatorToRows = () => {
    if (!simResult?.matched || !simResult.targetRow) return
    const rowId = simResult.targetRow.id
    setClosingRows(prev => prev.map(r => {
      if (r.id !== rowId) return r
      const qty = simForm.qty
      let v1 = r.validOrdersP1 || 0
      let v2 = r.validOrdersP2 || 0
      if (simResult.period === 'PERIOD_1') {
        v1 += qty
      } else {
        v2 += qty
      }
      const qtyP1 = r.isDuplicateP1 ? v1 / 2 : v1
      const qtyP2 = r.isDuplicateP2 ? v2 / 2 : v2
      const biayaP1 = qtyP1 * r.totalDiskon
      const biayaP2 = qtyP2 * r.totalDiskon
      return {
        ...r,
        validOrdersP1: v1,
        validOrdersP2: v2,
        totalOrdersP1: (r.totalOrdersP1 || 0) + (simResult.period === 'PERIOD_1' ? qty : 0),
        totalOrdersP2: (r.totalOrdersP2 || 0) + (simResult.period === 'PERIOD_2' ? qty : 0),
        qtyP1,
        biayaP1,
        qtyP2,
        biayaP2,
        grandTotalQty: qtyP1 + qtyP2,
        grandTotalBiaya: biayaP1 + biayaP2
      }
    }))
    setShowUploadModal(false)
    showToast(`1 Transaksi simulasi (${simForm.sku}) berhasil ditambahkan ke baris ${simResult.targetRow.productName}!`)
  }

  // Handle Manual Row Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const { 
      sheetTab,
      marketplace, 
      kategori, 
      subKategori, 
      periodeBadge, 
      tanggal, 
      sku, 
      productName, 
      hargaBulanan, 
      diskonPersen, 
      totalDiskon, 
      targetQty, 
      totalPromosi, 
      ordersP1, 
      cancelP1, 
      ordersP2, 
      cancelP2, 
      isDuplicate,
      closingType
    } = manualForm

    const hargaPromo = Math.max(0, hargaBulanan - totalDiskon)
    const validP1 = Math.max(0, ordersP1 - cancelP1)
    const validP2 = Math.max(0, ordersP2 - cancelP2)

    const qtyP1 = isDuplicate ? validP1 / 2 : validP1
    const qtyP2 = isDuplicate ? validP2 / 2 : validP2
    const biayaP1 = qtyP1 * totalDiskon
    const biayaP2 = qtyP2 * totalDiskon
    const grandTotalQty = qtyP1 + qtyP2
    const grandTotalBiaya = biayaP1 + biayaP2

    const newRow: PatokanClosingRow = {
      id: `row-manual-${Date.now()}`,
      groupId: `grp-${Date.now()}`,
      sheetTab,
      marketplace,
      kategori,
      subKategori,
      periodeBadge,
      tanggal,
      sku,
      productName,
      hargaBulanan,
      diskonPersen,
      totalDiskon,
      hargaPromo,
      targetQty,
      totalPromosi,
      qtyP1,
      biayaP1,
      qtyP2,
      biayaP2,
      grandTotalQty,
      grandTotalBiaya,
      month: selectedBulan,
      year: selectedTahun,
      closingType,
      branchCity: marketplace.includes('Semarang') ? 'Semarang' : marketplace.includes('Bali') ? 'Bali' : marketplace.includes('Surabaya') ? 'Surabaya' : 'Pusat',
      isShopeeBranch: isShopeePlatform(marketplace),
      isDuplicateP1: isDuplicate,
      isDuplicateP2: isDuplicate,
      totalOrdersP1: ordersP1,
      cancelledOrdersP1: cancelP1,
      validOrdersP1: validP1,
      totalOrdersP2: ordersP2,
      cancelledOrdersP2: cancelP2,
      validOrdersP2: validP2,
      finalClosingQty: grandTotalQty,
      biaya: grandTotalBiaya,
      totalBiayaPromo: grandTotalBiaya,
      price: hargaBulanan,
      discountAmount: totalDiskon,
      priceAfterDiscount: hargaPromo,
      discountPercent: diskonPersen,
      promotionCategory: subKategori,
      promotionName: productName,
      closingPeriod: 'PERIOD_1',
      periodLabel: `Periode 1 (1–15 ${selectedBulan})`,
      totalOrders: ordersP1 + ordersP2,
      cancelledOrders: cancelP1 + cancelP2,
      validOrders: validP1 + validP2,
      appliedRule: isDuplicate ? 'DIVIDE_VALID_ORDERS_BY_2' : 'STANDARD_NO_SPLIT',
      formulaDescription: isDuplicate ? `(${ordersP1 + ordersP2} total - ${cancelP1 + cancelP2} batal) ÷ 2 = ${grandTotalQty}` : `(${ordersP1 + ordersP2} total - ${cancelP1 + cancelP2} batal) = ${grandTotalQty}`,
      hasSameDiscountInPeriod: isDuplicate,
      transactions: []
    }

    setClosingRows([newRow, ...closingRows])
    setShowManualModal(false)
    showToast(`Baris "${productName}" (${marketplace}) berhasil ditambahkan.`)
  }

  const handleDeleteRow = (id: string) => {
    if (closingStatus === 'Closed') {
      alert('Closing berstatus CLOSED (Terkunci). Silakan reopen closing terlebih dahulu.')
      return
    }
    if (confirm('Hapus baris closing ini dari patokan?')) {
      setClosingRows(closingRows.filter(r => r.id !== id))
      showToast('Baris closing telah dihapus.')
    }
  }

  const handleResetSeedData = () => {
    if (confirm('Muat ulang data patokan Theraskin (Tab September & September Cabang)?')) {
      setClosingRows(generateTheraskinClosingSeed(selectedBulan, selectedTahun))
      setActiveSheetTab('ALL')
      setSelectedPlatform('ALL')
      setSelectedSubKategori('ALL')
      setSearchQuery('')
      showToast('Data patokan Theraskin berhasil dimuat ulang.')
    }
  }

  // All transactions for Raw Orders tab
  const allRawTransactions = useMemo(() => {
    return filteredRows.flatMap(r => r.transactions || [])
  }, [filteredRows])

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

      {/* 2. SMART PRICE-MATCHING & WORKFLOW BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
        color: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.18)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '850px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FCD34D', flexShrink: 0 }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                Format Resmi Spreadsheet: '2026_Promo Theraskin'
              </span>
              <span className="badge" style={{ backgroundColor: '#FCD34D', color: '#78350F', fontSize: '0.68rem', padding: '2px 8px', fontWeight: 700 }}>
                100% Identik Kolom B s/d T
              </span>
              <a
                href="https://docs.google.com/spreadsheets/d/1kPM6fmb81EzXoBybPbGSl1NSE2TL3SgdzJbQ88XZLNw/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.72rem',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FDE68A',
                  border: '1px solid rgba(253, 230, 138, 0.4)',
                  textDecoration: 'none',
                  fontWeight: 700
                }}
              >
                <ExternalLink size={12} />
                Buka Google Sheet
              </a>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', marginTop: '3px', lineHeight: 1.45 }}>
              Data mentah Shopee/TikTok/Lazada otomatis dihitung <strong>Harga Setelah Diskon ➔ Dicocokkan ke Harga Promo (Kuning)</strong>. Nilai closing langsung masuk ke <strong>Qty 1–15 & Biaya 1–15</strong> dan <strong>Qty 16–30 & Biaya 1–30</strong> dengan formula resmi: <code style={{ backgroundColor: 'rgba(255,255,255,0.12)', padding: '1px 5px', borderRadius: '4px' }}>Biaya = Qty × Total Diskon</code>.
            </div>
          </div>
        </div>

        {/* Primary 1-Click Copy O-T Button */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyColsOT}
            className="btn-primary"
            style={{ 
              fontSize: '0.8125rem', 
              padding: '8px 16px', 
              height: '38px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              backgroundColor: copiedMode === 'COLS_O_T' ? '#16A34A' : '#F59E0B', 
              color: '#0F172A',
              fontWeight: 800,
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)'
            }}
            disabled={filteredRows.length === 0}
            title="Salin Kolom O s/d T tab-separated. Klik cell O2 di Google Sheet lalu Ctrl+V!"
          >
            {copiedMode === 'COLS_O_T' ? <Check size={16} /> : <Copy size={16} />}
            {copiedMode === 'COLS_O_T' ? 'Tercopy! Tinggal Paste di Cell O2' : 'COPY KOLOM O–T (Qty & Biaya)'}
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-outline"
            style={{ fontSize: '0.8125rem', padding: '8px 14px', height: '38px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.25)' }}
          >
            <UploadCloud size={15} /> Upload Pesanan
          </button>
        </div>
      </div>

      {/* 3. PAGE HEADER & SECONDARY ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Rekap Closing Promo & Diskon</h1>
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
          <p className="page-subtitle" style={{ margin: 0, marginTop: '2px' }}>
            Perhitungan nominal yang brand keluarkan untuk biaya promosi marketplace pada periode 1 (1–15) dan periode 2 (16–30/31).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleCopyFullPatokan} 
            className="btn-outline" 
            style={{ fontSize: '0.75rem', height: '34px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Salin seluruh kolom B sampai T"
          >
            <TableProperties size={14} /> Copy Seluruh Sheet (B–T)
          </button>
          
          <button 
            onClick={handleCopyMaster6Col} 
            className="btn-outline" 
            style={{ fontSize: '0.75rem', height: '34px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Salin 6 kolom TSV untuk Master Closing"
          >
            <FileSpreadsheet size={14} /> Copy Master Closing (6-Kolom)
          </button>

          <button 
            onClick={handleExportExcel} 
            className="btn-outline" 
            style={{ fontSize: '0.75rem', height: '34px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} /> Export Excel
          </button>

          <button 
            onClick={() => setShowManualModal(true)} 
            className="btn-outline" 
            style={{ fontSize: '0.75rem', height: '34px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Input Manual
          </button>
        </div>
      </div>

      {/* 4. TAB PATOKAN SWITCHER (SESUAI TAB GOOGLE SHEET) */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Tab Row: Pusat vs Cabang */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tab Google Sheet:
            </span>
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
              <button
                onClick={() => setActiveSheetTab('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: activeSheetTab === 'ALL' ? 700 : 500,
                  backgroundColor: activeSheetTab === 'ALL' ? '#FFFFFF' : 'transparent',
                  color: activeSheetTab === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: activeSheetTab === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Semua Tab ({closingRows.length})
              </button>
              <button
                onClick={() => setActiveSheetTab('September')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: activeSheetTab === 'September' ? 700 : 500,
                  backgroundColor: activeSheetTab === 'September' ? '#FFFFFF' : 'transparent',
                  color: activeSheetTab === 'September' ? '#2563EB' : 'var(--text-secondary)',
                  boxShadow: activeSheetTab === 'September' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={14} /> Tab 'September' (Pusat, TikTok, Lazada)
              </button>
              <button
                onClick={() => setActiveSheetTab('September Cabang')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: activeSheetTab === 'September Cabang' ? 700 : 500,
                  backgroundColor: activeSheetTab === 'September Cabang' ? '#FFFFFF' : 'transparent',
                  color: activeSheetTab === 'September Cabang' ? '#EA580C' : 'var(--text-secondary)',
                  boxShadow: activeSheetTab === 'September Cabang' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <MapPin size={14} /> Tab 'September Cabang' (Shopee Semarang, Bali, Surabaya)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status Closing:</span>
            <select
              value={closingStatus}
              onChange={e => setClosingStatus(e.target.value as ClosingStatus)}
              className="filter-select"
              style={{ padding: '5px 10px', fontSize: '0.8125rem', borderRadius: '6px', fontWeight: 600 }}
            >
              <option value="Draft">Draft</option>
              <option value="Data Imported">Data Imported</option>
              <option value="Under Review">Under Review</option>
              <option value="Ready for Finance">Ready for Finance</option>
              <option value="Closed">🔒 Closed</option>
            </select>
          </div>
        </div>

        {/* Filter Bar: Marketplace, Sub Kategori, Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--surface-border)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Marketplace:
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
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Semua
            </button>
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
                cursor: 'pointer'
              }}
            >
              Shopee Semarang
            </button>
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
                cursor: 'pointer'
              }}
            >
              Shopee Bali
            </button>
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
                cursor: 'pointer'
              }}
            >
              Shopee Surabaya
            </button>
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
            <button
              onClick={() => setSelectedPlatform('TikTok Shop')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: selectedPlatform === 'TikTok Shop' ? 700 : 500,
                backgroundColor: selectedPlatform === 'TikTok Shop' ? '#0F172A' : '#F8FAFC',
                color: selectedPlatform === 'TikTok Shop' ? '#FFFFFF' : '#0F172A',
                border: '1px solid #CBD5E1',
                cursor: 'pointer'
              }}
            >
              TikTok Shop
            </button>
            <button
              onClick={() => setSelectedPlatform('Lazada')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: selectedPlatform === 'Lazada' ? 700 : 500,
                backgroundColor: selectedPlatform === 'Lazada' ? '#2563EB' : '#EFF6FF',
                color: selectedPlatform === 'Lazada' ? '#FFFFFF' : '#1D4ED8',
                border: '1px solid #BFDBFE',
                cursor: 'pointer'
              }}
            >
              Lazada
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Cari SKU / Produk di patokan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 10px 5px 30px',
                  fontSize: '0.78rem',
                  borderRadius: '6px',
                  border: '1px solid var(--surface-border-strong)',
                  backgroundColor: 'var(--surface)'
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              )}
            </div>

            <button onClick={handleResetSeedData} className="btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} title="Reset data patokan">
              <RefreshCw size={12} />
            </button>
          </div>

        </div>

      </div>

      {/* 5. SUMMARY STRIP (GRAND TOTALS DARI SPREADSHEET PATOKAN) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        
        {/* Total Program */}
        <div className="stat-card" style={{ padding: '14px 18px' }}>
          <div className="stat-label">Total Program Patokan</div>
          <div className="stat-value" style={{ fontSize: '1.4rem', marginTop: '4px' }}>
            {summaryMetrics.totalRows} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>baris</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {activeSheetTab === 'ALL' ? 'Semua Tab' : `Tab ${activeSheetTab}`}
          </div>
        </div>

        {/* Qty & Biaya Periode 1 (1–15 Sep) */}
        <div className="stat-card" style={{ padding: '14px 18px', backgroundColor: '#FEFCE8', borderColor: '#FEF08A' }}>
          <div className="stat-label" style={{ color: '#854D0E', fontWeight: 700 }}>
            Periode 1 (1–15 {selectedBulan.slice(0, 3)})
          </div>
          <div className="stat-value" style={{ fontSize: '1.35rem', color: '#854D0E', marginTop: '4px' }}>
            {summaryMetrics.totalQtyP1.toLocaleString()} pcs
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', marginTop: '2px' }}>
            Biaya: {fmt(summaryMetrics.totalBiayaP1)}
          </div>
        </div>

        {/* Qty & Biaya Periode 2 (16–30 Sep) */}
        <div className="stat-card" style={{ padding: '14px 18px', backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <div className="stat-label" style={{ color: '#166534', fontWeight: 700 }}>
            Periode 2 (16–{periodLabels.lastDay} {selectedBulan.slice(0, 3)})
          </div>
          <div className="stat-value" style={{ fontSize: '1.35rem', color: '#166534', marginTop: '4px' }}>
            {summaryMetrics.totalQtyP2.toLocaleString()} pcs
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', marginTop: '2px' }}>
            Biaya: {fmt(summaryMetrics.totalBiayaP2)}
          </div>
        </div>

        {/* GRAND TOTAL BIAYA PROMOSI BRAND */}
        <div className="stat-card" style={{ padding: '14px 18px', backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
          <div className="stat-label" style={{ color: '#991B1B', fontWeight: 700 }}>
            GRAND TOTAL BIAYA PROMOSI
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem', color: '#DC2626', marginTop: '4px' }}>
            {fmt(summaryMetrics.grandTotalBiaya)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7F1D1D', marginTop: '2px' }}>
            Grand Qty: <strong>{summaryMetrics.grandTotalQty.toLocaleString()} pcs</strong> terjual
          </div>
        </div>

      </div>

      {/* 6. MAIN TABLE IDENTIK DENGAN GOOGLE SHEET (KOLOM B s/d T) */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        
        <div style={{ overflowX: 'auto', maxHeight: '720px' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'separate', borderSpacing: 0 }}>
            
            {/* TABLE HEADER MATCHING GOOGLE SHEET */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F8FAFC' }}>
              <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                <th style={{ minWidth: '125px', position: 'sticky', left: 0, backgroundColor: '#F8FAFC', zIndex: 11 }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[B]</div>
                  Marketplace
                </th>
                <th style={{ minWidth: '70px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[C]</div>
                  Kategori
                </th>
                <th style={{ minWidth: '120px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[D]</div>
                  Sub Kategori
                </th>
                <th style={{ minWidth: '100px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[E]</div>
                  Periode
                </th>
                <th style={{ minWidth: '130px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[F]</div>
                  Tanggal
                </th>
                <th style={{ minWidth: '120px', fontFamily: 'monospace' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[G]</div>
                  SKU
                </th>
                <th style={{ minWidth: '220px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[H]</div>
                  Product Name
                </th>
                <th style={{ textAlign: 'right', minWidth: '95px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[I]</div>
                  HARGA Bulanan
                </th>
                <th style={{ textAlign: 'center', minWidth: '60px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[J]</div>
                  Diskon
                </th>
                <th style={{ textAlign: 'right', minWidth: '95px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[K]</div>
                  Total Diskon
                </th>
                
                {/* KOLOM L: HARGA PROMO (KUNING) */}
                <th style={{ textAlign: 'right', minWidth: '105px', backgroundColor: '#FEF08A', color: '#854D0E', fontWeight: 800 }}>
                  <div style={{ fontSize: '0.65rem', color: '#854D0E', fontWeight: 900 }}>[L] HARGA PROMO</div>
                  Harga Promo
                </th>

                <th style={{ textAlign: 'center', minWidth: '60px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[M]</div>
                  Qty
                </th>
                <th style={{ textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>[N]</div>
                  Total Promo
                </th>

                {/* KOLOM O & P: PERIODE 1 (KUNING) */}
                <th style={{ textAlign: 'center', minWidth: '85px', backgroundColor: '#FEF08A', color: '#854D0E', fontWeight: 800 }}>
                  <div style={{ fontSize: '0.65rem', color: '#854D0E', fontWeight: 900 }}>[O] QTY 1-15</div>
                  Qty 1-15 Sep
                </th>
                <th style={{ textAlign: 'right', minWidth: '105px', backgroundColor: '#FEFCE8', color: '#B45309', fontWeight: 700 }}>
                  <div style={{ fontSize: '0.65rem', color: '#B45309', fontWeight: 800 }}>[P] BIAYA</div>
                  Biaya 1-15 Sep
                </th>

                {/* KOLOM Q & R: PERIODE 2 (HIJAU) */}
                <th style={{ textAlign: 'center', minWidth: '85px', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 800 }}>
                  <div style={{ fontSize: '0.65rem', color: '#166534', fontWeight: 900 }}>[Q] QTY 16-30</div>
                  Qty 16-30 Sep
                </th>
                <th style={{ textAlign: 'right', minWidth: '105px', backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: 700 }}>
                  <div style={{ fontSize: '0.65rem', color: '#15803D', fontWeight: 800 }}>[R] BIAYA</div>
                  Biaya 16-30 Sep
                </th>

                {/* KOLOM S & T: GRAND TOTAL */}
                <th style={{ textAlign: 'center', minWidth: '95px', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800 }}>
                  <div style={{ fontSize: '0.65rem', color: '#1D4ED8', fontWeight: 900 }}>[S] TOTAL QTY</div>
                  GRAND TOTAL QTY
                </th>
                <th style={{ textAlign: 'right', minWidth: '125px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontWeight: 800 }}>
                  <div style={{ fontSize: '0.65rem', color: '#B91C1C', fontWeight: 900 }}>[T] TOTAL BIAYA</div>
                  GRAND TOTAL BIAYA
                </th>

                <th style={{ width: '60px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={20} style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: 'var(--surface)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <FileSpreadsheet size={32} color="#2563EB" />
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>Tidak Ada Baris Promo Yang Sesuai</div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Silakan pilih tab 'September' atau 'September Cabang', atau klik tombol reset.
                      </p>
                      <button onClick={handleResetSeedData} className="btn-primary" style={{ fontSize: '0.8125rem', padding: '6px 14px', marginTop: '6px' }}>
                        Muat Data Patokan
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const isShopee = isShopeePlatform(r.marketplace)
                  const isDD = r.periodeBadge.includes('DD')

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      
                      {/* B: Marketplace (Sticky) */}
                      <td style={{ position: 'sticky', left: 0, backgroundColor: 'var(--surface)', zIndex: 5, fontWeight: 600 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: isShopee ? '#EA580C' : r.marketplace.includes('TikTok') ? '#0F172A' : '#2563EB' }}>
                            {r.marketplace}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            Tab: {r.sheetTab}
                          </span>
                        </div>
                      </td>

                      {/* C: Kategori */}
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {r.kategori}
                      </td>

                      {/* D: Sub Kategori */}
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.subKategori}
                      </td>

                      {/* E: Periode (Badge) */}
                      <td style={{ textAlign: 'center' }}>
                        <span 
                          style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 700, 
                            padding: '3px 8px', 
                            borderRadius: '4px',
                            backgroundColor: isDD ? '#DC2626' : '#F1F5F9',
                            color: isDD ? '#FFFFFF' : '#475569'
                          }}
                        >
                          {r.periodeBadge}
                        </span>
                      </td>

                      {/* F: Tanggal */}
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {r.tanggal}
                      </td>

                      {/* G: SKU */}
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1E293B', fontSize: '0.78rem' }}>
                        {r.sku}
                      </td>

                      {/* H: Product Name */}
                      <td style={{ color: 'var(--text-primary)', maxWidth: '240px', whiteSpace: 'normal', lineHeight: 1.3 }}>
                        {r.productName}
                      </td>

                      {/* I: HARGA Bulanan */}
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                        {r.hargaBulanan > 0 ? fmt(r.hargaBulanan) : '-'}
                      </td>

                      {/* J: Diskon (%) */}
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                        {r.diskonPersen > 0 ? `${r.diskonPersen}%` : '-'}
                      </td>

                      {/* K: Total Diskon (Nominal Diskon Satuan yang ditanggung Brand) */}
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#D97706' }}>
                        {fmt(r.totalDiskon)}
                      </td>

                      {/* L: Harga Promo (KUNING: Harga Setelah Diskon = HARGA Bulanan - Total Diskon) */}
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800, backgroundColor: '#FEF9C3', color: '#854D0E' }}>
                        {r.hargaPromo > 0 ? fmt(r.hargaPromo) : '-'}
                      </td>

                      {/* M: Qty Target */}
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                        {r.targetQty || '-'}
                      </td>

                      {/* N: Total Promosi */}
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                        {r.totalPromosi || '-'}
                      </td>

                      {/* O: Qty 1-15 Sep (KUNING: Diisi dari closing data mentah) */}
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 800, backgroundColor: '#FEF08A', color: '#854D0E' }}>
                        <button
                          onClick={() => setActiveAuditModal(r)}
                          style={{ background: 'none', border: 'none', fontWeight: 800, color: '#854D0E', cursor: 'pointer', textDecoration: r.qtyP1 > 0 ? 'underline' : 'none' }}
                          title="Klik untuk rincian transaksi"
                        >
                          {r.qtyP1 || 0}
                        </button>
                      </td>

                      {/* P: Biaya 1-15 Sep (= Qty 1-15 × Total Diskon) */}
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, backgroundColor: '#FEFCE8', color: r.biayaP1 > 0 ? '#B45309' : 'var(--text-muted)' }}>
                        {r.biayaP1 > 0 ? fmt(r.biayaP1) : '0'}
                      </td>

                      {/* Q: Qty 16-30 Sep */}
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 800, backgroundColor: '#DCFCE7', color: '#166534' }}>
                        <button
                          onClick={() => setActiveAuditModal(r)}
                          style={{ background: 'none', border: 'none', fontWeight: 800, color: '#166534', cursor: 'pointer', textDecoration: r.qtyP2 > 0 ? 'underline' : 'none' }}
                          title="Klik untuk rincian transaksi"
                        >
                          {r.qtyP2 || 0}
                        </button>
                      </td>

                      {/* R: Biaya 16-30 Sep (= Qty 16-30 × Total Diskon) */}
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, backgroundColor: '#F0FDF4', color: r.biayaP2 > 0 ? '#15803D' : 'var(--text-muted)' }}>
                        {r.biayaP2 > 0 ? fmt(r.biayaP2) : '0'}
                      </td>

                      {/* S: GRAND TOTAL QTY TERJUAL (= Qty 1-15 + Qty 16-30) */}
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 800, backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                        {r.grandTotalQty || 0}
                      </td>

                      {/* T: GRAND TOTAL BIAYA PROMOSI (= Biaya 1-15 + Biaya 16-30) */}
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800, backgroundColor: '#FEF2F2', color: r.grandTotalBiaya > 0 ? '#B91C1C' : 'var(--text-muted)' }}>
                        {r.grandTotalBiaya > 0 ? fmt(r.grandTotalBiaya) : '0'}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button
                            onClick={() => setActiveAuditModal(r)}
                            style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: '3px' }}
                            title="Audit Bukti Transaksi"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(r.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
                            title="Hapus baris ini"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>

            {/* GRAND TOTAL SPREADSHEET FOOTER */}
            {filteredRows.length > 0 && (
              <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem' }}>
                  <td colSpan={7} style={{ padding: '14px 16px', color: '#F8FAFC' }}>
                    GRAND TOTAL ({filteredRows.length} BARIS PROMO):
                  </td>
                  <td colSpan={6} style={{ textAlign: 'right', padding: '14px 16px', color: '#94A3B8', fontSize: '0.75rem' }}>
                    Total Biaya Promosi yang Dikeluarkan Brand:
                  </td>
                  
                  {/* Kolom O: Total Qty 1-15 */}
                  <td style={{ textAlign: 'center', padding: '14px 8px', color: '#FEF08A', backgroundColor: '#1E293B', fontSize: '0.95rem' }}>
                    {summaryMetrics.totalQtyP1.toLocaleString()}
                  </td>
                  
                  {/* Kolom P: Total Biaya 1-15 */}
                  <td style={{ textAlign: 'right', padding: '14px 10px', color: '#FCD34D', backgroundColor: '#1E293B', fontSize: '0.9rem' }}>
                    {fmt(summaryMetrics.totalBiayaP1)}
                  </td>

                  {/* Kolom Q: Total Qty 16-30 */}
                  <td style={{ textAlign: 'center', padding: '14px 8px', color: '#86EFAC', backgroundColor: '#1E293B', fontSize: '0.95rem' }}>
                    {summaryMetrics.totalQtyP2.toLocaleString()}
                  </td>

                  {/* Kolom R: Total Biaya 16-30 */}
                  <td style={{ textAlign: 'right', padding: '14px 10px', color: '#86EFAC', backgroundColor: '#1E293B', fontSize: '0.9rem' }}>
                    {fmt(summaryMetrics.totalBiayaP2)}
                  </td>

                  {/* Kolom S: Grand Total Qty */}
                  <td style={{ textAlign: 'center', padding: '14px 8px', color: '#93C5FD', backgroundColor: '#0B1120', fontSize: '1.05rem' }}>
                    {summaryMetrics.grandTotalQty.toLocaleString()} pcs
                  </td>

                  {/* Kolom T: Grand Total Biaya Promosi */}
                  <td style={{ textAlign: 'right', padding: '14px 16px', color: '#FCA5A5', backgroundColor: '#0B1120', fontSize: '1.05rem' }}>
                    {fmt(summaryMetrics.grandTotalBiaya)}
                  </td>

                  <td></td>
                </tr>
              </tfoot>
            )}

          </table>
        </div>

        {/* Bottom Bar: 1-Click Copy O-T Reminder */}
        <div style={{ padding: '14px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <CheckCheck size={18} color="#16A34A" />
            <span>
              <strong>Cara Copy-Paste ke Google Sheet:</strong> Klik tombol kuning <code>COPY KOLOM O–T</code> di bawah, lalu buka Google Sheet Anda, klik cell <strong>O2</strong> (baris pertama Qty 1-15 Sep), dan tekan <strong>Ctrl + V</strong>. Seluruh nilai Qty dan Biaya akan otomatis terisi rapi!
            </span>
          </div>

          <button
            onClick={handleCopyColsOT}
            className="btn-primary"
            style={{ 
              fontSize: '0.8125rem', 
              padding: '8px 18px', 
              backgroundColor: copiedMode === 'COLS_O_T' ? '#16A34A' : '#F59E0B', 
              color: '#0F172A',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
            }}
            disabled={filteredRows.length === 0}
          >
            {copiedMode === 'COLS_O_T' ? <Check size={16} /> : <Copy size={16} />}
            {copiedMode === 'COLS_O_T' ? 'Tercopy! Siap Paste di Cell O2' : 'COPY KOLOM O–T (Qty & Biaya)'}
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: SMART UPLOAD (OTOMATIS COCOKKAN KE HARGA PROMO)                    */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '660px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calculator size={20} color="#2563EB" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Input Pesanan & Pencocokan Harga Promo</h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Membaca <strong>SKU Subtotal After Discount</strong> dan <strong>Order created time</strong> ➔ Mencocokkan ke kolom <strong>[L] Harga Promo (Kuning)</strong> katalog.
                </p>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '10px' }}>
              <button
                onClick={() => setUploadModalTab('FILE')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: uploadModalTab === 'FILE' ? 700 : 500,
                  backgroundColor: uploadModalTab === 'FILE' ? '#2563EB' : '#F1F5F9',
                  color: uploadModalTab === 'FILE' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <UploadCloud size={15} />
                1. Upload File (.xlsx/.csv)
              </button>
              <button
                onClick={() => setUploadModalTab('QUICK_PASTE')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: uploadModalTab === 'QUICK_PASTE' ? 700 : 500,
                  backgroundColor: uploadModalTab === 'QUICK_PASTE' ? '#2563EB' : '#F1F5F9',
                  color: uploadModalTab === 'QUICK_PASTE' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={15} />
                2. Quick Paste Teks Excel
              </button>
              <button
                onClick={() => setUploadModalTab('SIMULATOR')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: uploadModalTab === 'SIMULATOR' ? 700 : 500,
                  backgroundColor: uploadModalTab === 'SIMULATOR' ? '#D97706' : '#FEF3C7',
                  color: uploadModalTab === 'SIMULATOR' ? '#FFFFFF' : '#B45309',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={15} />
                3. Tes Pencocokan Harga (Live)
              </button>
            </div>

            {/* Target Branch Selector */}
            {uploadModalTab !== 'SIMULATOR' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  Target Platform / Cabang:
                </label>
                <select
                  value={uploadTargetBranch}
                  onChange={e => setUploadTargetBranch(e.target.value)}
                  className="filter-select"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.875rem' }}
                >
                  <option value="AUTO">✨ Auto-Detect (Otomatis dari nama file/header)</option>
                  <optgroup label="Shopee Cabang (Tab 'September Cabang')">
                    <option value="Shopee Semarang">Shopee Semarang</option>
                    <option value="Shopee Bali">Shopee Bali</option>
                    <option value="Shopee Surabaya">Shopee Surabaya</option>
                  </optgroup>
                  <optgroup label="Shopee Pusat & Lainnya (Tab 'September')">
                    <option value="Shopee Pusat">Shopee Pusat</option>
                    <option value="TikTok Shop">TikTok Shop</option>
                    <option value="Lazada">Lazada</option>
                  </optgroup>
                </select>
              </div>
            )}

            {/* TAB 1: FILE UPLOAD */}
            {uploadModalTab === 'FILE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                    Export OrderSKUList resmi Shopee, TikTok Shop, atau Lazada
                  </div>
                </div>

                <div style={{ backgroundColor: '#FEFCE8', border: '1px solid #FEF08A', padding: '12px 14px', borderRadius: '8px', fontSize: '0.78rem', color: '#854D0E', lineHeight: 1.45 }}>
                  🔍 <strong>Aturan Pencocokan Otomatis (Kolom Kuning):</strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', marginTop: '4px' }}>
                    <li><strong>SKU Subtotal After Discount</strong>: Dihitung per unit <code>Subtotal ÷ Qty</code> ➔ Dicocokkan ke kolom <strong>[L] Harga Promo (Kuning)</strong> katalog.</li>
                    <li><strong>Order created time</strong>: Pesanan tanggal <strong>1–14/15 September</strong> otomatis masuk <strong>[O] Qty 1–15 Sep</strong>; tanggal 16–30/31 masuk <strong>[Q] Qty 16–30 Sep</strong>.</li>
                    <li><strong>Product Name / SKU</strong>: Memastikan nama barang atau SKU cocok dengan baris spreadsheet yang sesuai.</li>
                    <li>Pesanan batal/retur otomatis bernilai <code>COUNT = 0</code> (tidak dimasukkan ke Qty).</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Live Detection Banner */}
            {lastDetectionResult && (
              <div style={{
                backgroundColor: lastDetectionResult.platform === 'TIKTOK' ? '#FFF1F2' : lastDetectionResult.platform === 'SHOPEE' ? '#FFF7ED' : lastDetectionResult.platform === 'LAZADA' ? '#EFF6FF' : '#F8FAFC',
                border: `1px solid ${lastDetectionResult.platform === 'TIKTOK' ? '#FECDD3' : lastDetectionResult.platform === 'SHOPEE' ? '#FED7AA' : lastDetectionResult.platform === 'LAZADA' ? '#BFDBFE' : '#E2E8F0'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>
                    {lastDetectionResult.platform === 'TIKTOK' ? '🎵' : lastDetectionResult.platform === 'SHOPEE' ? '🟠' : lastDetectionResult.platform === 'LAZADA' ? '🔵' : '📋'}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                      Format Terdeteksi: <span style={{ color: lastDetectionResult.platform === 'TIKTOK' ? '#E11D48' : lastDetectionResult.platform === 'SHOPEE' ? '#EA580C' : lastDetectionResult.platform === 'LAZADA' ? '#2563EB' : '#334155' }}>{lastDetectionResult.platformLabel}</span>
                      <span style={{ marginLeft: '6px', fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#E2E8F0', fontWeight: 600 }}>{lastDetectionResult.confidence} CONFIDENCE</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px' }}>
                      {lastDetectionResult.description}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  Target: <strong>{lastDetectionResult.suggestedTargetMarketplace}</strong>
                </div>
              </div>
            )}

            {/* TAB 2: QUICK PASTE */}
            {uploadModalTab === 'QUICK_PASTE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    Pilih Contoh Data Mentah atau Paste Langsung dari Excel / Google Sheet:
                  </label>
                  
                  {/* Preset Buttons per Marketplace */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Preset 1: TikTok Shop from real screenshot */}
                    <button
                      onClick={() => {
                        const tsv = `Order ID\tOrder Status\tOrder Substatus\tNormal or Pre-order\tSKU ID\tSeller SKU\tProduct Name\tVariation\tQuantity\tSku Quantity Returned\tSKU Unit Original Price\tSKU Subtotal Before Discount\tSKU Platform Discount\tSKU Seller Discount\tSKU Subtotal After Discount\tCreated Time
586072309974861411\tDikirim\tSedang transit\tNormal\t17296653610505\tFPK00000042\tTheraskin Perfect Glow Basic Skin\tDefault\t1\t0\t231000\t231000\t7975\t71501\t151524\t14/09/2026 23:47:20
586072294970481411\tDikirim\tSedang transit\tNormal\t17311751476101\tFAW02L0010CG\tTheraskin AHA Cleanser 100ml -\tDefault\t1\t0\t39800\t39800\t1390\t0\t37810\t14/09/2026 23:36:30
5860722646704687\tDikirim\tSedang transit\tNormal\t175524619167\tFNC02P0010CW\tTheraskin Niacinamide Cream Gel\tDefault\t1\t0\t36700\t36700\t1300\t10700\t24700\t14/09/2026 23:30:50
5860722646704688\tDikirim\tSedang transit\tNormal\t1731718546089\tFD02C0010G\tTheraskin Daily C-Booster Cream 1\tDaily C-Booster Cream 1 pcs\t1\t0\t71000\t71000\t1950\t32000\t37050\t14/09/2026 23:30:50
5860722646704689\tDikirim\tSedang transit\tNormal\t1729482550384\tFFG02B010CS\tTheraskin Perfect glow toner essence\tperfect glow toner essence\t1\t0\t49500\t49500\t3550\t13300\t32670\t14/09/2026 23:30:50
586071971284420062\tDikirim\tSedang transit\tNormal\t17296653587540\tFPK00000043\tTheraskin Advanced Acne Basic Sk\tDefault\t1\t0\t209000\t209000\t14000\t69100\t125900\t14/09/2026 23:17:25
58607176288282104\tDikirim\tSedang transit\tNormal\t17254281545962\tFPK00000032\tPaket Theraskin AHA Glow White -\tDefault\t1\t0\t147700\t147700\t10000\t9701\t127999\t14/09/2026 23:01:14
58607124814350325\tDikirim\tSedang transit\tNormal\t1729482258087\tPAK034POT010CS\tTHERASKIN Age Revival Moisture Lock Night Cream Pot New Mould 10 g Shrink\t2\t0\t78000\t156000\t0\t77680\t78320\t14/09/2026 21:40:52
58607142908495\tDikirim\tSedang transit\tNormal\t173142054959\tTWINSUNAGEPROTECTIONDC\tTwinpack Sun Protector Age Revival Protection Day Cream\tDefault\t1\t0\t145000\t145000\t0\t67816\t77184\t14/09/2026 19:25:27`
                        setQuickPasteText(tsv)
                        setUploadTargetBranch('TikTok Shop')
                        setLastDetectionResult({
                          platform: 'TIKTOK',
                          platformLabel: 'TikTok Shop',
                          confidence: 'HIGH',
                          detectedHeaders: ['SKU Subtotal After Discount', 'Created Time', 'Seller SKU', 'Product Name'],
                          suggestedTargetMarketplace: 'TikTok Shop',
                          description: 'Format terdeteksi: TikTok Shop OrderSKUList (Data Asli Screenshot 1–14 Sep). Kolom kunci: SKU Subtotal After Discount, Created Time.'
                        })
                      }}
                      style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#FFF1F2',
                        color: '#BE123C',
                        border: '1px solid #FECDD3',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🎵 1. Data Mentah TikTok Shop (1–14 Sep)
                    </button>

                    {/* Preset 2: Shopee Semarang */}
                    <button
                      onClick={() => {
                        const tsv = `No. Pesanan\tStatus Pesanan\tWaktu Pesanan Dibuat\tNomor Referensi SKU\tNama Produk\tJumlah\tHarga Awal\tPotongan Penjual\tHarga Setelah Diskon
260914SMG001\tSelesai\t14/09/2026 10:15:00\tPAK033POT010PCS\tTHERASKIN Age Revival Protection Day Cream 10g (Semarang)\t1\t40200\t1608\t38592
260914SMG002\tSelesai\t14/09/2026 11:20:00\tBUNDLEPERFECTGLOW\tTheraskin Perfect Glow Complete Series Bundle\t1\t138800\t8328\t130472
260914SMG003\tSelesai\t14/09/2026 14:05:00\tAll SKU\tVoucher Toko Semarang Diskon 5K min 100K\t1\t100000\t5000\t95000`
                        setQuickPasteText(tsv)
                        setUploadTargetBranch('Shopee Semarang')
                        setLastDetectionResult({
                          platform: 'SHOPEE',
                          platformLabel: 'Shopee',
                          confidence: 'HIGH',
                          detectedHeaders: ['Nomor Referensi SKU', 'Harga Setelah Diskon', 'Waktu Pesanan Dibuat', 'No. Pesanan'],
                          suggestedTargetMarketplace: 'Shopee Semarang',
                          description: 'Format terdeteksi: Shopee Seller Centre (Cabang Semarang). Kolom kunci: Nomor Referensi SKU, Harga Setelah Diskon, Waktu Pesanan Dibuat.'
                        })
                      }}
                      style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#FFF7ED',
                        color: '#C2410C',
                        border: '1px solid #FED7AA',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🟠 2. Data Mentah Shopee Semarang (1–14 Sep)
                    </button>

                    {/* Preset 3: Lazada */}
                    <button
                      onClick={() => {
                        const tsv = `orderItemId\torderNumber\tcreateTime\tstatus\tsellerSku\titemName\tunitPrice\tpaidPrice\tvoucherSeller
78912345671\tORD-LAZ-101\t14/09/2026 11:00:00\tdelivered\tPAK033POT010PCS\tTHERASKIN Age Revival Protection Day Cream Pot New Mould 10 g Shrink\t40200\t38592\t1608
78912345672\tORD-LAZ-102\t14/09/2026 12:30:00\tdelivered\tPAK032T010C\tTHERASKIN Age Revival Gentle Cleanser Tube 100 ml\t41300\t39648\t1652
78912345673\tORD-LAZ-103\t14/09/2026 14:15:00\tdelivered\tPAK034POT010CS\tTHERASKIN Age Revival Moisture Lock Night Cream Pot New Mould 10 g Shrink\t41500\t39840\t1660`
                        setQuickPasteText(tsv)
                        setUploadTargetBranch('Lazada')
                        setLastDetectionResult({
                          platform: 'LAZADA',
                          platformLabel: 'Lazada',
                          confidence: 'HIGH',
                          detectedHeaders: ['sellerSku', 'paidPrice', 'createTime', 'orderItemId'],
                          suggestedTargetMarketplace: 'Lazada',
                          description: 'Format terdeteksi: Lazada Seller Center. Kolom kunci: sellerSku, paidPrice, createTime.'
                        })
                      }}
                      style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🔵 3. Data Mentah Lazada (1–14 Sep)
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={quickPasteText}
                  onChange={e => {
                    const val = e.target.value
                    setQuickPasteText(val)
                    if (val.trim()) {
                      try {
                        let p = Papa.parse(val, { delimiter: '\t', header: true, skipEmptyLines: true }).data
                        if (!p || p.length === 0 || Object.keys(p[0] || {}).length <= 1) {
                          p = Papa.parse(val, { header: true, skipEmptyLines: true }).data
                        }
                        if (p && p.length > 0) {
                          const det = detectMarketplacePlatform(p[0] as any, 'PastedData.tsv', 'OrderSKUList')
                          setLastDetectionResult(det)
                        }
                      } catch {}
                    }
                  }}
                  placeholder="Paste langsung tabel TSV/CSV dari Excel atau Google Sheet di sini..."
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border-strong)',
                    backgroundColor: '#F8FAFC'
                  }}
                />

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Tips: Cukup buka file Excel data mentah Anda, blok baris dari kolom A sampai P, tekan <code>Ctrl + C</code>, lalu paste di kotak ini!
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={handleQuickPasteProcess}
                    className="btn-primary"
                    disabled={!quickPasteText.trim() || isProcessing}
                    style={{ fontSize: '0.8125rem', padding: '8px 18px' }}
                  >
                    {isProcessing ? 'Memproses...' : '⚡ Proses & Cocokkan ke Promo'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: LIVE SIMULATOR / MATCHER TEST */}
            {uploadModalTab === 'SIMULATOR' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  Uji coba satu pesanan mentah untuk melihat apakah harganya cocok dengan <strong>Harga Promo di Kolom L Google Sheet</strong>, masuk periode mana, dan berapa biaya promosi yang dihitung brand.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.8125rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Marketplace:</label>
                    <select
                      value={simForm.marketplace}
                      onChange={e => setSimForm({ ...simForm, marketplace: e.target.value })}
                      className="filter-select"
                      style={{ width: '100%', padding: '6px 10px' }}
                    >
                      <option value="Lazada">Lazada (Tab September)</option>
                      <option value="Shopee Semarang">Shopee Semarang (Tab September Cabang)</option>
                      <option value="Shopee Bali">Shopee Bali (Tab September Cabang)</option>
                      <option value="Shopee Surabaya">Shopee Surabaya (Tab September Cabang)</option>
                      <option value="Shopee Pusat">Shopee Pusat (Tab September)</option>
                      <option value="TikTok Shop">TikTok Shop (Tab September)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Order created time (Tanggal):</label>
                    <input
                      type="text"
                      value={simForm.date}
                      placeholder="14/09/2026 23:47:20 atau 2026-09-05"
                      onChange={e => setSimForm({ ...simForm, date: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--surface-border-strong)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>SKU / Nama Produk:</label>
                    <select
                      value={simForm.sku}
                      onChange={e => {
                        const selectedSku = e.target.value
                        const found = closingRows.find(r => r.sku === selectedSku)
                        if (found) {
                          setSimForm({
                            ...simForm,
                            sku: selectedSku,
                            hargaAwal: found.hargaBulanan,
                            totalDiskon: found.totalDiskon
                          })
                        } else {
                          setSimForm({ ...simForm, sku: selectedSku })
                        }
                      }}
                      className="filter-select"
                      style={{ width: '100%', padding: '6px 10px', fontFamily: 'monospace' }}
                    >
                      <option value="TWINSUNAGEPROTECTIONDC">TWINSUNAGEPROTECTIONDC - Twinpack Sun Protector</option>
                      <option value="PAK033POT010PCS">PAK033POT010PCS - Age Revival Day Cream</option>
                      <option value="PAK032T010C">PAK032T010C - Age Revival Gentle Cleanser</option>
                      <option value="PAK034POT010CS">PAK034POT010CS - Age Revival Night Cream</option>
                      <option value="PAK036B100CS">PAK036B100CS - Age Revival Toner Essence</option>
                      <option value="PAK035S010CS">PAK035S010CS - Age Revival Retinol Serum</option>
                      <option value="FTC00000030CS">FTC00000030CS - Perfect Glow Face Cream</option>
                      <option value="FPK038POT010PRI">FPK038POT010PRI - Perfect Glow Day Cream</option>
                      <option value="FPK037T010CS">FPK037T010CS - Perfect Glow Facial Wash</option>
                      <option value="FTC00000015CI">FTC00000015CI - Perfect Glow Serum</option>
                      <option value="All SKU">All SKU - Voucher Belanja Toko</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Jumlah (Quantity):</label>
                    <input
                      type="number"
                      min={1}
                      value={simForm.qty}
                      onChange={e => setSimForm({ ...simForm, qty: parseInt(e.target.value) || 1 })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--surface-border-strong)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Harga Normal / Awal (Rp):</label>
                    <input
                      type="number"
                      value={simForm.hargaAwal}
                      onChange={e => setSimForm({ ...simForm, hargaAwal: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--surface-border-strong)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Total Diskon Promosi (Rp):</label>
                    <input
                      type="number"
                      value={simForm.totalDiskon}
                      onChange={e => setSimForm({ ...simForm, totalDiskon: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--surface-border-strong)' }}
                    />
                  </div>
                </div>

                {/* Net Price Display */}
                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#1E40AF' }}>
                    <strong>SKU Subtotal After Discount:</strong> (Harga bayar riil pembeli)
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E40AF' }}>
                    {fmt(Math.max(0, simForm.hargaAwal - simForm.totalDiskon))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleRunSimulator}
                    className="btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '7px 16px', backgroundColor: '#D97706' }}
                  >
                    ⚡ Jalankan Tes Pencocokan
                  </button>
                </div>

                {/* Simulator Result Box */}
                {simResult && (
                  <div style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: simResult.matched ? '#BBF7D0' : '#FECACA',
                    backgroundColor: simResult.matched ? '#F0FDF4' : '#FEF2F2',
                    fontSize: '0.8125rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: simResult.matched ? '#15803D' : '#DC2626', marginBottom: '6px' }}>
                      {simResult.matched ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      {simResult.matched ? 'HASIL: COCOK DENGAN MASTER PROMO GOOGLE SHEET!' : 'HASIL: TIDAK COCOK DENGAN PROMO MANAPUN'}
                    </div>

                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {simResult.keterangan}
                    </div>

                    {simResult.matched && simResult.targetRow && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #86EFAC', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#166534' }}>Target Kolom Spreadsheet:</div>
                          <div style={{ fontWeight: 700, color: '#166534' }}>
                            {simResult.period === 'PERIOD_1' ? 'Kolom [O] Qty 1–15 Sep' : 'Kolom [Q] Qty 16–30 Sep'} (+{simForm.qty})
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#166534' }}>Biaya Brand yang Dihitung:</div>
                          <div style={{ fontWeight: 700, color: '#DC2626' }}>
                            +{fmt(simResult.biayaBrand)} (di {simResult.period === 'PERIOD_1' ? 'Kolom [P]' : 'Kolom [R]'})
                          </div>
                        </div>

                        <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
                          <button
                            onClick={handleApplySimulatorToRows}
                            className="btn-primary"
                            style={{ width: '100%', fontSize: '0.8125rem', padding: '6px 12px', backgroundColor: '#16A34A' }}
                          >
                            + Tambahkan Transaksi Ini ke Tabel Closing
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-border)', paddingTop: '12px' }}>
              <button onClick={() => setShowUploadModal(false)} className="btn-outline" style={{ fontSize: '0.8125rem' }}>
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUDIT DRILLDOWN (RINCIAN PERHITUNGAN BARIS PATOKAN)                */}
      {/* ========================================================================= */}
      {activeAuditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="#2563EB" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                    Audit Rincian Baris Patokan Promo
                  </h3>
                  <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                    {activeAuditModal.marketplace}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Rincian transaksi dan formula perhitungan untuk baris spreadsheet ini.
                </p>
              </div>
              <button onClick={() => setActiveAuditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            {/* Context Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid var(--surface-border)', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Produk & SKU:</span>
                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{activeAuditModal.sku}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{activeAuditModal.productName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Katalog Promo:</span>
                <div style={{ fontWeight: 600 }}>{activeAuditModal.subKategori} ({activeAuditModal.periodeBadge})</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeAuditModal.tanggal}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Harga & Diskon:</span>
                <div style={{ fontWeight: 700, color: '#854D0E' }}>Promo: {fmt(activeAuditModal.hargaPromo)}</div>
                <div style={{ fontSize: '0.75rem', color: '#D97706' }}>Total Diskon: {fmt(activeAuditModal.totalDiskon)}</div>
              </div>
            </div>

            {/* Formula Breakdown */}
            <div style={{ backgroundColor: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#854D0E', marginBottom: '8px' }}>
                Perhitungan Qty & Biaya Promosi Brand:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.8125rem' }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                  <div style={{ fontWeight: 700, color: '#854D0E', marginBottom: '4px' }}>Periode 1 (1–15 Sep):</div>
                  <div>Total Order: {activeAuditModal.totalOrdersP1 || 0} (Batal: -{activeAuditModal.cancelledOrdersP1 || 0})</div>
                  <div>Valid: {activeAuditModal.validOrdersP1 || 0} order</div>
                  <div style={{ marginTop: '4px', fontWeight: 700, color: '#2563EB' }}>
                    Qty 1-15: {activeAuditModal.qtyP1} pcs
                  </div>
                  <div style={{ fontWeight: 700, color: '#DC2626' }}>
                    Biaya 1-15: {fmt(activeAuditModal.biayaP1)} ({activeAuditModal.qtyP1} × {fmt(activeAuditModal.totalDiskon)})
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                  <div style={{ fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Periode 2 (16–30 Sep):</div>
                  <div>Total Order: {activeAuditModal.totalOrdersP2 || 0} (Batal: -{activeAuditModal.cancelledOrdersP2 || 0})</div>
                  <div>Valid: {activeAuditModal.validOrdersP2 || 0} order</div>
                  <div style={{ marginTop: '4px', fontWeight: 700, color: '#166534' }}>
                    Qty 16-30: {activeAuditModal.qtyP2} pcs
                  </div>
                  <div style={{ fontWeight: 700, color: '#DC2626' }}>
                    Biaya 16-30: {fmt(activeAuditModal.biayaP2)} ({activeAuditModal.qtyP2} × {fmt(activeAuditModal.totalDiskon)})
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span>Grand Total Qty: <strong>{activeAuditModal.grandTotalQty} pcs</strong></span>
                <span style={{ color: '#DC2626', fontWeight: 800 }}>Grand Total Biaya Promosi: {fmt(activeAuditModal.grandTotalBiaya)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setActiveAuditModal(null)} className="btn-primary" style={{ fontSize: '0.8125rem' }}>
                Tutup Audit
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT BARIS PATOKAN MANUAL                                         */}
      {/* ========================================================================= */}
      {showManualModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '600px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Input Baris Patokan Manual</h3>
              <button onClick={() => setShowManualModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Tab Google Sheet</label>
                  <select 
                    value={manualForm.sheetTab} 
                    onChange={e => setManualForm({ ...manualForm, sheetTab: e.target.value as any })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                  >
                    <option value="September Cabang">September Cabang (Semarang/Bali/Surabaya)</option>
                    <option value="September">September (Pusat/TikTok/Lazada)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Marketplace</label>
                  <select 
                    value={manualForm.marketplace} 
                    onChange={e => setManualForm({ ...manualForm, marketplace: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                  >
                    <option value="Shopee Semarang">Shopee Semarang</option>
                    <option value="Shopee Bali">Shopee Bali</option>
                    <option value="Shopee Surabaya">Shopee Surabaya</option>
                    <option value="Shopee Pusat">Shopee Pusat</option>
                    <option value="TikTok Shop">TikTok Shop</option>
                    <option value="Lazada">Lazada</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Sub Kategori</label>
                  <select 
                    value={manualForm.subKategori} 
                    onChange={e => setManualForm({ ...manualForm, subKategori: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                  >
                    <option value="Flash Sale">Flash Sale</option>
                    <option value="Voucher">Voucher</option>
                    <option value="Paket diskon">Paket diskon</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Periode Badge</label>
                  <input 
                    type="text" 
                    value={manualForm.periodeBadge} 
                    onChange={e => setManualForm({ ...manualForm, periodeBadge: e.target.value })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Tanggal Promo</label>
                  <input 
                    type="text" 
                    value={manualForm.tanggal} 
                    onChange={e => setManualForm({ ...manualForm, tanggal: e.target.value })}
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
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Product Name</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>HARGA Bulanan</label>
                  <input 
                    type="number" 
                    value={manualForm.hargaBulanan} 
                    onChange={e => setManualForm({ ...manualForm, hargaBulanan: parseFloat(e.target.value) || 0 })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Total Diskon (Rp)</label>
                  <input 
                    type="number" 
                    value={manualForm.totalDiskon} 
                    onChange={e => setManualForm({ ...manualForm, totalDiskon: parseFloat(e.target.value) || 0 })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Harga Promo Net</label>
                  <div style={{ padding: '6px 10px', fontSize: '0.8125rem', fontWeight: 800, backgroundColor: '#FEF9C3', borderRadius: '6px', color: '#854D0E' }}>
                    {fmt(Math.max(0, manualForm.hargaBulanan - manualForm.totalDiskon))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, marginBottom: '2px' }}>Qty 1-15 Sep (Order)</label>
                  <input 
                    type="number" 
                    value={manualForm.ordersP1} 
                    onChange={e => setManualForm({ ...manualForm, ordersP1: parseInt(e.target.value) || 0 })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '5px 8px', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, marginBottom: '2px' }}>Qty 16-30 Sep (Order)</label>
                  <input 
                    type="number" 
                    value={manualForm.ordersP2} 
                    onChange={e => setManualForm({ ...manualForm, ordersP2: parseInt(e.target.value) || 0 })}
                    className="filter-select" 
                    style={{ width: '100%', padding: '5px 8px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowManualModal(false)} className="btn-outline" style={{ fontSize: '0.8125rem' }}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.8125rem' }}>
                  Simpan ke Patokan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
