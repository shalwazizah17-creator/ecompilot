'use client'

import Link from 'next/link'

const marketplaceData = [
  { name: 'Shopee', gmv: 45000000, orders: 1200, spend: 4500000, roas: 10, cpa: 3750 },
  { name: 'TikTok Shop', gmv: 52000000, orders: 1400, spend: 3000000, roas: 17.3, cpa: 2142 },
  { name: 'Tokopedia', gmv: 27500000, orders: 550, spend: 1800000, roas: 15.2, cpa: 3272 },
]

const adChannelData = [
  { name: 'Meta Ads', spend: 5000000, attrRevenue: 22000000, roas: 4.4, cpa: 4500, ctr: 1.2 },
  { name: 'Shopee Ads', spend: 4500000, attrRevenue: 45000000, roas: 10, cpa: 3750, ctr: 2.1 },
  { name: 'TikTok Ads', spend: 3000000, attrRevenue: 52000000, roas: 17.3, cpa: 2142, ctr: 3.5 },
  { name: 'Tokopedia Ads', spend: 1800000, attrRevenue: 27500000, roas: 15.2, cpa: 3272, ctr: 1.8 },
]

export function PerformanceTables() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* MARKETPLACE TABLE */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Performa Marketplace</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 8px' }}>Marketplace</th>
              <th style={{ padding: '12px 8px' }}>GMV (Penjualan)</th>
              <th style={{ padding: '12px 8px' }}>Pesanan</th>
              <th style={{ padding: '12px 8px' }}>Pengeluaran Iklan</th>
              <th style={{ padding: '12px 8px' }}>ROAS</th>
              <th style={{ padding: '12px 8px' }}>CPA</th>
              <th style={{ padding: '12px 8px' }}></th>
            </tr>
          </thead>
          <tbody>
            {marketplaceData.map(row => (
              <tr key={row.name} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                <td style={{ padding: '12px 8px', fontWeight: 500 }}>{row.name}</td>
                <td style={{ padding: '12px 8px' }}>Rp {(row.gmv/1000000).toFixed(1)}M</td>
                <td style={{ padding: '12px 8px' }}>{row.orders}</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Rp {(row.spend/1000000).toFixed(1)}M</td>
                <td style={{ padding: '12px 8px' }}>{row.roas}x</td>
                <td style={{ padding: '12px 8px' }}>Rp {row.cpa.toLocaleString()}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <Link href="#" style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.85rem' }}>Analisis Mendalam →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AD CHANNEL TABLE */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Performa Saluran Periklanan</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
            Pendapatan berbasis atribusi (Hindari menggabungkan dengan GMV)
          </span>
        </div>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 8px' }}>Saluran Iklan</th>
              <th style={{ padding: '12px 8px' }}>Pengeluaran</th>
              <th style={{ padding: '12px 8px' }}>Pendapatan Atribusi</th>
              <th style={{ padding: '12px 8px' }}>ROAS</th>
              <th style={{ padding: '12px 8px' }}>CPA</th>
              <th style={{ padding: '12px 8px' }}>CTR</th>
              <th style={{ padding: '12px 8px' }}></th>
            </tr>
          </thead>
          <tbody>
            {adChannelData.map(row => (
              <tr key={row.name} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                <td style={{ padding: '12px 8px', fontWeight: 500 }}>{row.name}</td>
                <td style={{ padding: '12px 8px' }}>Rp {(row.spend/1000000).toFixed(1)}M</td>
                <td style={{ padding: '12px 8px' }}>Rp {(row.attrRevenue/1000000).toFixed(1)}M</td>
                <td style={{ padding: '12px 8px', fontWeight: 600, color: row.roas > 5 ? 'var(--success)' : 'var(--text-primary)' }}>{row.roas}x</td>
                <td style={{ padding: '12px 8px' }}>Rp {row.cpa.toLocaleString()}</td>
                <td style={{ padding: '12px 8px' }}>{row.ctr}%</td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <Link href="#" style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.85rem' }}>Lihat Kampanye →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
