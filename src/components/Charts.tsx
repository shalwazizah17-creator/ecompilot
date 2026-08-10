'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface ChartProps {
  data: any[]
  dataKey: string
  color: string
}

export function TrendChart({ data, dataKey, color }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
          dy={10}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(value: any) => `Rp ${(value/1000000).toFixed(0)}M`} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
          labelStyle={{ color: 'var(--text-secondary)' }}
          formatter={(value: any) => [
            value >= 1000 ? `Rp ${value.toLocaleString()}` : value, 
            'Value'
          ]}
        />
        <Area 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={2}
          fillOpacity={1} 
          fill={`url(#color-${dataKey})`} 
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
