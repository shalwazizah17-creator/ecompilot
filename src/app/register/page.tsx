'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, User, Lock, Mail, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        router.push('/login?registered=true')
      } else {
        const data = await res.json()
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('An error occurred during registration')
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
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ 
            backgroundColor: 'var(--primary)', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(26, 86, 219, 0.2)'
          }}>
            <Store size={28} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Create your account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center' }}>
            Turn Marketplace Data Into Better Ecommerce Decisions
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {error && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)', 
              borderRadius: '6px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {error}
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }}>
                <User size={18} />
              </div>
              <input
                type="text"
                required
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '6px',
                  border: '1px solid var(--surface-border)',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>Email address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                placeholder="john@ecompilot.com"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '6px',
                  border: '1px solid var(--surface-border)',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '6px',
                  border: '1px solid var(--surface-border)',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ 
              width: '100%', 
              padding: '12px', 
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ 
          marginTop: '32px', 
          borderTop: '1px solid var(--surface-border)', 
          paddingTop: '24px', 
          textAlign: 'center' 
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
            Sign in instead
          </Link>
        </div>

      </div>
    </div>
  )
}
