'use client'

import { useEffect, useState } from 'react'
import { Activity, Server, AlertCircle, CheckCircle, Database } from 'lucide-react'

export default function DataHealthCenter() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/data-health`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div>Loading Data Health Center...</div>
  if (!data) return <div>Failed to load data health.</div>

  const { score, status, checks } = data

  let statusColor = 'var(--text-primary)'
  if (status === 'Healthy') statusColor = 'var(--success)'
  else if (status === 'Warning') statusColor = 'var(--warning)'
  else if (status === 'Critical') statusColor = 'var(--danger)'
  else if (status === 'INSUFFICIENT DATA') statusColor = 'var(--text-muted)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Data Health Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitor integration pipelines and data freshness.</p>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', borderRadius: '50%', border: `8px solid ${statusColor}` }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: statusColor }}>{score}</span>
        </div>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: statusColor, textTransform: 'uppercase' }}>{status}</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Data Health Score is calculated based on ingestion freshness, marketplace coverage, and error rates.
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} /> Data Source Connections
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {checks.map((check: any, idx: number) => {
            const isOk = check.status === 'OK'
            const isWarn = check.status === 'WARNING'
            const isErr = check.status === 'ERROR'
            const color = isOk ? 'var(--success)' : (isWarn ? 'var(--warning)' : 'var(--danger)')
            const Icon = isOk ? CheckCircle : AlertCircle

            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', borderLeft: `4px solid ${color}` }}>
                <Icon size={24} color={color} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color }}>{check.status}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>{check.message}</div>
                </div>
              </div>
            )
          })}
          {checks.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No data sources connected.</div>
          )}
        </div>
      </div>
      
    </div>
  )
}
