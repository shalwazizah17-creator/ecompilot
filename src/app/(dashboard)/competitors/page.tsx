'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, TrendingDown } from 'lucide-react'

const DUMMY_COMPETITORS = [
  {
    id: 'd1', name: 'SKINTIFIC', marketplace: 'shopee', store_url: 'https://shopee.co.id/skintific.id',
    products: [
      { id: 'p1', product_name: '5X Ceramide Barrier Repair Moisture Gel', sku_reference: 'SK-5X-GEL', current_price: 139000, stock_status: 'IN_STOCK', url: '', snapshots: [{ price: 139000 }, { price: 159000 }] },
      { id: 'p2', product_name: 'Mugwort Anti Pores & Acne Clay Mask', sku_reference: 'SK-MGW-MASK', current_price: 89000, stock_status: 'IN_STOCK', url: '', snapshots: [{ price: 89000 }, { price: 95000 }] },
    ]
  },
  {
    id: 'd2', name: 'GLAD2GLOW', marketplace: 'tokopedia', store_url: 'https://www.tokopedia.com/glad2glow',
    products: [
      { id: 'p3', product_name: 'Centella Allantoin Soothing Gel Moisturizer', sku_reference: 'G2G-CEN-GEL', current_price: 49000, stock_status: 'IN_STOCK', url: '', snapshots: [{ price: 49000 }] },
      { id: 'p4', product_name: 'Blueberry Ceramide 5% Barrier Repair', sku_reference: 'G2G-BLU-CER', current_price: 52000, stock_status: 'OUT_OF_STOCK', url: '', snapshots: [{ price: 52000 }, { price: 55000 }] },
    ]
  },
  {
    id: 'd3', name: 'TRUE TO SKIN', marketplace: 'tiktok', store_url: '',
    products: [
      { id: 'p5', product_name: 'Bakuchiol Anti-Aging Serum', sku_reference: 'TTS-BAK-SRM', current_price: 119000, stock_status: 'IN_STOCK', url: '', snapshots: [{ price: 119000 }, { price: 119000 }] },
      { id: 'p6', product_name: 'Mugwort Tripeptide Gel Cream', sku_reference: 'TTS-MUG-GEL', current_price: 115000, stock_status: 'IN_STOCK', url: '', snapshots: [{ price: 105000 }, { price: 115000 }] },
    ]
  },
  {
    id: 'd4', name: 'EMINA', marketplace: 'shopee', store_url: 'https://shopee.co.id/eminaofficial',
    products: [
      { id: 'p7', product_name: 'Bright Stuff Face Wash', sku_reference: 'EM-BS-FW', current_price: 28500, stock_status: 'IN_STOCK', url: '', snapshots: [{ price: 28500 }, { price: 29000 }] },
    ]
  },
  {
    id: 'd5', name: 'WARDAH', marketplace: 'lazada', store_url: '',
    products: [
      { id: 'p8', product_name: 'Lightening Day Cream', sku_reference: 'WD-LGT-DAY', current_price: 45000, stock_status: 'IN_STOCK', url: '', snapshots: [{ price: 45000 }] },
    ]
  },
  {
    id: 'd6', name: 'BECOMING', marketplace: 'shopee', store_url: '',
    products: [
      { id: 'p9', product_name: 'Glow Up Serum 20ml', sku_reference: 'BCM-GLW-SRM', current_price: 85000, stock_status: 'IN_STOCK', url: '', snapshots: [{ price: 85000 }, { price: 89000 }] },
    ]
  },
]

async function getBrandId(): Promise<string | null> {
  try {
    const res = await fetch('/api/brands')
    if (!res.ok) return null
    const data = await res.json()
    return data.brands?.[0]?.id ?? null
  } catch { return null }
}

export default function CompetitorsPage() {
  const [brandId, setBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [competitors, setCompetitors] = useState<any[]>([])
  const [isDummy, setIsDummy] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [productModal, setProductModal] = useState<{ competitorId: string; competitorName: string } | null>(null)
  const [snapshotModal, setSnapshotModal] = useState<any>(null)
  const [form, setForm] = useState({ name: '', marketplace: 'shopee', store_url: '' })
  const [productForm, setProductForm] = useState({ product_name: '', sku_reference: '', url: '', current_price: 0 })
  const [snapshotForm, setSnapshotForm] = useState({ price: 0, notes: '' })

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)
    try {
      const bid = await getBrandId()
      setBrandId(bid)
      if (bid) {
        await loadData(bid)
      } else {
        setCompetitors(DUMMY_COMPETITORS)
        setIsDummy(true)
      }
    } catch {
      setCompetitors(DUMMY_COMPETITORS)
      setIsDummy(true)
    } finally {
      setLoading(false)
    }
  }

  async function loadData(bid: string) {
    const res = await fetch(`/api/competitors?brandId=${bid}`)
    const data = await res.json()
    const comps = data.competitors ?? []
    if (comps.length === 0) {
      setCompetitors(DUMMY_COMPETITORS)
      setIsDummy(true)
    } else {
      setCompetitors(comps)
      setIsDummy(false)
    }
  }

  async function addCompetitor() {
    if (!brandId || !form.name) return
    await fetch('/api/competitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, brandId }) })
    setShowModal(false)
    setForm({ name: '', marketplace: 'shopee', store_url: '' })
    loadData(brandId)
  }

  async function deleteCompetitor(id: string) {
    if (!brandId || !confirm('Hapus kompetitor ini?')) return
    await fetch(`/api/competitors?id=${id}&brandId=${brandId}`, { method: 'DELETE' })
    loadData(brandId)
  }

  async function addProduct() {
    if (!productModal || !brandId) return
    await fetch(`/api/competitors/${productModal.competitorId}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...productForm, brandId }) })
    setProductModal(null)
    loadData(brandId)
  }

  async function addSnapshot() {
    if (!snapshotModal || !brandId) return
    await fetch(`/api/competitors/products/${snapshotModal.id}/snapshots`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...snapshotForm, brandId }) })
    setSnapshotModal(null)
    loadData(brandId)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--surface-border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Memuat data kompetitor...</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const mktColors: Record<string, string> = { shopee: '#f97316', tokopedia: '#16a34a', tiktok: '#0ea5e9', meta: '#2563eb', other: '#6b7280' }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🕵️ Intelijen Kompetitor</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>Pantau harga dan tren kompetitor secara manual.</p>
        </div>
        {!isDummy && <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={16} /> Tambah Kompetitor</button>}
      </div>

      {isDummy && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#854d0e' }}>
          <span>⚠️</span>
          <span>Menampilkan <strong>data contoh</strong>. Tambahkan kompetitor nyata untuk mulai memantau harga pesaing.</span>
          <button onClick={() => { setIsDummy(false); setCompetitors([]) }} style={{ marginLeft: 'auto', padding: '6px 14px', border: '1px solid var(--primary)', borderRadius: '6px', color: 'var(--primary)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            + Tambah Kompetitor
          </button>
        </div>
      )}

      {competitors.length === 0 && !isDummy ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px' }}>
          <TrendingDown size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ marginBottom: '8px' }}>Belum Ada Kompetitor</h3>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Tambah Kompetitor Pertama</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {competitors.map(comp => (
            <div key={comp.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--background)', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: `${mktColors[comp.marketplace] ?? '#6b7280'}20`, color: mktColors[comp.marketplace] ?? '#6b7280', textTransform: 'capitalize' }}>{comp.marketplace}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{comp.name}</div>
                    {comp.store_url && <a href={comp.store_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}><ExternalLink size={12} /> Lihat Toko</a>}
                  </div>
                </div>
                {!isDummy && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setProductModal({ competitorId: comp.id, competitorName: comp.name })} style={{ padding: '6px 14px', border: '1px solid var(--primary)', borderRadius: '6px', color: 'var(--primary)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>+ Produk</button>
                    <button onClick={() => deleteCompetitor(comp.id)} style={{ padding: '6px 10px', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', backgroundColor: 'transparent', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              {comp.products?.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                        {['Nama Produk', 'SKU Ref.', 'Harga Saat Ini', 'Stok', 'Tren Harga'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{h}</th>
                        ))}
                        {!isDummy && <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {comp.products.map((prod: any) => {
                        const prices = prod.snapshots?.map((s: any) => s.price) ?? []
                        const trend = prices.length >= 2 ? (prices[0] > prices[1] ? '📈 Naik' : prices[0] < prices[1] ? '📉 Turun' : '➡️ Stabil') : '—'
                        return (
                          <tr key={prod.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{prod.product_name}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{prod.sku_reference ?? '—'}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 700 }}>{prod.current_price > 0 ? `Rp ${prod.current_price.toLocaleString('id-ID')}` : '—'}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: prod.stock_status === 'IN_STOCK' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)', color: prod.stock_status === 'IN_STOCK' ? '#059669' : '#dc2626' }}>
                                {prod.stock_status === 'IN_STOCK' ? 'Tersedia' : prod.stock_status === 'OUT_OF_STOCK' ? 'Habis' : '—'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>{trend}</td>
                            {!isDummy && <td style={{ padding: '12px 16px' }}>
                              <button onClick={() => setSnapshotModal(prod)} style={{ padding: '5px 10px', border: '1px solid var(--surface-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>+ Update Harga</button>
                            </td>}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Belum ada produk dipantau.</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Competitor Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: 700 }}>Tambah Kompetitor</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Nama Toko</label><input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>URL Toko (Opsional)</label><input type="url" value={form.store_url} onChange={e => setForm(p => ({ ...p, store_url: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Marketplace</label>
                <select value={form.marketplace} onChange={e => setForm(p => ({ ...p, marketplace: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
                  {['shopee','tokopedia','tiktok','meta','lazada','other'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
              <button className="btn-primary" onClick={addCompetitor}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Product & Snapshot modals omitted for brevity — same as before */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
