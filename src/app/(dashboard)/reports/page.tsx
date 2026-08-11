'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus } from 'lucide-react'

export default function ReportsIndex() {
  const router = useRouter()
  
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  
  // Form State
  const [reportType, setReportType] = useState('CUSTOM')
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const loadReports = async () => {
    setLoading(true)
    const res = await fetch(`/api/reports`)
    if (res.ok) {
      const data = await res.json()
      setReports(data.reports || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadReports() }, [])

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    
    // Calculate dates if standard
    let finalStart = new Date(startDate)
    let finalEnd = new Date(endDate)
    const now = new Date()
    
    if (reportType === 'DAILY') {
      finalStart = new Date(now)
      finalEnd = new Date(now)
    } else if (reportType === 'WEEKLY') {
      finalStart = new Date(now.setDate(now.getDate() - 7))
      finalEnd = new Date()
    } else if (reportType === 'MONTHLY') {
      finalStart = new Date(now.setMonth(now.getMonth() - 1))
      finalEnd = new Date()
    } else if (reportType === 'YEARLY') {
      finalStart = new Date(now.setFullYear(now.getFullYear() - 1))
      finalEnd = new Date()
    }

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          
          type: reportType,
          periodStart: finalStart.toISOString(), 
          periodEnd: finalEnd.toISOString() 
        })
      })
      const data = await res.json()
      if (data.reportId) {
        setShowModal(false)
        router.push(`/reports/${data.reportId}`)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ padding: '32px' }}>
      
      {/* Generate Report Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Buat Laporan</h3>
            <form onSubmit={generateReport}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}>Jenis Laporan</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--surface-border)' }}>
                  <option value="DAILY">Harian</option>
                  <option value="WEEKLY">Mingguan</option>
                  <option value="MONTHLY">Bulanan</option>
                  <option value="YEARLY">Tahunan</option>
                  <option value="CUSTOM">Kustom</option>
                </select>
              </div>
              
              {reportType === 'CUSTOM' && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}>Tanggal Mulai</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--surface-border)' }} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}>Tanggal Selesai</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--surface-border)' }} required />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--surface-border)', borderRadius: '4px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-primary" disabled={generating}>
                  {generating ? 'Membuat...' : 'Buat Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Laporan</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Buat Laporan
        </button>
      </div>

      {loading ? (
        <div style={{ height: '400px', backgroundColor: 'var(--surface-border)', animation: 'pulse 2s infinite', borderRadius: '8px' }}></div>
      ) : (
        <div className="card">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>Tanggal Dibuat</th>
                <th style={{ padding: '12px' }}>Jenis Laporan</th>
                <th style={{ padding: '12px' }}>Periode Cakupan</th>
                <th style={{ padding: '12px' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada laporan yang dibuat. Klik di atas untuk membuat laporan.
                  </td>
                </tr>
              )}
              {reports.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 500 }}>{new Date(r.generated_date).toLocaleString()}</td>
                  <td style={{ padding: '16px 12px' }}>{r.type}</td>
                  <td style={{ padding: '16px 12px' }}>
                    {new Date(r.period_start).toLocaleDateString()} - {new Date(r.period_end).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <button 
                      onClick={() => router.push(`/reports/${r.id}`)}
                      style={{ padding: '6px 12px', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '4px', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Lihat Laporan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
