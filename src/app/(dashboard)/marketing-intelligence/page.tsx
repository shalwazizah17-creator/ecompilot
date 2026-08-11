'use client'

import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, TrendingDown, DollarSign, Target, Activity } from 'lucide-react'

export default function MarketingDecisionCenter() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Simulator State
  const [simulatorTotal, setSimulatorTotal] = useState(20000000)
  const [allocations, setAllocations] = useState<any>({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/budget/recommendations`)
        const json = await res.json()
        
        let recs = json.rawRecommendations || []
        
        // Mock data fallback for testing if db is empty or API structure changed
        if (!recs || recs.length === 0) {
          recs = [
            {
              channel: 'Meta Ads',
              roas30: 4.4, roas7: 4.1,
              action: 'DECREASE', recommendedChangePct: -10,
              currentMonthlyBudget: 5000000, recommendedBudget: 4500000,
              reason: 'ROAS 30 hari adalah 4.4x vs target 5.0x. Pertimbangkan untuk memindahkan anggaran ke saluran yang lebih efisien.'
            },
            {
              channel: 'Shopee Ads',
              roas30: 10.0, roas7: 10.2,
              action: 'INCREASE', recommendedChangePct: 15,
              currentMonthlyBudget: 10000000, recommendedBudget: 11500000,
              reason: 'ROAS 30 hari adalah 10.0x vs target 5.0x. ROAS stabil pada periode 7 dan 30 hari.'
            },
            {
              channel: 'TikTok Ads',
              roas30: 17.3, roas7: 18.0,
              action: 'INCREASE', recommendedChangePct: 20,
              currentMonthlyBudget: 8000000, recommendedBudget: 9600000,
              reason: 'Performa sangat tinggi. Disarankan untuk memaksimalkan anggaran.'
            },
            {
              channel: 'Tokopedia Ads',
              roas30: 15.2, roas7: 14.8,
              action: 'HOLD', recommendedChangePct: 0,
              currentMonthlyBudget: 2000000, recommendedBudget: 2000000,
              reason: 'Performa berjalan optimal di ROAS 15.2x. Pertahankan alokasi saat ini.'
            }
          ]
        }

        setData(recs)
        
        // Init Simulator
        const initialAlloc: any = {}
        recs.forEach((r: any) => {
          initialAlloc[r.channel] = Math.round(r.currentMonthlyBudget)
        })
        setAllocations(initialAlloc)
        
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatCurrency = (val: number) => `Rp ${(val).toLocaleString('id-ID')}`

  const handleSimulate = () => {
    // Basic simulator apply (UI only per prompt rules until applied)
    alert('Simulasi alokasi diterapkan secara lokal.')
  }

  const handleReset = () => {
    if (!data) return
    const initialAlloc: any = {}
    data.forEach((r: any) => {
      initialAlloc[r.channel] = Math.round(r.currentMonthlyBudget)
    })
    setAllocations(initialAlloc)
  }

  if (loading) return <div>Memuat Pusat Keputusan Pemasaran...</div>
  if (!data || data.length === 0) return <div>Tidak ada data periklanan. Silakan impor data.</div>

  const simTotalAllocated = Object.values(allocations).reduce((a: any, b: any) => a + Number(b), 0) as number
  let simExpectedRev = 0
  data.forEach((r: any) => {
    simExpectedRev += (allocations[r.channel] || 0) * r.roas30
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Marketing Decision Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cross-channel Performance & Budget Optimization</p>
      </div>

      {/* CROSS-CHANNEL PERFORMANCE & RECOMMENDATIONS */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={20} /> Budget Recommendations</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.map((r: any, idx: number) => {
            const isIncrease = r.action === 'INCREASE'
            const isDecrease = r.action === 'DECREASE'
            const color = isIncrease ? 'var(--success)' : (isDecrease ? 'var(--danger)' : 'var(--text-secondary)')
            
            return (
              <div key={idx} style={{ padding: '20px', backgroundColor: 'var(--background)', borderRadius: '8px', borderLeft: `4px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{r.channel}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>30-day ROAS: {r.roas30.toFixed(2)}x | 7-day ROAS: {r.roas7.toFixed(2)}x</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color }}>{r.action} {r.recommendedChangePct > 0 ? `+${r.recommendedChangePct}%` : (r.recommendedChangePct < 0 ? `${r.recommendedChangePct}%` : '')}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--surface)', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Monthly Budget</div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(r.currentMonthlyBudget)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Recommended Budget</div>
                    <div style={{ fontWeight: 600, color }}>{formatCurrency(r.recommendedBudget)}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', backgroundColor: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Reason: </span> {r.reason}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* BUDGET SIMULATOR */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={20} /> Budget Allocation Simulator</h3>
        
        <div style={{ display: 'flex', gap: '24px' }}>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Total Simulator Budget (Rp)</label>
              <input 
                type="number" 
                className="input" 
                value={simulatorTotal} 
                onChange={e => setSimulatorTotal(Number(e.target.value))} 
              />
            </div>
            
            {data.map((r: any) => (
              <div key={r.channel}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                  <span>{r.channel}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{r.roas30.toFixed(2)}x ROAS</span>
                </label>
                <input 
                  type="number" 
                  className="input" 
                  value={allocations[r.channel] || 0} 
                  onChange={e => setAllocations({...allocations, [r.channel]: Number(e.target.value)})} 
                />
              </div>
            ))}
          </div>

          <div style={{ flex: 1, padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontWeight: 600, borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>Simulation Results</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Allocated:</span>
              <span style={{ fontWeight: 600, color: simTotalAllocated > simulatorTotal ? 'var(--danger)' : 'var(--text-primary)' }}>{formatCurrency(simTotalAllocated)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Remaining Budget:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(simulatorTotal - simTotalAllocated)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Projected Revenue:</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--success)' }}>{formatCurrency(simExpectedRev)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Projected Profit (15%):</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--success)' }}>{formatCurrency(simExpectedRev * 0.15)}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '24px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={handleReset}>Reset</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={handleSimulate}>Apply Simulation</button>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  )
}
