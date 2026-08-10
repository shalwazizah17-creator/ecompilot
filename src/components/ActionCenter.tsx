'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Info, Target, Zap } from 'lucide-react'

export function ActionCenter({ brandId }: { brandId: string }) {
  const [actions, setActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    async function load() {
      if (!brandId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/actions?brandId=${brandId}`)
        const data = await res.json()
        setActions(data.actions || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [brandId])

  const runEngine = async () => {
    try {
      setLoading(true)
      await fetch(`/api/actions/generate?brandId=${brandId}`, { method: 'POST' })
      const res = await fetch(`/api/actions?brandId=${brandId}`)
      const data = await res.json()
      setActions(data.actions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (severity: string) => {
    switch(severity) {
      case 'HIGH': return <AlertTriangle size={18} color="var(--danger)" />
      case 'MEDIUM': return <AlertTriangle size={18} color="var(--warning)" />
      case 'OPPORTUNITY': return <Zap size={18} color="var(--success)" />
      default: return <Info size={18} color="var(--primary)" />
    }
  }

  const getBg = (severity: string) => {
    switch(severity) {
      case 'HIGH': return 'rgba(239, 68, 68, 0.05)'
      case 'MEDIUM': return 'rgba(245, 158, 11, 0.05)'
      case 'OPPORTUNITY': return 'rgba(16, 185, 129, 0.05)'
      default: return 'var(--surface-border)'
    }
  }

  const filteredActions = filter === 'ALL' ? actions : actions.filter(a => a.severity === filter)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Action Center</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--surface-border)' }}
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="OPPORTUNITY">Opportunities</option>
          </select>
          <button className="btn-primary" onClick={runEngine} disabled={loading} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            {loading ? 'Analyzing...' : 'Run Analysis Engine'}
          </button>
        </div>
      </div>

      {loading && actions.length === 0 ? (
        <div style={{ height: '100px', animation: 'pulse 2s infinite', backgroundColor: 'var(--surface-border)', borderRadius: '8px' }} />
      ) : filteredActions.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {filter === 'ALL' ? 'No actionable insights found.' : `No ${filter.toLowerCase()} insights found.`}
        </div>
      ) : (
        filteredActions.map(action => (
          <div key={action.id} style={{ 
            display: 'flex', gap: '12px', padding: '16px', 
            backgroundColor: getBg(action.severity), 
            borderRadius: '8px', border: '1px solid var(--surface-border)'
          }}>
            <div style={{ paddingTop: '2px' }}>{getIcon(action.severity)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{action.title}</h4>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{action.severity}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px' }}>{action.recommendation}</p>
              {action.metric && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trigger: {action.metric}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
