'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Trash2, Edit } from 'lucide-react'

const DUMMY_RECORDS = [
  { id: 'd1', sku: 'SRM-VC-001', product_name: 'Serum Vitamin C 30ml',  available_stock: 1200, reserved_stock: 50,  campaign_allocation: 200, avg_daily_sales_7d: 45, avg_daily_sales_30d: 38, coverageDays: 21,  stockoutRisk: 'LOW' },
  { id: 'd2', sku: 'TNR-AHA-02', product_name: 'Toner AHA 7% 100ml',    available_stock: 250,  reserved_stock: 30,  campaign_allocation: 100, avg_daily_sales_7d: 28, avg_daily_sales_30d: 25, coverageDays: 4,   stockoutRisk: 'CRITICAL' },
  { id: 'd3', sku: 'PLM-SPF-03', product_name: 'Pelembab SPF30 50g',    available_stock: 480,  reserved_stock: 0,   campaign_allocation: 150, avg_daily_sales_7d: 32, avg_daily_sales_30d: 29, coverageDays: 10,  stockoutRisk: 'MEDIUM' },
  { id: 'd4', sku: 'MSK-CLY-04', product_name: 'Masker Clay Pore',      available_stock: 90,   reserved_stock: 10,  campaign_allocation: 50,  avg_daily_sales_7d: 18, avg_daily_sales_30d: 15, coverageDays: 1,   stockoutRisk: 'CRITICAL' },
  { id: 'd5', sku: 'EYE-RET-05', product_name: 'Eye Cream Retinol',     available_stock: 830,  reserved_stock: 0,   campaign_allocation: 0,   avg_daily_sales_7d: 12, avg_daily_sales_30d: 10, coverageDays: 69,  stockoutRisk: 'LOW' },
]

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: '🔴 KRITIS',      color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  HIGH:     { label: '🟠 TINGGI',      color: '#ea580c', bg: 'rgba(234,88,12,0.08)' },
  MEDIUM:   { label: '🟡 SEDANG',      color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  LOW:      { label: '🟢 AMAN',        color: '#059669', bg: 'rgba(5,150,105,0.08)' },
}

async function getBrandId(): Promise<string | null> {
  try {
    const res = await fetch('/api/brands')
    if (!res.ok) return null
    const data = await res.json()
    return data.brands?.[0]?.id ?? null
  } catch { return null }
}

export default function InventoryIntelligencePage() {
  const [brandId, setBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<any[]>([])
  const [isDummy, setIsDummy] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ sku: '', product_name: '', available_stock: 0, reserved_stock: 0, campaign_allocation: 0, avg_daily_sales_7d: 0, avg_daily_sales_30d: 0 })

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)
    try {
      const bid = await getBrandId()
      setBrandId(bid)
      if (bid) {
        await loadData(bid)
      } else {
        setRecords(DUMMY_RECORDS)
        setIsDummy(true)
      }
    } catch {
      setRecords(DUMMY_RECORDS)
      setIsDummy(true)
    } finally {
      setLoading(false)
    }
  }

  async function loadData(bid: string) {
    const res = await fetch(`/api/inventory?brandId=${bid}`)
    const data = await res.json()
    const recs = data.records ?? []
    if (recs.length === 0) { setRecords(DUMMY_RECORDS); setIsDummy(true) }
    else { setRecords(recs); setIsDummy(false) }
  }

  async function saveRecord() {
    if (!brandId) return
    await fetch('/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, brandId, ...(editItem ? { id: editItem.id } : {}) }) })
    setShowModal(false); setEditItem(null)
    loadData(brandId)
  }

  async function deleteRecord(id: string) {
    if (!brandId || !confirm('Hapus data stok ini?')) return
    await fetch(`/api/inventory?id=${id}&brandId=${brandId}`, { method: 'DELETE' })
    loadData(brandId)
  }

  function openEdit(r: any) {
    setEditItem(r)
    setForm({ sku: r.sku, product_name: r.product_name, available_stock: r.available_stock, reserved_stock: r.reserved_stock, campaign_allocation: r.campaign_allocation, avg_daily_sales_7d: r.avg_daily_sales_7d, avg_daily_sales_30d: r.avg_daily_sales_30d })
    setShowModal(true)
  }

  const summary = { total: records.length, critical: records.filter(r => r.stockoutRisk === 'CRITICAL').length, high: records.filter(r => r.stockoutRisk === 'HIGH').length, safe: records.filter(r => r.stockoutRisk === 'LOW').length }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--surface-border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Memuat data stok...</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>📦 Intelijen Inventori</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>Pantau risiko kehabisan stok dan alokasikan stok kampanye secara cerdas.</p>
        </div>
        {!isDummy && <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={16} /> Tambah SKU</button>}
      </div>

      {isDummy && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#854d0e', flexWrap: 'wrap' }}>
          <span>⚠️ Menampilkan <strong>data contoh</strong>. Tambahkan data stok SKU Anda untuk memantau risiko nyata.</span>
          <button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto', padding: '6px 14px', border: '1px solid var(--primary)', borderRadius: '6px', color: 'var(--primary)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>+ Tambah SKU</button>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total SKU',              value: summary.total,    color: 'var(--text-primary)' },
          { label: '🔴 Kritis (≤3 hari)',    value: summary.critical, color: '#dc2626' },
          { label: '🟢 Stok Aman',           value: summary.safe,     color: '#059669' },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>{c.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: c.color, marginTop: '8px' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
              {['SKU / Produk', 'Stok Tersedia', 'Alokasi Kampanye', 'Avg Jual/Hari (7H)', 'Sisa Hari', 'Risiko Stockout', 'Aksi'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r: any, i: number) => {
              const rc = RISK_CONFIG[r.stockoutRisk]
              const effective = r.available_stock - r.reserved_stock - r.campaign_allocation
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{r.product_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.sku}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700 }}>{r.available_stock.toLocaleString('id-ID')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Efektif: {Math.max(0, effective).toLocaleString('id-ID')}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.campaign_allocation.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '12px 16px' }}>{r.avg_daily_sales_7d.toFixed(1)} unit</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: r.coverageDays <= 7 ? '#dc2626' : 'var(--text-primary)' }}>
                    {r.coverageDays >= 999 ? '∞' : `${r.coverageDays} hari`}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: rc.bg, color: rc.color }}>{rc.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {!isDummy && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEdit(r)} style={{ padding: '5px 8px', border: '1px solid var(--surface-border)', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--text-secondary)' }}><Edit size={14} /></button>
                        <button onClick={() => deleteRecord(r.id)} style={{ padding: '5px 8px', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent', color: '#dc2626' }}><Trash2 size={14} /></button>
                      </div>
                    )}
                    {isDummy && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Demo</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: 700 }}>{editItem ? 'Edit Data Stok' : 'Tambah SKU Baru'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { label: 'SKU', field: 'sku', type: 'text', colSpan: 1 },
                { label: 'Nama Produk', field: 'product_name', type: 'text', colSpan: 1 },
                { label: 'Stok Tersedia', field: 'available_stock', type: 'number', colSpan: 1 },
                { label: 'Stok Dipesan', field: 'reserved_stock', type: 'number', colSpan: 1 },
                { label: 'Alokasi Kampanye', field: 'campaign_allocation', type: 'number', colSpan: 1 },
                { label: 'Avg Jual/Hari (7H)', field: 'avg_daily_sales_7d', type: 'number', colSpan: 1 },
                { label: 'Avg Jual/Hari (30H)', field: 'avg_daily_sales_30d', type: 'number', colSpan: 2 },
              ].map(f => (
                <div key={f.field} style={{ gridColumn: `span ${f.colSpan}` }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>{f.label}</label>
                  <input type={f.type} step="0.1" value={form[f.field as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.field]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setEditItem(null) }} style={{ padding: '10px 20px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
              <button className="btn-primary" onClick={saveRecord}>{editItem ? 'Simpan Perubahan' : 'Tambah SKU'}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
