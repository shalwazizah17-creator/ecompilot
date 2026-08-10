'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

import { Suspense } from 'react'

import { useStore } from '@/store/useStore'

function DiscoveryContent() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedBrandId } = useStore()
  const brandId = selectedBrandId || 'cm0m2xxxx0000000000000000'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/affiliates/discovery?brandId=${brandId}`)
        const data = await res.json()
        setCandidates(data.candidates || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [brandId])

  const getLabelColor = (label: string) => {
    if (label === 'HIGH POTENTIAL') return { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--success)' }
    if (label === 'GOOD FIT') return { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--primary)' }
    if (label === 'TEST') return { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--warning)' }
    return { bg: 'var(--surface-border)', text: 'var(--text-secondary)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER */}
      <div>
        <Link href="/affiliate" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to Overview
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Affiliate Discovery Engine</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>AI-driven creator matching based on your Brand Audience Profile.</p>
      </div>

      {loading ? (
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Running Discovery Engine...</div>
      ) : candidates.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No affiliate candidates found in the database.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {candidates.map(candidate => {
            const labelStyle = getLabelColor(candidate.recommendationLabel)
            
            return (
              <div key={candidate.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>@{candidate.username}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {candidate.followers.toLocaleString()} Followers • {candidate.engagement_rate}% Eng.
                    </div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: labelStyle.bg, color: labelStyle.text, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {candidate.recommendationLabel}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  
                  {/* Audience Match Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Audience Match</span>
                      <span style={{ fontWeight: 600 }}>{candidate.audienceMatch}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${candidate.audienceMatch}%`, height: '100%', backgroundColor: candidate.audienceMatch >= 80 ? 'var(--success)' : 'var(--primary)' }} />
                    </div>
                  </div>

                  {/* Potential Score Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Potential Score</span>
                      <span style={{ fontWeight: 600 }}>{candidate.potentialScore} / 100</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${candidate.potentialScore}%`, height: '100%', backgroundColor: 'var(--primary-navy)' }} />
                    </div>
                  </div>

                </div>

                <div style={{ backgroundColor: 'var(--background)', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', flex: 1, display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Why this affiliate?</strong>
                    {candidate.reasoning}
                  </div>
                </div>
                
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button className="btn-primary" style={{ flex: 1 }}>Simulate Deal</button>
                  <button style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--surface-border)', backgroundColor: 'transparent', fontWeight: 500, color: 'var(--text-primary)' }}>Shortlist</button>
                </div>

              </div>
            )
          })}
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
