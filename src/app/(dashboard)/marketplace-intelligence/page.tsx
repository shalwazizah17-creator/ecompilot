'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'

export default function MarketplaceIntelligence() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { selectedBrandId } = useStore()
  const brandId = selectedBrandId || 'cm0m2xxxx0000000000000000'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/marketplace-intelligence?brandId=${brandId}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [brandId])

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Marketplace Intelligence...</div>
  }

  if (!data || !data.kpis) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load data.</div>
  }

  const { kpis, chartData, platformGrowth } = data

  const formatIDR = (val: number) => `Rp ${(val/1000000).toFixed(1)}M`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Marketplace Intelligence</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Understand marketplace growth, sales performance, advertising efficiency, and affiliate contribution.</p>
      </div>

      {/* EXECUTIVE KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="card">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>GMV</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatIDR(kpis.totalGMV)}</h2>
        </div>
        <div className="card">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Net Sales</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatIDR(kpis.totalNetSales)}</h2>
        </div>
        <div className="card">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Orders</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{kpis.totalOrders.toLocaleString()}</h2>
        </div>
        <div className="card">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>ROAS</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{kpis.roas.toFixed(1)}x</h2>
        </div>
        <div className="card" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '8px', fontWeight: 500 }}>Affiliate Contribution</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{kpis.affiliateContribution.toFixed(1)}%</h2>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>GMV vs Affiliate Contribution Growth</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(val) => `${(val/1000000)}M`} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString()}`} />
                <Area type="monotone" dataKey="gmv" name="Total GMV" stroke="var(--primary)" fill="rgba(59, 130, 246, 0.1)" strokeWidth={3} />
                <Area type="monotone" dataKey="affiliateGmv" name="Affiliate GMV" stroke="var(--success)" fill="rgba(16, 185, 129, 0.2)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>Platform Share</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformGrowth} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--surface-border)" />
                <XAxis type="number" tickFormatter={(val) => `${(val/1000000)}M`} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} type="category" width={80} />
                <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString()}`} />
                <Bar dataKey="gmv" name="GMV" fill="var(--primary-navy)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  )
}
