'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Activity } from 'lucide-react'

export default function DailyIntelligencePage() {
  const { selectedBrandId } = useStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!selectedBrandId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/intelligence/daily?brandId=${selectedBrandId}`)
        const json = await res.json()
        if (json.score !== undefined) setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedBrandId])

  if (loading) return <div>Loading Intelligence Engine...</div>
  if (!data) return <div>Failed to load intelligence.</div>

  const { score, intelligence, metrics } = data
  const isHealthy = score >= 80

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Daily Ecommerce Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Automated analysis of your performance over the last 7 days.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <Activity size={24} color={isHealthy ? 'var(--success)' : 'var(--warning)'} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Business Health</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isHealthy ? 'var(--success)' : 'var(--warning)' }}>{score} / 100</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* WHAT HAPPENED */}
        <div className="card" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <TrendingUp size={32} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--primary)' }}>What Happened?</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>{intelligence.whatHappened}</p>
          </div>
        </div>

        {/* WHY */}
        <div className="card" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
            <Brain size={32} color="#8b5cf6" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: '#8b5cf6' }}>Why?</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>{intelligence.why}</p>
          </div>
        </div>

        {/* WHAT NEEDS ATTENTION */}
        <div className="card" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
            <AlertTriangle size={32} color="var(--warning)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--warning)' }}>What Needs Attention?</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>{intelligence.whatNeedsAttention}</p>
          </div>
        </div>

        {/* WHAT SHOULD WE DO */}
        <div className="card" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', borderLeft: '4px solid var(--success)' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
            <Lightbulb size={32} color="var(--success)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--success)' }}>What Should We Do?</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>{intelligence.whatShouldWeDo}</p>
          </div>
        </div>

      </div>
    </div>
  )
}
