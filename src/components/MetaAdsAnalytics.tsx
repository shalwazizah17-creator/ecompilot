'use client'

import { useEffect, useState } from 'react'

export function MetaAdsAnalytics() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)

  useEffect(() => {
    async function load() {
      // Removed brandId check
      setLoading(true)
      try {
        const res = await fetch(`/api/meta-ads`)
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="card" style={{ height: '300px', animation: 'pulse 2s infinite', backgroundColor: 'var(--surface-border)' }}></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {selectedCampaign && (
        <div style={{ marginBottom: '16px' }}>
          <button className="btn-primary" style={{ backgroundColor: 'var(--surface-border)', color: 'var(--text-primary)' }} onClick={() => setSelectedCampaign(null)}>
            ← Back to All Campaigns
          </button>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>
          {selectedCampaign ? `Meta Drill-down: ${selectedCampaign.name}` : 'Meta Ads Deep Analytics'}
        </h3>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 8px' }}>Campaign</th>
              <th style={{ padding: '12px 8px' }}>Status</th>
              <th style={{ padding: '12px 8px' }}>Spend</th>
              <th style={{ padding: '12px 8px' }}>Meta Attributed Revenue</th>
              <th style={{ padding: '12px 8px' }}>ROAS</th>
              <th style={{ padding: '12px 8px' }}>Purchases</th>
              <th style={{ padding: '12px 8px' }}>CPA</th>
              <th style={{ padding: '12px 8px' }}>CTR</th>
              <th style={{ padding: '12px 8px' }}>CPM</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No Meta Ads data found.</td>
              </tr>
            )}
            
            {/* If a campaign is selected, just show its summary or its adsets. For MVP, we show campaigns. */}
            {(selectedCampaign ? [selectedCampaign] : campaigns).map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem', cursor: selectedCampaign ? 'default' : 'pointer' }} onClick={() => !selectedCampaign && setSelectedCampaign(row)}>
                <td style={{ padding: '12px 8px', fontWeight: 500, color: selectedCampaign ? 'inherit' : 'var(--primary)' }}>{row.name}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: row.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-border)', color: row.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-secondary)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>Rp {(row.spend/1000).toLocaleString()}</td>
                <td style={{ padding: '12px 8px', fontWeight: 600 }}>Rp {(row.attrRev/1000).toLocaleString()}</td>
                <td style={{ padding: '12px 8px', color: row.roas > 3 ? 'var(--success)' : 'var(--text-primary)', fontWeight: 600 }}>
                  {row.roas.toFixed(2)}x
                </td>
                <td style={{ padding: '12px 8px' }}>{row.purchases}</td>
                <td style={{ padding: '12px 8px' }}>Rp {row.cpa.toLocaleString()}</td>
                <td style={{ padding: '12px 8px' }}>{row.ctr.toFixed(2)}%</td>
                <td style={{ padding: '12px 8px' }}>Rp {row.cpm.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedCampaign && (
          <div style={{ marginTop: '32px', padding: '32px', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px dashed var(--surface-border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            Ad Set and Ad level drill-down UI would render here for "{selectedCampaign.name}".
          </div>
        )}
      </div>
    </div>
  )
}
