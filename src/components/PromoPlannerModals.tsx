'use client'

import React, { useState } from 'react'
import {
  X,
  Plus,
  CopyPlus,
  Wand2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Bot,
  Sparkles,
  FileSpreadsheet,
  Download,
  Flame
} from 'lucide-react'
import * as xlsx from 'xlsx'
import {
  PromoPlanItem,
  PromoMarketplace,
  PromoCategory,
  THERASKIN_MASTER_CATALOG,
  MONTH_LIST,
  recalculatePromoItem,
  generateMonthlyPromoPlan,
  duplicateMonthlyPromoPlan
} from '@/lib/promo-planner/master-data'

interface GeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (items: PromoPlanItem[], bulan: string, tahun: number, replaceExisting: boolean) => void
}

export function MonthlyGeneratorModal({ isOpen, onClose, onGenerate }: GeneratorModalProps) {
  const [bulan, setBulan] = useState('Oktober')
  const [tahun, setTahun] = useState(2026)
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<PromoMarketplace[]>(['Shopee', 'TikTok Shop', 'Lazada'])
  const [selectedChannels, setSelectedChannels] = useState<PromoCategory[]>([
    'Campaign',
    'Toko',
    'Live Streaming',
    'Digital Marketing',
    'Brand Membership'
  ])
  const [productMix, setProductMix] = useState<'ALL' | 'NPD' | 'BAU'>('ALL')
  const [replaceExisting, setReplaceExisting] = useState(false)

  if (!isOpen) return null

  const toggleMp = (mp: PromoMarketplace) => {
    setSelectedMarketplaces(prev =>
      prev.includes(mp) ? (prev.length > 1 ? prev.filter(x => x !== mp) : prev) : [...prev, mp]
    )
  }

  const toggleCh = (ch: PromoCategory) => {
    setSelectedChannels(prev =>
      prev.includes(ch) ? (prev.length > 1 ? prev.filter(x => x !== ch) : prev) : [...prev, ch]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const generated = generateMonthlyPromoPlan({
      bulan,
      tahun,
      marketplaces: selectedMarketplaces,
      channels: selectedChannels,
      productMix
    })
    onGenerate(generated, bulan, tahun, replaceExisting)
    onClose()
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Wand2 size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>+ Buat Plan Bulanan (Generator)</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Generate plan bulanan otomatis (Payday Awal, Double Date, BAU, Payday Akhir) sesuai Master Produk &amp; Diskon &le; 5%.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Bulan Promo</label>
              <select value={bulan} onChange={e => setBulan(e.target.value)} className="filter-select" style={{ width: '100%' }}>
                {MONTH_LIST.map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tahun Promo</label>
              <select value={tahun} onChange={e => setTahun(Number(e.target.value))} className="filter-select" style={{ width: '100%' }}>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Marketplace Target</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['Shopee', 'TikTok Shop', 'Lazada'] as PromoMarketplace[]).map(mp => {
                const active = selectedMarketplaces.includes(mp)
                return (
                  <button
                    type="button"
                    key={mp}
                    onClick={() => toggleMp(mp)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: `1px solid ${active ? '#2563EB' : 'var(--surface-border)'}`,
                      backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                      color: active ? '#1D4ED8' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {active ? '✓ ' : ''}{mp}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Kategori &amp; Channel Promo</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['Campaign', 'Toko', 'Live Streaming', 'Digital Marketing', 'Brand Membership'] as PromoCategory[]).map(ch => {
                const active = selectedChannels.includes(ch)
                return (
                  <button
                    type="button"
                    key={ch}
                    onClick={() => toggleCh(ch)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: `1px solid ${active ? '#059669' : 'var(--surface-border)'}`,
                      backgroundColor: active ? '#ECFDF5' : '#FFFFFF',
                      color: active ? '#047857' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {active ? '✓ ' : ''}{ch}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Kombinasi Product Mix (Master Produk Theraskin)</label>
            <select value={productMix} onChange={e => setProductMix(e.target.value as any)} className="filter-select" style={{ width: '100%' }}>
              <option value="ALL">NPD + BAU Lengkap (C-Booster, Age Revival, CeraMoist, Perfect Glow, Acne, Oil Control, Bundle)</option>
              <option value="NPD">Fokus Produk Baru / NPD (C-Booster, Age Revival, CeraMoist, Skin Tint, Men)</option>
              <option value="BAU">Fokus Produk Reguler / BAU &amp; Best Seller (Perfect Glow, Advanced Acne, Oil Control)</option>
            </select>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.75rem' }}>
            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Template Periode Bulanan Otomatis ({bulan} {tahun}):</div>
            <div style={{ color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <span>&bull; <strong>Payday Awal:</strong> 1 - 8 {bulan}</span>
              <span>&bull; <strong>Double Date:</strong> 9 - 11 {bulan}</span>
              <span>&bull; <strong>BAU:</strong> 12 - 24 {bulan}</span>
              <span>&bull; <strong>Payday Akhir:</strong> 25 - Akhir {bulan}</span>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={replaceExisting} onChange={e => setReplaceExisting(e.target.checked)} />
            <span>Ganti (timpa) plan bulan <strong>{bulan}</strong> yang sudah ada dengan hasil generate baru</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn-outline">Batal</button>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wand2 size={15} /> Generate Plan {bulan} {tahun}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface DuplicateModalProps {
  isOpen: boolean
  onClose: () => void
  promoList: PromoPlanItem[]
  onDuplicate: (newItems: PromoPlanItem[], targetBulan: string, targetTahun: number, replaceTarget: boolean) => void
}

export function DuplicateMonthModal({ isOpen, onClose, promoList, onDuplicate }: DuplicateModalProps) {
  const [sourceBulan, setSourceBulan] = useState('Oktober')
  const [targetBulan, setTargetBulan] = useState('November')
  const [targetTahun, setTargetTahun] = useState(2026)
  const [replaceTarget, setReplaceTarget] = useState(true)

  if (!isOpen) return null

  const sourceItems = promoList.filter(i => i.bulan === sourceBulan)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (sourceItems.length === 0) {
      alert(`Tidak ada data plan pada bulan ${sourceBulan} untuk diduplikasi.`)
      return
    }
    const duplicated = duplicateMonthlyPromoPlan(sourceItems, targetBulan, targetTahun)
    onDuplicate(duplicated, targetBulan, targetTahun, replaceTarget)
    onClose()
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CopyPlus size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Duplikasi Plan Bulanan</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Salin struktur periode, produk mix &amp; channel ke bulan tujuan dan hitung ulang harga promo otomatis.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Salin Dari Bulan Sumber</label>
            <select value={sourceBulan} onChange={e => setSourceBulan(e.target.value)} className="filter-select" style={{ width: '100%' }}>
              {MONTH_LIST.map(m => (
                <option key={m.name} value={m.name}>
                  {m.name} ({promoList.filter(i => i.bulan === m.name).length} baris promo)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Ke Bulan Tujuan</label>
              <select value={targetBulan} onChange={e => setTargetBulan(e.target.value)} className="filter-select" style={{ width: '100%' }}>
                {MONTH_LIST.map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tahun Tujuan</label>
              <select value={targetTahun} onChange={e => setTargetTahun(Number(e.target.value))} className="filter-select" style={{ width: '100%' }}>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: '0.75rem', color: '#065F46' }}>
            <strong>{sourceItems.length} baris promo</strong> dari <strong>{sourceBulan}</strong> akan disalin ke <strong>{targetBulan} {targetTahun}</strong> dengan penyesuaian tanggal periode otomatis, verifikasi harga Master Produk, dan batas diskon maksimal 5%.
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={replaceTarget} onChange={e => setReplaceTarget(e.target.checked)} />
            <span>Ganti plan bulan <strong>{targetBulan}</strong> yang sudah ada</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn-outline">Batal</button>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CopyPlus size={15} /> Duplikasi ke {targetBulan} {targetTahun}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  defaultBulan: string
  onImport: (items: PromoPlanItem[]) => void
}

export function ImportPromoModal({ isOpen, onClose, defaultBulan, onImport }: ImportModalProps) {
  const [previewRows, setPreviewRows] = useState<PromoPlanItem[]>([])
  const [fileName, setFileName] = useState('')
  const [targetBulan, setTargetBulan] = useState(defaultBulan === 'ALL' ? 'Oktober' : defaultBulan)

  if (!isOpen) return null

  const parseNumber = (val: any): number => {
    if (typeof val === 'number') return val
    if (!val) return 0
    const cleaned = String(val).replace(/[^0-9.-]+/g, '')
    return Number(cleaned) || 0
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = evt => {
      const bstr = evt.target?.result
      const wb = xlsx.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const rawJson: any[] = xlsx.utils.sheet_to_json(ws, { defval: '' })

      const parsedItems: PromoPlanItem[] = rawJson
        .map((row, idx) => {
          const sku = String(row['SKU'] || row['Kode SKU'] || row['sku'] || '').trim()
          const productName = String(row['Product Name'] || row['Nama Produk'] || row['productName'] || '').trim()
          if (!sku && !productName) return null

          const catalogItem =
            THERASKIN_MASTER_CATALOG.find(c => c.sku.toLowerCase() === sku.toLowerCase()) ||
            THERASKIN_MASTER_CATALOG.find(c => c.productName.toLowerCase() === productName.toLowerCase())

          const hrgBulanan = parseNumber(row['Harga Bulanan'] || row['HARGA Bulanan']) || catalogItem?.hargaBulanan || 0
          const hrgOB = parseNumber(row['Harga OB']) || catalogItem?.hargaOB || Math.round(hrgBulanan * 0.9)
          const rawDisc = parseNumber(row['Diskon'] || row['Diskon (%)'])
          const qty = parseNumber(row['Qty'] || row['Target Qty']) || 50
          const marketplace = (row['Marketplace'] || 'Shopee') as PromoMarketplace
          const kategori = (row['Kategori'] || 'Campaign') as PromoCategory
          const channel = (row['Channel'] || kategori) as any
          const subKategori = String(row['Sub Kategori'] || 'Flash Sale')
          const periode = String(row['Periode'] || 'Payday Awal')
          const tanggal = String(row['Tanggal'] || `1 - 8 ${targetBulan}`)
          const bulanRow = String(row['Bulan'] || targetBulan)

          return recalculatePromoItem({
            id: `imp-${Date.now()}-${idx}`,
            bulan: bulanRow,
            tahun: 2026,
            marketplace,
            kategori,
            channel,
            subKategori,
            periode,
            tanggal,
            sku: sku || catalogItem?.sku || 'SKU-BELUM-ADA',
            productName: productName || catalogItem?.productName || 'Produk Baru',
            hargaBulanan: hrgBulanan,
            diskonPercent: rawDisc,
            qty,
            hargaOB: hrgOB,
            campaignName: String(row['Campaign Name'] || `${marketplace} ${periode} - ${productName || catalogItem?.productName || sku}`),
            notes: String(row['Catatan'] || row['Notes'] || 'Imported via Excel/CSV'),
            status: 'Scheduled'
          })
        })
        .filter(Boolean) as PromoPlanItem[]

      setPreviewRows(parsedItems)
    }
    reader.readAsBinaryString(file)
  }

  const handleDownloadTemplate = () => {
    const sample = THERASKIN_MASTER_CATALOG.slice(0, 3).map(c => ({
      'Marketplace': 'Shopee',
      'Kategori': 'Campaign',
      'Sub Kategori': 'Payday Awal',
      'Periode': 'Payday Awal',
      'Tanggal': `1 - 8 ${targetBulan}`,
      'SKU': c.sku,
      'Product Name': c.productName,
      'Harga Bulanan': c.hargaBulanan,
      'Diskon': c.maxSafeDiscount,
      'Total Diskon': Math.round(c.hargaBulanan * (c.maxSafeDiscount / 100)),
      'Harga Promo': c.hargaBulanan - Math.round(c.hargaBulanan * (c.maxSafeDiscount / 100)),
      'Qty': 100,
      'Total Promosi': (c.hargaBulanan - Math.round(c.hargaBulanan * (c.maxSafeDiscount / 100))) * 100,
      'Total Qty 1-15': 100,
      'Biaya 1-15': Math.round(c.hargaBulanan * (c.maxSafeDiscount / 100)) * 100,
      'Total Qty 16-31': 0,
      'Biaya 16-31': 0,
      'Estimasi GMV': (c.hargaBulanan - Math.round(c.hargaBulanan * (c.maxSafeDiscount / 100))) * 100,
      'Harga OB': c.hargaOB,
      'Bottom Price': c.bottomPrice,
      'Status Margin': 'AMAN',
      'Campaign Name': `Shopee Payday Awal - ${c.productName}`,
      'Channel': 'Campaign',
      'Catatan': 'Template Import Kolom A-X'
    }))
    const ws = xlsx.utils.json_to_sheet(sample)
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Template_Promo_A_X')
    xlsx.writeFile(wb, `Template_Import_Promo_Planner_Kolom_A_X.xlsx`)
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div className="card" style={{ maxWidth: '820px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet size={20} color="#2563EB" />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Import Excel / CSV Promo Planner (Kolom A–X)</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Preview data sebelum disimpan &amp; validasi otomatis batas diskon &le; 5% serta Bottom Price.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <select value={targetBulan} onChange={e => setTargetBulan(e.target.value)} className="filter-select">
            {MONTH_LIST.map(m => (
              <option key={m.name} value={m.name}>Bulan Default: {m.name}</option>
            ))}
          </select>

          <label className="btn-outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <Upload size={14} /> Pilih File (.xlsx / .csv)
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button type="button" onClick={handleDownloadTemplate} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <Download size={14} /> Download Template A–X
          </button>
        </div>

        {fileName && (
          <div style={{ fontSize: '0.78rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>
            File terpilih: <strong>{fileName}</strong> ({previewRows.length} baris terdeteksi)
          </div>
        )}

        {previewRows.length > 0 && (
          <div style={{ overflowX: 'auto', maxHeight: '340px', border: '1px solid var(--surface-border)', borderRadius: '8px', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '8px' }}>Marketplace</th>
                  <th style={{ padding: '8px' }}>Periode</th>
                  <th style={{ padding: '8px' }}>SKU &amp; Produk</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Harga Bulanan</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Diskon</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Harga Promo</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Bottom Price</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Status Validasi</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map(r => {
                  const isOk = r.discountStatus === 'VALID' && r.statusMargin === 'AMAN'
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{r.marketplace}</td>
                      <td style={{ padding: '8px' }}>{r.periode} ({r.tanggal})</td>
                      <td style={{ padding: '8px' }}>
                        <strong>{r.sku}</strong> - {r.productName}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>Rp {r.hargaBulanan.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: r.discountStatus === 'VALID' ? '#059669' : '#DC2626' }}>
                        {r.diskonPercent}%
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>Rp {r.hargaPromo.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>Rp {r.bottomPrice.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          backgroundColor: isOk ? '#ECFDF5' : '#FEF2F2',
                          color: isOk ? '#047857' : '#DC2626'
                        }}>
                          {isOk ? 'AMAN & VALID' : r.discountStatus === 'TIDAK VALID' ? 'DISKON > 5%' : r.statusMargin}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} className="btn-outline">Batal</button>
          <button
            type="button"
            disabled={previewRows.length === 0}
            onClick={() => {
              onImport(previewRows)
              onClose()
            }}
            className="btn-primary"
          >
            Simpan {previewRows.length} Baris ke Promo Planner
          </button>
        </div>
      </div>
    </div>
  )
}

interface AiAdvisorModalProps {
  isOpen: boolean
  onClose: () => void
  promoList: PromoPlanItem[]
  activeBulan: string
  onFixAllInvalid: () => void
  onAddRecommendedItem: (item: PromoPlanItem) => void
}

export function AiPromoAdvisorModal({
  isOpen,
  onClose,
  promoList,
  activeBulan,
  onFixAllInvalid,
  onAddRecommendedItem
}: AiAdvisorModalProps) {
  if (!isOpen) return null

  const targetMonth = activeBulan === 'ALL' ? 'Oktober' : activeBulan
  const monthItems = promoList.filter(i => activeBulan === 'ALL' || i.bulan === activeBulan)
  const invalidItems = monthItems.filter(
    i => i.discountStatus === 'TIDAK VALID' || i.statusMargin !== 'AMAN' || !i.sku || i.hargaBulanan <= 0
  )

  const recommendations = [
    {
      periode: 'Payday Awal',
      tanggal: `1 - 8 ${targetMonth}`,
      marketplace: 'Shopee' as PromoMarketplace,
      kategori: 'Campaign' as PromoCategory,
      subKategori: 'Payday Awal',
      catalog: THERASKIN_MASTER_CATALOG[0], // Daily C-Booster Serum
      recommendedDisc: 4,
      qty: 110,
      reason: 'NPD C-Booster Serum memiliki margin sehat (Bottom Price Rp 50.440). Diskon 4% menghasilkan Harga Promo Rp 55.680 (+Rp 5.240 buffer aman).'
    },
    {
      periode: 'Double Date',
      tanggal: `9 - 11 ${targetMonth}`,
      marketplace: 'TikTok Shop' as PromoMarketplace,
      kategori: 'Live Streaming' as PromoCategory,
      subKategori: 'Flash Sale',
      catalog: THERASKIN_MASTER_CATALOG[9], // Twinpack Sun Protector Age Revival
      recommendedDisc: 5,
      qty: 120,
      reason: 'Twinpack Sunscreen sangat kuat untuk keranjang kuning Live Streaming Double Date. Diskon 5% (Rp 76.380) aman di atas Bottom Price Rp 70.810.'
    },
    {
      periode: 'BAU',
      tanggal: `12 - 24 ${targetMonth}`,
      marketplace: 'Lazada' as PromoMarketplace,
      kategori: 'Toko' as PromoCategory,
      subKategori: 'Paket Diskon',
      catalog: THERASKIN_MASTER_CATALOG[27], // AHA Cleanser Oil Control
      recommendedDisc: 4,
      qty: 95,
      reason: 'Menjaga trafik harian BAU untuk lini Oil Control dengan Paket Diskon bertingkat (maksimal 4%–5%).'
    },
    {
      periode: 'Payday Akhir',
      tanggal: `25 - 31 ${targetMonth}`,
      marketplace: 'Shopee' as PromoMarketplace,
      kategori: 'Campaign' as PromoCategory,
      subKategori: 'Payday Akhir',
      catalog: THERASKIN_MASTER_CATALOG[14], // CeraMoist Paket Lengkap
      recommendedDisc: 3,
      qty: 60,
      reason: 'Paket Lengkap CeraMoist menaikkan AOV saat gajian akhir bulan. Diskon 3% (Rp 192.060) aman di atas Bottom Price Rp 188.665.'
    }
  ]

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div className="card" style={{ maxWidth: '720px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
              <Bot size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>AI Promo Advisor &amp; Margin Guard</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Rekomendasi berbasis 100% Data Master Produk Theraskin (Harga Bulanan, Harga OB, Bottom Price -3%, Diskon &le; 5%).
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Audit Kesehatan Plan */}
        <div style={{
          padding: '14px 16px',
          borderRadius: '10px',
          backgroundColor: invalidItems.length === 0 ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${invalidItems.length === 0 ? '#A7F3D0' : '#FECACA'}`,
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {invalidItems.length === 0 ? (
              <CheckCircle2 size={20} color="#059669" />
            ) : (
              <AlertTriangle size={20} color="#DC2626" />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: invalidItems.length === 0 ? '#065F46' : '#991B1B' }}>
                {invalidItems.length === 0
                  ? `100% Plan Promo Valid (${monthItems.length} Baris Memenuhi Aturan Diskon <= 5% & Margin AMAN)`
                  : `Ditemukan ${invalidItems.length} Baris "Perlu Diperbaiki" (Diskon > 5% atau Harga Promo < Bottom Price)`}
              </div>
              <div style={{ fontSize: '0.75rem', color: invalidItems.length === 0 ? '#047857' : '#B91C1C' }}>
                Aturan Sistem: Diskon produk maksimal 5% &amp; Harga Promo wajib &ge; Bottom Price (Harga OB - 3%).
              </div>
            </div>
          </div>

          {invalidItems.length > 0 && (
            <button
              type="button"
              onClick={onFixAllInvalid}
              className="btn-primary"
              style={{ backgroundColor: '#DC2626', fontSize: '0.78rem', padding: '6px 12px' }}
            >
              Perbaiki Otomatis ({invalidItems.length} Baris)
            </button>
          )}
        </div>

        {/* Kalkulator Target 1 Miliar & RoAS Iklan */}
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          color: '#FFFFFF',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 800, color: '#FCD34D', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={18} /> Kalkulator Target GMV 1 Miliar & Alokasi Iklan
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            {(() => {
              const currentGmv = monthItems.reduce((acc, i) => acc + (i.estimasiGmv || 0), 0)
              const targetGmv = 1000000000
              const gapGmv = Math.max(0, targetGmv - currentGmv)
              const adBudget = 1500000
              const requiredRoas = gapGmv > 0 ? (gapGmv / adBudget).toFixed(1) : '0'

              return (
                <>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>Estimasi GMV Saat Ini</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>Rp {(currentGmv/1000000).toFixed(1)} Jt</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>Target GMV Bulan Ini</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60A5FA' }}>Rp 1.000 Jt (1 Miliar)</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(252, 211, 77, 0.4)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#FCD34D', fontWeight: 600, marginBottom: '4px' }}>Kekurangan GMV (Gap)</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FCD34D' }}>Rp {(gapGmv/1000000).toFixed(1)} Jt</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.4)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#FCA5A5', fontWeight: 600, marginBottom: '4px' }}>Target ROAS (Budget 1,5 Jt)</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FCA5A5' }}>{requiredRoas}x ROAS</div>
                  </div>
                </>
              )
            })()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', lineHeight: 1.5 }}>
            <strong>Saran AI Advisor:</strong> Dengan budget harian Rp 25rb - 100rb, target ROAS ini sangat tinggi jika hanya mengandalkan iklan berbayar (Paid Ads). 
            Kamu wajib menggunakan budget iklan ini sebagai <strong>pemancing traffic organik (Katalis)</strong>. Fokuskan tembakan iklan 50rb/hari pada saat <strong>Flash Sale Live</strong> atau ke SKU <strong>Twinpack/Triplepack (AOV Tinggi)</strong> agar 1 klik konversi menghasilkan GMV besar.
          </div>
        </div>

        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={15} color="#4F46E5" /> Rekomendasi SKU &amp; Diskon Terbaik per Periode ({targetMonth} 2026)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recommendations.map((rec, idx) => {
            const totDisc = Math.round(rec.catalog.hargaBulanan * (rec.recommendedDisc / 100))
            const hrgPromo = rec.catalog.hargaBulanan - totDisc
            return (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--surface-border)',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                      {rec.periode} ({rec.tanggal})
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F172A' }}>{rec.marketplace} &bull; {rec.kategori}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    [{rec.catalog.sku}] {rec.catalog.productName}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {rec.reason}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                    Harga Bulanan: Rp {rec.catalog.hargaBulanan.toLocaleString('id-ID')} &rarr; Diskon {rec.recommendedDisc}% &rarr; Harga Promo: Rp {hrgPromo.toLocaleString('id-ID')} (Bottom Price: Rp {rec.catalog.bottomPrice.toLocaleString('id-ID')})
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newItem = recalculatePromoItem({
                      bulan: targetMonth,
                      tahun: 2026,
                      marketplace: rec.marketplace,
                      kategori: rec.kategori,
                      channel: rec.kategori,
                      subKategori: rec.subKategori,
                      periode: rec.periode,
                      tanggal: rec.tanggal,
                      sku: rec.catalog.sku,
                      productName: rec.catalog.productName,
                      hargaBulanan: rec.catalog.hargaBulanan,
                      diskonPercent: rec.recommendedDisc,
                      qty: rec.qty,
                      hargaOB: rec.catalog.hargaOB,
                      bottomPrice: rec.catalog.bottomPrice,
                      campaignName: `${rec.marketplace} ${rec.periode} - ${rec.catalog.productName}`,
                      notes: `Rekomendasi AI Advisor: ${rec.reason}`,
                      status: 'Scheduled'
                    })
                    onAddRecommendedItem(newItem)
                  }}
                  className="btn-outline"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', fontWeight: 700, color: '#2563EB', borderColor: '#BFDBFE', backgroundColor: '#FFFFFF' }}
                >
                  + Tambah ke Plan
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
