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
        const json = await res.json()
        if (json.current) setData(json)
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

  const currentTotal = data.current.reduce((sum: number, c: any) => sum + c.spend, 0)
  const recTotal = data.recommended.reduce((sum: number, c: any) => sum + c.spend, 0)
  const isIncrease = recTotal > currentTotal

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Manajer & Alokasi Anggaran</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rekomendasi anggaran otomatis berdasarkan performa ROAS 30 hari.</p>
      </div>

      <div style={{ padding: '12px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertTriangle size={18} />
        HANYA SIMULASI / REKOMENDASI. Anggaran platform periklanan sebenarnya tidak dimodifikasi hingga disetujui secara eksplisit.
      </div>

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

          <button className="btn-primary" style={{ width: '100%', marginTop: 'auto' }}>Setujui Perubahan</button>
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
                {data.current.map((c: any, i: number) => {
                  const rec = data.recommended.find((r: any) => r.channel === c.channel)
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
              {data.insights.map((insight: string, idx: number) => (
                <li key={idx} style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
      
      <BudgetManager />
    </div>
  )
}
