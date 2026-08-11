'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    if (res?.error) {
      setError('Kredensial tidak valid. Silakan coba lagi.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.5px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>Ecom</span>Pilot
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Masuk ke akun Anda</p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--danger)', 
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--surface-border)',
                outline: 'none'
              }}
              placeholder="admin@ecompilot.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}>Kata Sandi</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--surface-border)',
                outline: 'none'
              }}
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '8px', padding: '10px' }}
            disabled={loading}
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Belum punya akun?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
            Buat akun
          </Link>
        </div>
      </div>
    </div>
  )
}
