'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, TrendingDown } from 'lucide-react'

export default function CompetitorsPage() {
  const [brandId, setBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [competitors, setCompetitors] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [productModal, setProductModal] = useState<{ competitorId: string; competitorName: string } | null>(null)
  const [form, setForm] = useState({ name: '', marketplace: 'shopee', store_url: '' })
  const [productForm, setProductForm] = useState({ product_name: '', sku_reference: '', url: '', current_price: 0 })
  const [snapshotModal, setSnapshotModal] = useState<any>(null)
  const [snapshotForm, setSnapshotForm] = useState({ price: 0, notes: '' })

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(async (sess) => {
      if (!sess?.user) return
      const bRes = await fetch('/api/brands')
      const bData = await bRes.json()
      const bid = bData.brands?.[0]?.id
      if (bid) { setBrandId(bid); await loadData(bid) }
      setLoading(false)
    })
  }, [])

  async function loadData(bid: string) {
    const res = await fetch(`/api/competitors?brandId=${bid}`)
    const data = await res.json()
    setCompetitors(data.competitors ?? [])
  }

  async function addCompetitor() {
    if (!brandId || !form.name) return
    await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, brandId }),
    })
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
    await fetch(`/api/competitors/${productModal.competitorId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...productForm, brandId }),
    })
    setProductModal(null)
    setProductForm({ product_name: '', sku_reference: '', url: '', current_price: 0 })
    loadData(brandId)
  }

  async function addSnapshot() {
    if (!snapshotModal || !brandId) return
    await fetch(`/api/competitors/products/${snapshotModal.id}/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...snapshotForm, brandId }),
    })
    setSnapshotModal(null)
    loadData(brandId)
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Memuat data kompetitor...</div>

  const marketplaceColors: Record<string, string> = { shopee: '#f97316', tokopedia: '#16a34a', tiktok: '#0ea5e9', meta: '#2563eb', other: '#6b7280' }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🕵️ Intelijen Kompetitor</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Pantau harga dan tren kompetitor. Data tidak mengakses file privat brand lain.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Tambah Kompetitor
        </button>
      </div>

      {competitors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px' }}>
          <TrendingDown size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ marginBottom: '8px' }}>Belum Ada Kompetitor</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Tambahkan kompetitor untuk memantau pergerakan harga dan stok mereka.
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Tambah Kompetitor Pertama</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {competitors.map(comp => (
            <div key={comp.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--background)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: `${marketplaceColors[comp.marketplace] ?? '#6b7280'}20`, color: marketplaceColors[comp.marketplace] ?? '#6b7280', textTransform: 'capitalize' }}>
                    {comp.marketplace}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{comp.name}</div>
                    {comp.store_url && <a href={comp.store_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ExternalLink size={12} /> Lihat Toko
                    </a>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setProductModal({ competitorId: comp.id, competitorName: comp.name })}
                    style={{ padding: '6px 14px', border: '1px solid var(--primary)', borderRadius: '6px', color: 'var(--primary)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                    + Produk
                  </button>
                  <button onClick={() => deleteCompetitor(comp.id)}
                    style={{ padding: '6px 10px', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Products */}
              {comp.products?.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                      {['Nama Produk', 'SKU Ref.', 'Harga Saat Ini', 'Status Stok', 'Riwayat Harga', 'Aksi'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comp.products.map((prod: any) => {
                      const prices = prod.snapshots?.map((s: any) => s.price) ?? []
                      const minPrice = prices.length ? Math.min(...prices) : 0
                      const maxPrice = prices.length ? Math.max(...prices) : 0
                      const trend = prices.length >= 2 ? (prices[0] > prices[1] ? '📈' : prices[0] < prices[1] ? '📉' : '➡️') : '—'
                      return (
                        <tr key={prod.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{prod.product_name}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{prod.sku_reference ?? '—'}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                            {prod.current_price > 0 ? `Rp ${prod.current_price.toLocaleString('id-ID')}` : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                              backgroundColor: prod.stock_status === 'IN_STOCK' ? 'rgba(5,150,105,0.1)' : prod.stock_status === 'OUT_OF_STOCK' ? 'rgba(220,38,38,0.1)' : 'rgba(107,114,128,0.1)',
                              color: prod.stock_status === 'IN_STOCK' ? '#059669' : prod.stock_status === 'OUT_OF_STOCK' ? '#dc2626' : '#6b7280',
                            }}>
                              {prod.stock_status === 'IN_STOCK' ? 'Tersedia' : prod.stock_status === 'OUT_OF_STOCK' ? 'Habis' : 'Tidak Diketahui'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {prices.length >= 2 ? `${trend} Min: Rp ${minPrice.toLocaleString('id-ID')} | Max: Rp ${maxPrice.toLocaleString('id-ID')}` : `${prod.snapshots?.length ?? 0} snapshot`}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => setSnapshotModal(prod)}
                              style={{ padding: '5px 10px', border: '1px solid var(--surface-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>
                              + Update Harga
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Belum ada produk dipantau. Klik "+ Produk" untuk menambahkan.
                </div>
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
              {[
                { label: 'Nama Toko/Brand Kompetitor', field: 'name', type: 'text', placeholder: 'Contoh: Toko Rival ABC' },
                { label: 'URL Toko (Opsional)', field: 'store_url', type: 'url', placeholder: 'https://shopee.co.id/...' },
              ].map(f => (
                <div key={f.field}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.field as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Marketplace</label>
                <select value={form.marketplace} onChange={e => setForm(p => ({ ...p, marketplace: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
                  {['shopee', 'tokopedia', 'tiktok', 'meta', 'lazada', 'other'].map(m => <option key={m} value={m}>{m}</option>)}
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

      {/* Add Product Modal */}
      {productModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 4px', fontWeight: 700 }}>Tambah Produk Pantauan</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 20px' }}>Kompetitor: {productModal.competitorName}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Nama Produk</label><input type="text" value={productForm.product_name} onChange={e => setProductForm(p => ({ ...p, product_name: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Referensi SKU Anda (Opsional)</label><input type="text" value={productForm.sku_reference} onChange={e => setProductForm(p => ({ ...p, sku_reference: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>URL Produk Kompetitor</label><input type="url" value={productForm.url} onChange={e => setProductForm(p => ({ ...p, url: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Harga Saat Ini (Rp)</label><input type="number" value={productForm.current_price} onChange={e => setProductForm(p => ({ ...p, current_price: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setProductModal(null)} style={{ padding: '10px 20px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
              <button className="btn-primary" onClick={addProduct}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Modal */}
      {snapshotModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '380px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 4px', fontWeight: 700 }}>Update Harga Kompetitor</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 20px' }}>{snapshotModal.product_name}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Harga Baru (Rp)</label><input type="number" value={snapshotForm.price} onChange={e => setSnapshotForm(p => ({ ...p, price: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Catatan (Opsional)</label><input type="text" placeholder="Contoh: promo flash sale" value={snapshotForm.notes} onChange={e => setSnapshotForm(p => ({ ...p, notes: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: '6px', backgroundColor: 'var(--background)', color: 'var(--text-primary)', boxSizing: 'border-box' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSnapshotModal(null)} style={{ padding: '10px 20px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'transparent', cursor: 'pointer' }}>Batal</button>
              <button className="btn-primary" onClick={addSnapshot}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
