'use client'

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function AdSpendVsRevenueChart({ data }: { data: any[] }) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entry.name}</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Rp {(entry.value/1000).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed var(--surface-border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            *Attributed Revenue is distinct from Marketplace GMV.
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '24px' }}>Advertising vs Revenue (Decoupled)</h3>
      <div style={{ flex: 1, minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
            <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={v => `${(v/1000000).toFixed(0)} Juta`} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={v => `${(v/1000000).toFixed(0)} Juta`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '0.85rem' }} />
            
            <Bar yAxisId="left" dataKey="gmv" name="Marketplace GMV" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="attrRev" name="Ads Attributed Revenue" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line yAxisId="right" type="step" dataKey="spend" name="Ads Spend" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
