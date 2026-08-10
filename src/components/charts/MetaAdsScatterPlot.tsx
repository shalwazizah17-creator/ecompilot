'use client'

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function MetaAdsScatterPlot({ data }: { data: any[] }) {
  // data: { name, ctr, roas, spend }
  const validData = data.filter(d => d.ctr > 0 && d.spend > 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div style={{ backgroundColor: 'white', padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>{d.name}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>CTR:</span>
              <span style={{ fontWeight: 600 }}>{d.ctr.toFixed(2)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ROAS:</span>
              <span style={{ fontWeight: 600 }}>{d.roas.toFixed(2)}x</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Spend:</span>
              <span style={{ fontWeight: 600 }}>Rp {(d.spend/1000).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Creative / Campaign Efficiency</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>CTR vs ROAS (Bubble size: Spend)</p>
      
      {validData.length < 3 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface)', borderRadius: '8px' }}>
          Insufficient data for scatter plot visualization.
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
              <XAxis type="number" dataKey="ctr" name="CTR" unit="%" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false}>
                <text x="50%" y="15" dy="15" textAnchor="middle" fill="var(--text-secondary)" fontSize="12">Click-Through Rate (CTR)</text>
              </XAxis>
              <YAxis type="number" dataKey="roas" name="ROAS" unit="x" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <ZAxis type="number" dataKey="spend" range={[60, 400]} name="Spend" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Scatter data={validData} fill="var(--primary)" fillOpacity={0.6}>
                {validData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.roas > 3 ? '#10b981' : (entry.roas < 1 ? '#ef4444' : '#3b82f6')} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
