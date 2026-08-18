'use client'

import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export function ForecastActualChart({ 
  trendData, 
  forecast 
}: { 
  trendData: any[], 
  forecast: { actual: number, projected: number, target: number, method: string, variance: number } 
}) {
  
  // Transform data to show distinct past vs future
  // For MVP visualization, we just draw the historical trend, then append a final "Projected End" point.
  const chartData = trendData.map(t => ({
    date: t.date,
    actual: t.gmv as number | undefined,
    projected: undefined as number | undefined
  }))
  
  // Append a future point
  if (chartData.length > 0) {
    const lastDate = new Date(chartData[chartData.length - 1].date)
    lastDate.setDate(lastDate.getDate() + 7) // Project 7 days out
    chartData.push({
      date: lastDate.toISOString().split('T')[0],
      actual: undefined as any,
      projected: forecast.projected
    })
    
    // Connect the line
    chartData[chartData.length - 2].projected = chartData[chartData.length - 2].actual
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null) return null
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></div>
                <span style={{ fontSize: '0.9rem' }}>{entry.name}:</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Rp {(entry.value/1000).toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>GMV Forecast vs Target</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Method: {forecast.method}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Variance</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: forecast.variance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {forecast.variance > 0 ? '+' : ''}Rp {(forecast.variance/1000000).toFixed(1)} Juta
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={v => `${(v/1000000).toFixed(0)} Juta`} />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={forecast.target} stroke="var(--warning)" strokeDasharray="3 3" label={{ position: 'top', value: 'Monthly Target', fill: 'var(--warning)', fontSize: 12 }} />
            
            <Line type="monotone" dataKey="actual" name="Actual GMV" stroke="var(--primary)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="projected" name="Forecast GMV" stroke="var(--primary)" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
