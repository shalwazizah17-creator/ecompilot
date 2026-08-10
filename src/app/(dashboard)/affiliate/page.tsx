'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { TrendingUp, Users, DollarSign, Award, ChevronRight, Calculator } from 'lucide-react'
import Link from 'next/link'

export default function AffiliateDashboard() {
  const { selectedBrandId } = useStore()
  const [data, setData] = useState<any>(null)
  const [recs, setRecs] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Scenario Planner State
  const [expectedRoi, setExpectedRoi] = useState(8)
  const [commissionPct, setCommissionPct] = useState(10)
  const [expectedGmv, setExpectedGmv] = useState(10000000)

  useEffect(() => {
    load()
  }, [selectedBrandId])

  async function load() {
    if (!selectedBrandId) return
    setLoading(true)
    const [resData, resRecs] = await Promise.all([
      fetch(`/api/affiliate?brandId=${selectedBrandId}`),
      fetch(`/api/affiliate/recommendations?brandId=${selectedBrandId}`)
    ])
    
    if (resData.ok) setData(await resData.json())
    if (resRecs.ok) {
      const r = await resRecs.json()
      setRecs(r.recommendations)
    }
    setLoading(false)
  }

  const formatCurrency = (val: number) => `Rp ${(val).toLocaleString('id-ID')}`

  if (loading) return <div>Loading Affiliate Intelligence...</div>

  const expectedCommission = expectedGmv * (commissionPct / 100)
  const requiredSalesForRoi = expectedCommission * expectedRoi
  const expectedProfit = expectedGmv * 0.15 // Assuming standard 15% net margin before affiliate cost
  const projectedNetImpact = expectedProfit - expectedCommission

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Affiliate Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Creator performance, ROI analysis, and recommendations.</p>
        </div>
        <Link href="/settings/affiliate" className="btn-secondary" style={{ textDecoration: 'none' }}>
          Target Settings <ChevronRight size={16} />
        </Link>
      </div>

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div className="card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} /> Affiliate GMV
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>
              {formatCurrency(data.kpis.totalGmv)}
            </div>
          </div>
          
          <div className="card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} /> Affiliate ROAS
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>
              {data.kpis.roas.toFixed(2)}x
            </div>
          </div>

          <div className="card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} /> Active Affiliates
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>
              {data.kpis.activeAffiliates}
            </div>
          </div>

          <div className="card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} /> Commission Paid
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>
              {formatCurrency(data.kpis.totalCommission)}
            </div>
          </div>
        </div>
      )}

      {/* STAFF SCENARIO PLANNER */}
      <div className="card" style={{ display: 'flex', gap: '32px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><Calculator size={20} /> Affiliate Scenario Planner</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Simulate collaboration parameters before approving creators.</p>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Expected GMV (Rp)</label>
            <input type="number" className="input" value={expectedGmv} onChange={e => setExpectedGmv(Number(e.target.value))} />
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Commission %</label>
              <input type="number" className="input" value={commissionPct} onChange={e => setCommissionPct(Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Target ROI (%)</label>
              <input type="number" className="input" value={expectedRoi} onChange={e => setExpectedRoi(Number(e.target.value))} />
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1, backgroundColor: 'var(--background)', padding: '24px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontWeight: 600, borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px', marginBottom: '8px' }}>Simulation Results</h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Estimated Commission:</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(expectedCommission)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Break-even GMV (for ROI):</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(requiredSalesForRoi)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Projected Net Impact:</span>
            <span style={{ fontWeight: 700, color: projectedNetImpact > 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(projectedNetImpact)}</span>
          </div>
        </div>
      </div>

      {/* RECOMMENDED AFFILIATES (AI ENGINE) */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>Recommended Affiliates</h3>
        
        {recs && (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px' }}>Affiliate</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Match</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px' }}>Why</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>30d ROAS</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--background)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600 }}>{r.affiliate}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.platform}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: r.score >= 80 ? 'var(--success)' : 'var(--primary)' }}>{r.score}/100</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.confidence}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                      backgroundColor: r.recommendation === 'STAR' ? 'rgba(16, 185, 129, 0.1)' : 
                                       r.recommendation === 'RISK' ? 'rgba(239, 68, 68, 0.1)' : 
                                       'rgba(59, 130, 246, 0.1)',
                      color: r.recommendation === 'STAR' ? 'var(--success)' : 
                             r.recommendation === 'RISK' ? 'var(--danger)' : 
                             'var(--primary)'
                    }}>
                      {r.recommendation}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      {r.reasons.map((reason: string, i: number) => <li key={i}>{reason}</li>)}
                    </ul>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                    {r.metrics.roas.toFixed(2)}x
                  </td>
                </tr>
              ))}
              {recs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No affiliate recommendations available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
