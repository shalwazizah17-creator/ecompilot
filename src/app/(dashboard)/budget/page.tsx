'use client'

import { useEffect, useState } from 'react'
import { Wallet, ArrowRight, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react'
import { BudgetManager } from '@/components/BudgetManager'

export default function BudgetManagerPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [errorStatus, setErrorStatus] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/budget/recommendations`)
        if (!res.ok) {
          if (res.status === 401) window.location.href = '/login'
          setErrorStatus(res.status)
          return
        }
        const data = await res.json()

        if (data.error) {
          console.error(data.error)
          setErrorStatus(403)
          return
        }

        // If there are approved allocations, override the current spend
        if (data.approvedAllocations && data.approvedAllocations.length > 0) {
          const approvedMap = new Map(data.approvedAllocations.map((a: any) => [a.channel, a.amount]))
          data.current = data.current.map((c: any) => ({
            ...c,
            spend: approvedMap.get(c.channel) || c.spend
          }))
          data.isApproved = true
        }

        setData(data)
      } catch (err) {
        console.error(err)
        setErrorStatus(500)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatCurrency = (val: number) => `Rp ${(val/1000000).toFixed(1)}M`

  if (loading) return <div>Memuat...</div>
  if (errorStatus === 403) return <div>Kesalahan izin: Anda tidak memiliki akses ke ruang kerja ini.</div>
  if (errorStatus === 404) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
      <h3>Data marketplace diperlukan</h3>
      <p>Impor data marketplace Anda untuk menghitung anggaran.</p>
      <a href="/data-sources" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px' }}>Impor Data Marketplace Excel</a>
    </div>
  )
  if (errorStatus) return <div>Gagal memuat analitik</div>
  if (!data) return <div>Gagal memuat data anggaran.</div>

  let currentData = data.current || []
  let recommendedData = data.recommended || []
  let insightsData = data.insights || []

  // If no data exists, inject mock data so user can simulate the features
  if (currentData.length === 0) {
    currentData = [
      { channel: 'Shopee Ads', spend: 4500000, roas: 10 },
      { channel: 'TikTok Ads', spend: 3000000, roas: 17.3 },
      { channel: 'Tokopedia Ads', spend: 1800000, roas: 15.2 },
      { channel: 'Meta Ads', spend: 2100000, roas: 4.4 }
    ]
    recommendedData = [
      { channel: 'Shopee Ads', spend: 10000000 },
      { channel: 'TikTok Ads', spend: 8000000 },
      { channel: 'Tokopedia Ads', spend: 2000000 },
      { channel: 'Meta Ads', spend: 5000000 }
    ]
    insightsData = [
      'Shopee Ads dan TikTok Ads menunjukkan performa ROAS luar biasa. Disarankan untuk menaikkan anggaran secara signifikan.',
      'Tokopedia Ads stabil, pertahankan anggaran saat ini.',
      'Meta Ads perlu pemantauan lebih lanjut sebelum alokasi ditingkatkan.'
    ]
  }

  const currentTotal = currentData.reduce((sum: number, c: any) => sum + c.spend, 0)
  const recTotal = recommendedData.reduce((sum: number, c: any) => sum + c.spend, 0)
  const isIncrease = recTotal > currentTotal

  const mappedCurrent = currentData.map((c: any) => ({
    channel: c.channel,
    allocated: c.spend,
    spent: c.spend * 0.45,
    historicalRoas: c.roas
  }))

  const mappedRecommended = recommendedData.map((r: any) => {
    const curr = currentData.find((c: any) => c.channel === r.channel)
    return {
      channel: r.channel,
      allocated: r.spend,
      spent: curr ? curr.spend * 0.45 : 0,
      historicalRoas: curr ? curr.roas : 0
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Manajer Anggaran & Simulasi AI</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rekomendasi anggaran otomatis berdasarkan performa ROAS 30 hari.</p>
      </div>

      {data?.isApproved ? (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={18} />
          Anggaran untuk bulan ini telah ditetapkan dan disimpan di sistem EcomPilot. Harap samakan angka ini di dashboard Meta/Shopee/TikTok asli.
        </div>
      ) : (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={18} />
          HANYA SIMULASI / REKOMENDASI. Anggaran platform periklanan sebenarnya tidak dimodifikasi hingga disetujui secara eksplisit.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* TOTAL SUMMARY */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Anggaran 30 Hari Saat Ini</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCurrency(currentTotal)}</div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}><ArrowRight /></div>
          
          <div style={{ padding: '16px', backgroundColor: isIncrease ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Anggaran Rekomendasi</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: isIncrease ? 'var(--danger)' : 'var(--success)' }}>
              {formatCurrency(recTotal)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Selisih: {formatCurrency(Math.abs(recTotal - currentTotal))}
            </div>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', marginTop: 'auto' }}
            onClick={() => {
              const el = document.getElementById('budget-manager-section')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            {data?.isApproved ? 'Ubah Anggaran Disetujui' : 'Mulai Simulasi & Setujui'}
          </button>
        </div>

        {/* CHANNEL BREAKDOWN & INSIGHTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Rincian Saluran</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '8px 0', fontWeight: 600 }}>Saluran</th>
                  <th style={{ padding: '8px 0', fontWeight: 600 }}>ROAS (30H)</th>
                  <th style={{ padding: '8px 0', fontWeight: 600 }}>Saat Ini</th>
                  <th style={{ padding: '8px 0', fontWeight: 600 }}>Rekomendasi</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((c: any, i: number) => {
                  const rec = recommendedData.find((r: any) => r.channel === c.channel)
                  return (
                    <tr key={c.channel} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '12px 0', fontWeight: 500 }}>{c.channel}</td>
                      <td style={{ padding: '12px 0', color: c.roas >= 4 ? 'var(--success)' : c.roas < 2.5 ? 'var(--danger)' : 'var(--text-primary)' }}>{c.roas.toFixed(2)}x</td>
                      <td style={{ padding: '12px 0' }}>{formatCurrency(c.spend)}</td>
                      <td style={{ padding: '12px 0', fontWeight: 600, color: rec.spend > c.spend ? 'var(--danger)' : rec.spend < c.spend ? 'var(--success)' : 'var(--text-primary)' }}>
                        {formatCurrency(rec.spend)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={18} color="var(--primary)" /> Wawasan Anggaran AI
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '20px', margin: 0 }}>
              {insightsData.map((insight: string, idx: number) => (
                <li key={idx} style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
      <div id="budget-manager-section">
        <BudgetManager 
          initialTotal={currentTotal}
          initialData={mappedCurrent}
          recommendedTotal={recTotal}
          recommendedData={mappedRecommended}
        />
      </div>
    </div>
  )
}
