'use client'

import { useEffect, useState } from 'react'
import { Calculator, ArrowRight, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'

export default function ScenarioPlannerPage() {
  const [metaBudgetChange, setMetaBudgetChange] = useState(0) // percentage
  const [affiliateCommission, setAffiliateCommission] = useState(10) // percentage
  
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runSimulation = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // brandId removed
          metaBudgetChangePct: metaBudgetChange,
          affiliateCommissionPct: affiliateCommission
        })
      })
      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runSimulation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaBudgetChange, affiliateCommission])

  const formatCurrency = (val: number) => `Rp ${(val/1000000).toFixed(1)} Juta`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scenario Planner</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Simulate budget and commission changes to forecast profitability.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* CONTROLS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} /> Simulation Parameters
          </h2>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Meta Ads Budget</label>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: metaBudgetChange >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {metaBudgetChange >= 0 ? '+' : ''}{metaBudgetChange}%
              </span>
            </div>
            <input 
              type="range" min="-50" max="100" step="5"
              value={metaBudgetChange}
              onChange={e => setMetaBudgetChange(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Simulate increasing or cutting Meta spend.</p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Affiliate Commission (Flat %)</label>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>{affiliateCommission}%</span>
            </div>
            <input 
              type="range" min="0" max="30" step="1"
              value={affiliateCommission}
              onChange={e => setAffiliateCommission(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Simulate cost impact of aggressive affiliate payouts.</p>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--surface-border)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong>Note:</strong> All projections apply a diminishing returns mathematical model (e.g., +20% budget ≠ +20% GMV).
          </div>
        </div>

        {/* RESULTS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Projected 30-Day Impact</h2>
            {loading && <Activity size={16} color="var(--primary)" className="animate-spin" />}
          </div>

          {!results ? (
            <div style={{ color: 'var(--text-muted)' }}>Adjust sliders to simulate outcomes.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '16px', alignItems: 'center' }}>
                <div style={{ padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Baseline GMV</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(results.baseline.gmv)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}><ArrowRight /></div>
                <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '8px' }}>Projected GMV</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(results.projected.gmv)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '16px', alignItems: 'center' }}>
                <div style={{ padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Baseline Net Profit</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(results.baseline.profit)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}><ArrowRight /></div>
                <div style={{ padding: '16px', backgroundColor: results.projected.profit > results.baseline.profit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: results.projected.profit > results.baseline.profit ? 'var(--success)' : 'var(--danger)', fontWeight: 600, marginBottom: '8px' }}>Projected Net Profit</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: results.projected.profit > results.baseline.profit ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(results.projected.profit)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--surface)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Projected Total Ads Spend</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatCurrency(results.projected.spend)}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ROAS: {results.projected.roas.toFixed(2)}x (Baseline: {results.baseline.roas.toFixed(2)}x)</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--surface)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Projected Affiliate Cost</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatCurrency(results.projected.affiliateCost)}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>At {affiliateCommission}% flat commission</div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
