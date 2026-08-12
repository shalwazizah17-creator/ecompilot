'use client'

import { useState } from 'react'

interface BudgetAllocation {
  channel: string;
  allocated: number;
  spent: number;
  historicalRoas: number;
}

interface BudgetManagerProps {
  initialTotal?: number;
  initialData?: BudgetAllocation[];
  recommendedTotal?: number;
  recommendedData?: BudgetAllocation[];
}

export function BudgetManager({ initialTotal, initialData, recommendedTotal, recommendedData }: BudgetManagerProps) {
  const defaultTotal = initialTotal || 25000000
  const defaultAllocations = initialData || [
    { channel: 'Shopee Ads', allocated: 10000000, spent: 4500000, historicalRoas: 10 },
    { channel: 'TikTok Ads', allocated: 8000000, spent: 3000000, historicalRoas: 17.3 },
    { channel: 'Tokopedia Ads', allocated: 2000000, spent: 1800000, historicalRoas: 15.2 },
    { channel: 'Meta Ads', allocated: 5000000, spent: 2100000, historicalRoas: 4.4 },
  ]
  
  const [totalBudget, setTotalBudget] = useState(defaultTotal)
  const [allocations, setAllocations] = useState<BudgetAllocation[]>(defaultAllocations)
  const [hasChanges, setHasChanges] = useState(false)
  const [notes, setNotes] = useState('')

  const handleAllocationChange = (channelName: string, newAllocated: number) => {
    setAllocations(prev => prev.map(a => 
      a.channel === channelName ? { ...a, allocated: newAllocated } : a
    ))
    setHasChanges(true)
  }

  const handleTotalChange = (val: number) => {
    setTotalBudget(val)
    setHasChanges(true)
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated, 0)
  const remaining = totalBudget - totalAllocated
  const isOverBudget = remaining < 0

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    setIsApplying(true)
    try {
      const res = await fetch('/api/budget/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations, notes })
      })

      if (!res.ok) throw new Error('Gagal menyimpan anggaran')
      
      alert('Perubahan anggaran disetujui dan diterapkan.')
      setHasChanges(false)
      window.location.reload()
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan anggaran.')
      console.error(err)
    } finally {
      setIsApplying(false)
    }
  }

  const currentDay = new Date().getDate()
  const daysRemaining = daysInMonth - currentDay + 1

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Total Anggaran Iklan</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Atur batas pengeluaran untuk semua platform</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>Rp</span>
            <input 
              type="text" 
              className="input"
              style={{ width: '200px', fontSize: '1.1rem', fontWeight: 600, padding: '8px 12px 8px 40px', border: '1px solid var(--surface-border)', borderRadius: '6px' }}
              value={totalBudget.toLocaleString('id-ID')}
              onChange={e => {
                const rawValue = e.target.value.replace(/\./g, '')
                const num = parseInt(rawValue, 10)
                if (!isNaN(num)) {
                  setTotalBudget(num)
                  setHasChanges(true)
                } else if (e.target.value === '' || e.target.value === 'Rp ') {
                  setTotalBudget(0)
                  setHasChanges(true)
                }
              }}
            />
          </div>
          <input 
            type="text" 
            placeholder="Catatan / Keterangan (Opsional)" 
            value={notes}
            onChange={e => {
              setNotes(e.target.value)
              setHasChanges(true)
            }}
            style={{ 
              padding: '8px 12px', border: '1px solid var(--surface-border)', 
              borderRadius: '6px', background: 'transparent', color: 'var(--text-primary)',
              width: '250px', fontSize: '0.9rem'
            }}
          />

          <button 
            className="btn-primary"
            disabled={!hasChanges || isApplying}
            onClick={handleApply}
          >
            {isApplying ? 'Menyimpan...' : 'Terapkan Perubahan'}
          </button>
        </div>
      </div>

      <div className="responsive-grid-5" style={{ marginBottom: '32px' }}>
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(26, 86, 219, 0.05) 0%, transparent 100%)', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Total Anggaran Iklan</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>Rp {(totalBudget/1000000).toFixed(1)} Juta</div>
          {recommendedTotal !== undefined && recommendedData && recommendedData.length > 0 && (
            <button 
              onClick={() => {
                setTotalBudget(recommendedTotal)
                setAllocations(recommendedData)
                setHasChanges(true)
              }}
              style={{ 
                marginTop: '16px', fontSize: '0.8rem', padding: '8px 12px', fontWeight: 600,
                backgroundColor: 'var(--primary)', color: 'white', 
                border: 'none', borderRadius: '6px', cursor: 'pointer', width: '100%',
                transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(26, 86, 219, 0.2)'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              Gunakan Rekomendasi AI
            </button>
          )}
        </div>
        <div style={{ padding: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Alokasi Simulasi</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>Rp {(totalAllocated/1000000).toFixed(1)} Juta</div>
        </div>
        <div style={{ padding: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Dihabiskan (Bulan Ini)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>
            Rp {(allocations.reduce((sum, a) => sum + a.spent, 0)/1000000).toFixed(1)} Juta
          </div>
        </div>
        <div style={{ padding: '20px', background: isOverBudget ? 'linear-gradient(135deg, var(--danger) 0%, #b91c1c 100%)' : 'linear-gradient(135deg, var(--success) 0%, #047857 100%)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, opacity: 0.9 }}>Sisa Dana</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>
            {isOverBudget ? '-' : ''}Rp {Math.abs(remaining/1000000).toFixed(1)} Juta
          </div>
        </div>
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(26, 86, 219, 0.05) 0%, rgba(26, 86, 219, 0.02) 100%)', backgroundColor: 'var(--surface)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(26, 86, 219, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proyeksi Pend. Atribusi</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>
            Rp {(allocations.reduce((sum, a) => sum + (a.allocated * a.historicalRoas), 0)/1000000).toFixed(1)} Juta
          </div>
          <div style={{ fontSize: '0.7rem', marginTop: '6px', opacity: 0.8, fontWeight: 500 }}>*Berdasarkan ROAS 30 Hari</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {allocations.map(alloc => {
          const allocRemaining = alloc.allocated - alloc.spent
          const recommendedDaily = allocRemaining > 0 ? allocRemaining / daysRemaining : 0
          const utilPct = alloc.allocated > 0 ? Math.round((alloc.spent / alloc.allocated) * 100) : 0

          return (
            <div key={alloc.channel} style={{ 
              backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', 
              borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'transform 0.2s',
              animation: 'fadeIn 0.3s ease-out'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'none'}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{alloc.channel}</span>
                <span style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: 'var(--background)', borderRadius: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  ROAS: <strong style={{ color: 'var(--text-primary)' }}>{alloc.historicalRoas}x</strong>
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Anggaran Disetujui</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>Rp {(alloc.allocated/1000000).toFixed(1)} Jt</span>
                </div>
                <input 
                  type="range"
                  min={alloc.spent}
                  max={totalBudget}
                  step={100000}
                  value={alloc.allocated}
                  onChange={(e) => handleAllocationChange(alloc.channel, Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', height: '6px', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--background)', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Terpakai</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px', color: utilPct > 90 ? 'var(--danger)' : 'var(--text-primary)' }}>{utilPct}% ({((alloc.spent)/1000000).toFixed(1)} Jt)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Proyeksi</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                    Rp {((alloc.allocated * alloc.historicalRoas)/1000000).toFixed(1)} Jt
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'auto' }}>
                Rekomendasi Harian: <strong>Rp {(recommendedDaily/1000).toFixed(0)}k/hari</strong>
              </div>
            </div>
          )
        })}
      </div>
      
      {isOverBudget && (
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
          Peringatan: Total alokasi saluran melebihi Total Anggaran Iklan. Harap kurangi anggaran saluran.
        </div>
      )}
    </div>
  )
}
