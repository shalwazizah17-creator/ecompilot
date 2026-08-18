'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'
import { TeamCrudModal } from '@/components/TeamCrudModal'

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/team`)
      const data = await res.json()
      setMembers(data.members || [])
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
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const responseData = await res.json()
    if (!res.ok) throw new Error(responseData.error || 'Gagal menyimpan anggota')
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akses anggota ini dari ruang kerja?')) return
    try {
      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error('Gagal menghapus anggota')
      await load()
    } catch (err) {
      alert(err)
    }
  }

  if (loading) {
    return <div className="card" style={{ height: '300px', animation: 'pulse 2s infinite', backgroundColor: 'var(--surface-border)' }}></div>
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Manajemen Anggota Tim</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Undang dan atur peran para karyawan dan kolaborator Anda.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--primary)" /> Daftar Anggota Ruang Kerja
          </h3>
          <button 
            className="btn-primary" 
            onClick={() => {
              setEditingMember(null)
              setShowModal(true)
            }}
          >
            <Plus size={16} /> Undang Anggota
          </button>
        </div>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 8px' }}>Nama & Email</th>
              <th style={{ padding: '12px 8px' }}>Peran (Role)</th>
              <th style={{ padding: '12px 8px' }}>Bergabung Pada</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada anggota tim.</td>
              </tr>
            )}
            {members.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                <td style={{ padding: '12px 8px' }}>
                  <div style={{ fontWeight: 600 }}>{row.name || 'Belum Diatur'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.email}</div>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                    backgroundColor: row.role === 'OWNER' ? 'rgba(239, 68, 68, 0.1)' : row.role === 'ADMIN' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(26, 86, 219, 0.1)',
                    color: row.role === 'OWNER' ? 'var(--danger)' : row.role === 'ADMIN' ? 'var(--warning)' : 'var(--primary)'
                  }}>
                    {row.role}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                  {new Date(row.joined_at).toLocaleDateString('id-ID')}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => { setEditingMember(row); setShowModal(true); }}
                      style={{ padding: '6px', color: 'var(--primary)', borderRadius: '4px' }}
                      className="btn-outline"
                      title="Ubah Role"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(row.id)}
                      style={{ padding: '6px', color: 'var(--danger)', borderRadius: '4px' }}
                      className="btn-outline"
                      title="Cabut Akses"
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
        <TeamCrudModal 
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          initialData={editingMember}
        />
      )}
    </div>
  )
}
