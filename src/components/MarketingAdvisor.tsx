'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, TrendingUp, HelpCircle, CheckCircle } from 'lucide-react'

export function MarketingAdvisor({ brandId }: { brandId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/marketing-advisor?brandId=${brandId}`)
        const json = await res.json()
        setData(json.advisor)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [brandId])

  if (loading) return <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Running strategic analysis...</div>
  if (!data) return <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Advisor data unavailable.</div>

  return (
    <div className="card" style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid var(--surface-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ padding: '8px', backgroundColor: 'var(--primary-navy)', borderRadius: '8px', color: 'white' }}>
          <TrendingUp size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Premium Marketing Advisor</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>AI-driven strategic analysis based on your 30-day cross-channel data.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ color: 'var(--primary)', flexShrink: 0 }}><HelpCircle size={20} /></div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>What Happened?</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{data.whatHappened}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ color: 'var(--primary)', flexShrink: 0 }}><HelpCircle size={20} /></div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Why?</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{data.why}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ color: 'var(--warning)', flexShrink: 0 }}><AlertCircle size={20} /></div>
          <div style={{ width: '100%' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>What Needs Attention?</h3>
            {data.whatNeedsAttention.length === 0 ? (
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>No critical issues detected.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.whatNeedsAttention.map((item: any, idx: number) => (
                  <div key={idx} style={{ padding: '12px', backgroundColor: 'white', border: '1px solid var(--surface-border)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{item.issue}</strong>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.priority === 'HIGH' ? 'var(--danger)' : item.priority === 'OPPORTUNITY' ? 'var(--success)' : 'var(--warning)' }}>
                        {item.priority}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ color: 'var(--success)', flexShrink: 0 }}><CheckCircle size={20} /></div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>What Should We Do?</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.whatShouldWeDo.map((rec: string, idx: number) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
