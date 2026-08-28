'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, Calculator, X } from 'lucide-react'

function DiscoveryContent() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [simModal, setSimModal] = useState<any>(null)

  // Simulation State
  const [simParams, setSimParams] = useState({
    commissionPercent: 10,
    targetGMV: 10000000,
    expectedConversion: 5,
    averageOrderValue: 120000,
    targetROI: 5
  })
  const [simResult, setSimResult] = useState<any>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/affiliates/discovery`)
        const data = await res.json()
        setCandidates(data.candidates || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const runSimulation = () => {
    // Porting the backend logic to frontend for interactive demo without API roundtrips
    const estimatedCommission = simParams.targetGMV * (simParams.commissionPercent / 100);
    const estimatedRevenue = simParams.targetGMV;
    const baseGrossMarginPercent = 30; 
    const grossProfit = simParams.targetGMV * (baseGrossMarginPercent / 100);
    const estimatedProfit = grossProfit - estimatedCommission;
    const requiredOrders = simParams.targetGMV / (simParams.averageOrderValue || 1);
    const maxSustainable = baseGrossMarginPercent - 5; 

    setSimResult({
      estimatedCommission,
      estimatedRevenue,
      estimatedProfit,
      requiredOrders,
      maxSustainable,
      recommended: [Math.max(5, maxSustainable - 10), maxSustainable - 2]
    })
  }

  const getLabelColor = (grade: string) => {
    if (grade === 'STAR') return { bg: 'rgba(34, 197, 94, 0.1)', text: 'var(--success)', icon: '🌟' }
    if (grade === 'HIGH POTENTIAL') return { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--primary)', icon: '🚀' }
    if (grade === 'STABLE') return { bg: 'rgba(107, 114, 128, 0.1)', text: 'var(--text-secondary)', icon: '🛡️' }
    return { bg: 'rgba(220, 38, 38, 0.1)', text: 'var(--danger)', icon: '⚠️' }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER */}
      <div>
        <Link href="/affiliate" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to Affiliate Overview
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Affiliate Discovery 2.0</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>AI-driven creator matching based on ROI, Conversion, and Audience Match.</p>
      </div>

      <div style={{ padding: '16px', backgroundColor: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px', display: 'flex', gap: '12px' }}>
        <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--warning)' }}>Data Publik Tidak Menjamin Hasil</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
            Data di bawah ini berasal dari profil publik dan performa historis rata-rata. Gunakan <strong>Simulate Deal</strong> untuk menghitung target ROI dan margin yang aman. Data terakhir di-update: <strong>28 Aug 2026</strong>.
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Mencari affiliator terbaik...</div>
      ) : candidates.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Belum ada kandidat di database.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {candidates.map(candidate => {
            const labelStyle = getLabelColor(candidate.evaluation.grade)
            
            return (
              <div key={candidate.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0' }}>@{candidate.username}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {candidate.followers.toLocaleString()} Followers • {candidate.engagement_rate}% Eng.
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', backgroundColor: labelStyle.bg, color: labelStyle.text, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                    <span>{labelStyle.icon}</span> {candidate.evaluation.grade}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  
                  {/* Scores Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Overall Match</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{candidate.evaluation.score}/100</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Audience Fit</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{candidate.audienceMatch}%</div>
                    </div>
                  </div>

                  {/* Detail Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Audience Match', val: candidate.evaluation.details.audienceMatchScore, max: 20 },
                      { label: 'Perf. Volume', val: candidate.evaluation.details.performanceVolumeScore, max: 20 },
                      { label: 'ROI Potential', val: candidate.evaluation.details.roiScore, max: 20 },
                    ].map(b => (
                      <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '100px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.label}</div>
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${(b.val / b.max) * 100}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                  <button className="btn-primary" onClick={() => setSimModal(candidate)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Calculator size={16} /> Simulate Deal
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FINANCIAL SIMULATOR MODAL */}
      {simModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Simulasi Keuangan: @{simModal.username}</h3>
              <button onClick={() => { setSimModal(null); setSimResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Target GMV (Rp)</label>
                <input type="number" value={simParams.targetGMV} onChange={e => setSimParams(p => ({...p, targetGMV: Number(e.target.value)}))} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--background)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Komisi (%)</label>
                  <input type="number" value={simParams.commissionPercent} onChange={e => setSimParams(p => ({...p, commissionPercent: Number(e.target.value)}))} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--background)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>AOV / Harga Rata² (Rp)</label>
                  <input type="number" value={simParams.averageOrderValue} onChange={e => setSimParams(p => ({...p, averageOrderValue: Number(e.target.value)}))} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--surface-border)', borderRadius: '8px', backgroundColor: 'var(--background)' }} />
                </div>
              </div>
              <button onClick={runSimulation} className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>Hitung Simulasi</button>
            </div>

            {simResult && (
              <div className="fade-in" style={{ padding: '20px', backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Hasil Estimasi</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Estimasi Komisi Dikeluarkan</span>
                    <strong style={{ color: 'var(--danger)' }}>Rp {simResult.estimatedCommission.toLocaleString('id-ID')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Estimasi Profit Bersih</span>
                    <strong style={{ color: 'var(--success)' }}>Rp {simResult.estimatedProfit.toLocaleString('id-ID')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Target Order (Sales)</span>
                    <strong>{Math.ceil(simResult.requiredOrders)} pesanan</strong>
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'rgba(26, 86, 219, 0.05)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 600 }}>Rekomendasi AI:</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Komisi ideal dan paling aman untuk menyeimbangkan growth dan profitabilitas adalah di kisaran <strong>{simResult.recommended[0]}% – {simResult.recommended[1]}%</strong>.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default function AffiliateDiscovery() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscoveryContent />
    </Suspense>
  )
}
