'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { ProductCrudModal } from '@/components/ProductCrudModal'

export function ProductAnalytics() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async (data: any) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Gagal menyimpan produk')
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error('Gagal menghapus produk')
      await load()
    } catch (err) {
      alert(err)
    }
  }

  if (loading) {
    return <div className="card" style={{ height: '300px', animation: 'pulse 2s infinite', backgroundColor: 'var(--surface-border)' }}></div>
  }

  // Generate rankings based on data
  const topRevenue = [...products].sort((a, b) => b.netSales - a.netSales).slice(0, 3)
  const topProfit = [...products].sort((a, b) => b.profit - a.profit).slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {products.length > 0 && (
        <div className="responsive-grid-2">
          <div className="card">
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Top Revenue Products</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topRevenue.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{i + 1}. {p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                    Rp {(p.netSales/1000000).toFixed(1)} Juta
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Top Profit Products</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topProfit.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{i + 1}. {p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Margin: {p.margin.toFixed(1)}%</div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                    Rp {(p.profit/1000).toFixed(0)}k
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Daftar Produk & Analitik</h3>
          <button 
            className="btn-primary" 
            onClick={() => {
              setEditingProduct(null)
              setShowModal(true)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Tambah Produk
          </button>
        </div>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 8px' }}>SKU</th>
              <th style={{ padding: '12px 8px' }}>Nama Produk</th>
              <th style={{ padding: '12px 8px' }}>Net Sales</th>
              <th style={{ padding: '12px 8px' }}>Ad Spend</th>
              <th style={{ padding: '12px 8px' }}>ROAS</th>
              <th style={{ padding: '12px 8px' }}>Profit</th>
              <th style={{ padding: '12px 8px' }}>Margin</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No product data found.</td>
              </tr>
            )}
            {products.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{row.sku}</td>
                <td style={{ padding: '12px 8px', fontWeight: 500 }}>{row.name}</td>
                <td style={{ padding: '12px 8px', fontWeight: 600 }}>Rp {(row.netSales/1000).toLocaleString()}</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Rp {(row.spend/1000).toLocaleString()}</td>
                <td style={{ padding: '12px 8px' }}>{row.roas.toFixed(1)}x</td>
                <td style={{ padding: '12px 8px', color: row.profit > 0 ? 'var(--success)' : 'var(--danger)' }}>
                  Rp {(row.profit/1000).toLocaleString()}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: row.margin > 20 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: row.margin > 20 ? 'var(--success)' : 'var(--warning)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {row.margin.toFixed(1)}%
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => { setEditingProduct(row); setShowModal(true); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(row.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <ProductCrudModal 
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          initialData={editingProduct}
        />
      )}
    </div>
  )
}
