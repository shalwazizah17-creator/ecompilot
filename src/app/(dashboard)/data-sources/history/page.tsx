'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface SyncHistoryItem {
  id: string
  date: string
  source: string
  type: string
  records: number
  created: number
  updated: number
  errors: string | null
  status: string
}

export default function SyncHistoryPage() {
  const { selectedBrandId } = useStore()
  const [history, setHistory] = useState<SyncHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!selectedBrandId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/sync/history?brandId=${selectedBrandId}`)
        const data = await res.json()
        if (data.history) setHistory(data.history)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedBrandId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/data-sources" style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Sync History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review automated and manual data synchronization logs.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '16px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Source</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Records</th>
                <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Created</th>
                <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Updated</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No sync history found.</td></tr>
              ) : (
                history.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                      {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{item.source}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: 'var(--surface-border)' }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500 }}>{item.records.toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--success)' }}>+{item.created.toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--primary)' }}>~{item.updated.toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: item.status === 'SUCCESS' ? 'var(--success)' : item.status === 'FAILED' ? 'var(--danger)' : 'var(--warning)', fontWeight: 600, fontSize: '0.8rem' }}>
                        {item.status === 'SUCCESS' && <CheckCircle size={16} />}
                        {item.status === 'FAILED' && <XCircle size={16} />}
                        {item.status === 'RUNNING' && <Clock size={16} />}
                        {item.status}
                      </div>
                      {item.errors && <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.errors}>{item.errors}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
