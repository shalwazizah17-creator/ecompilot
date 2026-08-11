'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Store, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [brandName, setBrandName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleComplete = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: brandName,
          brandName: brandName
        })
      })

      if (res.ok) {
        window.location.href = '/dashboard'
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal menyelesaikan onboarding')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background)',
      padding: '24px'
    }}>
      
      <div style={{ width: '100%', maxWidth: '480px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Selamat Datang di EcomPilot
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Mari siapkan Ruang Kerja Ecommerce Anda
          </p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          
          {error && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)', 
              borderRadius: '6px',
              fontSize: '0.9rem',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Nama Merek / Perusahaan
              </label>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Masukkan nama merek Anda. Ini akan digunakan sebagai ruang kerja utama Anda.
              </p>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }}>
                  <Store size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Theraskin"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '6px',
                    border: '1px solid var(--surface-border)',
                    outline: 'none',
                    fontSize: '0.95rem'
                  }}
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                />
              </div>
            </div>
            
            <button
              onClick={handleComplete}
              disabled={!brandName || loading}
              className="btn-primary"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                opacity: (!brandName || loading) ? 0.6 : 1,
                cursor: (!brandName || loading) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Membuat Ruang Kerja...</>
              ) : (
                <><CheckCircle2 size={18} /> Selesaikan Pengaturan</>
              )}
            </button>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  )
}
