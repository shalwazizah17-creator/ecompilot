'use client'

import { useEffect, useState } from 'react'

export function ForecastModule({ brandId }: { brandId: string }) {
  // In a real app, this would fetch from /api/forecast. 
  // For MVP, we'll mock the projection UI based on the calculation engine requirements.
  const [loading, setLoading] = useState(false)

  const forecast = {
    method: '7-day / 30-day Simple Moving Average',
    actualGmv: 72000000,
    projectedGmv: 105000000,
    targetGmv: 120000000,
    actualSpend: 15000000,
    projectedSpend: 25000000,
    targetSpend: 28000000,
  }

  const achievement = (forecast.projectedGmv / forecast.targetGmv) * 100
  const variance = forecast.projectedGmv - forecast.targetGmv

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Month-End Projection</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: 'var(--surface-border)', padding: '4px 8px', borderRadius: '4px' }}>
          Method: {forecast.method}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        
        <div style={{ padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current GMV (MTD)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '8px 0' }}>Rp {(forecast.actualGmv/1000000).toFixed(1)}M</div>
        </div>

        <div style={{ padding: '16px', border: '1px solid var(--primary)', backgroundColor: 'var(--surface)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>Projected Month-End GMV</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '8px 0', color: 'var(--primary)' }}>Rp {(forecast.projectedGmv/1000000).toFixed(1)}M</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not a guaranteed outcome</div>
        </div>

        <div style={{ padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Monthly Target GMV</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '8px 0' }}>Rp {(forecast.targetGmv/1000000).toFixed(1)}M</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '12px' }}>
            <span>Proj. Achievement:</span>
            <span style={{ fontWeight: 600, color: achievement >= 100 ? 'var(--success)' : 'var(--warning)' }}>
              {achievement.toFixed(1)}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
            <span>Variance:</span>
            <span style={{ fontWeight: 600, color: variance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {variance > 0 ? '+' : ''}Rp {(variance/1000000).toFixed(1)}M
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
