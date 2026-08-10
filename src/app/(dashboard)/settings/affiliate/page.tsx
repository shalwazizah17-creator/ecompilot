'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Target, Users, Settings } from 'lucide-react'

export default function AffiliateSettingsPage() {
  const { selectedBrandId } = useStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form State
  const [targetRoi, setTargetRoi] = useState(5)
  const [maxCommissionPct, setMaxCommissionPct] = useState(15)
  const [minConversionPct, setMinConversionPct] = useState(1)
  const [interests, setInterests] = useState('')

  useEffect(() => {
    load()
  }, [selectedBrandId])

  async function load() {
    if (!selectedBrandId) return
    setLoading(true)
    const res = await fetch(`/api/settings/affiliate?brandId=${selectedBrandId}`)
    const json = await res.json()
    if (res.ok) {
      setData(json)
      setTargetRoi(json.target?.target_roi || 5)
      setMaxCommissionPct(json.target?.max_commission_pct || 15)
      setMinConversionPct(json.target?.min_conversion_pct || 1)
      setInterests(json.profile?.interests || 'Beauty, Skincare')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/settings/affiliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId: selectedBrandId,
        targetRoi,
        maxCommissionPct,
        minConversionPct,
        interests
      })
    })
    setSaving(false)
    alert('Settings saved successfully.')
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Affiliate Configuration</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure ROI parameters and target audiences for the recommendation engine.</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={20}/> Financial Parameters</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Target ROI / ROAS (multiplier)</label>
            <input 
              type="number" 
              className="input" 
              value={targetRoi}
              onChange={e => setTargetRoi(Number(e.target.value))}
              min={1}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>E.g. 5 means 500% ROI or 5x ROAS</p>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Maximum Commission (%)</label>
            <input 
              type="number" 
              className="input" 
              value={maxCommissionPct}
              onChange={e => setMaxCommissionPct(Number(e.target.value))}
              min={1} max={100}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Minimum Conversion Rate (%)</label>
            <input 
              type="number" 
              className="input" 
              value={minConversionPct}
              onChange={e => setMinConversionPct(Number(e.target.value))}
              min={0} max={100}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20}/> Target Audience Match</h3>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Brand Target Audience Tags</label>
          <input 
            type="text" 
            className="input" 
            style={{ width: '100%' }}
            value={interests}
            onChange={e => setInterests(e.target.value)}
            placeholder="e.g. Beauty, Gen Z, Premium Skincare"
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            The AI engine uses these tags to evaluate affiliate audience fit. Separate with commas.
          </p>
        </div>
      </div>

      <div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

    </div>
  )
}
