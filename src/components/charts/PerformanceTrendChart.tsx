'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts'

interface TrendData {
  date: string
  gmv: number
  netSales: number
  orders: number
  spend: number
  roas: number
  profit: number
}

const METRICS = [
  { key: 'gmv', label: 'GMV', format: 'currency', color: 'var(--primary)' },
  { key: 'netSales', label: 'Net Sales', format: 'currency', color: '#10b981' },
  { key: 'orders', label: 'Orders', format: 'number', color: '#8b5cf6' },
  { key: 'spend', label: 'Ads Spend', format: 'currency', color: '#f59e0b' },
  { key: 'roas', label: 'ROAS', format: 'multiplier', color: '#ec4899' },
  { key: 'profit', label: 'Profit', format: 'currency', color: '#14b8a6' },
]

export function PerformanceTrendChart({ data }: { data: TrendData[] }) {
  const [selectedMetric, setSelectedMetric] = useState('gmv')

  const metricConfig = METRICS.find(m => m.key === selectedMetric)!

  const formatValue = (val: number, format: string) => {
    if (format === 'currency') return `Rp ${(val/1000).toLocaleString()}`
    if (format === 'multiplier') return `${val.toFixed(2)}x`
    return val.toLocaleString()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></div>
              <span style={{ fontSize: '0.9rem' }}>{entry.name}:</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {formatValue(entry.value, metricConfig.format)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Performance Trend</h3>
        <select 
          value={selectedMetric} 
          onChange={(e) => setSelectedMetric(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)', outline: 'none', backgroundColor: 'var(--surface)' }}
        >
          {METRICS.map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`color-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricConfig.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={metricConfig.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              tickFormatter={(value) => {
                if (metricConfig.format === 'currency') return `${(value/1000000).toFixed(0)}M`
                if (metricConfig.format === 'multiplier') return `${value}x`
                return value
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey={selectedMetric} 
              name={metricConfig.label}
              stroke={metricConfig.color} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={`url(#color-${selectedMetric})`} 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
