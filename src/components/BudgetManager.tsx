'use client'

import { useState } from 'react'

interface BudgetAllocation {
  channel: string;
  allocated: number;
  spent: number;
  historicalRoas: number;
}

export function BudgetManager() {
  const initialTotal = 25000000
  const initialData = [
    { channel: 'Shopee Ads', allocated: 10000000, spent: 4500000, historicalRoas: 10 },
    { channel: 'TikTok Ads', allocated: 8000000, spent: 3000000, historicalRoas: 17.3 },
    { channel: 'Tokopedia Ads', allocated: 2000000, spent: 1800000, historicalRoas: 15.2 },
    { channel: 'Meta Ads', allocated: 5000000, spent: 2100000, historicalRoas: 4.4 },
  ]
  
  const [totalBudget, setTotalBudget] = useState(initialTotal)
  const [allocations, setAllocations] = useState<BudgetAllocation[]>(initialData)
  const [hasChanges, setHasChanges] = useState(false)

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

  const handleApply = () => {
    // API Call would go here
    setHasChanges(false)
    alert('Alokasi anggaran berhasil diterapkan.')
  }

  const handleDiscard = () => {
    setTotalBudget(initialTotal)
    setAllocations(initialData)
    setHasChanges(false)
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated, 0)
  const remaining = totalBudget - totalAllocated
  const isOverBudget = remaining < 0

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const currentDay = new Date().getDate()
  const daysRemaining = daysInMonth - currentDay + 1

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Manajer Anggaran Interaktif</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {hasChanges && (
            <button onClick={handleDiscard} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--surface-border)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
              Buang Perubahan
            </button>
          )}
          <button 
            className="btn-primary" 
            onClick={handleApply}
            disabled={isOverBudget || !hasChanges}
            style={{ opacity: (!hasChanges || isOverBudget) ? 0.5 : 1 }}
          >
            Terapkan Perubahan
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', backgroundColor: 'var(--surface-border)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Anggaran Iklan</div>
          <input 
            type="number"
            value={totalBudget}
            onChange={(e) => handleTotalChange(Number(e.target.value))}
            style={{ 
              fontSize: '1.5rem', fontWeight: 700, background: 'transparent', 
              border: 'none', borderBottom: '2px solid var(--primary)', 
              outline: 'none', width: '100%', marginTop: '4px', color: 'var(--text-primary)'
            }}
          />
        </div>
        <div style={{ padding: '16px', backgroundColor: 'var(--surface-border)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Alokasi Simulasi</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Rp {(totalAllocated/1000000).toFixed(1)}M</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'var(--surface-border)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dihabiskan (S.Bulan)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Rp {(allocations.reduce((sum, a) => sum + a.spent, 0)/1000000).toFixed(1)}M
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: isOverBudget ? 'var(--danger)' : 'var(--success)', color: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem' }}>Sisa Dana</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {isOverBudget ? '-' : ''}Rp {Math.abs(remaining/1000000).toFixed(1)}M
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Proyeksi Pend. Atribusi</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Rp {(allocations.reduce((sum, a) => sum + (a.allocated * a.historicalRoas), 0)/1000000).toFixed(1)}M
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>*Berdasarkan ROAS 30 hari terakhir</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {allocations.map(alloc => {
          const allocRemaining = alloc.allocated - alloc.spent
          const recommendedDaily = allocRemaining > 0 ? allocRemaining / daysRemaining : 0
          const utilPct = alloc.allocated > 0 ? Math.round((alloc.spent / alloc.allocated) * 100) : 0

          return (
            <div key={alloc.channel} style={{ paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600 }}>{alloc.channel}</span>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>30-Day ROAS: <strong style={{ color: 'var(--text-primary)' }}>{alloc.historicalRoas}x</strong></span>
                  <span>Rek. Harian: <strong style={{ color: 'var(--text-primary)' }}>Rp {(recommendedDaily/1000).toFixed(0)}k</strong></span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <input 
                  type="range"
                  min={alloc.spent} // Cannot allocate less than what's already spent
                  max={totalBudget}
                  step={100000}
                  value={alloc.allocated}
                  onChange={(e) => handleAllocationChange(alloc.channel, Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--primary)' }}
                />
                <div style={{ width: '160px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>Rp {(alloc.allocated/1000000).toFixed(1)}M</div>
                  <div style={{ fontSize: '0.8rem', color: utilPct > 90 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {utilPct}% Digunakan
                  </div>
                </div>
                <div style={{ width: '160px', textAlign: 'right', paddingLeft: '16px', borderLeft: '1px solid var(--surface-border)' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary)' }}>
                    Rp {((alloc.allocated * alloc.historicalRoas)/1000000).toFixed(1)}M
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Proyeksi Pend. Atribusi</div>
                </div>
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
