import { useState, useEffect } from 'react'
import { X, Users, Save } from 'lucide-react'

export function TeamCrudModal({ 
  onClose, 
  onSave, 
  initialData 
}: { 
  onClose: () => void, 
  onSave: (data: any) => Promise<void>, 
  initialData?: any 
}) {
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    name: '',
    role: 'SPECIALIST'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        email: initialData.email || '',
        name: initialData.name || '',
        role: initialData.role || 'SPECIALIST'
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email && !formData.id) {
      setError('Email pengguna wajib diisi')
      return
    }
    
    setIsSaving(true)
    setError('')
    try {
      await onSave(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan anggota')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column',
        padding: 0, overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--surface)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Users size={20} color="var(--primary)" /> 
            {formData.id ? 'Edit Anggota Tim' : 'Undang Anggota Baru'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.9rem' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Email Pengguna <span className="text-danger">*</span></label>
            <input 
              type="email" 
              className="input" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="email@perusahaan.com"
              disabled={!!formData.id} // Cannot edit email once added
              required={!formData.id}
            />
            {!!formData.id && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email tidak dapat diubah</span>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Nama (Opsional)</label>
            <input 
              type="text" 
              className="input" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Nama lengkap"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Peran Akses (Role)</label>
            <select 
              className="input" 
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="VIEWER">Viewer (Hanya Melihat)</option>
              <option value="SPECIALIST">Specialist (Bisa Mengubah Data)</option>
              <option value="ADMIN">Admin (Manajemen Pengaturan)</option>
              <option value="OWNER">Owner (Pemilik Penuh)</option>
            </select>
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>Batal</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Anggota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
