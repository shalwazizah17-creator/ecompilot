'use client'

export function BudgetUtilizationBar({ allocations }: { allocations: any[] }) {
  // allocations: { name, spent, budget }
  // We'll mock the budget limit internally if not provided by snapshot
  
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '24px' }}>Budget Utilization</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {allocations.map(a => {
          // For MVP visualization, if budget isn't in snapshot, we mock a reasonable limit
          const budget = a.budget || Math.max(a.spend * 1.5, 1000000)
          const pct = Math.min((a.spend / budget) * 100, 100)
          const isWarning = pct > 85
          const isCritical = pct > 95
          
          let color = 'var(--primary)'
          if (isWarning) color = 'var(--warning)'
          if (isCritical) color = 'var(--danger)'

          return (
            <div key={a.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600 }}>{a.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Rp {(a.spend/1000000).toFixed(1)}M <span style={{ opacity: 0.5 }}>/ {(budget/1000000).toFixed(1)}M</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--surface-border)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${pct}%`, 
                  height: '100%', 
                  backgroundColor: color,
                  borderRadius: '6px',
                  transition: 'width 0.5s ease-out'
                }}></div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '4px', color: isCritical ? 'var(--danger)' : 'var(--text-muted)' }}>
                {pct.toFixed(1)}% Utilized
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
