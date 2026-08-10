'use client'

import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export function RoasTrendChart({ data, targetRoas }: { data: any[], targetRoas: number }) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>{label}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: payload[0].color }}></div>
            <span style={{ fontSize: '0.9rem' }}>Actual ROAS:</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{payload[0].value.toFixed(2)}x</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }}></div>
            <span style={{ fontSize: '0.9rem' }}>Target ROAS:</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{targetRoas.toFixed(2)}x</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '24px' }}>ROAS Trend</h3>
      <div style={{ flex: 1, minHeight: '250px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={v => `${v}x`} />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={targetRoas} stroke="var(--warning)" strokeDasharray="3 3" label={{ position: 'top', value: 'Target', fill: 'var(--warning)', fontSize: 12 }} />
            
            <Line type="monotone" dataKey="roas" name="ROAS" stroke="#ec4899" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
