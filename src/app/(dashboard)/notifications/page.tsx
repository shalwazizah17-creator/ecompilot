'use client'

import { useEffect, useState } from 'react'
import { Bell, AlertTriangle, Info, CheckCircle, Lightbulb, Check } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications`)
      const data = await res.json()
      if (data.notifications) setNotifications(data.notifications)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'READ' })
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div>Loading notifications...</div>

  const getIcon = (type: string, severity: string) => {
    if (severity === 'HIGH') return <AlertTriangle size={24} color="var(--danger)" />
    if (severity === 'MEDIUM') return <AlertTriangle size={24} color="var(--warning)" />
    if (type === 'OPPORTUNITY') return <Lightbulb size={24} color="var(--primary)" />
    if (type === 'REPORT_READY') return <CheckCircle size={24} color="var(--success)" />
    return <Info size={24} color="var(--text-secondary)" />
  }

  const active = notifications.filter(n => n.status !== 'ARCHIVED')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Notification Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Alerts, sync issues, and strategic opportunities.</p>
        </div>
        <button className="btn-secondary"><Check size={16} /> Mark all read</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {active.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            No active notifications.
          </div>
        ) : (
          active.map(n => (
            <div key={n.id} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px', backgroundColor: n.status === 'UNREAD' ? 'var(--background)' : 'var(--surface)', opacity: n.status === 'UNREAD' ? 1 : 0.7, border: n.status === 'UNREAD' ? '1px solid var(--surface-border)' : '1px solid transparent' }}>
              <div style={{ padding: '8px', backgroundColor: 'var(--surface)', borderRadius: '8px' }}>
                {getIcon(n.type, n.severity)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: n.status === 'UNREAD' ? 700 : 500 }}>{n.title}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.message}</p>
              </div>
              {n.status === 'UNREAD' && (
                <button onClick={() => markRead(n.id)} style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Mark Read">
                  <CheckCircle size={20} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
