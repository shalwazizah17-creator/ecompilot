import { useState, useEffect } from 'react'
import { X, Package, Save } from 'lucide-react'

export function ProductCrudModal({ 
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
    sku: '',
    name: '',
    category: '',
    price: '',
    cogs: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        sku: initialData.sku || '',
        name: initialData.name || '',
        category: initialData.category || '',
        price: initialData.price?.toString() || '',
        cogs: initialData.cogs?.toString() || ''
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.sku || !formData.name) {
      setError('SKU dan Nama Produk wajib diisi')
      return
    }
    
    setIsSaving(true)
    setError('')
    try {
      await onSave(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan produk')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--surface-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="var(--primary)" /> 
            {formData.id ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.9rem' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>SKU <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input 
              type="text" 
              className="input" 
              value={formData.sku}
              onChange={e => setFormData({...formData, sku: e.target.value})}
              placeholder="Contoh: SHP-001"
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Nama Produk <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input 
              type="text" 
              className="input" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Contoh: Kemeja Flanel Premium"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Kategori</label>
            <input 
              type="text" 
              className="input" 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              placeholder="Contoh: Pakaian Pria"
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Harga Jual (Rp)</label>
              <input 
                type="number" 
                className="input" 
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>HPP / COGS (Rp)</label>
              <input 
                type="number" 
                className="input" 
                value={formData.cogs}
                onChange={e => setFormData({...formData, cogs: e.target.value})}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>Batal</button>
            <button type="submit" className="btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
