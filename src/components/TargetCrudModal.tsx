import { useState, useEffect } from 'react'
import { X, Target, Save } from 'lucide-react'

export function TargetCrudModal({ 
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
    type: 'ROAS',
    value: '',
    level: 'BRAND'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        type: initialData.type || 'ROAS',
        value: initialData.value?.toString() || '',
        level: initialData.level || 'BRAND'
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.value) {
      setError('Nilai target wajib diisi')
      return
    }
    
    setIsSaving(true)
    setError('')
    try {
      await onSave(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan target')
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
            <Target size={20} color="var(--primary)" /> 
            {formData.id ? 'Edit Target' : 'Buat Target Baru'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.9rem' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Jenis Target</label>
            <select 
              className="input" 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="ROAS">ROAS (x)</option>
              <option value="CPA">CPA (Cost per Acquisition)</option>
              <option value="GMV">Target Penjualan / GMV (Rp)</option>
              <option value="PROFIT">Target Profit / Margin (%)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Nilai Angka <span className="text-danger">*</span></label>
            <input 
              type="number" 
              step="any"
              className="input" 
              value={formData.value}
              onChange={e => setFormData({...formData, value: e.target.value})}
              placeholder={formData.type === 'ROAS' ? 'Misal: 5.0' : formData.type === 'PROFIT' ? 'Misal: 30' : 'Masukkan angka'}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Tingkatan / Level</label>
            <select 
              className="input" 
              value={formData.level}
              onChange={e => setFormData({...formData, level: e.target.value})}
            >
              <option value="BRAND">Seluruh Brand</option>
              <option value="MARKETPLACE">Marketplace Khusus</option>
              <option value="AD_CHANNEL">Jalur Iklan Khusus</option>
            </select>
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>Batal</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
