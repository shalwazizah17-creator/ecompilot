import { useState, useEffect } from 'react'
import { X, Megaphone, Save } from 'lucide-react'

export function CampaignCrudModal({ 
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
    name: '',
    platformName: 'Shopee Ads',
    type: 'Search',
    objective: '',
    status: 'ACTIVE'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        name: initialData.name || '',
        platformName: initialData.platformName || 'Shopee Ads',
        type: initialData.type || 'Search',
        objective: initialData.objective || '',
        status: initialData.status || 'ACTIVE'
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setError('Nama Kampanye wajib diisi')
      return
    }
    
    setIsSaving(true)
    setError('')
    try {
      await onSave(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan kampanye')
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
        width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column',
        padding: 0, overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--surface)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Megaphone size={20} color="var(--primary)" /> 
            {formData.id ? 'Edit Kampanye' : 'Buat Kampanye Baru'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.9rem' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Nama Kampanye <span className="text-danger">(Wajib)</span></label>
            <input 
              type="text" 
              className="input" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Contoh: Promo Merdeka 8.8"
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Platform Iklan</label>
            <select 
              className="input" 
              value={formData.platformName}
              onChange={e => setFormData({...formData, platformName: e.target.value})}
            >
              <option value="Shopee Ads">Shopee Ads</option>
              <option value="TikTok Ads">TikTok Ads</option>
              <option value="Tokopedia Ads">Tokopedia Ads</option>
              <option value="Meta Ads">Meta Ads</option>
            </select>
          </div>

          <div className="responsive-grid-2">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Jenis Kampanye</label>
              <select 
                className="input" 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="Search">Search (Pencarian)</option>
                <option value="Discovery">Discovery</option>
                <option value="Video">Video Ads</option>
                <option value="Display">Display</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Status</label>
              <select 
                className="input" 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="ACTIVE">Aktif (Berjalan)</option>
                <option value="PAUSED">Dijeda (Paused)</option>
                <option value="COMPLETED">Selesai</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Objektif (Opsional)</label>
            <input 
              type="text" 
              className="input" 
              value={formData.objective}
              onChange={e => setFormData({...formData, objective: e.target.value})}
              placeholder="Contoh: Konversi, Traffic"
            />
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>Batal</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Kampanye'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
