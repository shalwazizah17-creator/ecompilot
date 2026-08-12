'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Megaphone } from 'lucide-react'
import { CampaignCrudModal } from '@/components/CampaignCrudModal'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/campaigns`)
      const data = await res.json()
      setCampaigns(data.campaigns || [])
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
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Gagal menyimpan kampanye')
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kampanye ini?')) return
    try {
      const res = await fetch('/api/campaigns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error('Gagal menghapus kampanye')
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Manajemen Kampanye Iklan</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Kelola seluruh daftar kampanye lintas platform (Shopee, TikTok, Meta).</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={20} color="var(--primary)" /> Daftar Kampanye
          </h3>
          <button 
            className="btn-primary" 
            onClick={() => {
              setEditingCampaign(null)
              setShowModal(true)
            }}
          >
            <Plus size={16} /> Tambah Kampanye
          </button>
        </div>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 8px' }}>Nama Kampanye</th>
              <th style={{ padding: '12px 8px' }}>Platform</th>
              <th style={{ padding: '12px 8px' }}>Tipe</th>
              <th style={{ padding: '12px 8px' }}>Objektif</th>
              <th style={{ padding: '12px 8px' }}>Status</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data kampanye.</td>
              </tr>
            )}
            {campaigns.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                <td style={{ padding: '12px 8px', fontWeight: 500 }}>{row.name}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500,
                    backgroundColor: row.platformName.includes('Shopee') ? 'rgba(239, 75, 41, 0.1)' : row.platformName.includes('TikTok') ? 'rgba(0, 0, 0, 0.1)' : 'rgba(26, 86, 219, 0.1)',
                    color: row.platformName.includes('Shopee') ? '#ef4b29' : row.platformName.includes('TikTok') ? '#000000' : 'var(--primary)'
                  }}>
                    {row.platformName}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>{row.type}</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{row.objective || '-'}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                    backgroundColor: row.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : row.status === 'PAUSED' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                    color: row.status === 'ACTIVE' ? 'var(--success)' : row.status === 'PAUSED' ? 'var(--warning)' : 'var(--text-muted)'
                  }}>
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => { setEditingCampaign(row); setShowModal(true); }}
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
        <CampaignCrudModal 
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          initialData={editingCampaign}
        />
      )}
    </div>
  )
}
