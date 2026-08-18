'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useState } from 'react'

const METRICS = [
  { key: 'gmv', label: 'GMV', format: 'currency' },
  { key: 'orders', label: 'Orders', format: 'number' },
  { key: 'roas', label: 'ROAS', format: 'multiplier' },
  { key: 'profit', label: 'Profit', format: 'currency' },
]

export function MarketplaceComparisonChart({ data }: { data: any[] }) {
  const [metric, setMetric] = useState('gmv')
  const config = METRICS.find(m => m.key === metric)!

  const sortedData = [...data].sort((a, b) => b[metric] - a[metric])

  const formatValue = (val: number) => {
    if (config.format === 'currency') return `Rp ${(val/1000).toLocaleString()}`
    if (config.format === 'multiplier') return `${val.toFixed(2)}x`
    return val.toLocaleString()
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid var(--surface-border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{payload[0].payload.name}</p>
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary)', marginTop: '4px' }}>
            {formatValue(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Marketplace Comparison</h3>
        <select 
          value={metric} 
          onChange={(e) => setMetric(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontSize: '0.85rem' }}
        >
          {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, minHeight: '250px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--surface-border)" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
              tickFormatter={v => config.format === 'currency' ? `${(v/1000000).toFixed(0)} Juta` : v} 
            />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} width={80} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Bar dataKey={metric} radius={[0, 4, 4, 0]} barSize={32}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary)' : 'var(--surface-border)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
