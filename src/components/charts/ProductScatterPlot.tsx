'use client'

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

export function ProductScatterPlot({ data }: { data: any[] }) {
  // data: { name, sku, gmv, margin, orders }
  const validData = data.filter(d => d.gmv > 0 && d.orders > 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div style={{ backgroundColor: 'white', padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>{d.name}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>SKU: {d.sku || 'N/A'}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Revenue:</span>
              <span style={{ fontWeight: 600 }}>Rp {(d.gmv/1000).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Profit Margin:</span>
              <span style={{ fontWeight: 600 }}>{d.margin.toFixed(1)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Orders:</span>
              <span style={{ fontWeight: 600 }}>{d.orders}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate median margin for quadrants
  const sortedMargins = [...validData].map(d => d.margin).sort((a,b) => a-b)
  const medianMargin = sortedMargins.length > 0 ? sortedMargins[Math.floor(sortedMargins.length / 2)] : 20

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Product Profitability</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Revenue vs Margin (Bubble size: Orders)</p>
      
      {validData.length < 3 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface)', borderRadius: '8px' }}>
          Insufficient data for scatter plot visualization.
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
              <XAxis type="number" dataKey="gmv" name="Revenue" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(0)}M`}>
                <text x="50%" y="15" dy="15" textAnchor="middle" fill="var(--text-secondary)" fontSize="12">Gross Merchandise Value (GMV)</text>
              </XAxis>
              <YAxis type="number" dataKey="margin" name="Margin" unit="%" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <ZAxis type="number" dataKey="orders" range={[60, 400]} name="Orders" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <ReferenceLine y={medianMargin} stroke="var(--surface-border)" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg Margin', fill: 'var(--text-muted)', fontSize: 10 }} />
              <Scatter data={validData} fillOpacity={0.6}>
                {validData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.margin > medianMargin ? '#10b981' : (entry.margin < 0 ? '#ef4444' : '#f59e0b')} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
