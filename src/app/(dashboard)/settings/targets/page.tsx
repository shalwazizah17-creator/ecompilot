'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Target } from 'lucide-react'
import { TargetCrudModal } from '@/components/TargetCrudModal'

export default function TargetsPage() {
  const [targets, setTargets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTarget, setEditingTarget] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/targets`)
      const data = await res.json()
      setTargets(data.targets || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async (data: any) => {
    const res = await fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Gagal menyimpan target')
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus target ini?')) return
    try {
      const res = await fetch('/api/targets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error('Gagal menghapus target')
      await load()
    } catch (err) {
      alert(err)
    }
  }

  if (loading) {
    return <div className="card" style={{ height: '300px', animation: 'pulse 2s infinite', backgroundColor: 'var(--surface-border)' }}></div>
  }

  const formatValue = (type: string, value: number) => {
    if (type === 'ROAS') return `${value.toFixed(2)}x`
    if (type === 'PROFIT') return `${value.toFixed(1)}%`
    if (type === 'GMV' || type === 'CPA') return `Rp ${(value/1000).toLocaleString()}`
    return value.toString()
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Target Bisnis & Performa</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Atur KPI dan tujuan keuangan untuk seluruh tim Anda di sini.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} color="var(--primary)" /> Indikator Kinerja Utama (KPI)
          </h3>
          <button 
            className="btn-primary" 
            onClick={() => {
              setEditingTarget(null)
              setShowModal(true)
            }}
          >
            <Plus size={16} /> Tambah Target
          </button>
        </div>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 8px' }}>Jenis Target</th>
              <th style={{ padding: '12px 8px' }}>Tingkat (Level)</th>
              <th style={{ padding: '12px 8px' }}>Nilai Target</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {targets.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data target bisnis.</td>
              </tr>
            )}
            {targets.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                <td style={{ padding: '12px 8px', fontWeight: 600 }}>{row.type}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500,
                    backgroundColor: 'rgba(26, 86, 219, 0.1)',
                    color: 'var(--primary)'
                  }}>
                    {row.level}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--success)' }}>
                  {formatValue(row.type, row.value)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => { setEditingTarget(row); setShowModal(true); }}
                      style={{ padding: '6px', color: 'var(--primary)', borderRadius: '4px' }}
                      className="btn-outline"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(row.id)}
                      style={{ padding: '6px', color: 'var(--danger)', borderRadius: '4px' }}
                      className="btn-outline"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <TargetCrudModal 
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          initialData={editingTarget}
        />
      )}
    </div>
  )
}
