'use client'

import { useEffect, useState } from 'react'
import { Activity, Clock, CheckCircle2, XCircle, ArrowRight, Play, Edit3 } from 'lucide-react'

export default function DecisionHistoryPage() {
  const [decisions, setDecisions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [outcomeModal, setOutcomeModal] = useState<any>(null)
  
  const [outcomeForm, setOutcomeForm] = useState({
    success: true,
    actionTaken: '',
    metricsChanged: ''
  })

  useEffect(() => {
    fetchDecisions()
  }, [])

  async function fetchDecisions() {
    setLoading(true)
    try {
      const brandRes = await fetch('/api/brands')
      const brands = await brandRes.json()
      const brandId = brands[0]?.id
      
      if (brandId) {
        const res = await fetch(`/api/decision-history?brandId=${brandId}`)
        const data = await res.json()
        setDecisions(data.decisions || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function submitOutcome() {
    try {
      const brandRes = await fetch('/api/brands')
      const brands = await brandRes.json()
      const brandId = brands[0]?.id

      await fetch('/api/decision-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          action: 'RECORD_OUTCOME',
          decisionId: outcomeModal.id,
          success: outcomeForm.success,
          actionTaken: outcomeForm.actionTaken,
          metricsChanged: { summary: outcomeForm.metricsChanged }
        })
      })
      setOutcomeModal(null)
      fetchDecisions()
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SUCCESS': return { bg: 'rgba(34, 197, 94, 0.1)', text: 'var(--success)', icon: <CheckCircle2 size={16} /> }
      case 'FAILED': return { bg: 'rgba(220, 38, 38, 0.1)', text: 'var(--danger)', icon: <XCircle size={16} /> }
      case 'EXECUTED': return { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--primary)', icon: <Play size={16} /> }
      default: return { bg: 'rgba(107, 114, 128, 0.1)', text: 'var(--text-secondary)', icon: <Clock size={16} /> }
    }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 8px 0' }}>Decision History & Outcome Analysis</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Pantau riwayat eksekusi rekomendasi AI dan validasi apakah tindakan tersebut berhasil atau gagal. Ini menciptakan <strong>Evidence Base</strong> untuk masa depan.</p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Memuat rekam jejak keputusan...</div>
      ) : decisions.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Belum ada riwayat keputusan atau rekomendasi yang dieksekusi.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {decisions.map(d => {
            const statusStyle = getStatusColor(d.status)
            return (
              <div key={d.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{d.actionTaken}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', backgroundColor: statusStyle.bg, color: statusStyle.text, fontSize: '0.75rem', fontWeight: 700 }}>
                    {statusStyle.icon} {d.status}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--background)', padding: '16px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tindakan / Ekspektasi:</div>
                    <div style={{ fontSize: '0.9rem' }}>{d.expectedOutcome}</div>
                  </div>
                  {d.recommendation && (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Rekomendasi AI Asal:</div>
                      <div style={{ fontSize: '0.9rem' }}>{d.recommendation.title}</div>
                    </div>
                  )}
                </div>

                {d.outcomes && d.outcomes.length > 0 ? (
                  <div style={{ padding: '16px', backgroundColor: d.outcomes[0].success ? 'rgba(34, 197, 94, 0.05)' : 'rgba(220, 38, 38, 0.05)', borderLeft: `3px solid ${d.outcomes[0].success ? 'var(--success)' : 'var(--danger)'}`, borderRadius: '0 8px 8px 0' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Hasil Aktual (Outcome Analysis):</div>
                    <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{d.outcomes[0].actualOutcome}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: d.outcomes[0].success ? 'var(--success)' : 'var(--danger)' }}>
                      Dampak Metrik: {d.outcomes[0].metricsChanged ? JSON.parse(d.outcomes[0].metricsChanged).summary : 'Tidak ada perubahan dicatat'}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setOutcomeModal(d); setOutcomeForm({ success: true, actionTaken: '', metricsChanged: '' }); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}>
                      <Edit3 size={16} /> Catat Hasil Aktual (Outcome)
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* OUTCOME MODAL */}
      {outcomeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '450px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Catat Hasil (Outcome)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Apakah Keputusan Ini Berhasil?</label>
                <select value={outcomeForm.success ? 'true' : 'false'} onChange={e => setOutcomeForm(p => ({...p, success: e.target.value === 'true'}))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)' }}>
                  <option value="true">✅ Ya, Berhasil (SUCCESS)</option>
                  <option value="false">❌ Tidak, Gagal (FAILED)</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Apa yang Terjadi? (Penjelasan Lengkap)</label>
                <textarea 
                  value={outcomeForm.actionTaken} onChange={e => setOutcomeForm(p => ({...p, actionTaken: e.target.value}))}
                  placeholder="Misal: Sesuai prediksi AI, setelah budget TikTok diturunkan 15%, profit net kembali positif."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)', minHeight: '80px', fontFamily: 'inherit' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Perubahan Metrik Spesifik</label>
                <input 
                  type="text" value={outcomeForm.metricsChanged} onChange={e => setOutcomeForm(p => ({...p, metricsChanged: e.target.value}))}
                  placeholder="Misal: Spend -15%, GMV +5%, ROAS Naik 0.4x"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'var(--background)' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button onClick={() => setOutcomeModal(null)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--surface-border)', background: 'transparent' }}>Batal</button>
                <button onClick={submitOutcome} className="btn-primary" style={{ flex: 1, padding: '10px' }}>Simpan Hasil</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
