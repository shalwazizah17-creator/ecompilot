'use client'

import { useEffect, useState } from 'react'

export function ProductAnalytics({ brandId }: { brandId: string }) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!brandId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/products?brandId=${brandId}`)
        const data = await res.json()
        setProducts(data.products || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [brandId])

  if (loading) {
    return <div className="card" style={{ height: '300px', animation: 'pulse 2s infinite', backgroundColor: 'var(--surface-border)' }}></div>
  }

  // Generate rankings based on data
  const topRevenue = [...products].sort((a, b) => b.netSales - a.netSales).slice(0, 3)
  const topProfit = [...products].sort((a, b) => b.profit - a.profit).slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
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
                    Rp {(p.netSales/1000000).toFixed(1)}M
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
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Product & SKU Analytics</h3>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 8px' }}>SKU</th>
              <th style={{ padding: '12px 8px' }}>Product Name</th>
              <th style={{ padding: '12px 8px' }}>Net Sales</th>
              <th style={{ padding: '12px 8px' }}>Ad Spend</th>
              <th style={{ padding: '12px 8px' }}>ROAS</th>
              <th style={{ padding: '12px 8px' }}>Profit</th>
              <th style={{ padding: '12px 8px' }}>Margin</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
