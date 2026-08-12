'use client'

import { useStore, DateRangeOption } from '@/store/useStore'
import { Menu, User, Calendar } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function TopNav({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { selectedBrandId, setSelectedBrandId, dateRangeOption, setDateRangeOption } = useStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Sync to URL (Brand is now derived from session/workspace in the backend, but we keep dateOption sync)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (dateRangeOption) params.set('dateOption', dateRangeOption)
    
    // Don't push if nothing changed to avoid loop
    const currentDate = searchParams.get('dateOption')
    if (currentDate !== dateRangeOption) {
      router.push(`${pathname}?${params.toString()}`)
    }
  }, [dateRangeOption, pathname, router])

  const dateOptions: { value: DateRangeOption, label: string }[] = [
    { value: 'TODAY', label: 'Hari Ini' },
    { value: 'YESTERDAY', label: 'Kemarin' },
    { value: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
    { value: 'LAST_30_DAYS', label: '30 Hari Terakhir' },
    { value: 'THIS_MONTH', label: 'Bulan Ini' },
    { value: 'LAST_MONTH', label: 'Bulan Lalu' },
    { value: 'THIS_YEAR', label: 'Tahun Ini' },
  ]

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--surface)',
      borderBottom: `1px solid var(--surface-border)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 9,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="menu-toggle" 
          onClick={onToggleSidebar}
          style={{ padding: '8px', marginLeft: '-8px', color: 'var(--text-secondary)' }}
        >
          <Menu size={24} />
        </button>

        {/* EcomPilot Logo for mobile only */}
        <div className="mobile-logo" style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.5px', display: 'none' }}>
          <span style={{ color: 'var(--primary)' }}>Ecom</span>Pilot
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--background)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <Calendar size={16} color="var(--text-muted)" />
          <select 
            value={dateRangeOption}
            onChange={(e) => setDateRangeOption(e.target.value as DateRangeOption)}
            style={{ 
              padding: '0', 
              border: 'none', 
              background: 'transparent',
              fontSize: '0.85rem', 
              outline: 'none',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {dateOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
          <User size={18} />
        </div>
      </div>
    </header>
  )
}
